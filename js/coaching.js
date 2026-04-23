/*
 * Coaching module — the "deepen the feedback card" layer.
 *
 * Given a verdict + move + ply, produce:
 *   - axes     : { theory: "In theory" | "Off theory", quality: "Strong" | ... }
 *   - rubric   : { center: n, development: n, "king-safety": n, tempo: n }
 *               where n ∈ [-2, -1, 0, 1, 2]
 *   - planFit  : one-sentence string about how the move serves the phase goal
 *   - cost     : one-sentence string about what the move costs (null if pure gain)
 *   - blackReply: one-sentence narration for the engine's Black reply
 *
 * Pure functions. No DOM access. No engine calls. Drives the UI directly.
 */

// ============================================================
// Rubric scoring
// ============================================================

/**
 * Compute a 4-dimension rubric for a White move.
 * @param {Object} verdict — from critique()
 * @param {Object} moveObj — chess.js move object
 * @param {number} ply    — 1-indexed ply number (White's odd plies)
 * @returns {Object} { center, development, "king-safety", tempo } each -2..+2
 */
export function computeRubric(verdict, moveObj, ply) {
  const rubric = { center: 0, development: 0, "king-safety": 0, tempo: 0 };
  if (!moveObj) return rubric;

  const piece = moveObj.piece;
  const from = moveObj.from;
  const to = moveObj.to;
  const flags = moveObj.flags || "";

  const concepts = verdict.concepts || [];
  const positive = new Set(concepts.filter((c) => c.polarity === "positive").map((c) => c.tag));
  const negative = new Set(concepts.filter((c) => c.polarity === "negative").map((c) => c.tag));

  // ---- Center ----
  if (piece === "p" && (to === "e4" || to === "d4")) rubric.center = 2;            // staked
  else if (piece === "p" && (to === "c4" || to === "c3" || to === "d3" || to === "e3")) rubric.center = 1; // supports center
  else if (positive.has("center")) rubric.center = 1;
  else if (piece === "p" && /^[ah]/.test(to) && ply <= 8) rubric.center = -1;      // flank pawn
  else if (negative.has("flank-pawn")) rubric.center = -1;

  // ---- Development ----
  if ((piece === "n" || piece === "b") && isBackRank(from, "w")) rubric.development = 2;  // first development
  else if (piece === "n" || piece === "b") rubric.development = 0;                  // re-moving a minor
  else if (flags.includes("k") || flags.includes("q")) rubric.development = 1;      // castling activates rook
  else if (piece === "q" && ply <= 8 && !negative.has("early-queen")) rubric.development = 0;
  else if (negative.has("piece-twice")) rubric.development = -1;

  // ---- King safety ----
  if (flags.includes("k") || flags.includes("q")) rubric["king-safety"] = 2;        // castled!
  else if (piece === "p" && ["f3", "g4", "h4", "g3", "h3"].includes(to) && ply <= 10 && !isKingCastled(moveObj, ply)) {
    rubric["king-safety"] = -1;                                                      // weakens kingside
  } else if (piece === "p" && ["f2", "g2"].includes(from) && ply <= 8) {
    // pawn push in front of king before castling
    rubric["king-safety"] = -1;
  } else if (piece === "r" && (from === "h1" || from === "a1") && ply <= 8) {
    rubric["king-safety"] = -1;                                                      // loses castling rights
  } else if (piece === "k" && ply <= 12 && !(flags.includes("k") || flags.includes("q"))) {
    rubric["king-safety"] = -2;                                                      // king step without castling
  }

  // ---- Tempo ----
  // Book/good mainline move = +1 tempo (move does its job efficiently)
  if (verdict.isMainline) rubric.tempo = 1;
  if (verdict.classification === "good") rubric.tempo = Math.max(rubric.tempo, 1);
  // Pure prep pawn move (c3, d3, h3, a3) = costs a tempo unless it supports a real idea
  if (piece === "p" && ["c3", "a3", "h3", "a4"].includes(to) && ply <= 10) {
    rubric.tempo = Math.min(rubric.tempo, -1);
  }
  if (negative.has("piece-twice") || negative.has("early-queen")) rubric.tempo = -1;
  if (verdict.classification === "inaccuracy") rubric.tempo = Math.min(rubric.tempo, -1);
  if (verdict.classification === "mistake") rubric.tempo = -2;
  if (verdict.classification === "blunder") rubric.tempo = -2;

  // Clamp to [-2, 2]
  for (const k of Object.keys(rubric)) {
    rubric[k] = Math.max(-2, Math.min(2, rubric[k]));
  }
  return rubric;
}

function isBackRank(square, side) {
  if (!square) return false;
  return side === "w" ? square[1] === "1" : square[1] === "8";
}

function isKingCastled() {
  // Simple heuristic — we'd need to track state. For the rubric this is an approximation.
  return false;
}

/**
 * Render a rubric score into one of five buckets: ++, +, 0, –, ––
 */
export function rubricLabel(score) {
  if (score >= 2) return "++";
  if (score === 1) return "+";
  if (score === 0) return "0";
  if (score === -1) return "\u2013";
  return "\u2013\u2013";
}

export function rubricClass(score) {
  if (score >= 2) return "rs-pp";
  if (score === 1) return "rs-p";
  if (score === 0) return "rs-0";
  if (score === -1) return "rs-m";
  return "rs-mm";
}

// ============================================================
// Axes
// ============================================================

const QUALITY_LABEL = {
  book: "Strong",
  good: "Good",
  playable: "Playable",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder",
};

export function computeAxes(verdict) {
  return {
    theory: verdict.isMainline ? "In theory" : (verdict.isInBook ? "Known sideline" : "Off theory"),
    theoryCls: verdict.isMainline ? "ax-in-book" : (verdict.isInBook ? "ax-in-book" : "ax-off-book"),
    quality: QUALITY_LABEL[verdict.classification] || "Playable",
    qualityCls: "ax-" + (verdict.classification || "playable"),
  };
}

// ============================================================
// Narrative lines: Plan fit, What this costs
// ============================================================

/**
 * Phase-sensitive "plan fit" line. Speaks differently in ply 1–8 vs 9–16 vs 17+.
 */
export function computePlanFit(verdict, moveObj, ply, rubric) {
  if (!moveObj) return null;
  const phase = phaseForPly(ply);
  const piece = moveObj.piece;
  const flags = moveObj.flags || "";

  if (flags.includes("k") || flags.includes("q")) {
    return "Castles on time. King safety is the whole job of this phase.";
  }

  if (phase === "center") {
    if (rubric.center >= 2) return "Stakes the center — exactly the job of moves 1\u20134.";
    if (rubric.center >= 1) return "Supports the center. Good fit for the phase.";
    if (piece === "n" || piece === "b") {
      if (rubric.development >= 2) return "Develops a minor piece while the center is still being contested.";
      return "Works on development, but don't forget the center.";
    }
    if (rubric.center < 0) return "The center wants attention here more than the flank does.";
    return "Plays calmly while the center is still being decided.";
  }

  if (phase === "develop") {
    if (rubric["king-safety"] >= 2) return "Castles on time. Moves 5\u20138 are about getting the king safe.";
    if (rubric.development >= 2) return "Develops a piece \u2014 right on the phase goal.";
    if (piece === "p" && rubric.tempo < 0) return "Pawn moves now cost tempo; your pieces still need homes.";
    if (rubric.center >= 1) return "Reinforces central space while development continues.";
    return "Fits a calm setup, but development should stay the priority.";
  }

  if (phase === "safety") {
    if (rubric["king-safety"] >= 2) return "Finally castles. Moves 9\u201312 want the king safe above all.";
    if (rubric["king-safety"] < 0) return "Weakens the king's shelter at the wrong moment.";
    if (rubric.development >= 2) return "Late development \u2014 useful, but king safety is more urgent now.";
    return "Reasonable, but make sure the king is already safe before reaching for more.";
  }

  // phase === "plan"
  if (rubric.tempo > 0 && piece === "r") return "Rooks joining the game \u2014 exactly the phase-13 idea.";
  if (piece === "q") return "Queen activity fits the planning phase \u2014 but should serve a concrete idea.";
  if (rubric.development >= 1) return "Completing coordination before the middlegame begins.";
  return "At move 13+, every move should serve a plan. Keep asking: what's my plan?";
}

/**
 * What this costs — one-sentence tradeoff line. Returns null for pure-gain moves.
 */
export function computeCost(verdict, moveObj, ply, rubric) {
  if (!moveObj) return null;
  // Pure book mainline with nothing negative: no cost line needed
  if (verdict.isMainline && Object.values(rubric).every((v) => v >= 0)) return null;

  const piece = moveObj.piece;
  const to = moveObj.to;
  const concepts = verdict.concepts || [];
  const negTags = concepts.filter((c) => c.polarity === "negative").map((c) => c.tag);

  // Concrete negatives first
  if (negTags.includes("early-queen")) return "Your queen becomes a target \u2014 opponents gain tempo kicking her.";
  if (negTags.includes("piece-twice")) return "Spends a tempo on a piece you already moved. Other pieces go hungry.";
  if (negTags.includes("flank-pawn")) return "An edge pawn doesn't fight for the center or develop anything.";

  // Tempo-negative prep moves
  if (piece === "p" && ["c3", "a3", "h3", "a4"].includes(to) && ply <= 10) {
    if (to === "h3") return "Spends a tempo on prophylaxis. Only worth it if you're guarding a specific square.";
    return "Preparation pawn \u2014 costs a tempo unless it supports a concrete plan.";
  }

  if (verdict.classification === "inaccuracy") {
    return verdict.recommended
      ? `Slightly slower than ${verdict.recommended}, the sharper main-line move.`
      : "Slightly slower than the main line \u2014 a small positional cost.";
  }
  if (verdict.classification === "mistake" || verdict.classification === "blunder") {
    return verdict.cpLoss
      ? `Stockfish sees about ${verdict.cpLoss} cp lost \u2014 the position materially worsens.`
      : "The position materially worsens here.";
  }

  if (rubric.tempo < 0) return "Costs tempo. Make sure the purpose is worth it.";
  return null;
}

// ============================================================
// Black's reply — one-sentence narration
// ============================================================

/**
 * Generate a short "Black played X to Y" line for the engine's reply.
 * Uses heuristics on the moveObj (no engine needed).
 *
 * @param {Object} blackMoveObj — chess.js move object for Black's move
 * @param {number} ply — ply at which Black moved
 */
export function narrateBlackReply(blackMoveObj, ply) {
  if (!blackMoveObj) return null;
  const piece = blackMoveObj.piece;
  const to = blackMoveObj.to;
  const from = blackMoveObj.from;
  const san = blackMoveObj.san;
  const flags = blackMoveObj.flags || "";

  // Castling
  if (flags.includes("k") || flags.includes("q")) {
    return `Black plays ${san} \u2014 king safety first, rook toward the center.`;
  }

  // Capture
  if (flags.includes("c") || flags.includes("e")) {
    return `Black plays ${san} to capture and clarify the tension.`;
  }

  // Central pawn pushes
  if (piece === "p" && (to === "e5" || to === "d5")) {
    return `Black plays ${san} to contest the center and open lines for pieces.`;
  }
  if (piece === "p" && (to === "e6" || to === "d6" || to === "c6")) {
    return `Black plays ${san} to support the center solidly before developing pieces.`;
  }

  // Knight development
  if (piece === "n" && (from === "b8" || from === "g8")) {
    if (to === "f6") return `Black plays ${san} \u2014 develops a knight and hits e4.`;
    if (to === "c6") return `Black plays ${san} \u2014 develops a knight and defends e5.`;
    return `Black plays ${san} to develop a knight.`;
  }
  if (piece === "n") {
    return `Black plays ${san} to reroute the knight.`;
  }

  // Bishop development
  if (piece === "b" && (from === "c8" || from === "f8")) {
    return `Black plays ${san} to develop a bishop and prepare castling.`;
  }
  if (piece === "b") {
    return `Black plays ${san} to reposition the bishop.`;
  }

  // Early queen moves
  if (piece === "q") {
    return `Black plays ${san} \u2014 an early queen sortie with a specific idea in mind.`;
  }

  // Rook moves
  if (piece === "r") {
    return `Black plays ${san} to bring the rook toward active files.`;
  }

  // Pawn prep moves
  if (piece === "p") {
    if (to[0] === "a" || to[0] === "h") {
      return `Black plays ${san} to ask a question on the flank.`;
    }
    return `Black plays ${san} to adjust the pawn structure.`;
  }

  // King move
  if (piece === "k") {
    return `Black plays ${san} to tuck the king away.`;
  }

  return `Black plays ${san}.`;
}

// ============================================================
// Phases
// ============================================================

/**
 * Classify a ply into one of four teaching phases.
 * Plies 1-8 (moves 1-4):   "center"
 * Plies 9-16 (moves 5-8):  "develop"
 * Plies 17-24 (moves 9-12): "safety"
 * Plies 25+ (moves 13+):   "plan"
 */
export function phaseForPly(ply) {
  if (ply <= 8) return "center";
  if (ply <= 16) return "develop";
  if (ply <= 24) return "safety";
  return "plan";
}

// ============================================================
// Progressive hint ladder
// ============================================================

/**
 * Build a progressive hint ladder (4 levels). The UI reveals one at a time.
 *
 * Level 1: What matters right now (phase principle)
 * Level 2: Which piece/area is most urgent
 * Level 3: Candidate moves (2-3)
 * Level 4: Best move and why
 */
export function buildHintLadder(ctx) {
  const { ply, opening, chess, engineBestSan, engineBestUci } = ctx;
  const phase = phaseForPly(ply);
  const steps = [];

  // --- Step 1: What matters right now ---
  if (phase === "center") {
    steps.push("Right now, what matters most is the center and piece activity. Look for moves that claim central squares or develop a minor piece.");
  } else if (phase === "develop") {
    steps.push("This is the development phase. Every minor piece should leave the back rank before you start pawn moves or maneuvers.");
  } else if (phase === "safety") {
    steps.push("King safety first. Before any ambitious plan, make sure the king is castled and the shelter pawns are intact.");
  } else {
    steps.push("You're entering the middlegame. Every move should serve a plan \u2014 rooks to open files, queen to useful squares, coordinated pieces.");
  }

  // --- Step 2: Which pieces are most urgent ---
  const undevelopedHint = findUndevelopedPieces(chess);
  if (undevelopedHint && phase !== "plan") {
    steps.push(undevelopedHint);
  } else if (phase === "plan") {
    steps.push("Look for your rooks \u2014 they want open or semi-open files. The d-file and e-file are often the most useful early.");
  } else {
    steps.push("Scan your back rank. Any piece still sitting on its starting square is a piece not working yet.");
  }

  // --- Step 3: Candidate moves (top 2-3 legal, preferring opening-tree alternatives) ---
  const candidates = pickCandidates(chess, opening, ply);
  if (candidates.length > 0) {
    steps.push(
      `Candidate moves worth considering: ${candidates.map((c) => `**${c}**`).join(", ")}. Each does something different \u2014 think about which fits your plan.`
    );
  } else {
    steps.push("Think about three different moves before picking. Chess is a comparison problem more than a search problem.");
  }

  // --- Step 4: Best move and why ---
  const mainlineSan = opening.mainline[ply - 1];
  if (mainlineSan && chess.moves().includes(mainlineSan)) {
    const why = opening.mainlineWhy?.[ply - 1] || "it's the known main line and keeps the standard plan intact";
    steps.push(`The main line here is **${mainlineSan}** \u2014 ${why}.`);
  } else if (engineBestSan) {
    steps.push(`The engine's top pick is **${engineBestSan}**. Try to figure out what it accomplishes before you play it.`);
  } else {
    steps.push("Make your best guess \u2014 the coach will tell you what the move does and what it costs.");
  }

  return steps;
}

function findUndevelopedPieces(chess) {
  // Look at White's back rank — any knight/bishop still on b1/g1/c1/f1?
  const backRank = chess.board()[7]; // rank 1 for white is index 7 in chess.js board()
  const starting = [
    { sq: "b1", piece: "n", name: "queenside knight" },
    { sq: "g1", piece: "n", name: "kingside knight" },
    { sq: "c1", piece: "b", name: "dark-squared bishop" },
    { sq: "f1", piece: "b", name: "light-squared bishop" },
  ];
  const undeveloped = [];
  for (const s of starting) {
    const file = s.sq.charCodeAt(0) - 97;
    const sq = backRank[file];
    if (sq && sq.type === s.piece && sq.color === "w") {
      undeveloped.push(s.name);
    }
  }
  if (undeveloped.length === 0) {
    // Check castling
    const fen = chess.fen();
    const castling = fen.split(" ")[2] || "";
    if (!castling.includes("K") && !castling.includes("Q")) {
      return null; // king has moved, can't castle anyway
    }
    return "Minor pieces look developed. The next priority is castling.";
  }
  if (undeveloped.length === 1) {
    return `The ${undeveloped[0]} is still on its starting square. That's probably the most urgent piece to move.`;
  }
  return `You still have your ${undeveloped.slice(0, 2).join(" and ")} undeveloped. Prioritize whichever has the clearer square.`;
}

function pickCandidates(chess, opening, ply) {
  const legal = chess.moves();
  const candidates = new Set();

  // 1) Opening-tree alternatives
  const alts = opening.alternatives?.[ply] || [];
  for (const a of alts) {
    if (a.san && legal.includes(a.san) && a.label !== "mistake" && a.label !== "blunder") {
      candidates.add(a.san);
    }
  }
  // 2) Mainline
  const mainSan = opening.mainline[ply - 1];
  if (mainSan && legal.includes(mainSan)) candidates.add(mainSan);

  // 3) If still empty, pick 2 heuristic plausibles: a central pawn push, a knight move
  if (candidates.size === 0) {
    const central = legal.find((m) => /^[ed][34]$/.test(m));
    if (central) candidates.add(central);
    const knight = legal.find((m) => /^N[fc][36]$/.test(m));
    if (knight) candidates.add(knight);
  }

  return [...candidates].slice(0, 3);
}

// ============================================================
// Phase-sensitive verdict weighting (adjusts verdict label)
// ============================================================

/**
 * Apply phase-sensitive stricture to a verdict. Returns a new classification
 * if the phase says this move ought to be judged more harshly (or more kindly).
 * Pure function; caller decides whether to use it.
 */
export function adjustVerdictForPhase(verdict, moveObj, ply) {
  // Phase-sensitive: in "safety" phase (9-16), a non-castling move when castling is available
  // and the king is still in the center is a mild downgrade.
  const phase = phaseForPly(ply);
  const flags = moveObj?.flags || "";

  if (phase === "safety" && ply >= 13 && verdict.classification === "playable") {
    // Already playable — no change (we only bump non-essential moves slightly)
  }
  // For now we don't rewrite the classification. Phase-sensitivity flows through
  // planFit and cost lines instead, which is a cleaner surface for users.
  return verdict;
}

// ============================================================
// One-sentence takeaway rule for the recap
// ============================================================

export function buildTakeawayRule(studentMoves, opening, positiveCounts, negativeCounts) {
  const openingName = opening?.name || "this opening";

  // If the top negative concept is specific, use a tailored rule
  const topNeg = Object.entries(negativeCounts || {}).sort((a, b) => b[1] - a[1])[0];
  if (topNeg && topNeg[1] >= 2) {
    const tag = topNeg[0];
    const rules = {
      "early-queen": `In ${openingName}, finish developing knights and bishops before bringing the queen out.`,
      "piece-twice": `In ${openingName}, develop every piece once before moving any piece twice.`,
      "flank-pawn": `In ${openingName}, fight for the center before reaching for the flanks.`,
      "king-safety": `In ${openingName}, castle before launching any attacking ideas.`,
      development: `In ${openingName}, get every minor piece off the back rank before pawn play.`,
    };
    if (rules[tag]) return rules[tag];
  }

  // Specific rules by opening for clean sessions
  if (opening?.id === "italian") {
    if (studentMoves.every((m) => m.critique?.isMainline)) {
      return `In the Italian, finish kingside development before launching pawn expansion.`;
    }
    return `In the Italian, keep development and central pressure ahead of pawn moves like c3 or h3.`;
  }
  if (opening?.id === "queens_gambit_declined" || opening?.id === "queens-gambit") {
    return `In the Queen's Gambit, coordinate before you commit \u2014 structure decides the middlegame.`;
  }
  if (opening?.id === "london") {
    return `In the London, repeat the setup first; learn the plans second. The structure teaches you.`;
  }

  // Generic fallback
  return `In the opening, every move should do at least two jobs at once \u2014 develop, claim center, or protect the king.`;
}
