/*
 * The First 15 Moves — main app controller.
 *
 * Plain ES modules, no build step. Orchestrates:
 *   - cm-chessboard       (the board UI)
 *   - chess.js            (rules, legality, FEN/SAN)
 *   - Stockfish Web Worker (analysis)
 *   - Opening tree data
 *   - Critique engine
 */

import { Chess } from "../vendor/chess.js";
import { Chessboard, COLOR, INPUT_EVENT_TYPE, BORDER_TYPE } from "../vendor/cm-chessboard/src/Chessboard.js";
import { MARKER_TYPE, Markers } from "../vendor/cm-chessboard/src/extensions/markers/Markers.js";
import { PromotionDialog } from "../vendor/cm-chessboard/src/extensions/promotion-dialog/PromotionDialog.js";

import { OPENINGS } from "../data/openings.js";
import { Engine } from "./engine.js";
import { CONFIG } from "./config.js";
import { critique, CLASS, classToBadgeClass } from "./critique.js";

const MAX_PLIES = 30; // 15 moves each side; we cap at 15 full moves = 30 plies

// ---------- State ----------
const state = {
  openingId: null,
  opening: null,
  chess: null,
  board: null,
  engine: null,
  engineReady: false,
  ply: 0,               // 1-based count of moves made so far
  studentSide: "w",     // 'w' for white (we always play white for now)
  history: [],          // [{san, uci, byStudent, critique, evalBefore, evalAfter}]
  evalHistory: [0],     // eval from white's POV at each position
  firstDeviationPly: null,
  inputLocked: false,
  lastPlayerCritique: null,
};

// ---------- Panels ----------
const panels = {
  landing: document.getElementById("landing"),
  game: document.getElementById("game"),
  summary: document.getElementById("summary"),
};

function showPanel(name) {
  for (const [key, el] of Object.entries(panels)) {
    el.hidden = key !== name;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Landing ----------
function renderOpeningCards() {
  const container = document.getElementById("openingCards");
  container.innerHTML = "";
  for (const opening of Object.values(OPENINGS)) {
    const btn = document.createElement("button");
    btn.className = "opening-card";
    btn.type = "button";
    btn.innerHTML = `
      <div class="opening-card-header">
        <span class="opening-card-name">${opening.name}</span>
        <span class="opening-card-eco">${opening.eco}</span>
      </div>
      <p class="opening-card-desc">${opening.intro}</p>
    `;
    btn.addEventListener("click", () => startGame(opening.id));
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

  // Fill in header
  document.getElementById("openingEco").textContent = opening.eco;
  document.getElementById("openingTitle").textContent = opening.name;
  document.getElementById("openingIntro").textContent = opening.intro;

  showPanel("game");

  // Build the board
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
  document.getElementById("moveCounter").textContent = "0";
  document.getElementById("btnUndo").disabled = true;
  document.getElementById("historyList").innerHTML = "";
  resetCoachPanel();

  // Boot the engine if not already
  if (!state.engine) {
    state.engine = new Engine();
    setCoachStatus("Waking up the coach…");
    try {
      await state.engine.start();
      state.engineReady = true;
      const modeText = state.engine.mode === "remote" ? "Ready when you are." : "Ready — running locally.";
      setCoachStatus(modeText);
    } catch (e) {
      console.warn("Engine failed to start:", e);
      setCoachStatus("Playing without the engine (offline mode).");
      state.engineReady = false;
    }
  } else {
    setCoachStatus("Ready when you are.");
  }
}

function resetCoachPanel() {
  document.getElementById("coachMessage").textContent =
    "Make your first move whenever you're ready. I'll tell you what I think, kindly.";
  document.getElementById("coachMeta").hidden = true;
  document.getElementById("coachConcepts").innerHTML = "";
}

function setCoachStatus(text) {
  document.getElementById("coachStatus").textContent = text;
}

// ---------- Move input ----------
function handleMoveInput(event) {
  if (state.inputLocked) return false;

  switch (event.type) {
    case INPUT_EVENT_TYPE.moveInputStarted: {
      // Show legal move dots
      const moves = state.chess.moves({ square: event.squareFrom, verbose: true });
      if (moves.length === 0) return false;
      moves.forEach((m) => state.board.addMarker(MARKER_TYPE.dot, m.to));
      return true;
    }

    case INPUT_EVENT_TYPE.validateMoveInput: {
      state.board.removeMarkers(MARKER_TYPE.dot);

      // Handle promotion: if any legal move from->to needs promotion, show dialog.
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
            const promo = result.piece[1]; // e.g. 'wq' -> 'q'
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
  const fenBefore = state.chess.fen();
  const moveObj = state.chess.move(moveSpec);
  if (!moveObj) return;

  state.ply++;
  const ply = state.ply;
  const fenAfter = state.chess.fen();
  state.board.setPosition(fenAfter, true);

  updateMoveCounter();

  state.inputLocked = true;
  setCoachStatus("Thinking…");

  // Engine eval before & after the student's move (both from WHITE's POV).
  // We compute "after" by evaluating the resulting position, and "before"
  // from the cached evaluation (or re-evaluate if missing).
  let evalBefore = state.evalHistory[state.evalHistory.length - 1];
  let evalAfter = 0;
  let analysisAfter = null;

  if (state.engineReady && state.engine) {
    try {
      const res = await state.engine.analyze(fenAfter, { depth: CONFIG.ANALYSIS_DEPTH });
      analysisAfter = res;
      evalAfter = extractEvalFromWhitesPOV(res.info, state.chess.turn());
    } catch (e) {
      console.warn("Engine analyze failed:", e);
    }
  }

  // Student is White: cpLoss = evalBefore - evalAfter (drop in White's eval)
  const cpLoss = Math.max(0, Math.round(evalBefore - evalAfter));

  // Opening lookup for this ply
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

  // Track first deviation (anything not in book / mainline)
  if (!verdict.isMainline && state.firstDeviationPly == null) {
    state.firstDeviationPly = ply;
  }

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

  renderCoach(verdict);
  renderHistory();

  // Check end conditions
  if (state.chess.isGameOver() || state.ply >= MAX_PLIES) {
    endSession();
    return;
  }

  // Computer reply
  await computerReply();

  state.inputLocked = false;
  setCoachStatus("Your move.");
}

async function computerReply() {
  const ply = state.ply + 1;
  const mainlineSan = state.opening.mainline[ply - 1] || null;

  let replySan = null;

  // If we're still on the mainline, prefer the mainline reply.
  // "On mainline" = every prior student move was the mainline move.
  const priorStudentMoves = state.history.filter((h) => h.byStudent);
  const onMainline = priorStudentMoves.every(
    (h, i) => h.san === state.opening.mainline[i * 2]
  );

  if (onMainline && mainlineSan) {
    // Sanity-check legality
    const legal = state.chess.moves();
    if (legal.includes(mainlineSan)) {
      replySan = mainlineSan;
    }
  }

  // Fallback: ask Stockfish
  if (!replySan) {
    if (state.engineReady && state.engine) {
      try {
        // Shallow search = friendlier, more human-ish replies
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

            // Eval after opponent move (white POV)
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
            updateMoveCounter();
            renderHistory();
            return;
          }
        }
      } catch (e) {
        console.warn("Engine reply failed:", e);
      }
    }

    // Last resort: pick any legal move (should basically never happen)
    const legal = state.chess.moves();
    if (legal.length === 0) return;
    replySan = legal[0];
  }

  // Commit mainline/fallback SAN reply
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

  updateMoveCounter();
  renderHistory();

  if (state.chess.isGameOver() || state.ply >= MAX_PLIES) {
    endSession();
  }
}

function extractEvalFromWhitesPOV(info, sideToMoveNext) {
  // Stockfish reports score from the side-to-move's POV after the search.
  // After a move is made and we evaluate, the "side to move" is the *opponent*
  // of the one whose move we're judging. We always normalize to White's POV.
  if (!info) return 0;
  let cp = 0;
  if (info.mate != null) {
    cp = info.mate > 0 ? 10000 - info.mate * 10 : -10000 - info.mate * 10;
  } else if (info.scoreCp != null) {
    cp = info.scoreCp;
  }
  // info is from side-to-move's perspective. If side to move is black, flip.
  if (sideToMoveNext === "b") cp = -cp;
  return cp;
}

// ---------- Rendering ----------
function updateMoveCounter() {
  const fullMoves = Math.floor(state.ply / 2) + (state.ply % 2); // ceil
  document.getElementById("moveCounter").textContent = Math.ceil(state.ply / 2);
}

function renderCoach(verdict) {
  document.getElementById("coachMessage").textContent = verdict.message;

  const meta = document.getElementById("coachMeta");
  meta.hidden = false;
  const badge = document.getElementById("coachBadge");
  badge.className = classToBadgeClass(verdict.classification);
  badge.textContent = verdict.label;

  const evalEl = document.getElementById("coachEval");
  if (verdict.cpLoss != null) {
    if (verdict.cpLoss < 40) evalEl.textContent = "Engine: position looks balanced.";
    else evalEl.textContent = `Engine: about ${verdict.cpLoss} centipawns lost.`;
  } else {
    evalEl.textContent = "";
  }

  const conceptsEl = document.getElementById("coachConcepts");
  conceptsEl.innerHTML = "";
  (verdict.concepts || []).forEach((c) => {
    const li = document.createElement("li");
    li.textContent = prettyConcept(c);
    conceptsEl.appendChild(li);
  });
}

function prettyConcept(tag) {
  const map = {
    center: "center control",
    development: "development",
    "king-safety": "king safety",
    "target-f7": "target f7",
    "piece-moved-twice": "piece moved twice",
    "piece-twice": "piece moved twice",
    "early-queen": "queen out early",
    "queen-early": "queen out early",
    tempo: "tempo",
    initiative: "initiative",
    "pawn-structure": "pawn structure",
    "flank-pawn": "flank pawn push",
    "flank": "flank play",
    flexible: "flexibility",
    "bishop-trapped": "bishop activity",
  };
  return map[tag] || tag.replace(/-/g, " ");
}

function renderHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";
  const maxMove = Math.ceil(state.ply / 2);
  for (let i = 0; i < maxMove; i++) {
    const white = state.history[i * 2];
    const black = state.history[i * 2 + 1];
    const num = document.createElement("li");
    num.className = "num";
    num.textContent = `${i + 1}.`;
    const w = document.createElement("li");
    w.className = "w";
    if (white) {
      w.textContent = white.san;
      if (white.critique && (white.critique.classification === "mistake" || white.critique.classification === "blunder" || white.critique.classification === "inaccuracy")) {
        w.classList.add("issue");
      }
    }
    const b = document.createElement("li");
    b.className = "b";
    if (black) b.textContent = black.san;
    list.appendChild(num);
    list.appendChild(w);
    list.appendChild(b);
  }
  document.getElementById("btnUndo").disabled = state.history.length === 0;
}

// ---------- Summary ----------
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

  // Top concept = whichever non-book classification appeared most often
  const conceptCounts = new Map();
  studentMoves.forEach((m) => {
    if (m.critique && m.critique.concepts) {
      m.critique.concepts.forEach((c) => conceptCounts.set(c, (conceptCounts.get(c) || 0) + 1));
    }
  });
  const [topConcept] = [...conceptCounts.entries()].sort((a, b) => b[1] - a[1]);
  document.getElementById("statConcept").textContent = topConcept ? prettyConcept(topConcept[0]) : "Classical principles";

  // Per-move notes
  const notes = document.getElementById("summaryNotes");
  notes.innerHTML = "";
  const weakMoves = studentMoves.filter((m) =>
    ["inaccuracy", "mistake", "blunder"].includes(m.critique?.classification)
  );
  if (weakMoves.length === 0) {
    notes.innerHTML = `<h4>A clean session</h4><p>No significant slips. If you'd like to keep studying this opening, try it again and see if you can reach move 15 with the same precision.</p>`;
  } else {
    const h4 = document.createElement("h4");
    h4.textContent = "A few moments to revisit";
    notes.appendChild(h4);
    const ul = document.createElement("ul");
    weakMoves.forEach((m) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>Move ${Math.ceil(m.ply / 2)} (${m.san}):</strong> ${m.critique.message}`;
      ul.appendChild(li);
    });
    notes.appendChild(ul);
  }

  showPanel("summary");
}

// ---------- Actions ----------
function undoLast() {
  if (state.history.length === 0) return;
  // Undo opponent reply + student move if both exist
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
  updateMoveCounter();
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
    flashHint(mainlineSan, "The mainline move here is " + mainlineSan + ".");
    return;
  }
  if (state.engineReady && state.engine) {
    try {
      const res = await state.engine.analyze(state.chess.fen(), { depth: 10 });
      if (res.bestmove) {
        const from = res.bestmove.slice(0, 2);
        const to = res.bestmove.slice(2, 4);
        // Convert to SAN for display
        const moves = state.chess.moves({ verbose: true }).filter((m) => m.from === from && m.to === to);
        const san = moves[0]?.san || `${from}-${to}`;
        flashHint(san, "The engine's top pick is " + san + ".");
        return;
      }
    } catch (e) {
      console.warn(e);
    }
  }
  flashHint(null, "No hint available right now.");
}

function flashHint(san, text) {
  document.getElementById("coachMessage").textContent = text;
  document.getElementById("coachMeta").hidden = true;
  document.getElementById("coachConcepts").innerHTML = "";
  setCoachStatus("Hint shown.");
  if (san) {
    const moves = state.chess.moves({ verbose: true }).filter((m) => m.san === san || m.san === san.replace("+", "").replace("#", ""));
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
document.getElementById("btnBackToMenu").addEventListener("click", () => {
  showPanel("landing");
});
document.getElementById("btnUndo").addEventListener("click", undoLast);
document.getElementById("btnHint").addEventListener("click", showHint);
document.getElementById("btnResign").addEventListener("click", endSession);
document.getElementById("btnPlayAgain").addEventListener("click", () => startGame(state.openingId));
document.getElementById("btnNewOpening").addEventListener("click", () => showPanel("landing"));

// Kick things off
renderOpeningCards();
showPanel("landing");
