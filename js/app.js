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
import { CONFIG } from "./config.js";
import { critique, CLASS, classToBadgeClass } from "./critique.js";

const MAX_PLIES = 30; // 15 full moves
const DEFAULT_OPENING_ID = "italian"; // auto-start with the Italian Game

// Phase map: ply range -> label
const PHASES = [
  { minPly: 1, maxPly: 8,  label: "Claim the center" },
  { minPly: 9, maxPly: 16, label: "Develop & coordinate" },
  { minPly: 17, maxPly: 24, label: "King safety & structure" },
  { minPly: 25, maxPly: 30, label: "Plan & pressure" },
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
};

// ---------- Panels ----------
const panels = {
  landing: document.getElementById("landing"),
  openings: document.getElementById("openings"),
  summary: document.getElementById("summary"),
};

function showPanel(name) {
  // "landing" is always visible (it's the hero). openings and summary toggle.
  // When summary is shown, we hide the hero to focus on the recap.
  panels.openings.hidden = name !== "openings";
  panels.summary.hidden = name !== "summary";
  panels.landing.hidden = name === "summary"; // hero hides only when reviewing
  if (name === "openings") {
    document.getElementById("openings").scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
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

  document.getElementById("openingEco").textContent = opening.eco;
  document.getElementById("openingTitle").textContent = opening.name;

  panels.summary.hidden = true;
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
    setCoachStatus("Waking up…");
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
}

function resetCoachPanel() {
  document.getElementById("coachMessage").textContent =
    "Make a move when you're ready. I'll tell you what it does, what it costs, and what to watch for next.";
  document.getElementById("coachMeta").hidden = true;
  document.getElementById("coachConcepts").innerHTML = "";
  const alts = document.getElementById("coachAlternatives");
  if (alts) alts.hidden = true;
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
  const moveObj = state.chess.move(moveSpec);
  if (!moveObj) return;

  state.ply++;
  const ply = state.ply;
  const fenAfter = state.chess.fen();
  state.board.setPosition(fenAfter, true);

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

  renderCoach(verdict, alternatives);
  flashMoveBadge(verdict, moveObj.to);
  renderHistory();
  if (state.overlayThreats) applyThreatOverlay();
  if (state.overlayCenter) applyCenterOverlay();

  if (state.chess.isGameOver() || state.ply >= MAX_PLIES) {
    endSession();
    return;
  }

  await computerReply();

  state.inputLocked = false;
  setCoachStatus("Your move.");
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

  if (state.chess.isGameOver() || state.ply >= MAX_PLIES) {
    endSession();
  }
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

function renderCoach(verdict, alternatives) {
  const msgEl = document.getElementById("coachMessage");
  msgEl.innerHTML = escapeAndBold(verdict.message);

  const meta = document.getElementById("coachMeta");
  meta.hidden = false;
  const badge = document.getElementById("coachBadge");
  badge.className = classToBadgeClass(verdict.classification);
  badge.textContent = verdict.label;

  const evalEl = document.getElementById("coachEval");
  if (verdict.cpLoss != null) {
    if (verdict.cpLoss < 40) evalEl.textContent = "Position stays roughly level.";
    else evalEl.textContent = `≈ ${verdict.cpLoss} cp shift`;
  } else {
    evalEl.textContent = "";
  }

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
  book: "Book",
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
  }, 1150);
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
  state.inputLocked = true;
  setCoachStatus("Session complete.");

  const studentMoves = state.history.filter((h) => h.byStudent);
  const bookMoves = studentMoves.filter((h) => h.critique?.isMainline).length;
  const accuracy = studentMoves.length > 0 ? Math.round((bookMoves / studentMoves.length) * 100) : 0;

  document.getElementById("summaryOpening").textContent = state.opening.name;
  document.getElementById("statBook").textContent = `${bookMoves}/${studentMoves.length} (${accuracy}%)`;
  document.getElementById("statDeviation").textContent = state.firstDeviationPly
    ? `Move ${Math.ceil(state.firstDeviationPly / 2)}`
    : "Stayed on book";

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

  showPanel("summary");
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
      ? `Every move matched the book. You consistently showed up for <strong>${tags}</strong>.`
      : `Every move matched the book. Clean opening work.`;
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
  return `Your moves stayed reasonable even off-book. Next time, aim for the main line — it sets up the middlegame cleanly.`;
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
  const mainlineSan = state.opening.mainline[state.ply];
  if (mainlineSan && state.chess.moves().includes(mainlineSan)) {
    flashHint(mainlineSan, `Main line: **${mainlineSan}**`);
    return;
  }
  if (state.engineReady && state.engine) {
    try {
      const res = await state.engine.analyze(state.chess.fen(), { depth: 10 });
      if (res.bestmove) {
        const from = res.bestmove.slice(0, 2);
        const to = res.bestmove.slice(2, 4);
        const moves = state.chess.moves({ verbose: true }).filter((m) => m.from === from && m.to === to);
        const san = moves[0]?.san || `${from}-${to}`;
        flashHint(san, `Engine's top pick: **${san}**`);
        return;
      }
    } catch (e) {
      console.warn(e);
    }
  }
  flashHint(null, "No hint available.");
}

function flashHint(san, text) {
  document.getElementById("coachMessage").innerHTML = escapeAndBold(text);
  document.getElementById("coachMeta").hidden = true;
  document.getElementById("coachConcepts").innerHTML = "";
  setCoachStatus("Hint shown.");
  if (san) {
    const moves = state.chess.moves({ verbose: true }).filter((m) => m.san === san || m.san === san.replace(/[+#]/g, ""));
    if (moves[0]) {
      state.board.addMarker(MARKER_TYPE.frame, moves[0].from);
      state.board.addMarker(MARKER_TYPE.frame, moves[0].to);
      setTimeout(() => {
        state.board.removeMarkers(MARKER_TYPE.frame);
      }, 2500);
    }
  }
}

// ---------- Event bindings ----------
document.getElementById("btnUndo").addEventListener("click", undoLast);
document.getElementById("btnHint").addEventListener("click", showHint);
document.getElementById("btnResign").addEventListener("click", endSession);
document.getElementById("btnPlayAgain").addEventListener("click", () => startGame(state.openingId));
document.getElementById("btnNewOpening").addEventListener("click", () => showPanel("openings"));
document.getElementById("btnSwitch").addEventListener("click", () => showPanel("openings"));
document.getElementById("btnPickOpening").addEventListener("click", () => showPanel("openings"));

// Overlay toggles
const btnCenter = document.getElementById("btnOverlayCenter");
const btnThreats = document.getElementById("btnOverlayThreats");
if (btnCenter) btnCenter.addEventListener("click", () => toggleOverlay("center"));
if (btnThreats) btnThreats.addEventListener("click", () => toggleOverlay("threats"));

// Primary CTA: if a session is in progress, focus the board; otherwise start fresh
document.getElementById("btnStartLesson").addEventListener("click", () => {
  if (state.ply === 0) {
    // No-op — the board is already ready to accept a move. Just focus.
    document.getElementById("hero-board").scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    // Mid-session: confirm-style restart is overkill; just restart the current opening
    startGame(state.openingId);
  }
});

// Kick things off: auto-start with the default opening so the board is live on load
renderOpeningCards();
startGame(DEFAULT_OPENING_ID);
