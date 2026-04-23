// Runtime configuration for the frontend.
//
// API_BASE should be the public URL of your Render backend once deployed,
// e.g. "https://first-15-moves-api.onrender.com".
//
// If left blank, the app automatically falls back to the browser-WASM
// Stockfish worker — useful for local development or if the backend is down.
export const CONFIG = {
  // Set this to your Render URL after deploying the backend, e.g.:
  //   API_BASE: "https://first-15-moves-api.onrender.com"
  // Left blank = use browser-WASM fallback.
  API_BASE: "",

  // Default analysis depth for move critique (interactive, must feel snappy).
  ANALYSIS_DEPTH: 12,

  // Default depth for computer replies when off-book. Lower = more human-ish.
  REPLY_DEPTH: 10,

  // Timeout for a single API call before we give up and fall back.
  API_TIMEOUT_MS: 6000,
};
