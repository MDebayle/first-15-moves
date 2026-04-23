/*
 * Critique engine.
 *
 * Combines three signals:
 *   1) Theory score   — does the move match the curated opening tree?
 *   2) Engine score   — how much did Stockfish's evaluation change?
 *   3) Concept score  — does the move respect universal opening principles?
 *
 * Produces a classification (Book / Good / Playable / Inaccuracy / Mistake /
 * Blunder) and a warm, plain-English sentence. We deliberately keep the tone
 * encouraging even when the move is weak.
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
  book: "Book move",
  good: "Good move",
  playable: "Playable",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder",
};

const WARM_LEAD = {
  book: [
    "Excellent — that's right in the heart of the theory.",
    "Beautifully played. That's the main line.",
    "Textbook. This is exactly the idea.",
  ],
  good: [
    "Nice move.",
    "That's a solid choice.",
    "Good — that works well here.",
  ],
  playable: [
    "That's playable.",
    "Perfectly reasonable.",
    "Not the main line, but still fine.",
  ],
  inaccuracy: [
    "Not bad, but we can do a little better here.",
    "This is okay, though a stronger move exists.",
    "Playable, but not quite optimal.",
  ],
  mistake: [
    "Let's look at this one together.",
    "I'd think twice about this — don't worry, we'll fix it.",
    "A small slip, and totally normal while learning.",
  ],
  blunder: [
    "Take a breath — this one's a tough one, but we learn more from these than from perfect moves.",
    "Here's a teachable moment. Let me show you what I'd play instead.",
    "No worries, everybody makes this kind of move while learning. Here's the idea:",
  ],
};

/**
 * Classify a user move.
 *
 * @param {object} ctx
 *   - ctx.san:         move in SAN, e.g. "e4", "Nf3"
 *   - ctx.uci:         move in UCI (e.g. e2e4)
 *   - ctx.ply:         ply number (1-based; 1 = white's first move)
 *   - ctx.opening:     the chosen opening (from OPENINGS)
 *   - ctx.alternatives: array of alternative entries for this ply (if any)
 *   - ctx.mainlineSan: the mainline SAN move for this ply (if known)
 *   - ctx.cpLoss:      centipawn loss (positive = worse for the mover)
 *   - ctx.evalBefore:  eval before (cp from mover's perspective)
 *   - ctx.evalAfter:   eval after (cp from mover's perspective)
 *   - ctx.side:        'w' | 'b' — which side the student played
 *   - ctx.moveObj:     chess.js move object (from/to/piece/flags/promotion)
 *   - ctx.historySan:  list of all SAN moves so far (including this one)
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
    theoryLabel = altMatch.label; // "playable" | "inaccuracy" | "mistake"
    theoryWhy = altMatch.why;
    theoryConcepts = altMatch.concepts || [];
  }

  // 2) Concept checks
  const conceptNotes = [];
  const conceptIssues = runConceptChecks(moveObj, historySan, side, ply);
  conceptIssues.forEach((c) => conceptNotes.push(c));

  // 3) Engine loss bucketing
  const engineBucket = bucketCpLoss(cpLoss);

  // Combine into a single classification.
  // Theory wins if explicit; otherwise engine bucket; then concept downgrades.
  let classification;
  if (theoryLabel === "mainline") {
    classification = CLASS.BOOK;
  } else if (theoryLabel === "playable") {
    // Engine check can still downgrade
    classification = engineBucket === "ok" ? CLASS.PLAYABLE : engineBucket;
  } else if (theoryLabel === "inaccuracy") {
    classification = CLASS.INACCURACY;
  } else if (theoryLabel === "mistake") {
    classification = CLASS.MISTAKE;
  } else {
    // Out of book entirely: engine decides, with a softer opening tolerance
    classification = engineBucket === "ok" ? CLASS.PLAYABLE : engineBucket;
  }

  // Downgrade if concept issues and currently classified as good/book
  if (conceptIssues.length > 0 && (classification === CLASS.BOOK || classification === CLASS.GOOD || classification === CLASS.PLAYABLE)) {
    classification = CLASS.INACCURACY;
  }

  // Build coach message
  const lead = pick(WARM_LEAD[classification] || WARM_LEAD.playable);
  const parts = [lead];

  if (theoryWhy) {
    parts.push(theoryWhy);
  } else if (classification === CLASS.BOOK) {
    parts.push("This is a mainline move in the opening we're studying.");
  } else if (theoryLabel == null && classification === CLASS.PLAYABLE) {
    parts.push("You've stepped outside our curated line, but the move itself is reasonable.");
  }

  // Concept notes tail
  conceptIssues.forEach((c) => parts.push(c.note));

  // Engine numeric tail (soft)
  if (cpLoss != null) {
    if (cpLoss >= 250) {
      parts.push(`Stockfish sees this as a meaningful drop — about ${Math.round(cpLoss)} centipawns.`);
    } else if (cpLoss >= 100) {
      parts.push("The engine does notice a small cost, but nothing fatal.");
    }
  }

  // Recommended alternative text
  let recommended = null;
  if (classification !== CLASS.BOOK && mainlineSan && mainlineSan !== san) {
    recommended = mainlineSan;
    parts.push(`In this opening, the go-to move here is ${mainlineSan}.`);
  }

  const concepts = [...new Set([...theoryConcepts, ...conceptNotes.map((c) => c.tag).filter(Boolean)])];

  return {
    classification,
    label: CLASS_LABEL[classification],
    message: parts.join(" "),
    recommended,
    cpLoss: cpLoss != null ? Math.round(cpLoss) : null,
    evalBefore: ctx.evalBefore,
    evalAfter: ctx.evalAfter,
    concepts,
    isInBook: theoryLabel !== null,
    isMainline,
  };
}

function bucketCpLoss(cpLoss) {
  if (cpLoss == null) return "ok";
  // In the opening we use generous thresholds — getting slightly worse is
  // normal and shouldn't get a harsh label.
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
 * Concept checks — universal opening principles.
 * @returns array of { tag, note }
 */
function runConceptChecks(moveObj, historySan, side, ply) {
  const issues = [];
  if (!moveObj) return issues;

  // Only apply in the opening
  if (ply > UNIVERSAL_PRINCIPLES.openingPlies) return issues;

  const piece = moveObj.piece; // 'p','n','b','r','q','k'
  const from = moveObj.from;
  const to = moveObj.to;

  // 1) Early queen sortie — queen moved before most minor pieces are developed
  if (piece === "q" && ply <= 8) {
    const mySan = historySan.filter((_, i) => (side === "w" ? i % 2 === 0 : i % 2 === 1));
    const minorDeveloped = mySan.slice(0, -1).filter((m) => /^[NB]/.test(m)).length;
    if (minorDeveloped < 2) {
      issues.push({
        tag: "early-queen",
        note:
          "One gentle note: bringing the queen out this early can let the opponent develop with tempo by attacking her. Usually we want our knights and bishops out first.",
      });
    }
  }

  // 2) Moving the same piece twice in the opening (ignoring captures/recaptures)
  if (moveObj.flags && !moveObj.flags.includes("c") && !moveObj.flags.includes("e")) {
    const mySan = historySan.filter((_, i) => (side === "w" ? i % 2 === 0 : i % 2 === 1));
    // This move is already at the end of mySan. Check if the same piece moved earlier.
    const myPrev = mySan.slice(0, -1);
    if (piece !== "p" && myPrev.length > 0) {
      // Naive check: look for a previous SAN with the same piece letter that lands on `from`
      const pieceLetter = piece.toUpperCase();
      const repeatedPiece = myPrev.some((san) => {
        if (piece === "p") return false;
        return san.startsWith(pieceLetter) && san.endsWith(from);
      });
      if (repeatedPiece && ply <= 10) {
        issues.push({
          tag: "piece-twice",
          note:
            "A small thought: in the opening, we usually avoid moving the same piece twice unless there's a clear reason — time matters.",
        });
      }
    }
  }

  // 3) Flank pawn pushes in early opening
  if (piece === "p" && ply <= 6) {
    const file = to[0];
    if (UNIVERSAL_PRINCIPLES.flankPawnFiles.has(file)) {
      issues.push({
        tag: "flank-pawn",
        note:
          "Pushing an edge pawn this early doesn't fight for the center or develop anything. The center is where the action is.",
      });
    }
  }

  return issues;
}

export function classToBadgeClass(classification) {
  return `badge badge-${classification}`;
}
