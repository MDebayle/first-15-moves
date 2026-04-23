/*
 * The First 15 Moves — main app controller.
 *
 * Plain ES modules, no build step. Orchestrates:
 *   - cm-chessboard       (the board UI)
 *   - chess.js            (rules, legality, FEN/SAN)
 *   - Stockfish engine    (Render backend or browser WASM fallback)
 *   - Opening tree data
 *   - Critique engine
 *
 * Design: the hero contains the board. There is no gate — the Italian Game
 * loads by default and the player can make a move immediately. Opening swap
 * is a secondary action, not a prerequisite.
 */

import { Chess } from "../vendor/chess.js";
import { Chessboard, COLOR, INPUT_EVENT_TYPE, BORDER_TYPE } from "../vendor/cm-chessboard/src/Chessboard.js";
import { MARKER_TYPE, Markers } from "../vendor/cm-chessboard/src/extensions/markers/Markers.js";

// Custom marker slices for board overlays
const MARKER_CENTER = { class: "marker-square-center", slice: "markerSquare" };
const MARKER_THREAT = { class: "marker-square-threat", slice: "markerSquare" };
const CENTER_SQUARES = ["d4", "d5", "e4", "e5"];
import { PromotionDialog } from "../vendor/cm-chessboard/src/extensions/promotion-dialog/PromotionDialog.js";

import { OPENINGS } from "../data/openings.js";
import { Engine } from "./engine.js";
import { Ranker, assignRanks, findMoveRank } from "./ranker.js";
import { CONFIG } from "./config.js";
import { critique, CLASS, classToBadgeClass } from "./critique.js";
import {
  computeRubric,
  rubricLabel,
  rubricClass,
  computeAxes,
  computePlanFit,
  computeCost,
  narrateBlackReply,
  buildHintLadder,
  buildTakeawayRule,
} from "./coaching.js";

const MAX_PLIES = 30; // 15 full moves
const DEFAULT_OPENING_ID = "italian"; // auto-start with the Italian Game

// Scorecard constants
const SCORECARD_CELLS = 16; // 15 moves + 1 final percentile cell
const MEDAL_RANK_GOLD = 1;
const MEDAL_RANK_SILVER = 2;
const MEDAL_RANK_BRONZE = 3;
// Depth for the background "rank this move among all legal options" analysis.
// Lower than the main critique depth (12) to keep it snappy — ranking wants
// relative ordering, not precise cp numbers.
const RANKER_DEPTH = 10;

// Phase map: ply range -> label + pre-move coaching prompt
const PHASES = [
  {
    minPly: 1, maxPly: 8, label: "Claim the center",
    goal: "Fight for the center. Put a pawn on e4 or d4, then develop a knight toward it.",
    watch: "Don't move the same piece twice, and keep the queen home until she has targets.",
  },
  {
    minPly: 9, maxPly: 16, label: "Develop & coordinate",
    goal: "Get every minor piece into play and tuck your king away.",
    watch: "Your king is still in the middle. Castle before opening lines.",
  },
  {
    minPly: 17, maxPly: 24, label: "King safety & structure",
    goal: "Finish development, then find a plan \u2014 a file, a diagonal, a weakness.",
    watch: "Check that your king is safe before committing pieces to the other side of the board.",
  },
  {
    minPly: 25, maxPly: 30, label: "Plan & pressure",
    goal: "Pick a target and aim multiple pieces at it.",
    watch: "Trade when it helps your plan, not just because a trade is available.",
  },
];

// Friendly labels for principle tags. Polarity sign is added at render time.
const CONCEPT_LABELS = {
  center: "Center",
  development: "Development",
  "king-safety": "King safety",
  castle: "Castling",
  "early-queen": "Queen out early",
  "piece-twice": "Same piece twice",
  "flank-pawn": "Flank pawn",
  tempo: "Tempo",
  initiative: "Initiative",
  "target-f7": "f7 pressure",
  "pawn-structure": "Pawn structure",
  flank: "Flank play",
  flexible: "Flexibility",
  "bishop-trapped": "Bishop activity",
};

// ---------- State ----------
const state = {
  openingId: null,
  opening: null,
  chess: null,
  board: null,
  engine: null,
  engineReady: false,
  ply: 0,
  studentSide: "w",
  history: [],
  evalHistory: [0],
  firstDeviationPly: null,
  inputLocked: false,
  lastPlayerCritique: null,
  positiveConceptCounts: {},
  negativeConceptCounts: {},
  selectedHistoryPly: null,
  overlayCenter: false,
  overlayThreats: false,
  hintStepIndex: 0,
  hintLadderSteps: [],
  // Scorecard state
  ranker: null,            // Ranker instance (its own Stockfish worker)
  moveRanks: [],           // [{ whiteMoveIndex: 1..15, rank, total, medal }]
};

// ---------- Panels ----------
const panels = {
  landing: document.getElementById("landing"),
  openings: document.getElementById("openings"),
  summary: document.getElementById("summary"),
};

function showPanel(name) {
  // "landing" is always visible (it's the hero). Only the openings picker toggles now;
  // the summary has been promoted to a modal dialog (see openSummaryModal).
  panels.openings.hidden = name !== "openings";
  panels.landing.hidden = false;
  if (name === "openings") {
    document.getElementById("openings").scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// ---------- Summary modal open/close ----------
function openSummaryModal() {
  const dlg = document.getElementById("summaryModal");
  if (!dlg) return;
  if (typeof dlg.showModal === "function" && !dlg.open) {
    dlg.showModal();
  } else if (!dlg.hasAttribute("open")) {
    dlg.setAttribute("open", "");
  }
  const inner = dlg.querySelector(".help-inner");
  if (inner) inner.scrollTop = 0;
}

// Close the summary modal. If the user closes without picking an action,
// treat that as "continue this game with coach off" — the explicit default.
function closeSummaryModal({ silent = false } = {}) {
  const dlg = document.getElementById("summaryModal");
  if (!dlg) return;
  if (typeof dlg.close === "function" && dlg.open) dlg.close();
  else dlg.removeAttribute("open");
  if (!silent && state.sessionEnded && !state.coachOff) {
    enterContinueMode();
  }
}

// Continue the current game after the 15-move session is over.
// Board stays interactive, Black keeps replying, but the coach goes quiet.
function enterContinueMode() {
  state.coachOff = true;
  state.inputLocked = false;
  document.body.classList.add("coach-off");
  // Show a quiet status line in the coach panel
  setCoachStatus("Coach off — free play.");
  const narrEl = document.getElementById("coachNarrative");
  if (narrEl) narrEl.hidden = true;
  const promptEl = document.getElementById("coachPrompt");
  if (promptEl) promptEl.hidden = true;
  const altsEl = document.getElementById("coachAlternatives");
  if (altsEl) altsEl.hidden = true;
  const hintLadder = document.getElementById("hintLadder");
  if (hintLadder) hintLadder.hidden = true;
}

// ---------- Scorecard ----------

// SVG medal icons. Simple, geometric, distinct colors.
// Written inline so they can inherit `currentColor` for strokes.
const MEDAL_SVG = {
  gold: `<svg class="medal-icon" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <path d="M10 2 L16 18 L24 18 L30 2 Z" fill="#c99d4a" opacity=".85"/>
    <circle cx="20" cy="26" r="11" fill="#e8c66a" stroke="#8a6420" stroke-width="1.4"/>
    <circle cx="20" cy="26" r="7" fill="#f4dd92"/>
    <text x="20" y="30" text-anchor="middle" font-size="9" font-weight="700" fill="#6d4c0f" font-family="Georgia, serif">1</text>
  </svg>`,
  silver: `<svg class="medal-icon" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <path d="M10 2 L16 18 L24 18 L30 2 Z" fill="#9aa4ad" opacity=".85"/>
    <circle cx="20" cy="26" r="11" fill="#d4dadf" stroke="#5a6a73" stroke-width="1.4"/>
    <circle cx="20" cy="26" r="7" fill="#e9eef2"/>
    <text x="20" y="30" text-anchor="middle" font-size="9" font-weight="700" fill="#3c4a52" font-family="Georgia, serif">2</text>
  </svg>`,
  bronze: `<svg class="medal-icon" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <path d="M10 2 L16 18 L24 18 L30 2 Z" fill="#a36b3f" opacity=".85"/>
    <circle cx="20" cy="26" r="11" fill="#c78350" stroke="#6a3e15" stroke-width="1.4"/>
    <circle cx="20" cy="26" r="7" fill="#dca078"/>
    <text x="20" y="30" text-anchor="middle" font-size="9" font-weight="700" fill="#4f2b0b" font-family="Georgia, serif">3</text>
  </svg>`,
};

// Build the 16 empty cells once. Cells 1–15 are per-move; cell 16 is the final percentile.
function renderScorecardShell() {
  const grid = document.getElementById("scorecardGrid");
  if (!grid) return;
  grid.innerHTML = "";
  for (let i = 1; i <= SCORECARD_CELLS; i++) {
    const li = document.createElement("li");
    li.className = "scorecard-cell empty" + (i === SCORECARD_CELLS ? " final" : "");
    li.dataset.cell = String(i);
    const label = i === SCORECARD_CELLS ? "Final" : String(i);
    li.setAttribute(
      "aria-label",
      i === SCORECARD_CELLS ? "Final session score (not yet computed)" : `Move ${i} (not yet played)`,
    );
    li.innerHTML = `
      <span class="cell-index">${label}</span>
      <span class="cell-rank"></span>
      <span class="cell-of"></span>
    `;
    grid.appendChild(li);
  }
}

// Convert rank -> medal key or null.
function rankToMedal(rank) {
  if (rank === MEDAL_RANK_GOLD) return "gold";
  if (rank === MEDAL_RANK_SILVER) return "silver";
  if (rank === MEDAL_RANK_BRONZE) return "bronze";
  return null;
}

// Fill a per-move cell (index 1..15) with rank info.
function paintScorecardCell(whiteMoveIndex, rank, total) {
  const grid = document.getElementById("scorecardGrid");
  if (!grid) return;
  const cell = grid.querySelector(`[data-cell="${whiteMoveIndex}"]`);
  if (!cell) return;
  const medal = rankToMedal(rank);

  cell.classList.remove("empty");
  cell.classList.add("filled");
  if (medal) cell.classList.add("medal", `medal-${medal}`);

  const rankEl = cell.querySelector(".cell-rank");
  const ofEl = cell.querySelector(".cell-of");

  if (medal) {
    // Replace content with medal svg; hide numeric labels via CSS.
    cell.innerHTML = `<span class="cell-index">${whiteMoveIndex}</span>${MEDAL_SVG[medal]}`;
    cell.setAttribute("aria-label", `Move ${whiteMoveIndex}: ${medal} medal (rank ${rank} of ${total})`);
  } else {
    if (rankEl) rankEl.textContent = ordinal(rank);
    if (ofEl) ofEl.textContent = `/ ${total}`;
    cell.setAttribute("aria-label", `Move ${whiteMoveIndex}: ranked ${rank} of ${total}`);
  }
}

// Fill the final (16th) cell with the session-average percentile.
function paintScorecardFinal(percentile) {
  const grid = document.getElementById("scorecardGrid");
  if (!grid) return;
  const cell = grid.querySelector(`[data-cell="${SCORECARD_CELLS}"]`);
  if (!cell) return;
  cell.classList.remove("empty");
  cell.classList.add("filled");
  const rounded = Math.round(percentile);
  cell.innerHTML = `
    <span class="cell-index">Final</span>
    <span class="cell-rank">Top ${rounded}%</span>
    <span class="cell-of">Average</span>
  `;
  cell.setAttribute("aria-label", `Final session score: top ${rounded} percent on average`);
}

// Clear a specific cell back to its initial "empty" placeholder state.
// Used when the player takes back their move so the scorecard stays honest.
function clearScorecardCell(whiteMoveIndex) {
  const grid = document.getElementById("scorecardGrid");
  if (!grid) return;
  const cell = grid.querySelector(`[data-cell="${whiteMoveIndex}"]`);
  if (!cell) return;
  cell.className = "scorecard-cell empty" + (whiteMoveIndex === SCORECARD_CELLS ? " final" : "");
  const label = whiteMoveIndex === SCORECARD_CELLS ? "Final" : String(whiteMoveIndex);
  cell.innerHTML = `
    <span class="cell-index">${label}</span>
    <span class="cell-rank"></span>
    <span class="cell-of"></span>
  `;
  cell.setAttribute(
    "aria-label",
    whiteMoveIndex === SCORECARD_CELLS
      ? "Final session score (not yet computed)"
      : `Move ${whiteMoveIndex} (not yet played)`,
  );
}

// English ordinals for small integers.
function ordinal(n) {
  if (n >= 11 && n <= 13) return `${n}th`;
  const last = n % 10;
  if (last === 1) return `${n}st`;
  if (last === 2) return `${n}nd`;
  if (last === 3) return `${n}rd`;
  return `${n}th`;
}

// Soft golf-clap audio. Lazy-loaded (HTMLAudioElement) and only played on gold medals.
let _clapAudio = null;
function playGoldClap() {
  try {
    if (!_clapAudio) {
      _clapAudio = new Audio("./assets/golf-clap.mp3");
      _clapAudio.preload = "auto";
      _clapAudio.volume = 0.6;
    }
    // Allow retriggering if it's already mid-play.
    _clapAudio.currentTime = 0;
    const p = _clapAudio.play();
    if (p && typeof p.catch === "function") {
      // Autoplay can fail if the user hasn't interacted yet — swallow silently.
      p.catch(() => {});
    }
  } catch (_) {
    /* ignore */
  }
}

// Kick off a non-blocking rank analysis for a move that was just played.
// Updates the scorecard cell in place when the analysis returns. Does NOT
// block the main critique/engine-reply pipeline.
async function analyzeMoveRank({ whiteMoveIndex, fenBefore, uciMove }) {
  if (!state.ranker) return;
  let ranked;
  try {
    // Count legal moves from the pre-move FEN to size MultiPV correctly.
    // We can’t easily instantiate a second chess.js here; Stockfish will
    // still only report moves that exist. Using 128 is safe (legal move
    // max in any position is ~218; typical openings are <50) but we pass
    // the real count if available.
    const legalCount = state._lastLegalCount || 128;
    ranked = await state.ranker.rankAll({ fen: fenBefore, legalCount, depth: RANKER_DEPTH });
  } catch (e) {
    console.warn("[scorecard] rank failed:", e);
    return;
  }
  if (!ranked || ranked.length === 0) return;

  // Stockfish returns the MultiPV list already sorted best-first
  // (multipv=1 is best). We trust that ordering directly.
  const ranksAssigned = assignRanks(ranked);
  const rank = findMoveRank(ranksAssigned, uciMove);
  const total = ranked.length;
  if (!rank) {
    // Safety net: if Stockfish didn't return a line for this exact move
    // (rare, e.g. MultiPV was capped), we just leave the cell empty.
    console.warn("[scorecard] could not locate move in ranked list:", uciMove);
    return;
  }

  // If the player undid this move while analysis was running, drop the result.
  const whiteMovesPlayed = Math.ceil(state.ply / 2);
  if (whiteMoveIndex > whiteMovesPlayed) return;

  // Persist
  state.moveRanks.push({ whiteMoveIndex, rank, total, medal: rankToMedal(rank) });

  // Paint the cell and, if gold, play the cheer.
  paintScorecardCell(whiteMoveIndex, rank, total);
  if (rank === MEDAL_RANK_GOLD) playGoldClap();
}

// When the session finishes, compute and show the 16th cell’s average percentile.
// "Top X%" means you ranked within the best X% of available moves.
// A rank of 4 out of 20 is "top 20%". Formula: (rank / total) * 100.
// LOWER is better. Moves that never got a rank (e.g. engine failed) are skipped.
function computeSessionPercentile() {
  const rows = state.moveRanks.filter((r) => r.rank && r.total);
  if (rows.length === 0) return null;
  const percentiles = rows.map((r) => (r.rank / r.total) * 100);
  const avg = percentiles.reduce((a, b) => a + b, 0) / percentiles.length;
  return avg;
}

// ---------- Opening picker ----------
function difficultyClass(label) {
  if (!label) return "";
  const l = label.toLowerCase();
  if (l.startsWith("beginner")) return "diff-beginner";
  if (l.startsWith("intermediate")) return "diff-intermediate";
  return "";
}

function renderOpeningCards() {
  const container = document.getElementById("openingCards");
  container.innerHTML = "";
  for (const opening of Object.values(OPENINGS)) {
    const btn = document.createElement("button");
    btn.className = "opening-card";
    if (opening.id === state.openingId) btn.classList.add("is-current");
    btn.type = "button";
    const diffClass = difficultyClass(opening.difficulty);
    btn.innerHTML = `
      <div class="opening-card-header">
        <span class="opening-card-name">${opening.name}</span>
        <span class="opening-card-eco">${opening.eco}</span>
      </div>
      ${opening.difficulty ? `<span class="opening-card-difficulty ${diffClass}">${opening.difficulty}</span>` : ""}
      ${opening.tagline ? `<p class="opening-card-tagline">${opening.tagline}</p>` : ""}
      <p class="opening-card-desc">${opening.intro}</p>
    `;
    btn.addEventListener("click", () => {
      startGame(opening.id);
      document.getElementById("landing").scrollIntoView({ behavior: "smooth", block: "start" });
      panels.openings.hidden = true;
    });
    container.appendChild(btn);
  }
}

// ---------- Starting a game ----------
async function startGame(openingId) {
  const opening = OPENINGS[openingId];
  if (!opening) return;

  state.openingId = openingId;
  state.opening = opening;
  state.chess = new Chess();
  state.ply = 0;
  state.history = [];
  state.evalHistory = [0];
  state.firstDeviationPly = null;
  state.lastPlayerCritique = null;
  state.positiveConceptCounts = {};
  state.negativeConceptCounts = {};
  state.inputLocked = false;
  state.sessionEnded = false;
  state.coachOff = false; // set true when user chooses "Continue without coach"
  state.moveRanks = [];
  state._lastLegalCount = null;

  // Reset the scorecard grid to 16 empty cells.
  renderScorecardShell();

  document.getElementById("openingEco").textContent = opening.eco;
  document.getElementById("openingTitle").textContent = opening.name;

  // Close the summary modal if it was left open from a prior session
  closeSummaryModal({ silent: true });
  document.body.classList.remove("coach-off");

  panels.landing.hidden = false;
  panels.openings.hidden = true;

  // Build / rebuild the board
  if (state.board) {
    state.board.destroy();
    state.board = null;
  }
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";

  state.board = new Chessboard(boardEl, {
    position: state.chess.fen(),
    assetsUrl: "./vendor/cm-chessboard/assets/",
    style: {
      cssClass: "default",
      showCoordinates: true,
      borderType: BORDER_TYPE.thin,
      aspectRatio: 1,
      pieces: { file: "pieces/staunty.svg" },
    },
    extensions: [{ class: Markers }, { class: PromotionDialog }],
  });
  state.board.enableMoveInput(handleMoveInput, COLOR.white);

  // Reset UI
  updatePhaseChip(0);
  document.getElementById("btnUndo").disabled = true;
  const histEl = document.getElementById("historyAnnotated");
  if (histEl) histEl.innerHTML = "";
  const histHint = document.getElementById("historyHint");
  if (histHint) histHint.hidden = true;
  state.selectedHistoryPly = null;
  resetCoachPanel();
  renderOpeningCards(); // refresh the "is-current" highlight

  // Starting a fresh game is pre-play again for marketing copy until first move
  document.body.classList.remove("has-played");

  // Re-apply any active overlays on the fresh board
  if (state.overlayCenter) applyCenterOverlay();
  if (state.overlayThreats) applyThreatOverlay();

  // Boot the engine if not already
  if (!state.engine) {
    state.engine = new Engine();
    setCoachStatus("Loading engine…");
    try {
      await state.engine.start();
      state.engineReady = true;
      const modeText = state.engine.mode === "remote" ? "Ready." : "Ready (local engine).";
      setCoachStatus(modeText);
    } catch (e) {
      console.warn("Engine failed to start:", e);
      setCoachStatus("Offline — no engine.");
      state.engineReady = false;
    }
  } else {
    setCoachStatus(state.engine.mode === "remote" ? "Ready." : "Ready (local engine).");
  }

  // Boot the ranker (own Stockfish worker, separate from the critique engine).
  // Failure here is non-fatal — scorecard just won't light up.
  if (!state.ranker) {
    try {
      state.ranker = new Ranker();
      await state.ranker.start();
    } catch (e) {
      console.warn("Ranker failed to start — scorecard will stay empty:", e);
      state.ranker = null;
    }
  }
}

function resetCoachPanel() {
  document.getElementById("coachMessage").textContent =
    "Make a move when you're ready. I'll tell you what it does, what it costs, and what to watch for next.";
  const meta = document.getElementById("coachMeta");
  if (meta) meta.hidden = true;
  // Show the pre-move prompt for the opening phase
  renderCoachPrompt(0);
  document.getElementById("coachConcepts").innerHTML = "";
  const alts = document.getElementById("coachAlternatives");
  if (alts) alts.hidden = true;

  // Round 3: hide deep-feedback surfaces until a move is played
  const axes = document.getElementById("coachAxes");
  if (axes) axes.hidden = true;
  const rubric = document.getElementById("rubric");
  if (rubric) rubric.hidden = true;
  const narr = document.getElementById("coachNarrative");
  if (narr) narr.hidden = true;
  const planRow = document.getElementById("narrPlanRow");
  if (planRow) planRow.hidden = true;
  const costRow = document.getElementById("narrCostRow");
  if (costRow) costRow.hidden = true;
  const blackRow = document.getElementById("narrBlackRow");
  if (blackRow) blackRow.hidden = true;
  const ladder = document.getElementById("hintLadder");
  if (ladder) ladder.hidden = true;
  const steps = document.getElementById("hintSteps");
  if (steps) steps.innerHTML = "";
  state.hintStepIndex = 0;
  state.hintLadderSteps = [];
}

function setCoachStatus(text) {
  document.getElementById("coachStatus").textContent = text;
}

// ---------- Move input ----------
function handleMoveInput(event) {
  if (state.inputLocked) return false;

  switch (event.type) {
    case INPUT_EVENT_TYPE.moveInputStarted: {
      const moves = state.chess.moves({ square: event.squareFrom, verbose: true });
      if (moves.length === 0) return false;
      moves.forEach((m) => state.board.addMarker(MARKER_TYPE.dot, m.to));
      return true;
    }

    case INPUT_EVENT_TYPE.validateMoveInput: {
      state.board.removeMarkers(MARKER_TYPE.dot);
      const legalMoves = state.chess.moves({ verbose: true }).filter(
        (m) => m.from === event.squareFrom && m.to === event.squareTo
      );
      if (legalMoves.length === 0) return false;

      const promotionMove = legalMoves.find((m) => m.promotion);
      if (promotionMove) {
        state.inputLocked = true;
        state.board.showPromotionDialog(event.squareTo, COLOR.white, (result) => {
          state.inputLocked = false;
          if (result && result.piece) {
            const promo = result.piece[1];
            commitStudentMove({ from: event.squareFrom, to: event.squareTo, promotion: promo });
          } else {
            state.board.setPosition(state.chess.fen(), true);
          }
        });
        return true;
      }

      commitStudentMove({ from: event.squareFrom, to: event.squareTo });
      return true;
    }

    case INPUT_EVENT_TYPE.moveInputCanceled: {
      state.board.removeMarkers(MARKER_TYPE.dot);
      return true;
    }
  }
  return true;
}

async function commitStudentMove(moveSpec) {
  // Capture pre-move state for scorecard ranking: the FEN the student saw
  // when deciding, and the count of legal moves they were choosing from.
  const fenBeforeMove = state.chess.fen();
  const legalBefore = state.chess.moves();
  state._lastLegalCount = legalBefore.length;

  const moveObj = state.chess.move(moveSpec);
  if (!moveObj) return;

  state.ply++;
  const ply = state.ply;
  const fenAfter = state.chess.fen();
  state.board.setPosition(fenAfter, true);

  // Fire off the rank analysis in parallel. It runs on its own worker
  // so it never blocks the main critique pipeline or the engine reply.
  // Scorecard cells are updated when this resolves. Only rank the
  // first 15 White moves — in continue-mode we stop adding scorecard rows.
  const whiteMoveIndex = Math.ceil(ply / 2);
  if (!state.coachOff && whiteMoveIndex >= 1 && whiteMoveIndex <= 15) {
    const uciMove = moveObj.from + moveObj.to + (moveObj.promotion || "");
    // Intentionally un-awaited:
    analyzeMoveRank({ whiteMoveIndex, fenBefore: fenBeforeMove, uciMove })
      .catch((e) => console.warn("[scorecard] background rank error:", e));
  }

  updatePhaseChip(ply);

  state.inputLocked = true;
  setCoachStatus("Thinking…");

  let evalBefore = state.evalHistory[state.evalHistory.length - 1];
  let evalAfter = 0;

  if (state.engineReady && state.engine) {
    try {
      const res = await state.engine.analyze(fenAfter, { depth: CONFIG.ANALYSIS_DEPTH });
      evalAfter = extractEvalFromWhitesPOV(res.info, state.chess.turn());
    } catch (e) {
      console.warn("Engine analyze failed:", e);
    }
  }

  const cpLoss = Math.max(0, Math.round(evalBefore - evalAfter));

  const mainlineSan = state.opening.mainline[ply - 1] || null;
  const alternatives = state.opening.alternatives?.[ply] || [];
  const historySan = state.chess.history();

  const verdict = critique({
    san: moveObj.san,
    uci: moveObj.from + moveObj.to + (moveObj.promotion || ""),
    ply,
    opening: state.opening,
    alternatives,
    mainlineSan,
    cpLoss: state.engineReady ? cpLoss : null,
    evalBefore,
    evalAfter,
    side: "w",
    moveObj,
    historySan,
  });

  if (!verdict.isMainline && state.firstDeviationPly == null) {
    state.firstDeviationPly = ply;
  }

  // Track concept counts for the recap
  (verdict.concepts || []).forEach((c) => {
    const bucket = c.polarity === "positive" ? state.positiveConceptCounts : state.negativeConceptCounts;
    bucket[c.tag] = (bucket[c.tag] || 0) + 1;
  });

  state.lastPlayerCritique = verdict;
  state.history.push({
    ply,
    byStudent: true,
    san: moveObj.san,
    uci: moveObj.from + moveObj.to + (moveObj.promotion || ""),
    critique: verdict,
    evalBefore,
    evalAfter,
  });
  state.evalHistory.push(evalAfter);

  // Mark body as has-played so landing-only copy hides
  document.body.classList.add("has-played");

  // In continue mode, skip coach UI — just update history
  if (!state.coachOff) {
    renderCoach(verdict, alternatives, moveObj, ply);
    flashMoveBadge(verdict, moveObj.to);
  }
  renderHistory();
  if (state.overlayThreats) applyThreatOverlay();
  if (state.overlayCenter) applyCenterOverlay();

  // How many White moves has the student made? After White's Nth move, state.ply === 2N - 1.
  const whitePliesPlayed = Math.ceil(state.ply / 2);
  const shouldEndAfterBlackReply = !state.coachOff && whitePliesPlayed >= 15;

  // Checkmate / stalemate mid-session: end immediately before Black could reply.
  if (state.chess.isGameOver() && !state.coachOff) {
    endSession();
    return;
  }

  await computerReply();

  // If the session ended during Black's reply (e.g. game-over), don't unlock input.
  if (state.sessionEnded) return;

  // White just completed move 15 and Black has now replied — fire the summary.
  if (shouldEndAfterBlackReply) {
    endSession();
    return;
  }

  // After Black replies, refresh the pre-move prompt with the new phase/situation
  if (!state.coachOff) {
    renderCoachPrompt(state.ply);
    setCoachStatus("Your move.");
  } else {
    setCoachStatus("Coach off — free play.");
  }

  state.inputLocked = false;
}

async function computerReply() {
  const ply = state.ply + 1;
  const mainlineSan = state.opening.mainline[ply - 1] || null;

  let replySan = null;

  const priorStudentMoves = state.history.filter((h) => h.byStudent);
  const onMainline = priorStudentMoves.every(
    (h, i) => h.san === state.opening.mainline[i * 2]
  );

  if (onMainline && mainlineSan) {
    const legal = state.chess.moves();
    if (legal.includes(mainlineSan)) {
      replySan = mainlineSan;
    }
  }

  if (!replySan) {
    if (state.engineReady && state.engine) {
      try {
        const res = await state.engine.analyze(state.chess.fen(), { depth: CONFIG.REPLY_DEPTH });
        if (res.bestmove) {
          const uciMove = res.bestmove;
          const from = uciMove.slice(0, 2);
          const to = uciMove.slice(2, 4);
          const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
          const moveObj = state.chess.move({ from, to, promotion });
          if (moveObj) {
            replySan = moveObj.san;
            state.board.setPosition(state.chess.fen(), true);
            state.ply++;

            let evalAfter = 0;
            try {
              const res2 = await state.engine.analyze(state.chess.fen(), { depth: 10 });
              evalAfter = extractEvalFromWhitesPOV(res2.info, state.chess.turn());
            } catch (_) {}

            state.history.push({
              ply: state.ply,
              byStudent: false,
              san: replySan,
              uci: uciMove,
              critique: null,
              evalBefore: state.evalHistory[state.evalHistory.length - 1],
              evalAfter,
            });
            state.evalHistory.push(evalAfter);
            updatePhaseChip(state.ply);
            renderHistory();
            showBlackReplyNarration(moveObj, state.ply);
            return;
          }
        }
      } catch (e) {
        console.warn("Engine reply failed:", e);
      }
    }

    const legal = state.chess.moves();
    if (legal.length === 0) return;
    replySan = legal[0];
  }

  const moveObj = state.chess.move(replySan);
  if (!moveObj) return;
  state.board.setPosition(state.chess.fen(), true);
  state.ply++;

  let evalAfter = state.evalHistory[state.evalHistory.length - 1];
  if (state.engineReady && state.engine) {
    try {
      const res = await state.engine.analyze(state.chess.fen(), { depth: 10 });
      evalAfter = extractEvalFromWhitesPOV(res.info, state.chess.turn());
    } catch (_) {}
  }

  state.history.push({
    ply: state.ply,
    byStudent: false,
    san: moveObj.san,
    uci: moveObj.from + moveObj.to + (moveObj.promotion || ""),
    critique: null,
    evalBefore: state.evalHistory[state.evalHistory.length - 1],
    evalAfter,
  });
  state.evalHistory.push(evalAfter);

  updatePhaseChip(state.ply);
  renderHistory();
  if (state.overlayThreats) applyThreatOverlay();
  if (state.overlayCenter) applyCenterOverlay();

  showBlackReplyNarration(moveObj, state.ply);

  // The 15-move cap is now handled in commitStudentMove (fires after Black's
  // reply to White's 15th). Here we only fire on actual game-over mid-session.
  if (state.chess.isGameOver() && !state.coachOff) {
    endSession();
  }
}

function showBlackReplyNarration(blackMoveObj, ply) {
  const narrEl = document.getElementById("coachNarrative");
  const blackRow = document.getElementById("narrBlackRow");
  const blackEl = document.getElementById("narrBlack");
  if (!blackEl || !blackRow) return;
  const line = narrateBlackReply(blackMoveObj, ply);
  if (!line) return;
  blackEl.textContent = line;
  blackRow.hidden = false;
  if (narrEl) narrEl.hidden = false;
}

function renderConceptsScorecard(studentMoves) {
  const container = document.getElementById("conceptsScorecard");
  if (!container) return;
  const items = container.querySelectorAll("li[data-concept]");
  const pos = state.positiveConceptCounts;
  const neg = state.negativeConceptCounts;

  items.forEach((li) => {
    const tag = li.getAttribute("data-concept");
    const mark = li.querySelector(".scorecard-mark");
    if (!mark) return;

    mark.classList.remove("mark-good", "mark-warn", "mark-miss");

    const p = pos[tag] || 0;
    const n = neg[tag] || 0;

    // Special case: "piece-twice" / "piece economy" only has a negative polarity.
    // If no negatives recorded AND the player developed things, call it a win.
    if (tag === "piece-twice") {
      if (n === 0 && studentMoves.length >= 6) {
        mark.textContent = "✓";
        mark.classList.add("mark-good");
      } else if (n > 0) {
        mark.textContent = "!";
        mark.classList.add("mark-miss");
      } else {
        mark.textContent = "—";
      }
      return;
    }

    if (p > 0 && n === 0) {
      mark.textContent = "✓";
      mark.classList.add("mark-good");
    } else if (p > 0 && n > 0 && p >= n) {
      mark.textContent = "✓";
      mark.classList.add("mark-warn");
    } else if (n > 0) {
      mark.textContent = "!";
      mark.classList.add("mark-miss");
    } else {
      mark.textContent = "—";
    }
  });
}

function extractEvalFromWhitesPOV(info, sideToMoveNext) {
  if (!info) return 0;
  let cp = 0;
  if (info.mate != null) {
    cp = info.mate > 0 ? 10000 - info.mate * 10 : -10000 - info.mate * 10;
  } else if (info.scoreCp != null) {
    cp = info.scoreCp;
  }
  if (sideToMoveNext === "b") cp = -cp;
  return cp;
}

// ---------- Rendering ----------
function updatePhaseChip(ply) {
  const moveCounter = document.getElementById("moveCounter");
  const stageEl = document.getElementById("phaseStage");
  moveCounter.textContent = String(Math.ceil(ply / 2));
  const phase = PHASES.find((p) => ply >= p.minPly && ply <= p.maxPly) || PHASES[0];
  stageEl.textContent = phase.label;
}

function renderCoach(verdict, alternatives, moveObj, ply) {
  const msgEl = document.getElementById("coachMessage");
  let msg = verdict.message;

  // One-time teaching line on the first "book" move: emphasize that book is
  // a theory fact, not a virtue — natural moves often stumble into it.
  if (verdict.classification === "book") {
    try {
      if (!localStorage.getItem("f15m_book_taught")) {
        msg += " **Theory isn't a test you passed** \u2014 it's a label for moves that match established opening lines. Natural, principled moves often match theory without any memorization.";
        localStorage.setItem("f15m_book_taught", "1");
      }
    } catch (_) { /* localStorage unavailable */ }
  }

  msgEl.innerHTML = escapeAndBold(msg);

  // Hide the pre-move prompt while the post-move verdict is visible
  const promptEl = document.getElementById("coachPrompt");
  if (promptEl) promptEl.hidden = true;

  // Close any open hint ladder when a move is played
  const ladder = document.getElementById("hintLadder");
  if (ladder) ladder.hidden = true;

  // Legacy single-badge meta row — keep hidden in R3 (replaced by axes + rubric)
  const meta = document.getElementById("coachMeta");
  if (meta) meta.hidden = true;

  // --- Axes: Theory + Quality chips ---
  const axesEl = document.getElementById("coachAxes");
  const axes = computeAxes(verdict);
  const axTheory = document.getElementById("axisTheory");
  const axQuality = document.getElementById("axisQuality");
  if (axTheory && axQuality && axesEl) {
    axTheory.textContent = axes.theory;
    axTheory.className = "axis-value " + axes.theoryCls;
    axQuality.textContent = axes.quality;
    axQuality.className = "axis-value " + axes.qualityCls;
    axesEl.hidden = false;
  }

  // --- Rubric: 4 pills ---
  const rubric = computeRubric(verdict, moveObj, ply);
  const rubEl = document.getElementById("rubric");
  const rubMap = [
    ["rubCenter", rubric.center],
    ["rubDevelopment", rubric.development],
    ["rubKingSafety", rubric["king-safety"]],
    ["rubTempo", rubric.tempo],
  ];
  for (const [id, score] of rubMap) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.textContent = rubricLabel(score);
    el.className = "rubric-score " + rubricClass(score);
  }
  if (rubEl) rubEl.hidden = false;

  // --- Narrative: Plan fit + Cost (Black's reply populated later in computerReply) ---
  const planTxt = computePlanFit(verdict, moveObj, ply, rubric);
  const costTxt = computeCost(verdict, moveObj, ply, rubric);
  const narrEl = document.getElementById("coachNarrative");
  const planRow = document.getElementById("narrPlanRow");
  const planEl = document.getElementById("narrPlan");
  const costRow = document.getElementById("narrCostRow");
  const costEl = document.getElementById("narrCost");
  const blackRow = document.getElementById("narrBlackRow");
  const blackEl = document.getElementById("narrBlack");

  if (planEl && planRow) {
    if (planTxt) { planEl.innerHTML = escapeAndBold(planTxt); planRow.hidden = false; }
    else { planRow.hidden = true; }
  }
  if (costEl && costRow) {
    if (costTxt) { costEl.innerHTML = escapeAndBold(costTxt); costRow.hidden = false; }
    else { costRow.hidden = true; }
  }
  // Reset Black's reply row — will be filled after engine responds
  if (blackRow && blackEl) {
    blackEl.textContent = "…";
    blackRow.hidden = true;
  }
  if (narrEl) {
    narrEl.hidden = !(planTxt || costTxt);
  }

  // --- Concepts row ---
  const conceptsEl = document.getElementById("coachConcepts");
  conceptsEl.innerHTML = "";
  (verdict.concepts || []).forEach((c) => {
    const li = document.createElement("li");
    const label = CONCEPT_LABELS[c.tag] || c.tag.replace(/-/g, " ");
    const sign = c.polarity === "negative" ? "− " : "+ ";
    li.textContent = sign + label;
    if (c.polarity === "negative") li.classList.add("concept-negative");
    conceptsEl.appendChild(li);
  });

  // Alternatives ("other ideas at this moment") — from the opening tree
  renderAlternatives(verdict, alternatives);
}

function renderAlternatives(verdict, alternatives) {
  const container = document.getElementById("coachAlternatives");
  const list = document.getElementById("altsList");
  if (!container || !list) return;

  list.innerHTML = "";
  const alts = Array.isArray(alternatives) ? alternatives : [];

  // Build the shown set: include the mainline if the player deviated, plus any tree alts.
  const shown = [];
  if (!verdict.isMainline && verdict.recommended) {
    shown.push({
      san: verdict.recommended,
      label: "mainline",
      why: "The main line here — sets up the standard plan for this opening.",
    });
  }
  alts.forEach((a) => {
    if (a.san && a.san !== verdict.recommended) shown.push(a);
  });

  // Cap to 3 so the panel doesn't balloon
  const limited = shown.slice(0, 3);
  if (limited.length === 0) {
    container.hidden = true;
    return;
  }

  limited.forEach((alt) => {
    const li = document.createElement("li");
    const tagClass = "alt-tag-" + (alt.label === "mainline" ? "playable" : (alt.label || "playable"));
    const tagText = alt.label === "mainline"
      ? "Main line"
      : (alt.label ? alt.label[0].toUpperCase() + alt.label.slice(1) : "Playable");
    li.innerHTML =
      `<span class="alt-san">${escapeHtml(alt.san)}</span>` +
      `<span class="alt-tag ${tagClass}">${escapeHtml(tagText)}</span>` +
      (alt.why ? escapeAndBold(alt.why) : "");
    list.appendChild(li);
  });
  container.hidden = false;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------- On-board flash badge ----------
const CLASS_FLASH_LABEL = {
  book: "Strong",
  good: "Good",
  playable: "Playable",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder",
};

function flashMoveBadge(verdict) {
  const el = document.getElementById("moveFlash");
  const label = document.getElementById("moveFlashLabel");
  if (!el || !label) return;
  const cls = verdict.classification || "book";
  label.textContent = CLASS_FLASH_LABEL[cls] || verdict.label || "Played";

  // Clear previous state classes
  el.classList.remove(
    "flash-book", "flash-good", "flash-playable",
    "flash-inaccuracy", "flash-mistake", "flash-blunder"
  );
  el.classList.add("flash-" + cls);

  // Show, then hide after ~1.1s
  el.hidden = false;
  // Force a reflow to restart the transition if called rapidly
  void el.offsetWidth;
  if (el._flashTimer) clearTimeout(el._flashTimer);
  el._flashTimer = setTimeout(() => {
    el.hidden = true;
  }, 2000);
}

// Render the pre-move prompt above coach-message: phase goal + situational concern.
// Called at session start, after every computer reply, and on reset.
function renderCoachPrompt(ply) {
  const promptEl = document.getElementById("coachPrompt");
  const goalEl = document.getElementById("promptGoal");
  const watchEl = document.getElementById("promptWatch");
  if (!promptEl || !goalEl || !watchEl) return;

  // Next-move ply is current ply + 1 (ply increments before this is called)
  const nextPly = ply + 1;
  const phase = PHASES.find((p) => nextPly >= p.minPly && nextPly <= p.maxPly) || PHASES[0];

  // Derive a situational watch line based on board state
  let watch = phase.watch;
  try {
    if (state.chess && state.history && state.history.length > 0) {
      const hasCastled = state.history.some(
        (h) => h.byStudent && (h.san === "O-O" || h.san === "O-O-O")
      );
      const last = state.history[state.history.length - 1];
      if (!hasCastled && nextPly >= 9) {
        watch = "Your king is still in the center. Castling soon is the highest-priority move.";
      } else if (last && !last.byStudent && last.san) {
        // After a Black reply, hint at reading the move
        const san = last.san;
        if (/x/.test(san)) {
          watch = `Black just captured with <strong>${san}</strong>. Recapture only if the trade serves your plan.`;
        } else if (/\+$/.test(san)) {
          watch = `Black checked with <strong>${san}</strong>. Resolve the check, then return to the plan.`;
        } else if (/^[NBRQ]/.test(san) && nextPly <= 8) {
          watch = `Black developed with <strong>${san}</strong>. Answer development with development \u2014 don't chase.`;
        }
      }
    }
  } catch (_) { /* fall back to phase.watch */ }

  goalEl.textContent = phase.goal;
  if (watch) {
    watchEl.innerHTML = escapeAndBold(watch);
    watchEl.hidden = false;
  } else {
    watchEl.hidden = true;
  }
  promptEl.hidden = false;
}

function escapeAndBold(text) {
  // Escape HTML and then convert **x** -> <strong>x</strong>
  const esc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

// ---------- Annotated move log ----------
function renderHistory() {
  const list = document.getElementById("historyAnnotated");
  if (!list) return;
  list.innerHTML = "";

  const maxMove = Math.ceil(state.ply / 2);
  const hasAnyStudentMove = state.history.some((h) => h.byStudent);
  const hintEl = document.getElementById("historyHint");
  if (hintEl) hintEl.hidden = !hasAnyStudentMove;

  for (let i = 0; i < maxMove; i++) {
    const white = state.history[i * 2];
    const black = state.history[i * 2 + 1];

    const row = document.createElement("li");
    row.className = "history-row";
    const cls = white?.critique?.classification;
    if (cls) row.classList.add("row-" + cls);
    if (state.selectedHistoryPly === (i * 2 + 1)) row.classList.add("is-selected");

    const tagHtml = white?.critique
      ? `<span class="tiny-badge">${escapeHtml(white.critique.label || cls || "")}</span>`
      : "";

    const whiteHtml = white
      ? `<span class="ply ply-white"><span class="ply-san">${escapeHtml(white.san)}</span>${tagHtml}</span>`
      : `<span class="ply ply-white"></span>`;
    const blackHtml = black
      ? `<span class="ply ply-black"><span class="ply-san">${escapeHtml(black.san)}</span></span>`
      : `<span class="ply ply-black"></span>`;

    row.innerHTML =
      `<span class="row-num">${i + 1}.</span>` +
      whiteHtml + blackHtml;

    // Expandable note if there's a critique
    if (white?.critique?.message) {
      const note = document.createElement("div");
      note.className = "history-note";
      note.hidden = state.selectedHistoryPly !== (i * 2 + 1);
      note.innerHTML = escapeAndBold(white.critique.message);
      row.appendChild(note);

      row.addEventListener("click", () => {
        const targetPly = i * 2 + 1;
        state.selectedHistoryPly = state.selectedHistoryPly === targetPly ? null : targetPly;
        renderHistory();
      });
    }

    list.appendChild(row);
  }
  document.getElementById("btnUndo").disabled = state.history.length === 0;
}

// ---------- Board overlays ----------
function clearOverlay(markerDef) {
  if (!state.board) return;
  try { state.board.removeMarkers(markerDef); } catch (_) { /* noop */ }
}

function applyCenterOverlay() {
  if (!state.board) return;
  clearOverlay(MARKER_CENTER);
  if (!state.overlayCenter) return;
  CENTER_SQUARES.forEach((sq) => state.board.addMarker(MARKER_CENTER, sq));
}

function applyThreatOverlay() {
  if (!state.board) return;
  clearOverlay(MARKER_THREAT);
  if (!state.overlayThreats) return;

  // Compute all squares Black can capture on. We do this by asking chess.js for
  // Black's legal captures in the current position (regardless of whose turn it is).
  const fen = state.chess.fen();
  const parts = fen.split(" ");
  if (parts.length < 6) return;
  parts[1] = "b"; // force black-to-move so we can enumerate its attacks
  parts[3] = "-"; // invalidate en-passant
  const probeFen = parts.join(" ");

  let probe;
  try {
    probe = new Chess(probeFen);
  } catch (e) {
    return;
  }
  const captures = probe.moves({ verbose: true }).filter((m) => m.flags.includes("c") || m.flags.includes("e"));
  const targets = Array.from(new Set(captures.map((m) => m.to)));
  targets.forEach((sq) => state.board.addMarker(MARKER_THREAT, sq));
}

function toggleOverlay(which) {
  if (which === "center") {
    state.overlayCenter = !state.overlayCenter;
    document.getElementById("btnOverlayCenter").setAttribute("aria-pressed", String(state.overlayCenter));
    applyCenterOverlay();
  } else if (which === "threats") {
    state.overlayThreats = !state.overlayThreats;
    document.getElementById("btnOverlayThreats").setAttribute("aria-pressed", String(state.overlayThreats));
    applyThreatOverlay();
  }
}

// ---------- Summary with the three-question recap ----------
function endSession() {
  if (state.sessionEnded) return; // idempotent — never fire twice in one session
  state.sessionEnded = true;
  state.inputLocked = true;
  setCoachStatus("Session complete.");

  const studentMoves = state.history.filter((h) => h.byStudent);
  const bookMoves = studentMoves.filter((h) => h.critique?.isMainline).length;
  const accuracy = studentMoves.length > 0 ? Math.round((bookMoves / studentMoves.length) * 100) : 0;

  document.getElementById("summaryOpening").textContent = state.opening.name;
  document.getElementById("statBook").textContent = `${bookMoves}/${studentMoves.length} (${accuracy}%)`;
  document.getElementById("statDeviation").textContent = state.firstDeviationPly
    ? `Move ${Math.ceil(state.firstDeviationPly / 2)}`
    : "Stayed in theory";

  // Recurring theme = most-used principle (positive if clean session, else negative)
  const cleanSession = bookMoves === studentMoves.length;
  const conceptCounts = cleanSession ? state.positiveConceptCounts : state.negativeConceptCounts;
  const topEntry = Object.entries(conceptCounts).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("statConcept").textContent = topEntry
    ? prettyConceptForStat(topEntry[0])
    : "Classical principles";

  // ---------- The three-question recap ----------
  document.getElementById("qGood").innerHTML = buildGoodSummary(studentMoves);
  document.getElementById("qDrift").innerHTML = buildDriftSummary(studentMoves);
  document.getElementById("qLesson").innerHTML = buildLessonSummary(studentMoves);

  // ---------- One-sentence takeaway rule ----------
  const takeawayEl = document.getElementById("takeawayRule");
  const takeawayBody = document.getElementById("takeawayBody");
  if (takeawayEl && takeawayBody) {
    const rule = buildTakeawayRule(
      studentMoves,
      state.opening,
      state.positiveConceptCounts,
      state.negativeConceptCounts
    );
    takeawayBody.textContent = rule;
    takeawayEl.hidden = false;
  }

  // ---------- Concepts scorecard (four principles) ----------
  renderConceptsScorecard(studentMoves);

  // Per-move notes (all slips)
  const notes = document.getElementById("summaryNotes");
  notes.innerHTML = "";
  const weakMoves = studentMoves.filter((m) =>
    ["inaccuracy", "mistake", "blunder"].includes(m.critique?.classification)
  );
  if (weakMoves.length > 0) {
    const h4 = document.createElement("h4");
    h4.textContent = "Moments to revisit";
    notes.appendChild(h4);
    const ul = document.createElement("ul");
    weakMoves.forEach((m) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>Move ${Math.ceil(m.ply / 2)} (${m.san}):</strong> ${escapeAndBold(m.critique.message)}`;
      ul.appendChild(li);
    });
    notes.appendChild(ul);
  }

  // Headline
  const headline = document.getElementById("summaryHeadline");
  if (accuracy === 100) headline.textContent = "Clean session.";
  else if (accuracy >= 70) headline.textContent = "Nicely played.";
  else if (accuracy >= 40) headline.textContent = "Good work — room to sharpen.";
  else headline.textContent = "Tough one. Every session teaches.";

  // Finalize the scorecard: paint the 16th cell with the session’s
  // average percentile. If any per-move rank analyses are still running
  // (slow depth-10 search on a crowded position), wait briefly for them
  // so the final cell reflects all 15 moves. Cap the wait so the modal
  // isn't held up if Stockfish is wedged.
  finalizeScorecard().catch((e) => console.warn("[scorecard] finalize error:", e));

  openSummaryModal();
}

// Compute and paint the final percentile cell. Waits up to ~3s for any
// in-flight rank analyses to settle so the average reflects every move.
async function finalizeScorecard() {
  const deadline = Date.now() + 3000;
  while (state.moveRanks.length < 15 && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 100));
  }
  const pct = computeSessionPercentile();
  if (pct != null) paintScorecardFinal(pct);
}

function buildGoodSummary(studentMoves) {
  const goodMoves = studentMoves.filter((m) =>
    ["book", "good"].includes(m.critique?.classification)
  );
  const positives = state.positiveConceptCounts;
  const positiveList = Object.entries(positives).sort((a, b) => b[1] - a[1]);

  if (goodMoves.length === studentMoves.length) {
    const tags = positiveList.slice(0, 2).map((p) => prettyConceptForStat(p[0])).join(" and ");
    return tags
      ? `Every move matched standard theory. You consistently showed up for <strong>${tags}</strong>.`
      : `Every move matched standard theory. Clean opening work.`;
  }

  if (goodMoves.length >= studentMoves.length * 0.7) {
    return `Most of your moves matched theory. When you followed the mainline, your position stayed healthy.`;
  }

  if (positiveList.length > 0) {
    const tags = positiveList.slice(0, 2).map((p) => prettyConceptForStat(p[0])).join(" and ");
    return `You did get <strong>${tags}</strong> right on some moves. Build on that.`;
  }

  return `You made it through 15 moves. That's the foundation — the rest is iteration.`;
}

function buildDriftSummary(studentMoves) {
  if (state.firstDeviationPly == null) {
    return `You never left theory. That's rare — study a new opening to keep growing.`;
  }
  const driftMove = Math.ceil(state.firstDeviationPly / 2);
  const driftEntry = studentMoves.find((m) => m.ply === state.firstDeviationPly);
  const driftSan = driftEntry?.san || "—";
  const driftMainline = driftEntry?.critique?.recommended;

  if (driftMainline && driftMainline !== driftSan) {
    return `First departure was at <strong>move ${driftMove}</strong> (${driftSan}). The main line was <strong>${driftMainline}</strong>.`;
  }
  return `First departure was at <strong>move ${driftMove}</strong> (${driftSan}).`;
}

function buildLessonSummary(studentMoves) {
  const negatives = state.negativeConceptCounts;
  const topNeg = Object.entries(negatives).sort((a, b) => b[1] - a[1])[0];

  if (topNeg) {
    const label = prettyConceptForStat(topNeg[0]);
    const advice = LESSON_ADVICE[topNeg[0]] || `Watch for <strong>${label}</strong> in your next session.`;
    return advice;
  }

  // No negatives — positive lesson
  const bookMoves = studentMoves.filter((m) => m.critique?.isMainline).length;
  if (bookMoves === studentMoves.length) {
    return `You have the theory. Next step: play this opening against sharper replies in a real game.`;
  }
  return `Your moves stayed reasonable even when you left theory. Next time, aim for the main line — it sets up the middlegame cleanly.`;
}

const LESSON_ADVICE = {
  "early-queen": "<strong>Keep the queen home early.</strong> Develop knights and bishops first — the queen comes out after she has targets.",
  "piece-twice": "<strong>Develop every piece once before moving any piece twice.</strong> Time is the opening's most valuable resource.",
  "flank-pawn": "<strong>Fight for the center before the flanks.</strong> Edge pawns don't develop anything and don't contest the middle.",
  tempo: "<strong>Don't lose tempo.</strong> Every opening move should either claim space, develop a piece, or prepare king safety.",
  initiative: "<strong>Keep the initiative.</strong> Let your pieces make threats instead of just reacting.",
  "king-safety": "<strong>Guard the king first, attack second.</strong> Weakening pawns near your own king invites trouble.",
  development: "<strong>Develop every minor piece before launching anything.</strong> Undeveloped pieces are wasted pieces.",
  center: "<strong>Stake a claim in the center.</strong> The four central squares — d4, d5, e4, e5 — decide the early game.",
  "pawn-structure": "<strong>Mind your pawn structure.</strong> Pawns can't go backwards — push them deliberately.",
  "target-f7": "<strong>Watch f7 (and f2).</strong> It's the most vulnerable square early; many opening tricks aim there.",
  flank: "<strong>The center comes before the flanks.</strong> Wings are for the middlegame.",
  flexible: "<strong>Stay flexible early.</strong> Commit pawns only when you know what structure you want.",
  "bishop-trapped": "<strong>Keep your bishops breathing.</strong> A blocked bishop is almost a lost piece.",
};

function prettyConceptForStat(tag) {
  const map = {
    center: "center control",
    development: "development",
    "king-safety": "king safety",
    castle: "castling",
    "early-queen": "early queen moves",
    "piece-twice": "repeated piece moves",
    "flank-pawn": "flank pawn pushes",
    tempo: "tempo",
    initiative: "initiative",
    "pawn-structure": "pawn structure",
    flank: "flank play",
    flexible: "flexibility",
    "bishop-trapped": "bishop activity",
    "target-f7": "f7 pressure",
  };
  return map[tag] || tag.replace(/-/g, " ");
}

// ---------- Actions ----------
function undoLast() {
  if (state.history.length === 0) return;
  const last = state.history[state.history.length - 1];
  state.chess.undo();
  state.history.pop();
  state.evalHistory.pop();
  state.ply--;
  if (!last.byStudent && state.history.length > 0) {
    state.chess.undo();
    state.history.pop();
    state.evalHistory.pop();
    state.ply--;
  }
  // Roll back the scorecard: remove any entries whose whiteMoveIndex is now
  // past the end of play, and reset those cells to empty. ply counts half-moves,
  // so the number of completed White moves is ceil(ply/2).
  const whiteMovesPlayed = Math.ceil(state.ply / 2);
  if (Array.isArray(state.moveRanks) && state.moveRanks.length > 0) {
    const toRemove = state.moveRanks.filter((r) => r.whiteMoveIndex > whiteMovesPlayed);
    state.moveRanks = state.moveRanks.filter((r) => r.whiteMoveIndex <= whiteMovesPlayed);
    toRemove.forEach((r) => clearScorecardCell(r.whiteMoveIndex));
  }
  state.board.setPosition(state.chess.fen(), true);
  updatePhaseChip(state.ply);
  renderHistory();
  resetCoachPanel();
  setCoachStatus("Your move.");
  state.inputLocked = false;
}

async function showHint() {
  if (state.inputLocked) return;
  if (state.chess.turn() !== "w") return;
  setCoachStatus("Looking for a hint…");

  // Get engine's best pick if we can (for level 4 of the ladder)
  let engineBestSan = null;
  if (state.engineReady && state.engine) {
    try {
      const res = await state.engine.analyze(state.chess.fen(), { depth: 10 });
      if (res.bestmove) {
        const from = res.bestmove.slice(0, 2);
        const to = res.bestmove.slice(2, 4);
        const m = state.chess.moves({ verbose: true }).find((mv) => mv.from === from && mv.to === to);
        if (m) engineBestSan = m.san;
      }
    } catch (_) { /* noop */ }
  }

  const ply = state.ply + 1; // next ply (White to move)
  const steps = buildHintLadder({
    ply,
    opening: state.opening,
    chess: state.chess,
    engineBestSan,
  });
  state.hintLadderSteps = steps;
  state.hintStepIndex = 0;

  renderHintLadderStep();
  const ladder = document.getElementById("hintLadder");
  if (ladder) ladder.hidden = false;
  setCoachStatus("Hint shown.");
}

function renderHintLadderStep() {
  const list = document.getElementById("hintSteps");
  const nextBtn = document.getElementById("btnHintNext");
  if (!list) return;
  list.innerHTML = "";
  const visible = state.hintLadderSteps.slice(0, state.hintStepIndex + 1);
  visible.forEach((txt) => {
    const li = document.createElement("li");
    li.innerHTML = escapeAndBold(txt);
    list.appendChild(li);
  });

  // On final step, try to frame the engine's best move on the board
  if (state.hintStepIndex >= state.hintLadderSteps.length - 1) {
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.textContent = "That's the full hint";
    }
    // Parse any **SAN** markers out of the final step and frame it
    const finalTxt = state.hintLadderSteps[state.hintLadderSteps.length - 1] || "";
    const match = finalTxt.match(/\*\*([A-Za-z0-9\-+#=]+)\*\*/);
    if (match) {
      const sanToFrame = match[1];
      const moves = state.chess.moves({ verbose: true }).filter(
        (m) => m.san === sanToFrame || m.san === sanToFrame.replace(/[+#]/g, "")
      );
      if (moves[0]) {
        state.board.removeMarkers(MARKER_TYPE.frame);
        state.board.addMarker(MARKER_TYPE.frame, moves[0].from);
        state.board.addMarker(MARKER_TYPE.frame, moves[0].to);
        setTimeout(() => {
          try { state.board.removeMarkers(MARKER_TYPE.frame); } catch (_) {}
        }, 3500);
      }
    }
  } else {
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.textContent = "Tell me more";
    }
  }
}

function advanceHintLadder() {
  if (state.hintStepIndex < state.hintLadderSteps.length - 1) {
    state.hintStepIndex++;
    renderHintLadderStep();
  }
}

function closeHintLadder() {
  const ladder = document.getElementById("hintLadder");
  if (ladder) ladder.hidden = true;
  state.hintStepIndex = 0;
  state.hintLadderSteps = [];
  try { state.board.removeMarkers(MARKER_TYPE.frame); } catch (_) {}
}

// ---------- Event bindings ----------
document.getElementById("btnUndo").addEventListener("click", undoLast);
document.getElementById("btnHint").addEventListener("click", showHint);
document.getElementById("btnResign").addEventListener("click", endSession);
document.getElementById("btnPlayAgain").addEventListener("click", () => {
  closeSummaryModal({ silent: true });
  startGame(state.openingId);
});
document.getElementById("btnNewOpening").addEventListener("click", () => {
  closeSummaryModal({ silent: true });
  showPanel("openings");
});

// --- Summary modal: continue button + any close-without-choosing path ---
const summaryModalEl = document.getElementById("summaryModal");
const btnContinueGameEl = document.getElementById("btnContinueGame");
const btnSummaryCloseEl = document.getElementById("btnSummaryClose");
if (btnContinueGameEl) {
  btnContinueGameEl.addEventListener("click", () => {
    closeSummaryModal({ silent: true });
    enterContinueMode();
  });
}
if (btnSummaryCloseEl) {
  // X button in the modal header — closing without choosing defaults to continue-play
  btnSummaryCloseEl.addEventListener("click", () => closeSummaryModal());
}
if (summaryModalEl) {
  // Backdrop click — treat as close-without-choosing (defaults to continue-play)
  summaryModalEl.addEventListener("click", (e) => {
    if (e.target === summaryModalEl) closeSummaryModal();
  });
  // ESC / native cancel — same treatment
  summaryModalEl.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeSummaryModal();
  });
  // Native close event (fires from any close path) — ensure continue mode engages
  summaryModalEl.addEventListener("close", () => {
    if (state.sessionEnded && !state.coachOff) enterContinueMode();
  });
}
document.getElementById("btnSwitch").addEventListener("click", () => showPanel("openings"));
const btnPickOpeningEl = document.getElementById("btnPickOpening");
if (btnPickOpeningEl) btnPickOpeningEl.addEventListener("click", () => showPanel("openings"));
const btnPickOpeningNavEl = document.getElementById("btnPickOpeningNav");
if (btnPickOpeningNavEl) btnPickOpeningNavEl.addEventListener("click", () => showPanel("openings"));

// --- Help modal (replaces the dead "Openings" top-right link) ---
const helpModalEl = document.getElementById("helpModal");
const btnHelpEl = document.getElementById("btnHelp");
const btnHelpCloseEl = document.getElementById("btnHelpClose");
const btnHelpDoneEl = document.getElementById("btnHelpDone");
if (helpModalEl && btnHelpEl) {
  btnHelpEl.addEventListener("click", () => {
    if (typeof helpModalEl.showModal === "function") {
      helpModalEl.showModal();
      helpModalEl.scrollTop = 0;
    } else {
      // <dialog> not supported — fall back to an open attribute + top-of-viewport
      helpModalEl.setAttribute("open", "");
    }
  });
  const closeHelp = () => {
    if (typeof helpModalEl.close === "function" && helpModalEl.hasAttribute("open")) {
      helpModalEl.close();
    } else {
      helpModalEl.removeAttribute("open");
    }
  };
  if (btnHelpCloseEl) btnHelpCloseEl.addEventListener("click", closeHelp);
  if (btnHelpDoneEl) btnHelpDoneEl.addEventListener("click", closeHelp);
  // Click on backdrop closes the modal (clicks that land on the <dialog> itself, not its inner <article>)
  helpModalEl.addEventListener("click", (e) => {
    if (e.target === helpModalEl) closeHelp();
  });
}

// --- Round 3: Hint ladder buttons ---
const btnHintNextEl = document.getElementById("btnHintNext");
if (btnHintNextEl) btnHintNextEl.addEventListener("click", advanceHintLadder);
const btnHintCloseEl = document.getElementById("btnHintClose");
if (btnHintCloseEl) btnHintCloseEl.addEventListener("click", closeHintLadder);

// --- Round 3: Overflow menu (Switch opening / End session) ---
const btnOverflowEl = document.getElementById("btnOverflow");
const overflowMenuEl = document.getElementById("overflowMenu");
if (btnOverflowEl && overflowMenuEl) {
  btnOverflowEl.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = !overflowMenuEl.hidden;
    overflowMenuEl.hidden = isOpen;
    btnOverflowEl.setAttribute("aria-expanded", String(!isOpen));
  });
  // Close when clicking anywhere else
  document.addEventListener("click", (e) => {
    if (overflowMenuEl.hidden) return;
    if (e.target === btnOverflowEl || btnOverflowEl.contains(e.target)) return;
    if (overflowMenuEl.contains(e.target)) {
      // let menu items run their handlers, then close
      overflowMenuEl.hidden = true;
      btnOverflowEl.setAttribute("aria-expanded", "false");
      return;
    }
    overflowMenuEl.hidden = true;
    btnOverflowEl.setAttribute("aria-expanded", "false");
  });
  // Esc closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overflowMenuEl.hidden) {
      overflowMenuEl.hidden = true;
      btnOverflowEl.setAttribute("aria-expanded", "false");
    }
  });
}

// --- Round 3: Tooltip tap handler (mobile-friendly) ---
// Hover works on desktop via CSS; tap toggles .tt-open for touch devices
document.addEventListener("click", (e) => {
  const term = e.target.closest(".term");
  if (term) {
    // Toggle just this term; close any other open tooltips
    document.querySelectorAll(".term.tt-open").forEach((t) => {
      if (t !== term) t.classList.remove("tt-open");
    });
    term.classList.toggle("tt-open");
    e.stopPropagation();
    return;
  }
  // Click outside closes any open tooltip
  document.querySelectorAll(".term.tt-open").forEach((t) => t.classList.remove("tt-open"));
});

// Overlay toggles
const btnCenter = document.getElementById("btnOverlayCenter");
const btnThreats = document.getElementById("btnOverlayThreats");
if (btnCenter) btnCenter.addEventListener("click", () => toggleOverlay("center"));
if (btnThreats) btnThreats.addEventListener("click", () => toggleOverlay("threats"));

// Kick things off: auto-start with the default opening so the board is live on load
renderOpeningCards();
startGame(DEFAULT_OPENING_ID);
