/*
 * White rook coaching advice — both rooks × all 5 openings.
 *
 * Why this file exists:
 *   Rooks are among the most misunderstood opening pieces. The report's
 *   central insight: in the opening, rooks are usually IMPORTANT BEFORE
 *   THEY ARE ACTIVE. Beginners either treat rooks as irrelevant until the
 *   middlegame, or try to "activate" them artificially with early rook
 *   lifts and flank pawns (a3, b4, Rb1, Ra2) that don't belong in the
 *   first 3-5 moves. The coach must be authoritative about this: rooks
 *   are consequence pieces, not action pieces, in the opening phase.
 *
 *   The two rooks live very different lives:
 *     - a1 (queenside) is a STRUCTURAL CONSEQUENCE rook. It waits for
 *       queenside congestion to resolve (b1 knight, c1 bishop, queen
 *       timing, c-pawn choice) and inherits the structure White builds.
 *     - h1 (kingside) is a CASTLING REWARD rook. Castling kingside is
 *       also rook development — that's the deep insight. The h1 rook
 *       becomes active not because White "used" it but because White
 *       developed the kingside minors and castled on time.
 *
 * Structure:
 *   QUEENSIDE_ROOK_ADVICE[openingId] — a1 rook insights per opening
 *   KINGSIDE_ROOK_ADVICE[openingId]  — h1 rook insights per opening
 *     Each object has:
 *       identityLine    — the rook's role/future in this opening
 *       earlyLiftLine   — critique when the rook moves in the first 3-5 moves
 *       afterCastleLine — praise/coordination when a kingside rook reaches
 *                         f1/e1 via castling and then moves, or when the
 *                         queenside rook moves after legitimate queenside
 *                         clarification (c-file opens in QGD etc).
 *
 *   getRookAdvice({moveObj, openingId, historySan, ply}) — decides which
 *   line to return based on (1) which rook, (2) whether castling has
 *   happened, (3) whether the rook move looks like an artificial lift.
 *   Returns null if the module has nothing specific to say (rare; role
 *   fallback then takes over).
 *
 * Tone guardrails (from Standing Directives):
 *   - "Authoritative first, friendly second."
 *   - Criticize early rook lifts directly: a3-to-help-the-rook, b4 without
 *     a queenside plan, Rb1/Ra2/rook-lifts in classical setups.
 *   - Praise castling as ALSO being rook development — this is one of the
 *     strongest teaching points in the report.
 *   - 2-3 sentences max.
 */

// ---------------------------------------------------------------------------
// Queenside rook (a1) — structural consequence piece
// ---------------------------------------------------------------------------

export const QUEENSIDE_ROOK_ADVICE = {
  italian: {
    identityLine:
      "The a1 rook is a **structural follower** in the Italian — it inherits whatever you build with c3, d4, and later queenside coordination. It almost never needs to move in the first 3-5 moves; it needs you to build a good center around it.",
    earlyLiftLine:
      "Moving the a1 rook this early in the Italian is a misunderstanding of what rooks do in the opening. The Italian's first-wave priorities are **e4, Nf3, Bc4, castle, c3/d4** — none of which involve the queenside rook. You're spending a tempo on a piece that just needs the structure to mature.",
    afterCastleLine:
      "Now that the structure has clarified, the a1 rook can start thinking about central files — but only because your earlier development earned it. In the Italian, the queenside rook is a reward for good c3/d4 play, not a piece you activate by hand.",
  },
  queensGambit: {
    identityLine:
      "The a1 rook in the QGD is a **future c-file rook**. The opening has already played c4, which means the queenside is structurally alive — exchanges on the c-file later can open a natural home for this rook. But that's later. Early on it just waits.",
    earlyLiftLine:
      "The QGD is one of the few openings where the a1 rook has a genuine queenside future — but that future comes from c-file exchanges, **not from moving the rook manually**. Premature rook motion here wastes tempi on a piece whose future the opening is already preparing for you.",
    afterCastleLine:
      "This rook move fits the QGD's structural logic — the a1 rook is one of the naturally c-file-relevant pieces in this opening, and moving it here only makes sense once the c-file has started to clarify. That's the right kind of rook patience rewarded.",
  },
  ruyLopez: {
    identityLine:
      "The a1 rook in the Ruy Lopez is a **second-wave structural piece** — it waits while White builds strategic pressure with e4, Nf3, Bb5, and later c3/d4. Black's ...a6 in mainline Ruy doesn't change this; don't let Black's queenside pawn play trick you into answering with your own.",
    earlyLiftLine:
      "Moving the a1 rook this early in the Ruy misreads the opening. The Ruy's power is strategic central pressure via Bb5 and timed c3/d4 — the queenside rook is a reserve piece that benefits from that work, not a piece that needs its own tempo this early.",
    afterCastleLine:
      "The a1 rook starts to matter once the Ruy's central coordination is complete. Moving it now can fit, but only because the Bb5/c3/d4 structure you built earlier gave this rook a reason to exist.",
  },
  english: {
    identityLine:
      "The a1 rook in the English has the **most vivid queenside future** of any of our five openings — c-file pressure and b3/Bb2 fianchetto structures give it a real role later. That said, it's still a reserve piece in the first 3-5 moves; the future is being prepared, not claimed.",
    earlyLiftLine:
      "Even though the English is a flank opening, moving the a1 rook this early is still premature. The English builds queenside relevance through **c4, Nc3, g3/Bg2 or b3/Bb2** — the rook inherits that structure. Random Rb1 without a queenside plan is the exact anti-pattern the report warns about.",
    afterCastleLine:
      "This is the one opening where queenside rook moves earn their keep earliest — but only because c4 and the fianchetto structure made the queenside real. You're using the rook because the opening actually built something for it.",
  },
  london: {
    identityLine:
      "The a1 rook in the London is **very quiet** — the London is a system-shell opening that organizes itself around d4/Nf3/Bf4/e3/c3, and the queenside rook is among the last pieces to find a role. Its job is to wait while the shell forms.",
    earlyLiftLine:
      "Moving the a1 rook this early in the London fights against the opening's whole identity. The London's strength is a **compact, efficient shell** — spending a tempo on a rook lift or flank pawn before the shell is even complete is exactly what the system is designed to avoid.",
    afterCastleLine:
      "The a1 rook only becomes useful in the London once the shell is fully built and the queen has found c2 or b3. Moving it now is defensible because the system is mature, not because the rook was begging to move.",
  },
};

// ---------------------------------------------------------------------------
// Kingside rook (h1) — castling reward piece
// ---------------------------------------------------------------------------

export const KINGSIDE_ROOK_ADVICE = {
  italian: {
    identityLine:
      "The h1 rook is the Italian's **reward rook** — castling kingside doesn't just make your king safe, it brings this rook to f1 toward central action. The Italian's entire first wave (e4, Nf3, Bc4) points at quick castling, and this rook is the quiet beneficiary.",
    earlyLiftLine:
      "Moving the h1 rook before castling is a serious opening error in the Italian. Castling IS this rook's development — you're about to spend a tempo on a manual rook move when **O-O accomplishes the same thing plus king safety**. Castle first.",
    afterCastleLine:
      "Now that you've castled, the f1 rook is already well placed — it supports e4, the d4 break, and future central file activity. In the Italian, good early development and timely castling give this rook everything it needs.",
    castlingNudgeLine:
      "Castle kingside now — in the Italian, **O-O is also h1 rook development**. The rook arrives on f1 supporting your center in the same move that tucks your king away.",
  },
  queensGambit: {
    identityLine:
      "The h1 rook in the QGD is a **quiet structural supporter** after castling — less immediately active than in open e4 games, but still the first rook White improves. Castling brings it to f1 where it backs up the center as the QGD's slower positional logic unfolds.",
    earlyLiftLine:
      "Moving the h1 rook before castling in the QGD mistakes the opening's tempo. The QGD is quieter than the Italian, but that doesn't mean rook lifts are justified — **castling is still this rook's best early move**, and it's free with O-O.",
    afterCastleLine:
      "After castling, the h1 rook becomes a patient structural supporter — that fits the QGD's identity. This is the role the opening always intended for it: quietly central, waiting for exchanges to open files.",
    castlingNudgeLine:
      "Castle kingside — in the QGD, this rook is most improved not by moving it directly but by **O-O**, which brings it to f1 in a single tempo.",
  },
  ruyLopez: {
    identityLine:
      "The h1 rook in the Ruy is one of the opening's **great hidden beneficiaries**. The Bb5 and Nf3 development points straight at castling, and castling completes White's strategic setup — the rook on f1 supports e4, future d4, and the Ruy's precise central-support system.",
    earlyLiftLine:
      "Moving the h1 rook before castling in the Ruy throws away the opening's natural harmony. Ruy development (Nf3, Bb5, 0-0) is **designed** to improve this rook through castling — a manual rook move here is slower and worse than the castling you should be playing.",
    afterCastleLine:
      "The f1 rook is exactly where the Ruy wants it — backing up the e-pawn, ready to support later d4 or central file play. Castling did the work; this rook is now part of the strategic machinery the Ruy is built on.",
    castlingNudgeLine:
      "Castle kingside — the Ruy's Bb5/Nf3 development is **set up for O-O**, which completes White's strategic coordination and brings the h1 rook to f1 in one stroke.",
  },
  english: {
    identityLine:
      "The h1 rook in the English has **slightly more flexible timing** than in open games — the English's reserve-and-flank character means castling can wait a move or two longer. But the rook is still a castling beneficiary; it just gets there when White's flexible development says so.",
    earlyLiftLine:
      "The English is flexible, but that's not a license for rook lifts. **Flexibility doesn't mean rook tempi are free** — castling is still this rook's best first move, and pushing it out manually before the structure is settled is the exact confusion the report warns about.",
    afterCastleLine:
      "Now that you've castled, the f1 rook fits naturally into the English's flexible center — it can support e4 pushes, central breaks, or long-diagonal piece coordination depending on how the game unfolds.",
    castlingNudgeLine:
      "Castle kingside — even in the English's flexible system, **0-0 is still rook development**, and the h1 rook comes into play properly once the king is tucked away.",
  },
  london: {
    identityLine:
      "The h1 rook in the London is a **system reward** — the London's Nf3/Bf4/e3 shell naturally clears the kingside for O-O, and castling turns this rook into a ready central supporter. It's one of the cleanest 'rook through castling' stories in chess.",
    earlyLiftLine:
      "A rook lift in the London contradicts the entire system. The London is **efficient coordination** — Nf3, e3, Bd3, castle — and the h1 rook is one of the quiet pieces the system is designed to improve for you. Don't fight it.",
    afterCastleLine:
      "Now that the shell is complete and you've castled, the f1 rook fits perfectly into the London's quiet harmony — it supports future e4 ideas and pairs with Qc2 and Bd3 for steady central presence.",
    castlingNudgeLine:
      "Castle kingside — the London's shell (Nf3, e3, Bd3) is **complete preparation for O-O**, which upgrades the h1 rook to f1 as part of the system's reward structure.",
  },
};

// ---------------------------------------------------------------------------
// Helper: detect whether White has already castled
// ---------------------------------------------------------------------------

function whiteHasCastled(historySan) {
  // historySan is the list of SANs for both sides. White castles on even
  // indexes when counting from 0 (0 = white's 1st move). Safer: scan for
  // "O-O" / "O-O-O" and assume White's castle is at an even index.
  if (!Array.isArray(historySan)) return false;
  for (let i = 0; i < historySan.length; i += 1) {
    const san = historySan[i];
    if (i % 2 === 0 && (san === "O-O" || san === "O-O-O")) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Main advice function
// ---------------------------------------------------------------------------

/**
 * Build a rook-specific advice line.
 *
 * @param {Object} args
 * @param {Object} args.moveObj     chess.js verbose move ({piece, from, to, san, flags, ...})
 * @param {string} args.openingId   one of: italian, queensGambit, ruyLopez, english, london
 * @param {Array}  args.historySan  SANs played so far, including the current move (strings)
 * @param {number} args.ply         current ply (1-indexed, white = odd)
 * @returns {string|null}
 */
export function getRookAdvice({ moveObj, openingId, historySan, ply }) {
  if (!moveObj || moveObj.piece !== "r") return null;
  if (!openingId) return null;

  // Only applies to White — piece color is lowercase 'w' in chess.js verbose
  // format on moveObj.color, but the whole coach stack already gates on
  // "byStudent" earlier. We still check from-square to know which rook.
  // Did White castle already? Need this BEFORE deciding which rook table to
  // use — because once White has castled, the kingside rook lives on f1 and
  // any subsequent Rf1→e1/Rf1→d1 style reposition is still fundamentally a
  // kingside-rook move, and the rook report's after-castle endorsement
  // should fire for it.
  const priorSansForCastle = Array.isArray(historySan) ? historySan.slice(0, -1) : [];
  const castledForTable = whiteHasCastled(priorSansForCastle);

  const isQueenside = moveObj.from === "a1" || (castledForTable && moveObj.from === "d1");
  const isKingside =
    moveObj.from === "h1" ||
    (castledForTable && (moveObj.from === "f1" || moveObj.from === "e1"));
  const rookTable = isQueenside ? QUEENSIDE_ROOK_ADVICE : isKingside ? KINGSIDE_ROOK_ADVICE : null;

  if (!rookTable) {
    // Rook has already moved once AND is not in a recognized post-castle
    // lane; return null so role fallback can take over.
    return null;
  }

  const entry = rookTable[openingId];
  if (!entry) return null;

  const castled = castledForTable;

  // In the first 10 plies without castling, any rook move from home is an
  // early lift — the most educational case per the report.
  const isEarlyPhase = typeof ply === "number" ? ply <= 10 : true;

  if (!castled && isEarlyPhase) {
    // Early rook lift — criticize directly.
    return `${entry.earlyLiftLine} ${entry.identityLine}`;
  }

  if (castled) {
    // Post-castling rook move — endorse if it fits, but lead with identity.
    return `${entry.afterCastleLine} ${entry.identityLine}`;
  }

  // Fallback: identity line alone (rare path — rook moves after ply 10
  // without castling).
  return entry.identityLine;
}

/**
 * Build a castling-nudge line for the "Your Move" primary slot.
 * Returns null if castling isn't the right nudge right now.
 *
 * @param {Object} args
 * @param {string} args.openingId
 * @param {Array}  args.historySan
 * @param {number} args.nextPly
 * @returns {string|null}
 */
export function buildCastlingNudge({ openingId, historySan, nextPly, kingUrgency }) {
  if (!openingId) return null;
  const table = KINGSIDE_ROOK_ADVICE[openingId];
  if (!table) return null;

  const sans = Array.isArray(historySan) ? historySan : [];
  if (whiteHasCastled(sans)) return null;

  // Only nudge once the kingside minors are developed — otherwise the
  // normal next-actor logic (Develop Nf3 / Bc4) takes precedence.
  const played = new Set(sans);
  const hasNf3 = played.has("Nf3");
  const hasKingsideBishop =
    played.has("Bc4") || // Italian
    played.has("Bb5") || // Ruy
    played.has("Bf4") || // London (f4 is kingside-ish via c1, not the f1 bishop — exclude)
    played.has("Bd3") || played.has("Be2") || // London/QGD f1-bishop squares
    played.has("Bg2"); // English

  // For Italian/Ruy we expect both the knight and the bishop out.
  // For London we need Nf3 + Bd3/Be2 (the f1 bishop).
  // For QGD we accept Nf3 + f1 bishop developed, or Nc3 + Nf3 + Bf1 moved.
  // For English we need Nf3 + Bg2 at minimum.
  if (!hasNf3 || !hasKingsideBishop) return null;

  // Don't nudge past ply 12 — by then other advice should dominate.
  if (typeof nextPly === "number" && nextPly > 13) return null;

  // Merge the rook-side insight (castling is rook development) with the
  // king-side insight (castle BEFORE the center opens) when a king-urgency
  // flavor line is provided. This is the deliberate fusion of the two reports.
  const rookLine = table.castlingNudgeLine;
  if (kingUrgency) {
    return `${rookLine} ${kingUrgency}`;
  }
  return rookLine;
}

export default {
  QUEENSIDE_ROOK_ADVICE,
  KINGSIDE_ROOK_ADVICE,
  getRookAdvice,
  buildCastlingNudge,
};
