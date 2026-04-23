/*
 * Move ranker — asks Stockfish (via MultiPV) to rank every legal White move
 * from a given position. Runs in its own Web Worker so it never competes
 * with the main critique analysis pipeline.
 *
 * Public shape:
 *   const ranker = new Ranker();
 *   await ranker.start();                 // boot stockfish
 *   const ranked = await ranker.rankAll({ fen, depth: 10 });
 *   // ranked = [{ uci: "e2e4", scoreCp: 28, mate: null }, ...]  best first
 *
 * Notes:
 *   - We use a dedicated worker to avoid interfering with the main engine.
 *   - We cap MultiPV at the number of legal moves (Stockfish supports 1..500).
 *   - Scores are from the side-to-move's POV, as Stockfish reports them.
 *     White-to-move: higher scoreCp = better for White.
 *   - Ties are expected and common — the caller assigns ranks with standard
 *     competition scoring (1, 1, 3, ...).
 */

export class Ranker {
  constructor(workerUrl = "./vendor/stockfish/stockfish.js") {
    this.workerUrl = workerUrl;
    this.worker = null;
    this._ready = false;
    this._readyPromise = null;
    this._pending = null;       // { resolve, reject, rows: Map<multipv, {scoreCp, mate, pv}> }
    this._onReadyCb = null;
  }

  get ready() { return this._ready; }

  start() {
    if (this._readyPromise) return this._readyPromise;
    this._readyPromise = new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(this.workerUrl);
      } catch (e) {
        reject(e);
        return;
      }
      this.worker.onmessage = (e) => {
        const chunk = typeof e.data === "string" ? e.data : String(e.data);
        chunk.split("\n").forEach((line) => this._handle(line.trim()));
      };
      const timeout = setTimeout(() => reject(new Error("Ranker worker init timeout")), 20000);
      this._onReadyCb = () => {
        clearTimeout(timeout);
        this._ready = true;
        resolve();
      };
      this._send("uci");
      this._send("isready");
    });
    return this._readyPromise;
  }

  _send(cmd) {
    if (this.worker) this.worker.postMessage(cmd);
  }

  _handle(line) {
    if (!line) return;

    if (line === "readyok" || line === "uciok") {
      if (this._onReadyCb) {
        const cb = this._onReadyCb;
        this._onReadyCb = null;
        cb();
      }
      return;
    }

    if (line.startsWith("info ") && this._pending) {
      const info = parseInfoLine(line);
      if (info && info.multipv != null && (info.scoreCp != null || info.mate != null) && info.pv && info.pv.length) {
        // Keep the LATEST (deepest) info row per multipv slot.
        this._pending.rows.set(info.multipv, info);
      }
      return;
    }

    if (line.startsWith("bestmove") && this._pending) {
      const p = this._pending;
      this._pending = null;
      // Convert rows map -> sorted array by multipv index
      const entries = Array.from(p.rows.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([, info]) => ({
          uci: info.pv[0],
          scoreCp: info.scoreCp != null ? info.scoreCp : null,
          mate: info.mate != null ? info.mate : null,
          multipv: info.multipv,
        }));
      p.resolve(entries);
    }
  }

  /**
   * Run MultiPV analysis on a position and return every legal move ranked.
   *
   * @param {object} opts
   * @param {string} opts.fen          - FEN of the position to rank (side-to-move = the player being ranked).
   * @param {number} opts.legalCount   - number of legal moves (sets MultiPV).
   * @param {number} [opts.depth=10]   - Stockfish search depth. 10 is a good
   *                                     balance of accuracy + speed in-browser.
   * @returns {Promise<Array<{uci, scoreCp, mate, multipv}>>}
   */
  async rankAll({ fen, legalCount, depth = 10 }) {
    if (!this._ready) await this.start();

    // If a previous request is still in flight, cancel it.
    if (this._pending) {
      try { this._send("stop"); } catch (_) {}
      // Resolve the old one with an empty list so nothing hangs.
      const old = this._pending;
      this._pending = null;
      old.resolve([]);
      await new Promise((r) => setTimeout(r, 10));
    }

    const n = Math.max(1, Math.min(500, legalCount || 1));
    this._send(`setoption name MultiPV value ${n}`);
    this._send("ucinewgame");
    this._send(`position fen ${fen}`);

    return new Promise((resolve, reject) => {
      this._pending = { resolve, reject, rows: new Map() };
      this._send(`go depth ${depth}`);
    });
  }
}

function parseInfoLine(line) {
  const out = {};
  const d = line.match(/\bdepth (\d+)/);         if (d) out.depth = parseInt(d[1], 10);
  const mp = line.match(/\bmultipv (\d+)/);      if (mp) out.multipv = parseInt(mp[1], 10);
  const cp = line.match(/\bscore cp (-?\d+)/);   if (cp) out.scoreCp = parseInt(cp[1], 10);
  const m = line.match(/\bscore mate (-?\d+)/);  if (m) out.mate = parseInt(m[1], 10);
  const pv = line.match(/\bpv (.+)$/);           if (pv) out.pv = pv[1].trim().split(/\s+/);
  return Object.keys(out).length ? out : null;
}

/**
 * Assign standard-competition ranks (1, 1, 3, ...) to a list of ranked moves
 * sorted best-first. Two moves with identical scores share the same rank.
 *
 * @param {Array<{scoreCp, mate}>} sorted - best-first list from rankAll()
 * @returns {Array<{...orig, rank:number}>}
 */
export function assignRanks(sorted) {
  const out = [];
  let currentRank = 0;
  let lastKey = null;
  sorted.forEach((mv, i) => {
    const key = scoreKey(mv);
    if (key !== lastKey) {
      currentRank = i + 1;
      lastKey = key;
    }
    out.push({ ...mv, rank: currentRank });
  });
  return out;
}

function scoreKey(mv) {
  // Two moves are "tied" if both have the same mate distance OR same cp score.
  if (mv.mate != null) return `m:${mv.mate}`;
  if (mv.scoreCp != null) return `cp:${mv.scoreCp}`;
  return `x:${Math.random()}`; // shouldn't happen; treat as unique
}

/**
 * Look up the rank of a specific UCI move in a ranked+numbered list.
 * Returns null if the move isn't found (e.g. analysis was cut short).
 */
export function findMoveRank(rankedList, uci) {
  const hit = rankedList.find((m) => m.uci === uci);
  return hit ? hit.rank : null;
}
