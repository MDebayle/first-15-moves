/*
 * Critique engine.
 *
 * Combines three signals:
 *   1) Theory score   — does the move match the curated opening tree?
 *   2) Engine score   — how much did Stockfish's evaluation change?
 *   3) Concept score  — does the move respect universal opening principles?
 *
 * Tone: confident, concrete, coach-like. Warm but not timid. We tell the
 * player what the move does, what it costs, and what to watch for next —
 * without cushioning every sentence.
 */

import { UNIVERSAL_PRINCIPLES } from "../data/openings.js";

export const CLASS = {
  BOOK: "book",
  GOOD: "good",
  PLAYABLE: "playable",
  INACCURACY: "inaccuracy",
  MISTAKE: "mistake",
  BLUNDER: "blunder",
};

const CLASS_LABEL = {
  book: "Theory",
  good: "Good",
  playable: "Playable",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder",
};

// One sharp opening sentence per classification. No "gentle" filler.
const LEAD = {
  book: [
    "That's the main line.",
    "Textbook — exactly the idea here.",
    "Right in theory.",
  ],
  good: [
    "Good move.",
    "Solid choice.",
    "That works.",
  ],
  playable: [
    "Playable.",
    "Not the main line, but it holds up.",
    "Reasonable — just not the cleanest version.",
  ],
  inaccuracy: [
    "Slightly inaccurate.",
    "A small inaccuracy.",
    "Not wrong, but there's a sharper move.",
  ],
  mistake: [
    "This one costs you.",
    "That's a real mistake.",
    "Noticeable drop in the position.",
  ],
  blunder: [
    "That's a blunder.",
    "Ouch — this one gives up material or structure.",
    "Big drop. Worth studying carefully.",
  ],
};

// Positive principles these moves *support* (shown as green tags)
const POSITIVE_PRINCIPLE_NOTES = {
  center: "claims the center",
  development: "develops a piece",
  "king-safety": "helps king safety",
  castle: "king safety",
};

/**
 * Classify a user move.
 */
export function critique(ctx) {
  const { san, mainlineSan, alternatives = [], cpLoss, moveObj, historySan = [], ply, side } = ctx;

  // 1) Theory lookup
  const isMainline = mainlineSan && san === mainlineSan;
  const altMatch = alternatives.find((a) => a.san === san);

  let theoryLabel = null;
  let theoryWhy = null;
  let theoryConcepts = [];

  if (isMainline) {
    theoryLabel = "mainline";
  } else if (altMatch) {
    theoryLabel = altMatch.label;
    theoryWhy = altMatch.why;
    theoryConcepts = altMatch.concepts || [];
  }

  // 2) Concept analysis (both positive and negative signals)
  const positivePrinciples = detectPositivePrinciples(moveObj, historySan, ply, side);
  const conceptIssues = runConceptChecks(moveObj, historySan, side, ply);

  // 3) Engine loss bucketing
  const engineBucket = bucketCpLoss(cpLoss);

  // Combine into a single classification.
  let classification;
  if (theoryLabel === "mainline") {
    classification = CLASS.BOOK;
  } else if (theoryLabel === "playable") {
    classification = engineBucket === "ok" ? CLASS.PLAYABLE : engineBucket;
  } else if (theoryLabel === "inaccuracy") {
    classification = CLASS.INACCURACY;
  } else if (theoryLabel === "mistake") {
    classification = CLASS.MISTAKE;
  } else {
    classification = engineBucket === "ok" ? CLASS.PLAYABLE : engineBucket;
  }

  if (conceptIssues.length > 0 && (classification === CLASS.BOOK || classification === CLASS.GOOD || classification === CLASS.PLAYABLE)) {
    classification = CLASS.INACCURACY;
  }

  // ---- Build coach message: 2-3 short sentences max ----
  // Structure: [Lead] + [Why: theory reason OR top concept note] + [Main line recommendation OR engine verdict]
  const lead = pick(LEAD[classification] || LEAD.playable);
  const parts = [lead];

  // Pick the most specific "why" — prefer curated theory, else first concept issue
  if (theoryWhy) {
    parts.push(theoryWhy);
  } else if (conceptIssues.length > 0) {
    parts.push(conceptIssues[0].note);
  }

  // Recommended alternative OR engine verdict. One of these, not both.
  let recommended = null;
  if (classification !== CLASS.BOOK && mainlineSan && mainlineSan !== san) {
    recommended = mainlineSan;
    parts.push(`Main line here is **${mainlineSan}**.`);
  } else if (cpLoss != null && cpLoss >= 200) {
    parts.push(`Stockfish sees about ${Math.round(cpLoss)} cp lost.`);
  }

  // ---- Tag list for the UI ----
  // Positive principles supported, then negative issues.
  const positiveTags = positivePrinciples.map((p) => ({ tag: p, polarity: "positive" }));
  const negativeTags = [
    ...theoryConcepts.map((t) => ({ tag: t, polarity: "negative" })),
    ...conceptIssues.map((c) => ({ tag: c.tag, polarity: "negative" })).filter((t) => t.tag),
  ];

  // Dedupe by tag key
  const seen = new Set();
  const concepts = [];
  for (const t of [...positiveTags, ...negativeTags]) {
    if (!seen.has(t.tag)) {
      seen.add(t.tag);
      concepts.push(t);
    }
  }

  return {
    classification,
    label: CLASS_LABEL[classification],
    message: parts.join(" "),
    recommended,
    cpLoss: cpLoss != null ? Math.round(cpLoss) : null,
    evalBefore: ctx.evalBefore,
    evalAfter: ctx.evalAfter,
    concepts, // array of { tag, polarity: "positive" | "negative" }
    isInBook: theoryLabel !== null,
    isMainline,
  };
}

function bucketCpLoss(cpLoss) {
  if (cpLoss == null) return "ok";
  if (cpLoss < 40) return "ok";
  if (cpLoss < 100) return CLASS.PLAYABLE;
  if (cpLoss < 180) return CLASS.INACCURACY;
  if (cpLoss < 350) return CLASS.MISTAKE;
  return CLASS.BLUNDER;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Detect which opening principles a move *supports*.
 * Only runs in the opening phase.
 */
function detectPositivePrinciples(moveObj, historySan, ply, side) {
  const tags = [];
  if (!moveObj) return tags;
  if (ply > UNIVERSAL_PRINCIPLES.openingPlies) return tags;

  const piece = moveObj.piece;
  const to = moveObj.to;
  const from = moveObj.from;
  const flags = moveObj.flags || "";

  // Castling -> king safety
  if (flags.includes("k") || flags.includes("q")) {
    tags.push("king-safety");
  }

  // Central pawn push e2-e4, d2-d4, e7-e5, d7-d5 (fighting for center)
  if (piece === "p") {
    const centerFiles = new Set(["d", "e"]);
    if (centerFiles.has(to[0]) && (to[1] === "4" || to[1] === "5")) {
      tags.push("center");
    }
  }

  // Knight or bishop development from back rank
  if ((piece === "n" || piece === "b") && isBackRankForSide(from, side)) {
    tags.push("development");
  }

  return tags;
}

function isBackRankForSide(square, side) {
  if (!square) return false;
  const rank = square[1];
  return side === "w" ? rank === "1" : rank === "8";
}

/**
 * Concept checks — opening principles violated.
 * @returns array of { tag, note }
 */
function runConceptChecks(moveObj, historySan, side, ply) {
  const issues = [];
  if (!moveObj) return issues;
  if (ply > UNIVERSAL_PRINCIPLES.openingPlies) return issues;

  const piece = moveObj.piece;
  const from = moveObj.from;
  const to = moveObj.to;

  // 1) Early queen sortie
  if (piece === "q" && ply <= 8) {
    const mySan = historySan.filter((_, i) => (side === "w" ? i % 2 === 0 : i % 2 === 1));
    const minorDeveloped = mySan.slice(0, -1).filter((m) => /^[NB]/.test(m)).length;
    if (minorDeveloped < 2) {
      issues.push({
        tag: "early-queen",
        note: "Bringing the queen out this early lets the opponent gain tempo by attacking her. Knights and bishops first.",
      });
    }
  }

  // 2) Moving the same piece twice in the opening (ignoring captures)
  if (moveObj.flags && !moveObj.flags.includes("c") && !moveObj.flags.includes("e")) {
    const mySan = historySan.filter((_, i) => (side === "w" ? i % 2 === 0 : i % 2 === 1));
    const myPrev = mySan.slice(0, -1);
    if (piece !== "p" && myPrev.length > 0) {
      const pieceLetter = piece.toUpperCase();
      const repeatedPiece = myPrev.some((san) => {
        if (piece === "p") return false;
        return san.startsWith(pieceLetter) && san.endsWith(from);
      });
      if (repeatedPiece && ply <= 10) {
        issues.push({
          tag: "piece-twice",
          note: "You moved the same piece twice in the opening. Finish developing the others first.",
        });
      }
    }
  }

  // 3) Flank pawn pushes early
  if (piece === "p" && ply <= 6) {
    const file = to[0];
    if (UNIVERSAL_PRINCIPLES.flankPawnFiles.has(file)) {
      issues.push({
        tag: "flank-pawn",
        note: "An edge pawn this early does nothing for the center.",
      });
    }
  }

  return issues;
}

export function classToBadgeClass(classification) {
  return `badge badge-${classification}`;
}
