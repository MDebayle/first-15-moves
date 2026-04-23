/*
 * Queenside knight (the b1 knight) coaching advice.
 *
 * Why this file exists:
 *   The queenside knight is the most STRUCTURE-SENSITIVE piece in White's
 *   opening. Unlike the kingside knight (which almost always wants f3), the
 *   b1 knight's best square depends entirely on what the c-pawn is doing:
 *     - If the c-pawn has done its job (c4 already played), Nc3 is natural.
 *     - If White wants c3 soon (Italian, Ruy, London), Nc3 blocks it and
 *       Nd2 or "wait" is correct.
 *     - If the opening is flexible (English), Nc3 often fits perfectly.
 *   Every Nc3/Nd2/Na3 the student plays is a chance to teach whether the
 *   knight is serving the structure or fighting it.
 *
 * Structure:
 *   QN_ADVICE[openingId][destSquare] = string
 *   Plus QN_ADVICE_FALLBACK[destSquare] for openings not covered.
 *   Plus QN_STRUCTURE_HINTS for context add-ons (e.g. "the c-pawn still
 *   had work to do here").
 *
 * Tone guardrails:
 *   - Authoritative before friendly. We celebrate a well-timed Nc3 in the
 *     QGD or English, and we will firmly criticize a reflexive Nc3 in the
 *     Italian or London that blocks the c-pawn's real plan.
 *   - Two to three sentences max. Teach ONE concrete principle per line:
 *     c-pawn freedom, pawn-structure fit, opening identity, or central
 *     coordination.
 *   - Avoid the "every knight wants the center" cliche; the whole point of
 *     this piece is that it doesn't.
 *
 * Covered destinations (reachable from b1 in 1 move without prior pawn
 * moves): a3, c3, d2. We also deliver advice for the "no bishop moved yet
 * but the student waited" case elsewhere.
 */

// ---------------------------------------------------------------------------
// Per-opening × per-destination advice
// ---------------------------------------------------------------------------

export const QN_ADVICE = {
  // =========================================================================
  // ITALIAN GAME
  // The Italian wants c3 to support d4 — one of the opening's key ideas.
  // Nc3 directly blocks that plan. The model b1 knight play in the Italian
  // is to WAIT: develop f1 bishop, castle, play c3, then decide.
  // =========================================================================
  italian: {
    c3: "Nc3 in the Italian is natural-looking but usually wrong — you've just blocked the c-pawn that the Italian wants to push to c3 to support d4. The c3–d4 center is one of the Italian's signature ideas; Nc3 gives it up for a square the knight didn't need yet. Wait on this knight until the structure declares itself.",
    d2: "Nd2 in the Italian is premature. The Italian's standard shell is Nf3 + Bc4 + 0-0 + c3 + d4 — the b1 knight typically waits until that structure is set. Nd2 right now blocks the queen's bishop and isn't serving any concrete Italian plan yet.",
    a3: "Na3 in the Italian is off the map. The queenside knight's early question in the Italian is always about the c-pawn — a3 answers a question nobody asked. In this opening, the model b1-knight play is to wait, not wander to the rim.",
  },

  // =========================================================================
  // QUEEN'S GAMBIT DECLINED
  // The textbook home for Nc3. White has already played c4, so the c-pawn
  // no longer needs c3 — Nc3 is now purely a developing move that pressures
  // d5 and supports the classical center. This is where Nc3 gets taught.
  // =========================================================================
  queensGambit: {
    c3: "Nc3 is the classical Queen's Gambit developing move. Because you've already played c4, the c-pawn no longer needs c3 — the knight now pressures d5, supports a possible e4, and fits the opening's classical central ambitions. This is one of the cleanest Nc3 moves in all of chess.",
    d2: "Nd2 in the QGD is legitimate but usually a secondary plan — classical theory plays Nc3 first because it's more active. The main reason to prefer Nd2 is a specific line (Exchange or Carlsbad nuances), not vague caution. Unless you have that reason, Nc3 is cleaner and more ambitious.",
    a3: "Na3 in the QGD has no real home — the diagonal does nothing, and in a classical d-pawn opening the knight belongs on c3 pressuring d5. The QGD is one of the best openings in chess for teaching clean, classical Nc3; a3 throws that away.",
  },

  // =========================================================================
  // RUY LOPEZ
  // Like the Italian, the Ruy is a c-pawn opening. c3 is a key support move
  // for d4 in many Ruy lines (and for defending the Bb5 retreat to c2).
  // Rushing Nc3 closes the door on White's most thematic central plan.
  // =========================================================================
  ruyLopez: {
    c3: "Nc3 this early in the Ruy Lopez is usually a mistake — you've blocked the c-pawn that wants to play c3 to support d4 and build the Ruy's classical center. In the Ruy, the b1 knight is a waiting knight; castle, decide on your pawn plan, then develop the knight where the structure points.",
    d2: "Nd2 in the Ruy Lopez is premature. The Ruy's b1 knight is a waiting piece in the first 5 moves — the c-pawn and central pawn plans come first. Nd2 commits the knight before you know whether you want c3, d4, or a slower d3 setup.",
    a3: "Na3 in the Ruy Lopez is almost never the right call. The Ruy asks the queenside knight to wait while the c-pawn, central pawns, and bishop decide the opening's shape. Sending the knight to the rim first answers no question the Ruy is asking.",
  },

  // =========================================================================
  // ENGLISH OPENING
  // Because White's c-pawn has already moved, Nc3 becomes natural and clean.
  // It's one of the cleanest examples of "c-pawn already used, so Nc3 is
  // free." Nd2 is unusual and Na3 has occasional theoretical niches but is
  // generally suspect in the first 3–5 moves.
  // =========================================================================
  english: {
    c3: "Nc3 is the English's natural queenside development — and it's clean precisely because your c-pawn has already done its job on c4. The knight now fights for d5, supports central breaks, and fits the English's hypermodern-but-principled structure.",
    d2: "Nd2 in the English is unusual. The whole virtue of starting with 1.c4 is that it frees c3 for the knight — playing Nd2 instead throws that away and gives a passive piece. In the English, Nc3 is the textbook square for this knight.",
    a3: "Na3 in the English has a few obscure theoretical niches (anti-…Bb4 ideas), but in the first 3–5 moves it's almost always worse than the natural Nc3. The English gave you c3 for free — don't abandon it for the rim.",
  },

  // =========================================================================
  // LONDON SYSTEM
  // The signature LONDON b1-knight square is d2. Because the London's
  // structure needs c3 to support d4 (the d4–e3–c3 triangle), Nc3 blocks
  // the setup the whole opening is built on. This is one of the clearest
  // "knight chooses structure over activity" lessons in chess.
  // =========================================================================
  london: {
    d2: "Nd2 is the London's signature queenside knight development. You're keeping c3 available for the pawn (supporting d4 in the London's d4–e3–c3 triangle), reinforcing the center from behind, and letting the system stay compact. This is the knight choosing structure over flashy activity — exactly the London's style.",
    c3: "Nc3 in the London is a structural error — you've just blocked the c-pawn that wants c3 to support d4. The whole London shell (d4, Bf4, e3, c3, Nbd2) depends on that c3 pawn; Nc3 collapses the system for a square the knight doesn't need. The London's b1 knight goes to d2.",
    a3: "Na3 in the London is pointless. The system's knight plan is clear and mandatory: Nd2 to keep c3 free for the pawn and support the central triangle. Na3 abandons that plan for a rim square that does nothing.",
  },
};

// ---------------------------------------------------------------------------
// Fallback: destination-specific advice when the opening isn't in the table.
// Uses the general c-pawn + structure principles without opening-specific
// flavor.
// ---------------------------------------------------------------------------

export const QN_ADVICE_FALLBACK = {
  c3: "Nc3 is the natural queenside knight move, but it's conditional — it blocks the c-pawn. The right question before playing it: does my opening plan still need c3 or c4? If yes, Nc3 is premature. If the c-pawn is done (c4 already played), Nc3 is clean classical development.",
  d2: "Nd2 is a structure-first knight move — it keeps the c-pawn free and supports central coordination from behind. It's correct when your opening needs c3 (London, Colle) or when you want to preserve c-pawn flexibility. It's not a parking lot for a confused knight, though — use it with a reason.",
  a3: "Na3 in the opening is almost always suspect. The queenside knight's real question is always about the c-pawn — c3 or d2 — and a3 answers neither. Strong reasons only.",
};

// ---------------------------------------------------------------------------
// Structure add-ons: appended when the position meets a specific condition.
// ---------------------------------------------------------------------------

export const QN_STRUCTURE_HINTS = {
  // Appended when White plays Nc3 BEFORE the c-pawn has moved — directly
  // blocking the c-pawn's future. Critical teaching moment.
  cPawnStillHome:
    " Note your c-pawn hasn't moved yet — that knight has just locked it onto c2. If you ever wanted c3 or c4 in this opening, you now need the knight to move again first. That's the tempo cost of a reflexive Nc3.",

  // Appended when White plays Nd2 but the c-pawn has already moved to c4
  // (so the whole c-pawn-freedom argument for Nd2 doesn't apply).
  cPawnAlreadyMoved:
    " Since your c-pawn has already moved, the usual reason to prefer Nd2 (keeping c3 free) no longer applies — Nc3 would have been the more active developing square here.",

  // Appended when the knight moves a second time in the opening.
  secondMove:
    " This is the second time this knight has moved — tempo you won't get back. Re-routing a minor piece in the first 15 moves usually means the first square was wrong.",
};

// ---------------------------------------------------------------------------
// Public lookup function
// ---------------------------------------------------------------------------

/**
 * Return the best queenside-knight coaching line for this move, or null if
 * the move isn't a b1-knight move we want to handle.
 *
 * @param {object} args
 * @param {object} args.moveObj - chess.js move object
 * @param {string|null} args.openingId - current opening id
 * @param {string[]} args.historySan - full SAN history up to and including this move
 * @param {number} args.ply - ply of this move (1-indexed)
 * @returns {string|null}
 */
export function getQueensideKnightAdvice({ moveObj, openingId, historySan = [], ply }) {
  if (!moveObj) return null;
  if (moveObj.piece !== "n") return null;
  if (moveObj.from !== "b1") return null;
  if (ply > 15) return null;

  const dest = moveObj.to;
  const byOpening = openingId && QN_ADVICE[openingId];
  const openingLine = byOpening && byOpening[dest];
  const fallbackLine = QN_ADVICE_FALLBACK[dest];

  let line = openingLine || fallbackLine;
  if (!line) return null;

  // Structure hint: Nc3 while c-pawn is still home (c2).
  // Detect by scanning prior White SAN for any c-pawn move (c3, c4, cxb3,
  // cxd3, cxb4, cxd4 etc.).
  const whiteSan = historySan.filter((_, i) => i % 2 === 0);
  const cPawnMoved = whiteSan.some((san) => /^c[x23456]/.test(san) || /^c[a-h]?[x]?[a-h]?[345678]/.test(san));
  if (dest === "c3" && !cPawnMoved) {
    line += QN_STRUCTURE_HINTS.cPawnStillHome;
  }
  // Structure hint: Nd2 when the c-pawn is already gone (so the "keep c3
  // free" rationale doesn't apply).
  if (dest === "d2" && cPawnMoved) {
    line += QN_STRUCTURE_HINTS.cPawnAlreadyMoved;
  }

  return line;
}
