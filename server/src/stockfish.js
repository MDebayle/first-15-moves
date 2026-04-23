// Persistent Stockfish child process manager.
//
// One long-lived engine process, serialized request queue.
// Each request: ucinewgame → position fen … → go depth N → wait for bestmove.

import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";

export class StockfishEngine extends EventEmitter {
  constructor({ binary = "stockfish" } = {}) {
    super();
    this.binary = binary;
    this.child = null;
    this.ready = false;
    this.readyPromise = null;
    this.lineBuffer = "";
    this.pending = null;         // { resolve, reject, info, timer }
    this.queue = [];             // [{ fen, opts, resolve, reject }]
    this.currentInfo = null;
  }

  async start() {
    if (this.readyPromise) return this.readyPromise;
    this.readyPromise = new Promise((resolve, reject) => {
      try {
        this.child = spawn(this.binary, [], { stdio: ["pipe", "pipe", "pipe"] });
      } catch (e) {
        reject(e);
        return;
      }

      this.child.on("error", (err) => {
        console.error("[stockfish] spawn error:", err.message);
        reject(err);
      });

      this.child.on("exit", (code, signal) => {
        console.error(`[stockfish] exited code=${code} signal=${signal}`);
        this.ready = false;
        this.readyPromise = null;
        // Fail any in-flight request so the caller can retry
        if (this.pending) {
          this.pending.reject(new Error("Engine process exited"));
          this.pending = null;
        }
      });

      this.child.stdout.setEncoding("utf8");
      this.child.stdout.on("data", (chunk) => this._onData(chunk));
      this.child.stderr.setEncoding("utf8");
      this.child.stderr.on("data", (chunk) => {
        if (process.env.DEBUG_ENGINE) console.error("[stockfish stderr]", chunk);
      });

      const onReady = () => {
        this.ready = true;
        this.off("_readyok", onReady);
        resolve();
      };
      this.on("_readyok", onReady);

      this._send("uci");
      this._send("isready");
    });
    return this.readyPromise;
  }

  _send(cmd) {
    if (!this.child || !this.child.stdin.writable) return;
    this.child.stdin.write(cmd + "\n");
  }

  _onData(chunk) {
    this.lineBuffer += chunk;
    let nl;
    while ((nl = this.lineBuffer.indexOf("\n")) !== -1) {
      const line = this.lineBuffer.slice(0, nl).trim();
      this.lineBuffer = this.lineBuffer.slice(nl + 1);
      if (line) this._onLine(line);
    }
  }

  _onLine(line) {
    if (line === "uciok") return;
    if (line === "readyok") {
      this.emit("_readyok");
      return;
    }

    if (line.startsWith("info ")) {
      const info = parseInfo(line);
      if (info && this.pending) {
        this.pending.info = { ...(this.pending.info || {}), ...info };
      }
      return;
    }

    if (line.startsWith("bestmove") && this.pending) {
      const parts = line.split(/\s+/);
      const best = parts[1];
      const p = this.pending;
      this.pending = null;
      if (p.timer) clearTimeout(p.timer);
      p.resolve({
        bestmove: best && best !== "(none)" ? best : null,
        info: p.info || null,
      });
      this._pump();
    }
  }

  analyze(fen, opts = {}) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fen, opts, resolve, reject });
      this._pump();
    });
  }

  _pump() {
    if (this.pending || this.queue.length === 0 || !this.ready) return;
    const task = this.queue.shift();
    const depth = Math.max(1, Math.min(20, Number(task.opts.depth) || 12));
    const movetime = task.opts.movetime ? Math.max(10, Math.min(3000, Number(task.opts.movetime))) : null;

    this.pending = { resolve: task.resolve, reject: task.reject, info: null, timer: null };
    // Safety timer — if Stockfish doesn't respond in 10s, fail the request
    this.pending.timer = setTimeout(() => {
      if (this.pending === null) return;
      const p = this.pending;
      this.pending = null;
      this._send("stop");
      p.reject(new Error("Engine timeout"));
      this._pump();
    }, 10000);

    this._send("ucinewgame");
    this._send(`position fen ${task.fen}`);
    if (movetime) this._send(`go movetime ${movetime}`);
    else this._send(`go depth ${depth}`);
  }

  shutdown() {
    if (this.child) {
      try { this._send("quit"); } catch (_) {}
      setTimeout(() => {
        if (this.child && !this.child.killed) this.child.kill("SIGTERM");
      }, 500);
    }
  }
}

function parseInfo(line) {
  const out = {};
  const d = line.match(/\bdepth (\d+)/);
  if (d) out.depth = parseInt(d[1], 10);
  const cp = line.match(/\bscore cp (-?\d+)/);
  if (cp) out.scoreCp = parseInt(cp[1], 10);
  const mate = line.match(/\bscore mate (-?\d+)/);
  if (mate) out.mate = parseInt(mate[1], 10);
  const pv = line.match(/\bpv (.+)$/);
  if (pv) out.pv = pv[1].trim().split(/\s+/);
  return Object.keys(out).length ? out : null;
}
