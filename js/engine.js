/*
 * Engine wrapper. Two backends, one interface.
 *
 *   1. RemoteEngine  — talks to the Render Node/Stockfish API (preferred).
 *   2. WorkerEngine  — runs Stockfish as a Web Worker in the browser
 *                      (fallback when CONFIG.API_BASE is blank or the API fails).
 *
 * Both expose `start()` and `analyze(fen, { depth, movetime })`, returning the
 * same shape: { bestmove, info: { depth, scoreCp, mate, pv } }.
 */

import { CONFIG } from "./config.js";

export class Engine {
  constructor() {
    this._impl = null;
    this._ready = false;
    this._readyPromise = null;
    this._mode = "pending";
  }

  get mode() { return this._mode; }
  get ready() { return this._ready; }

  async start() {
    if (this._readyPromise) return this._readyPromise;
    this._readyPromise = (async () => {
      if (CONFIG.API_BASE) {
        const remote = new RemoteEngine(CONFIG.API_BASE);
        const ok = await remote.healthCheck();
        if (ok) {
          this._impl = remote;
          this._mode = "remote";
          this._ready = true;
          return;
        }
        console.warn("[engine] Remote API not reachable — falling back to browser worker.");
      }
      const local = new WorkerEngine();
      await local.start();
      this._impl = local;
      this._mode = "local";
      this._ready = true;
    })();
    return this._readyPromise;
  }

  async analyze(fen, opts = {}) {
    if (!this._ready) await this.start();
    return this._impl.analyze(fen, opts);
  }
}

// ---------- Remote (Render backend) ----------
class RemoteEngine {
  constructor(base) {
    this.base = base.replace(/\/$/, "");
  }

  async healthCheck() {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT_MS);
      const res = await fetch(this.base + "/api/health", { signal: controller.signal });
      clearTimeout(t);
      if (!res.ok) return false;
      const data = await res.json();
      return !!data.ok;
    } catch (e) {
      console.warn("[engine] health check failed:", e.message);
      return false;
    }
  }

  async analyze(fen, { depth, movetime } = {}) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT_MS);
    try {
      const res = await fetch(this.base + "/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fen, depth, movetime }),
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API ${res.status}: ${text.slice(0, 100)}`);
      }
      return await res.json();
    } catch (e) {
      clearTimeout(t);
      throw e;
    }
  }
}

// ---------- Local (browser Web Worker fallback) ----------
class WorkerEngine {
  constructor(workerUrl = "./vendor/stockfish/stockfish.js") {
    this.workerUrl = workerUrl;
    this.worker = null;
    this.pending = null;
    this.lastInfo = null;
  }

  start() {
    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(this.workerUrl);
      } catch (e) {
        reject(e);
        return;
      }
      this.worker.onmessage = (e) => this._onLine(typeof e.data === "string" ? e.data : String(e.data));

      const timeout = setTimeout(() => reject(new Error("Worker init timeout")), 15000);
      this._onReady = () => {
        clearTimeout(timeout);
        resolve();
      };
      this._send("uci");
      this._send("isready");
    });
  }

  _send(cmd) {
    if (this.worker) this.worker.postMessage(cmd);
  }

  _onLine(chunk) {
    chunk.split("\n").forEach((line) => this._handle(line.trim()));
  }

  _handle(line) {
    if (!line) return;
    if (line === "readyok" || line === "uciok") {
      if (this._onReady) { const cb = this._onReady; this._onReady = null; cb(); }
      return;
    }
    if (line.startsWith("info ")) {
      const info = parseInfo(line);
      if (info) this.lastInfo = { ...(this.lastInfo || {}), ...info };
      return;
    }
    if (line.startsWith("bestmove") && this.pending) {
      const parts = line.split(/\s+/);
      const best = parts[1] && parts[1] !== "(none)" ? parts[1] : null;
      const p = this.pending;
      this.pending = null;
      p.resolve({ bestmove: best, info: this.lastInfo || null });
      this.lastInfo = null;
    }
  }

  async analyze(fen, { depth = 12, movetime } = {}) {
    if (this.pending) { this._send("stop"); await new Promise((r) => setTimeout(r, 20)); }
    return new Promise((resolve, reject) => {
      this.pending = { resolve, reject };
      this._send("ucinewgame");
      this._send(`position fen ${fen}`);
      if (movetime) this._send(`go movetime ${movetime}`);
      else this._send(`go depth ${depth}`);
    });
  }
}

function parseInfo(line) {
  const out = {};
  const d = line.match(/\bdepth (\d+)/);           if (d) out.depth = parseInt(d[1], 10);
  const cp = line.match(/\bscore cp (-?\d+)/);     if (cp) out.scoreCp = parseInt(cp[1], 10);
  const m = line.match(/\bscore mate (-?\d+)/);    if (m) out.mate = parseInt(m[1], 10);
  const pv = line.match(/\bpv (.+)$/);             if (pv) out.pv = pv[1].trim().split(/\s+/);
  return Object.keys(out).length ? out : null;
}
