/*
 * White king coaching advice — the big boy × all 5 openings.
 *
 * Why this file exists:
 *   The king strategy report's central insight: in the opening, the king is
 *   a PRIORITY, not an ACTOR. Its job is to get to safety (almost always
 *   kingside) and stay off the central files before they open. The coach
 *   must be authoritative about two things above all:
 *
 *     1. Ke2/Kf1/Kd2/Ke3/etc in the first 8 moves are serious errors,
 *        not "creative." They either block development (Ke2 stands in the
 *        bishop's way), forfeit castling rights (Kf1 without a plan), or
 *        walk the king toward where the fighting will be.
 *
 *     2. O-O (kingside castling) is the single highest-value move of the
 *        opening — it achieves king safety AND rook development in one
 *        tempo. When the player plays it, the coach should PRAISE it
 *        clearly, not just note it.
 *
 *   The report also calls out per-opening castling urgency:
 *     - Italian, Ruy Lopez  -> castle IMMEDIATELY once minors are out.
 *                              The center will open; late castling = danger.
 *     - QGD                 -> castle on time, but the delay is structural —
 *                              it's because of the c1 bishop, not carelessness.
 *     - English             -> most flexible timing; the flank setup tolerates
 *                              a slightly later castle.
 *     - London System       -> the shell's entire design prepares O-O; when
 *                              Nf3/e3/Bd3 are in place, castling is the reward.
 *
 * Structure:
 *   KING_ADVICE[openingId] — per-opening king insights.
 *     Each entry has:
 *       identityLine             — what the king's job is in this opening
 *       homeMoveCritique         — fires when king moves to e2/f1/d2/e3 etc
 *                                  before castling in the first ~8 moves
 *       castlingPraise           — fires when White plays O-O
 *       castleKingsideUrgency    — a castling-nudge flavor line (merged into
 *                                  the "Your Move" castling nudge alongside
 *                                  the rook-side of the insight)
 *       delayedCastleWarning     — fires when the king is still uncastled
 *                                  past ply 11 and minors are developed
 *
 * Tone guardrails (from Standing Directives):
 *   - "Authoritative first, friendly second."
 *   - Be willing to say Ke2 in the Italian is a mistake — directly.
 *   - Praise O-O with real conviction, not just a checkmark.
 *   - 2-3 sentences max.
 */

// ---------------------------------------------------------------------------
// Per-opening king advice
// ---------------------------------------------------------------------------

export const KING_ADVICE = {
  italian: {
    identityLine:
      "In the Italian, the king's only job in the opening is **to get to g1 on time**. The center will open — Italian games become sharp once c3/d4 arrives — and a king still on e1 at that moment is the most common way beginners collapse winning positions.",
    homeMoveCritique:
      "Moving the king manually in the Italian is a serious opening error. The Italian is **castling-first chess** — e4, Nf3, Bc4 are literally preparation for O-O — and walking the king sideways throws that plan away and costs your castling rights. Put the king back mentally: you want O-O, not king footwork.",
    castlingPraise:
      "Textbook castling in the Italian — this is the single highest-value move of the whole opening. Your king is safe, the h1 rook is now on f1 supporting your center, and every subsequent plan (c3, d4, Re1) stands on this foundation. The Italian is *designed* to end in this castle.",
    castleKingsideUrgency:
      "The Italian's center will crack open soon — castle now while it's still a luxury, not an emergency.",
    delayedCastleWarning:
      "Your king has stayed in the center too long for the Italian. Italian positions break open with c3/d4 very naturally, and every move spent not castling is a move you're gambling on. **Castle kingside this turn** — it's late, but still the right move.",
  },

  queensGambit: {
    identityLine:
      "In the QGD, the king's route to safety is slower than in open games — the c1 bishop problem delays Nf3-and-castle logistics — but the destination is the same: **O-O**. The king is not a maneuvering piece in this opening, it's a deadline.",
    homeMoveCritique:
      "Moving the king manually in the QGD is a real opening error. The QGD's whole first phase is about carefully untangling the queenside (c1 bishop, b1 knight, queen timing) so that **castling kingside happens on time** — walking the king sideways forfeits castling rights and wastes one of the opening's precious preparation tempi.",
    castlingPraise:
      "Well-timed castle in the QGD. The QGD asks more patience than the Italian, so reaching this castle is genuine structural achievement — the king is safe and the f1 rook is now positioned for the c-file and e-file squeeze that defines the middlegame.",
    castleKingsideUrgency:
      "The QGD delays castling by design — but once the c1 bishop is out, **now** is the right moment.",
    delayedCastleWarning:
      "The QGD forgives a slow castle but not a forgotten one. Your king has been on e1 long enough; the c-file and e-file are about to become the busiest squares on the board, and your king should not be in that traffic. **Castle kingside.**",
  },

  ruyLopez: {
    identityLine:
      "In the Ruy Lopez, the king's safety is the backbone of White's whole strategic plan. The Ruy's slow-building central pressure only works because White is safe on g1 while Black scrambles — **a king still on e1 when d4 arrives is the Ruy's self-sabotage pattern**.",
    homeMoveCritique:
      "Moving the king manually in the Ruy is a severe opening error. Ruy development (Nf3, Bb5, O-O) is one of the most harmonious sequences in all of chess — it is *designed* to end in a castle — and forfeiting castling rights by hand destroys the entire strategic architecture the opening is building. Castle instead.",
    castlingPraise:
      "This is the Ruy in its full harmony. Bb5, Nf3, O-O — the opening's signature sequence is now complete, your king is safe on the short side, and the slow positional squeeze the Ruy is famous for can finally begin. Elite players castle here without hesitation for a reason.",
    castleKingsideUrgency:
      "The Ruy's architecture is *waiting* for O-O — the whole Bb5/Nf3 setup was preparation for this move.",
    delayedCastleWarning:
      "Your king has stayed in the center past the Ruy's castling window. The Ruy's patient central buildup turns dangerous the moment d4 opens lines — your king should have been on g1 already. **Castle this turn; recover the safety you skipped.**",
  },

  english: {
    identityLine:
      "In the English, the king enjoys **slightly more flexible timing** than in open games — the flank character of c4 means the center is slower to open. But \"flexible\" isn't \"optional\"; the destination is still g1, just on your own schedule within the first 8-10 moves.",
    homeMoveCritique:
      "The English is flexible, but that's not license to walk the king manually. **Flexibility doesn't mean castling rights are free to throw away** — moving Ke2/Kf1 forfeits the strongest king move in the whole game. Castle kingside when the minors are in place; don't freelance with the monarch.",
    castlingPraise:
      "A well-timed castle in the English — this is the moment the flexible opening becomes a real position. The king is safe, the f1 rook joins the center, and White can now choose between central breaks and flank pressure without having to worry about the monarch.",
    castleKingsideUrgency:
      "The English gives you latitude on timing, but once the minors are out **O-O is still the best move on the board**.",
    delayedCastleWarning:
      "Even in the English's flexible system, your king has now been in the center too long. Flexibility ends when the center starts to open — **castle kingside this turn** and convert that flexibility into a safe, mobilized position.",
  },

  london: {
    identityLine:
      "In the London, the king's path to g1 is the cleanest in all five openings — the Nf3/e3/Bd3 shell practically performs O-O for you. Your king's job is simply to **ride the system** to safety; the opening does the work.",
    homeMoveCritique:
      "A manual king move in the London contradicts the entire system. The London is *efficient coordination* — the whole shell (Nf3, e3, Bd3) is pre-built preparation for castling — so walking the king sideways isn't creative, it's a refusal to accept the gift the opening is handing you. Castle.",
    castlingPraise:
      "This is the London in its purest form. Nf3, e3, Bd3, O-O — the system's shell is complete, the king is safe, the f1 rook is ready, and every plan from here (Qc2, e4 breaks, c3 support) stands on this castle. Cleanly done.",
    castleKingsideUrgency:
      "The London's shell is **built** for this castle — Nf3, e3, Bd3 were all quietly arranging it.",
    delayedCastleWarning:
      "The London's whole point is smooth, efficient coordination — and your king is now the one piece out of step with the system. The shell is ready; **castle kingside this turn** and let the London do what it's designed to do.",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function whiteHasCastled(historySan) {
  if (!Array.isArray(historySan)) return false;
  for (let i = 0; i < historySan.length; i += 1) {
    const san = historySan[i];
    if (i % 2 === 0 && (san === "O-O" || san === "O-O-O")) return true;
  }
  return false;
}

// Squares that represent an "improper" manual king move in the opening —
// Ke2, Kf1, Kd2, Ke3 (and the rarer Kd1). These are the king walks the
// report warns about.
const HOME_KING_BAD_SQUARES = new Set(["e2", "f1", "d2", "e3", "d1"]);

// ---------------------------------------------------------------------------
// Main advice function
// ---------------------------------------------------------------------------

/**
 * Build a king-specific advice line.
 *
 * Fires when:
 *   - The player plays O-O / O-O-O (castling praise)
 *   - The player moves the king manually from e1 to e2/f1/d2/e3/d1
 *     within the first ~8 moves (critique)
 *   - The player moves the king somewhere that doesn't fit those patterns
 *     -> return null and let role-fallback handle it
 *
 * @param {Object} args
 * @param {Object} args.moveObj     chess.js verbose move
 * @param {string} args.openingId
 * @param {Array}  args.historySan  SANs played so far, including current move
 * @param {number} args.ply         current ply (1-indexed)
 * @returns {string|null}
 */
export function getKingAdvice({ moveObj, openingId, historySan, ply }) {
  if (!openingId) return null;
  const entry = KING_ADVICE[openingId];
  if (!entry) return null;

  // chess.js represents castling with piece === 'k' and a flag.
  const isCastle =
    moveObj &&
    moveObj.piece === "k" &&
    (moveObj.san === "O-O" ||
      moveObj.san === "O-O-O" ||
      (moveObj.flags && /[kq]/.test(moveObj.flags)));

  if (isCastle) {
    // Short-castle praise is the loud case. Queenside castle is rare in
    // these 5 openings and mostly an error — critique it as a king walk.
    if (moveObj.san === "O-O-O") {
      return `Castling queenside in this opening is almost always wrong for White — the queenside is where White's initiative should be aimed, not where the king should live. ${entry.identityLine}`;
    }
    return `${entry.castlingPraise} ${entry.identityLine}`;
  }

  if (moveObj && moveObj.piece === "k" && moveObj.from === "e1") {
    // Manual king move from home square.
    if (HOME_KING_BAD_SQUARES.has(moveObj.to)) {
      return `${entry.homeMoveCritique} ${entry.identityLine}`;
    }
    // Any other king-from-e1 move within the first 8 plies — still critique.
    if (typeof ply === "number" && ply <= 8) {
      return `${entry.homeMoveCritique} ${entry.identityLine}`;
    }
  }

  // Post-castling king shuffles (Kh1, Kg1→h1 for luft) or late king moves:
  // no critique, let role-fallback / default advice handle it.
  return null;
}

/**
 * Build an opening-specific "castle kingside urgency" flavor line that the
 * rook-side castling-nudge can merge in. This lets the coach give one
 * nudge that teaches BOTH the rook insight AND the king-safety insight
 * from two separate reports.
 *
 * @param {string} openingId
 * @returns {string|null}
 */
export function getKingCastleUrgency(openingId) {
  if (!openingId) return null;
  const entry = KING_ADVICE[openingId];
  if (!entry) return null;
  return entry.castleKingsideUrgency || null;
}

/**
 * Returns a warning line if the king has stayed in the center too long
 * (past ply 11 with kingside minors developed and no castle yet).
 *
 * @param {Object} args
 * @param {string} args.openingId
 * @param {Array}  args.historySan
 * @param {number} args.nextPly
 * @returns {string|null}
 */
export function getDelayedCastleWarning({ openingId, historySan, nextPly }) {
  if (!openingId) return null;
  const entry = KING_ADVICE[openingId];
  if (!entry) return null;
  if (!Array.isArray(historySan)) return null;
  if (whiteHasCastled(historySan)) return null;

  const played = new Set(historySan);
  const hasNf3 = played.has("Nf3");
  const hasKingsideBishop =
    played.has("Bc4") ||
    played.has("Bb5") ||
    played.has("Bd3") ||
    played.has("Be2") ||
    played.has("Bg2");
  if (!hasNf3 || !hasKingsideBishop) return null;

  if (typeof nextPly !== "number" || nextPly < 11) return null;

  return entry.delayedCastleWarning;
}

export default {
  KING_ADVICE,
  getKingAdvice,
  getKingCastleUrgency,
  getDelayedCastleWarning,
};
