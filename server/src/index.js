// HTTP API for The First 15 Moves backend.
//
// Endpoints:
//   GET  /api/health
//   POST /api/analyze   { fen, depth? }   → { bestmove, info: { depth, scoreCp, mate, pv } }
//   POST /api/bestmove  { fen, depth? }   → { bestmove }
//
// CORS: configured via ALLOWED_ORIGINS env (comma-separated).
// Rate limit: 60 req/min/IP by default.

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { StockfishEngine } from "./stockfish.js";

const PORT = process.env.PORT || 8080;
const STOCKFISH_BINARY = process.env.STOCKFISH_BINARY || "stockfish";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.use(express.json({ limit: "16kb" }));

// CORS
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);             // curl/same-origin
      if (ALLOWED_ORIGINS.includes("*")) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`Origin ${origin} not allowed`));
    },
  })
);

// Rate limit (only the analysis endpoints)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.RATE_LIMIT || 60),
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Engine lifecycle ---
const engine = new StockfishEngine({ binary: STOCKFISH_BINARY });
engine.start().then(
  () => console.log("[engine] stockfish ready"),
  (err) => {
    console.error("[engine] failed to start:", err.message);
    console.error("Is the `stockfish` binary installed and on PATH?");
  }
);

// --- Routes ---
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    engineReady: engine.ready,
    queued: engine.queue.length,
    now: new Date().toISOString(),
  });
});

app.post("/api/analyze", limiter, async (req, res) => {
  const fen = typeof req.body?.fen === "string" ? req.body.fen.trim() : null;
  const depth = req.body?.depth;
  const movetime = req.body?.movetime;

  if (!isPlausibleFen(fen)) {
    return res.status(400).json({ error: "Invalid or missing FEN." });
  }
  if (!engine.ready) {
    return res.status(503).json({ error: "Engine not ready, try again in a moment." });
  }

  try {
    const result = await engine.analyze(fen, { depth, movetime });
    res.json(result);
  } catch (e) {
    console.error("[analyze] error:", e.message);
    res.status(500).json({ error: "Analysis failed." });
  }
});

app.post("/api/bestmove", limiter, async (req, res) => {
  const fen = typeof req.body?.fen === "string" ? req.body.fen.trim() : null;
  const depth = req.body?.depth ?? 10;
  if (!isPlausibleFen(fen)) return res.status(400).json({ error: "Invalid or missing FEN." });
  if (!engine.ready) return res.status(503).json({ error: "Engine not ready." });
  try {
    const { bestmove } = await engine.analyze(fen, { depth });
    res.json({ bestmove });
  } catch (e) {
    res.status(500).json({ error: "Analysis failed." });
  }
});

// --- Root ---
app.get("/", (_req, res) => {
  res.type("text/plain").send(
    "The First 15 Moves — analysis backend.\n" +
      "Endpoints: GET /api/health, POST /api/analyze, POST /api/bestmove"
  );
});

function isPlausibleFen(fen) {
  if (!fen || typeof fen !== "string") return false;
  // Loose check: 6 space-separated fields, first field has 8 ranks separated by /
  const parts = fen.split(/\s+/);
  if (parts.length < 4) return false;
  const ranks = parts[0].split("/");
  if (ranks.length !== 8) return false;
  if (!/^[wb]$/.test(parts[1])) return false;
  return true;
}

// --- Start + graceful shutdown ---
const server = app.listen(PORT, () => {
  console.log(`[api] listening on :${PORT}`);
  console.log(`[api] allowed origins: ${ALLOWED_ORIGINS.join(", ") || "(same-origin only)"}`);
});

const shutdown = (sig) => {
  console.log(`[api] ${sig} received, shutting down`);
  engine.shutdown();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
