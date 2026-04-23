/*
 * Castling philosophy engine — the definitive coach logic for when and how
 * White should castle, across all 5 openings.
 *
 * Why this file exists:
 *   Castling is the single most pattern-rich moment in the opening. It is
 *   king safety AND rook development AND tempo-management AND a commitment
 *   to a plan, all compressed into one move. Beginners misread all four:
 *
 *     1. They delay castling "one more move" and let the center open on
 *        an uncastled king — the single most common losing pattern in the
 *        first 15 moves.
 *     2. They treat O-O as a safety move only, not noticing that it is
 *        ALSO h1-rook development in one tempo (the rook-report insight).
 *     3. They play h3 / a3 / queen shuffles instead of preparing castling,
 *        burning the exact tempi castling was supposed to save.
 *     4. They don't realize that the kingside bishop and knight must be
 *        developed first — castling is a REWARD for completing prep, not
 *        an escape hatch you pull when you remember the king exists.
 *
 *   The coach must therefore do three things:
 *
 *     A) Recognize the IDEAL castling window per opening, and push hard
 *        inside that window.
 *     B) Detect PREP-ENABLEMENT — when the king knight or kingside bishop
 *        are still home, castling is illegal; the coach should instead
 *        push the specific prep move that opens castling.
 *     C) Escalate URGENCY as the window closes. Past the ideal window,
 *        tone shifts from "suggest" -> "urge" -> "warn" -> "critical."
 *
 *   Per-opening windows (in WHITE-PLY terms — each White move is an odd
 *   ply: move 4 = ply 7, move 5 = ply 9, move 6 = ply 11, move 7 = ply 13):
 *
 *     Italian, Ruy Lopez      ideal: moves 4–6   (ply 7–11)
 *     Queen's Gambit Declined ideal: moves 6–8   (ply 11–15)
 *     London System           ideal: moves 5–8   (ply 9–15)
 *     English Opening         ideal: moves 6–9   (ply 11–17)
 *
 *   These windows come straight from the castling philosophy document:
 *   open-game e4 openings punish lateness fastest, d4 systems have more
 *   preparation overhead, and the English's flank character tolerates
 *   slightly later castles.
 *
 * Tone guardrails (Standing Directives):
 *   - "Authoritative first, friendly second."
 *   - Willing to criticize the player for drifting past the window.
 *   - Praise on-time castling with real conviction, not a checkmark.
 *   - Two to three sentences max per line.
 */

// ---------------------------------------------------------------------------
// Per-opening castling windows + advice lines
// ---------------------------------------------------------------------------

export const CASTLING_ADVICE = {
  italian: {
    // Italian is castling-first chess. Moves 4–6 is the textbook window.
    idealMinPly: 7,     // move 4
    idealMaxPly: 11,    // move 6
    criticalPly: 15,    // past move 7 = structurally dangerous
    suggestLine:
      "Castling kingside is now your highest-impact move. In the Italian, **O-O solves two problems at once**: king safety and h1-rook development. The bishop and knight are in place — finish the setup.",
    urgeLine:
      "You're at the edge of the Italian's castling window. The center is about to open with c3/d4 and you do **not** want to be uncastled when that happens. **O-O this turn**; there's no better move on the board.",
    warnLine:
      "You're late to castle in the Italian. Every move the king stays on e1, you're gambling that Black doesn't open the center — and the Italian's whole point is that White *wants* the center open. **Castle now and stop paying the king-safety tax** on every subsequent move.",
    criticalLine:
      "Your king has been on e1 deep into the Italian — this is the single most common way the Italian collapses for White. Stop everything else. **Castle kingside this turn.** If a check or pin takes castling rights, the game becomes strategically very difficult for you.",
    prepNf3Line:
      "Before you can castle, the knight needs to leave g1. **Nf3** is both a developing move and a prerequisite for O-O — play it now so the castle is available next turn.",
    prepBishopLine:
      "The f1 bishop is still blocking the castle. In the Italian, **Bc4** is the textbook move — it develops toward the weak f7 square and clears the path for O-O in one stroke.",
  },

  ruyLopez: {
    // Ruy is as castle-urgent as Italian. Window moves 4–6.
    idealMinPly: 7,
    idealMaxPly: 11,
    criticalPly: 15,
    suggestLine:
      "The Ruy's signature sequence is **Nf3, Bb5, O-O** — you've built the first two steps; the third is the reward. Castle now while the architecture holds.",
    urgeLine:
      "You're at the edge of the Ruy's castling window. The Ruy earns its slow central squeeze only when the king is safe first; **O-O this turn** and let the opening do what it's designed to do.",
    warnLine:
      "You're overdue to castle in the Ruy. The slow positional buildup the Ruy is famous for turns on its head the moment d4 opens lines — if your king is still on e1 at that moment, White's strategic advantage flips to disadvantage. **Castle now.**",
    criticalLine:
      "This is deep into the Ruy with an uncastled king — exactly the scenario the opening is trying to avoid. Every elite game reaches O-O within the first six moves for a reason. **Castle kingside this turn**; consider everything else secondary.",
    prepNf3Line:
      "The Ruy starts with Nf3 for a reason — it develops AND enables castling. If you haven't played it yet, **Nf3** should be your next move.",
    prepBishopLine:
      "**Bb5** is both the Ruy's defining move and the final prerequisite for O-O. Play it now; castling becomes available immediately after.",
  },

  queensGambit: {
    // QGD delays by design — c1 bishop must clear before castling makes sense.
    // Window moves 6–8.
    idealMinPly: 11,
    idealMaxPly: 15,
    criticalPly: 19,
    suggestLine:
      "The QGD's structural setup is complete — now is the moment for **O-O**. The QGD delays castling by design, so reaching it on time is itself a strategic achievement.",
    urgeLine:
      "You're at the late edge of the QGD's castling window. The c-file and e-file are about to become the most contested squares on the board and your king should not be in that traffic. **Castle kingside this turn.**",
    warnLine:
      "You're overdue to castle in the QGD. The QGD forgives a *slow* castle, not a *forgotten* one — and every extra move your king stays on e1, Black's counterplay on the c-file gains a target it shouldn't have. **Castle now.**",
    criticalLine:
      "This is the QGD's worst-case scenario: queenside fully resolved but the king still in the center. Black's natural break is right through your king's file. **Castle kingside immediately.** Every other move is a gamble you're going to lose.",
    prepNf3Line:
      "In the QGD, **Nf3** is the move that both develops and enables castling. It also supports d4 and keeps the king knight off the g-file. Play it now.",
    prepBishopLine:
      "The QGD delays castling because the c1 bishop needs a home first — **Bg5** or **Bf4** is the natural move, then the kingside bishop (Be2 or Bd3), then O-O. Clear the c1 bishop this turn.",
  },

  english: {
    // English is flexible but not limitless. Window moves 6–9.
    idealMinPly: 11,
    idealMaxPly: 17,
    criticalPly: 21,
    suggestLine:
      "The English's flank setup tolerates flexible timing, but now the minors are in place and **O-O is the best move on the board**. Flexibility isn't an excuse to skip it.",
    urgeLine:
      "You've reached the end of the English's castling latitude. The g3/Bg2 fianchetto was explicitly preparing this castle — finish the sequence. **O-O this turn.**",
    warnLine:
      "You're late to castle even by the English's generous standards. The English can tolerate a lot, but a king still on e1 past move 10 is no longer *flexible* — it's *exposed*. **Castle kingside now** and recover the tempo the opening gave you.",
    criticalLine:
      "Deep into the English with an uncastled king — this is past flexible into dangerous. The c-file and long diagonals the English builds will open against you next. **Castle kingside this turn.** It's late, but still the right move.",
    prepNf3Line:
      "In the English, **Nf3** and the g3/Bg2 setup together prepare castling. Play Nf3 first if you haven't; it's a development move and a castling prerequisite in one.",
    prepBishopLine:
      "The English castles behind the **g3/Bg2** fianchetto — the bishop's path is the castling path. Finish Bg2 this turn and O-O becomes legal next move.",
  },

  london: {
    // London's shell is built for castling. Window moves 5–8.
    idealMinPly: 9,
    idealMaxPly: 15,
    criticalPly: 19,
    suggestLine:
      "The London shell is complete — **O-O** is what the entire system has been arranging. Nf3, e3, Bd3 were quietly preparing this single move; now collect the reward.",
    urgeLine:
      "You're at the edge of the London's castling window. The London system is *designed* to end in O-O — any other move right now fights the system. **Castle this turn.**",
    warnLine:
      "You're overdue to castle in the London. The whole appeal of the London is efficient, low-maintenance coordination — and leaving the king on e1 is the one thing that breaks that coordination. **Castle kingside now**; the shell was built for this.",
    criticalLine:
      "This is deep into the London with the king still in the center — the system's one real failure mode. The London doesn't have sharp tactics to save an uncastled king. **O-O this turn.** No excuses.",
    prepNf3Line:
      "The London's shell starts with **Nf3** — it's a developing move and a castling prerequisite. Play it now; the rest of the system falls into place behind it.",
    prepBishopLine:
      "The London's kingside bishop belongs on **d3** (or sometimes e2). Play **Bd3** this turn and castling becomes legal the move after.",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function whiteHasCastled(historySan) {
  if (!Array.isArray(historySan)) return false;
  for (let i = 0; i < historySan.length; i += 1) {
    if (i % 2 === 0 && (historySan[i] === "O-O" || historySan[i] === "O-O-O")) {
      return true;
    }
  }
  return false;
}

function whiteCastledSide(historySan) {
  if (!Array.isArray(historySan)) return null;
  for (let i = 0; i < historySan.length; i += 1) {
    if (i % 2 === 0) {
      if (historySan[i] === "O-O") return "K";
      if (historySan[i] === "O-O-O") return "Q";
    }
  }
  return null;
}

function whiteMovesPlayed(historySan) {
  if (!Array.isArray(historySan)) return new Set();
  const out = new Set();
  for (let i = 0; i < historySan.length; i += 1) {
    if (i % 2 === 0) out.add(historySan[i]);
  }
  return out;
}

/**
 * Detect what (if anything) is blocking White from castling kingside.
 * Returns { canCastle, missingKnight, missingBishop } — if canCastle is
 * false, at least one of the others is true, and the coach should push
 * the prep move instead of O-O itself.
 *
 * @param {Array<string>} historySan
 * @returns {{canCastle: boolean, missingKnight: boolean, missingBishop: boolean}}
 */
export function detectCastlingPrep(historySan) {
  const whiteMoves = whiteMovesPlayed(historySan);

  // Knight on g1 until Nf3 (or the rare Nh3, Ne2 — those don't enable castling).
  const knightGone = whiteMoves.has("Nf3");

  // Kingside bishop (f1) gone once any of these are played.
  const bishopGone =
    whiteMoves.has("Bc4") ||
    whiteMoves.has("Bb5") ||
    whiteMoves.has("Bd3") ||
    whiteMoves.has("Be2") ||
    whiteMoves.has("Bg2");

  return {
    canCastle: knightGone && bishopGone,
    missingKnight: !knightGone,
    missingBishop: !bishopGone,
  };
}

// ---------------------------------------------------------------------------
// Main advice function — tier + line
// ---------------------------------------------------------------------------

/**
 * Return a tiered castling advice object based on opening, ply, and prep.
 *
 *   tier:
 *     "none"      no castling nudge is appropriate
 *     "prep"      castling illegal; push the prep move (Nf3/Bc4/etc.)
 *     "suggest"   inside the ideal window — gentle push
 *     "urge"      at the late edge of the window — firm push
 *     "warn"      past the window — critique the delay
 *     "critical"  deep past window — strong language, king in real danger
 *     "praise"    player has castled; no nudge needed (returned with null line)
 *
 * @param {Object} args
 * @param {string} args.openingId
 * @param {Array}  args.historySan
 * @param {number} args.nextPly     the ply the student is about to play
 * @returns {{tier: string, line: string|null, prep: {missingKnight:boolean, missingBishop:boolean}|null}}
 */
export function getCastlingAdvice({ openingId, historySan, nextPly }) {
  if (!openingId || !CASTLING_ADVICE[openingId]) {
    return { tier: "none", line: null, prep: null };
  }
  const entry = CASTLING_ADVICE[openingId];

  if (whiteHasCastled(historySan)) {
    return { tier: "praise", line: null, prep: null };
  }

  // Before the ideal window — no castling nudge yet (other priorities win).
  if (typeof nextPly !== "number" || nextPly < entry.idealMinPly) {
    return { tier: "none", line: null, prep: null };
  }

  const prep = detectCastlingPrep(historySan);

  // Inside the window but castling is illegal — push the prep move.
  // This is the key "prep-enablement" behavior from the philosophy doc.
  if (!prep.canCastle) {
    let line;
    if (prep.missingKnight) {
      line = entry.prepNf3Line;
    } else if (prep.missingBishop) {
      line = entry.prepBishopLine;
    } else {
      line = entry.suggestLine;
    }
    return { tier: "prep", line, prep };
  }

  // Castling is legal — pick the urgency tier by ply.
  if (nextPly <= entry.idealMaxPly) {
    return { tier: "suggest", line: entry.suggestLine, prep: null };
  }
  if (nextPly <= entry.idealMaxPly + 2) {
    return { tier: "urge", line: entry.urgeLine, prep: null };
  }
  if (nextPly <= entry.criticalPly) {
    return { tier: "warn", line: entry.warnLine, prep: null };
  }
  return { tier: "critical", line: entry.criticalLine, prep: null };
}

/**
 * Concise tag for a castling-tier — used by the critique path to decide
 * whether to add a secondary "castling urgency" footnote to the effect
 * line when the player declined to castle on a tier >= warn turn.
 *
 * @param {string} tier
 * @returns {boolean}
 */
export function castlingTierIsPressing(tier) {
  return tier === "urge" || tier === "warn" || tier === "critical" || tier === "prep";
}

/**
 * Build a short secondary-line footnote to attach to a non-castling move's
 * critique when castling was pressing and the student chose otherwise.
 * Returns null if the move was itself O-O, O-O-O, or a prep move that
 * enables castling.
 *
 * @param {Object} args
 * @param {string} args.san           the move the student just played
 * @param {Object} args.advice        result of getCastlingAdvice BEFORE this move
 * @returns {string|null}
 */
export function buildPostMoveCastlingCritique({ san, advice }) {
  if (!advice || !castlingTierIsPressing(advice.tier)) return null;
  if (!san) return null;
  if (san === "O-O" || san === "O-O-O") return null;
  // If the student played a useful prep move (Nf3 or kingside bishop
  // development), don't critique — they ARE moving toward castling.
  if (advice.tier === "prep") {
    if (san === "Nf3") return null;
    if (["Bc4", "Bb5", "Bd3", "Be2", "Bg2"].includes(san)) return null;
  }

  switch (advice.tier) {
    case "prep":
      return "Castling is still out of reach — the minors blocking it are the pieces that most urgently need to move.";
    case "urge":
      return "You passed up a clean castling chance — **O-O was the best move on the board.** Come back to it next turn without fail.";
    case "warn":
      return "Another turn with the king on e1. **The center will punish this.** Castling was, and still is, the priority move.";
    case "critical":
      return "The king is now genuinely in danger on e1. **Castle next turn** or the rest of the game will be spent defending against threats that castling would have prevented.";
    default:
      return null;
  }
}

export default {
  CASTLING_ADVICE,
  getCastlingAdvice,
  detectCastlingPrep,
  castlingTierIsPressing,
  buildPostMoveCastlingCritique,
};
