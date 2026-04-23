/*
 * Kingside knight (the g1 knight) coaching advice.
 *
 * Why this file exists:
 *   The g1 knight is the most reliable piece in White's opening — it almost
 *   always belongs on f3, and Nf3 is one of the best moves in chess. But
 *   "Nf3 is usually right" is not the same lesson as "Nf3 is always right,"
 *   and the student needs to understand WHY f3 is so strong:
 *     - it attacks the center
 *     - it supports castling
 *     - it doesn't block an essential pawn the way Nc3 can
 *     - it glues together the bishop, center, and king
 *   We also need to criticize the common off-f3 moves (Nh3 as a rim move,
 *   Ne2 without a structural reason) firmly but opening-aware.
 *
 * Structure:
 *   KN_ADVICE[openingId][destSquare] = string
 *   Plus KN_ADVICE_FALLBACK[destSquare] for openings not covered.
 *   Plus KN_STRUCTURE_HINTS (e.g., "the Italian/Ruy strongly wants Nf3 on
 *   move 2 — you're skipping the opening's engine").
 *
 * Tone guardrails:
 *   - Celebrate Nf3 when it's the signature move (Italian, Ruy, QGD, London).
 *   - In the English, acknowledge flexibility — Nf3 is still usually right,
 *     but the timing can vary.
 *   - Criticize Nh3 as the rim move it almost always is.
 *   - Criticize Ne2 when it's a "safe non-answer" rather than a real plan.
 *   - Two to three sentences max.
 *
 * Covered destinations (reachable from g1 in 1 move): f3, e2, h3.
 */

// ---------------------------------------------------------------------------
// Per-opening × per-destination advice
// ---------------------------------------------------------------------------

export const KN_ADVICE = {
  // =========================================================================
  // ITALIAN GAME
  // The Italian's Nf3 is one of the purest model knight moves in chess:
  // attacks e5, supports castling, pairs with Bc4. Anything else on move 2
  // is directly fighting the opening.
  // =========================================================================
  italian: {
    f3: "Nf3 is the engine of the Italian Game — it attacks e5, supports castling, and pairs with the Bc4 bishop to create the open-game harmony the opening is built on. This is one of the textbook model knight moves in all of chess; you just played exactly what the Italian wants.",
    e2: "Ne2 in the Italian is a passive replacement for Nf3. The Italian's signature is Nf3 eyeing e5 and coordinating with Bc4 — Ne2 blocks the f1 bishop's diagonal, skips the e5 pressure, and abandons the opening's engine. In the Italian, Nf3 is not optional; it's the point.",
    h3: "Nh3 in the Italian is a genuine error — the knight goes to the rim, attacks nothing, and gives up the Nf3 move that the entire opening is built around. The Italian needs its knight on f3 to pressure e5 and coordinate with Bc4. This move throws that away.",
  },

  // =========================================================================
  // QUEEN'S GAMBIT DECLINED
  // Nf3 here is classical queen's-pawn development — supports d4, prepares
  // castling, fits the compact center. Nothing flashy, just correct.
  // =========================================================================
  queensGambit: {
    f3: "Nf3 is model Queen's Gambit development. It supports the d4 center, prepares castling, keeps the f-pawn mobile, and slots into the QGD's classical piece coordination without committing to anything prematurely. Quiet, correct, essential.",
    e2: "Ne2 in the QGD is unusually passive. The classical plan is Nf3 — it supports d4, prepares king safety, and fits the opening's piece coordination. Ne2 gives up all of that for a square with no specific purpose in this structure.",
    h3: "Nh3 in the QGD is a mistake. The opening wants smooth central support and king safety — Nf3 does all of that effortlessly. Nh3 sends the knight to the rim for no gain and leaves White's development noticeably slower.",
  },

  // =========================================================================
  // RUY LOPEZ
  // Nf3 on move 2 is the Ruy's starting engine. It attacks e5, coordinates
  // with the coming Bb5, and sets up the Spanish pressure system.
  // =========================================================================
  ruyLopez: {
    f3: "Nf3 is the Ruy Lopez's opening engine — it attacks e5, supports White's central influence, and sets up the geometry that Bb5 completes. In the Ruy, the knight on f3 and the bishop on b5 together create the strategic pressure system the opening is famous for.",
    e2: "Ne2 is a passive replacement for Nf3 in the Ruy. The whole opening is a pressure system — Nf3 attacks e5, Bb5 pins the c6 knight, the center stays tense. Ne2 gives up the e5 pressure half of that equation for no compensation.",
    h3: "Nh3 in the Ruy Lopez is a rim mistake. The Ruy is built on coordinated central pressure — Nf3 hitting e5 is half of that pressure, and Nh3 surrenders it for a square that does nothing. Go to f3.",
  },

  // =========================================================================
  // ENGLISH OPENING
  // The English is the flexible case — Nf3 is still usually right, but the
  // timing can vary, and move orders that prioritize Nc3 or g3 first are
  // legitimate. Praise Nf3 clearly; don't over-criticize a slight delay.
  // =========================================================================
  english: {
    f3: "Nf3 in the English is natural, flexible development. It supports later d4 or e4 pushes, prepares castling, and keeps White's options open between pure-English and queen's-pawn transpositions. The English is more flexible about the timing of Nf3 than the e-pawn openings — but f3 is still the right destination.",
    e2: "Ne2 in the English is unusual. The English already gives you flexibility through c4 and g3-setups — you don't need Ne2's extra caution on top. Nf3 is the more active, more natural square in almost every English structure.",
    h3: "Nh3 in the English is off the map. The English has no special use for the rim knight, and Nh3 abandons Nf3's natural central influence. Go to f3 — it fits the English's flexible-but-principled style.",
  },

  // =========================================================================
  // LONDON SYSTEM
  // Nf3 is one of the London's organizing bricks — it's how the system
  // holds together alongside Bf4, e3, c3, and Nbd2.
  // =========================================================================
  london: {
    f3: "Nf3 is one of the London's signature moves — it supports d4, pairs with Bf4 on the kingside, and prepares castling, holding the system's compact shell together. Classic London development.",
    e2: "Ne2 in the London is wrong. The London's shell is d4 + Nf3 + Bf4 + e3 + c3 + Nbd2 — Nf3 is one of the bricks, and Ne2 removes it. In this system, Nf3 is not a choice; it's structure.",
    h3: "Nh3 in the London breaks the system. The London is a coordination opening — Nf3 is one of the moves that makes the whole shell click together. Nh3 sends the knight to the rim and scrambles the setup.",
  },
};

// ---------------------------------------------------------------------------
// Fallback: destination-specific advice when the opening isn't in the table.
// ---------------------------------------------------------------------------

export const KN_ADVICE_FALLBACK = {
  f3: "Nf3 is one of the most reliable opening moves in chess. It influences the center, prepares castling, attacks e5 when relevant, and doesn't block an essential pawn. If you're unsure whether to develop the kingside knight early, the answer is almost always yes — to f3.",
  e2: "Ne2 is the cautious kingside-knight square. It's sometimes correct (when f-pawn freedom or a specific central scheme matters) but is often just a slower, less active version of Nf3. Use it only with a concrete reason.",
  h3: "Nh3 in the opening is almost always a mistake. The knight on the rim attacks nothing, blocks nothing useful, and gives up the Nf3 square that's almost universally better. Needs a very specific system reason.",
};

// ---------------------------------------------------------------------------
// Structure add-ons.
// ---------------------------------------------------------------------------

export const KN_STRUCTURE_HINTS = {
  // Appended when the kingside knight moves a SECOND time in the opening.
  secondMove:
    " This is the second time this knight has moved — tempo you won't get back. In the opening, moving a minor piece twice usually means the first square was wrong.",

  // Appended when White plays Ne2 but the f-pawn is still on f2 with no
  // sign of a planned f4 push (so the "save the f-pawn" argument doesn't
  // apply). Best-effort heuristic.
  e2NoFPlan:
    " Note you have no visible f-pawn plan here — the usual reason to prefer Ne2 over Nf3 (keeping f4 available) doesn't apply. Nf3 would have been strictly more active.",
};

// ---------------------------------------------------------------------------
// Public lookup function
// ---------------------------------------------------------------------------

/**
 * Return the best kingside-knight coaching line for this move, or null if
 * the move isn't a g1-knight move we want to handle.
 *
 * @param {object} args
 * @param {object} args.moveObj - chess.js move object
 * @param {string|null} args.openingId - current opening id
 * @param {string[]} args.historySan - full SAN history up to and including this move
 * @param {number} args.ply - ply of this move (1-indexed)
 * @returns {string|null}
 */
export function getKingsideKnightAdvice({ moveObj, openingId, historySan = [], ply }) {
  if (!moveObj) return null;
  if (moveObj.piece !== "n") return null;
  if (moveObj.from !== "g1") return null;
  if (ply > 15) return null;

  const dest = moveObj.to;
  const byOpening = openingId && KN_ADVICE[openingId];
  const openingLine = byOpening && byOpening[dest];
  const fallbackLine = KN_ADVICE_FALLBACK[dest];

  let line = openingLine || fallbackLine;
  if (!line) return null;

  // Ne2 hint: no visible f-pawn plan. Heuristic — check if White has any
  // f-pawn move in history, or any preparatory move that typically goes
  // with f4 (e.g., g3 before f4 is unusual but not impossible).
  if (dest === "e2") {
    const whiteSan = historySan.filter((_, i) => i % 2 === 0);
    const fPawnMoved = whiteSan.some((san) => /^f[x234567]/.test(san));
    if (!fPawnMoved) {
      line += KN_STRUCTURE_HINTS.e2NoFPlan;
    }
  }

  return line;
}
