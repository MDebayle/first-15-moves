/*
 * Queenside bishop (the c1 bishop) coaching advice.
 *
 * Why this file exists:
 *   The c1 bishop is one of the most misunderstood pieces in opening play.
 *   Beginners either panic to develop it immediately or forget it entirely.
 *   In a 15-move session the player will typically only touch this bishop
 *   once or twice, so every bishop move is a big teaching moment. This file
 *   delivers an opening-aware, destination-aware, and structure-aware line
 *   the coach can say the moment White plays Bc1 to somewhere.
 *
 * Structure:
 *   QB_ADVICE[openingId][destSquare] = string
 *   Plus QB_ADVICE_FALLBACK[destSquare] for openings not covered.
 *   Plus QB_STRUCTURE_HINTS for notes that layer on top (e.g. "the e-pawn
 *   already sat on e3, so this bishop is behind the chain now").
 *
 * Tone guardrails:
 *   - Authoritative first, friendly second. We aren't afraid to say a move
 *     is passive, mistimed, or decorative when it is.
 *   - Two to three sentences max. Must read cleanly on the verdict card.
 *   - Teach one concrete principle per line: structure fit, tempo, pin
 *     value, pawn-chain logic, or an opening-specific plan.
 *   - Use the piece's square name sparingly; prefer the bishop's idea.
 *
 * Covered destinations (what the bishop can reach from c1 with no pawn moves
 * unblocking it first): d2, e3, f4, g5, h6, b2 (needs b3 first), a3 (needs
 * b3 first). We also handle captures generically.
 */

// ---------------------------------------------------------------------------
// Per-opening × per-destination advice
// ---------------------------------------------------------------------------

export const QB_ADVICE = {
  // =========================================================================
  // ITALIAN GAME
  // In the Italian the c1 bishop is a SUPPORTING actor. The king's bishop on
  // f1 (playing to c4) is the early star. The c1 bishop usually waits until
  // White knows whether the center is going c3+d4 or staying quiet on d3.
  // =========================================================================
  italian: {
    f4: "Bf4 in the Italian is a little ambitious — the bishop would rather wait until c3 and d4 decide the center's shape. Here it can get hit by ...d6 and ...Nh5 ideas. In Italian structures the c1 bishop is a supporting actor, not an early hero.",
    g5: "Bg5 looks active, but the Italian rarely has a meaningful knight to pin yet — Black can play ...h6 or ...Be7 and you'll spend a tempo deciding whether to trade or retreat. Pins are only strong when the pinned piece can't escape cheaply.",
    e3: "Be3 is solid, but a touch early in the Italian. The bishop hits c5 if Black has played ...Bc5, which can invite a trade that straightens Black's pawns. In the Italian, the c1 bishop usually waits until c3+d4 clarifies the center before picking a square.",
    d2: "Bd2 in the Italian is passive development. It blocks the queen, does little for the center, and signals the bishop hasn't found its real square. In this opening the c1 bishop is better left home until the plan is clearer.",
    b2: "A queenside fianchetto in the Italian is unusual — the center is an e-pawn structure, so the long diagonal is blocked by your own e4 pawn. Save Bb2 for English and flank systems where the diagonal actually opens.",
    h6: "Bh6 is a showy square that accomplishes almost nothing in the Italian. Unless there's a concrete tactic on g7, the bishop just gets traded or sits where Black never had to worry about it. This is the bishop's bad square, full stop.",
    a3: "Ba3 in the Italian is decorative. The diagonal runs into nothing useful, the bishop blocks your own a-pawn, and you've spent a tempo that should have gone to development or c3+d4. Strong Italian play keeps the c1 bishop home until the center decides.",
  },

  // =========================================================================
  // QUEEN'S GAMBIT DECLINED
  // The QGD is THE textbook case for the c1 bishop. White must get it outside
  // the pawn chain (to g5 or f4) BEFORE playing e3 — otherwise it's stuck
  // staring at its own pawns for the rest of the game. This is one of the
  // most important bishop lessons in all of chess.
  // =========================================================================
  queensGambit: {
    f4: "Bf4 is exactly right in the Queen's Gambit. You've developed the bishop outside the pawn chain before e3 locks it in, it eyes c7 and supports central pressure, and it avoids the heavy pin theory of Bg5. This is model c1-bishop play in d4 openings.",
    g5: "Bg5 is the most classical c1-bishop move in queen's pawn chess — it pins the f6 knight, pressures e7, and develops outside the chain before e3 arrives. This is exactly the bishop move the QGD was built to teach.",
    e3: "Be3 is too early in the Queen's Gambit. The bishop belongs OUTSIDE the pawn chain — on f4 or g5 — before the e-pawn moves to e3. Here, once you play e3 yourself, Be3 also leaves the bishop boxed in by its own pawns. In the QGD, remember: bishop out first, pawn to e3 second.",
    d2: "Bd2 in the QGD is a retreat before the bishop has even gotten anywhere. The whole point of the c1 bishop in queen's pawn chess is to come out to f4 or g5 BEFORE e3 locks the diagonal. Bd2 gives up that one big chance for free.",
    b2: "A queenside fianchetto in the QGD is unusual because the d4–c4 pawn structure blocks the long diagonal. The standard plan is Bg5 or Bf4 — not Bb2. Only consider b3+Bb2 in Catalan-flavored setups where the e-pawn and c-pawn structure cooperates.",
    h6: "Bh6 in the QGD is overextension. It abandons the one job the c1 bishop has in this opening — developing outside the e3–d4 chain — and goes chasing a tactic that usually isn't there. The bishop belongs on f4 or g5, supporting the center.",
    a3: "Ba3 in the QGD is an odd commitment. You've used b3 to clear the square, but the diagonal from a3 runs into Black's own pieces, and you've given up the standard Bg5/Bf4 idea for almost nothing. In the QGD the c1 bishop has much better work to do.",
  },

  // =========================================================================
  // RUY LOPEZ
  // Like the Italian, the Ruy Lopez is a kingside-bishop story early on.
  // The Bb5 bishop is doing the pressure work. The c1 bishop should USUALLY
  // WAIT. An early c1 bishop move in the Ruy is almost always premature.
  // =========================================================================
  ruyLopez: {
    f4: "Bf4 is premature in the Ruy Lopez. The opening is built around your kingside bishop on b5 and the long-term tension against e5 — your c1 bishop should wait until the center clarifies. Coming out now risks getting hit by ...d6 or ...Nh5 with tempo.",
    g5: "Bg5 in the Ruy Lopez is possible, but only if pinning f6 actually matters. Usually Black simply plays ...h6 and you waste a tempo deciding to retreat or trade. In the Ruy, c1-bishop activity should follow central clarity — not precede it.",
    e3: "Be3 is unusually quiet for the Ruy. The opening wants pressure through b5 and the e-file; a modest Be3 now adds little. It's not a bad square in the middlegame, but in the first five moves it signals that the c1 bishop didn't need to move at all.",
    d2: "Bd2 in the Ruy Lopez is a retreat move dressed as development. It blocks the queen, clutters the back rank, and doesn't support the Ruy's real idea — kingside pressure through your b5 bishop. Leave the c1 bishop home; castle and let the plan mature.",
    b2: "A queenside fianchetto in the Ruy Lopez is off-theme. This is an e-pawn opening built on classical center play, not flank strategy. If you wanted Bb2 ideas, the English was the better choice.",
    h6: "Bh6 this early in the Ruy is a mistake. It walks into a square with no support, gains no tempo, and ignores the Ruy's real work — pressure through the Bb5 bishop and the e-file. The c1 bishop is not the star of this opening.",
    a3: "Ba3 in the Ruy Lopez is a decorative move. The diagonal runs into thin air, the bishop blocks your own a-pawn, and the Ruy simply doesn't need this piece out yet. Castle, develop your knights, and let the c1 bishop wait its turn.",
  },

  // =========================================================================
  // ENGLISH OPENING
  // The English is the FLEXIBLE case. The c1 bishop has genuinely open options
  // — b3+Bb2 for a long-diagonal piece, or Bf4/Bg5 if the game transposes to
  // d4 structures. The key lesson is: don't commit the bishop before you
  // commit the center.
  // =========================================================================
  english: {
    f4: "Bf4 in the English is fine if you're steering the game toward d4 structures. But the English's native home for this bishop is b3 + Bb2 on the long diagonal. Make sure you actually want a queen's-pawn-style position before committing to Bf4.",
    g5: "Bg5 in the English is a queen's-pawn move in a flank opening. It's playable if the game transposes toward QGD-type structures, but the English's purest c1-bishop plan is b3 + Bb2 on the long diagonal, not Bg5.",
    e3: "Be3 is a quiet, solid English development, but the English's signature c1-bishop idea is the queenside fianchetto with b3 and Bb2 — that's where the bishop belongs in flank play. Be3 is playable, not ambitious.",
    d2: "Bd2 in the English is passive. The English gives the c1 bishop its best long-diagonal opportunity in all of chess (b3 + Bb2) — retreating to d2 instead gives that up for nothing.",
    b2: "Bb2 is the classic English idea — a long-diagonal piece aimed through the center, pressuring e5 and g7 from the flank. This is exactly what makes the English's c1 bishop special. Just check that the center doesn't close and bury it.",
    h6: "Bh6 in the English is out of character. The English wants the c1 bishop on the long diagonal via b3 and Bb2 — that's the signature idea. Lunging to h6 abandons the opening's real strength.",
    a3: "Ba3 in the English isn't standard. If you've already played b3, the bishop belongs on b2 — the long diagonal is the whole point. Ba3 dodges that plan without offering one of its own.",
  },

  // =========================================================================
  // LONDON SYSTEM
  // The London is THE model opening for the c1 bishop. Bf4 is played very
  // early — before e3 locks the diagonal. This is one of the clearest
  // "good bishop development" lessons in chess.
  // =========================================================================
  london: {
    f4: "Bf4 is the defining move of the London. You've brought the bishop outside the pawn chain before e3 arrives — exactly the rule the whole system is built on. This is the single clearest lesson about the c1 bishop in all of chess: get out first, pawn to e3 second.",
    g5: "Bg5 isn't the London — it's more of a Torre Attack idea. The London's native square is f4, where the bishop eyes c7 and supports the e5 square without inviting Black to ask questions with ...h6. In the London, stick with Bf4.",
    e3: "The London's rule is: Bf4 first, e3 second. By going Be3 instead, you've parked the bishop on the very square your e-pawn wants. If you now play e3 you'll lose time; if you don't, the bishop is just blocking its own natural home. This is exactly the error the London is designed to avoid.",
    d2: "Bd2 in the London is a wasted move. The system exists to get this bishop to f4 before the pawn chain closes — retreating it to d2 throws away the entire opening idea. The London's mantra: bishop out to f4, then e3 and c3 behind it.",
    b2: "Bb2 in the London is a different opening — it's closer to a Nimzo-Larsen or English structure. The London's signature is Bf4, not Bb2. If you want the long-diagonal plan, start with 1.b3, not 1.d4.",
    h6: "Bh6 abandons everything the London is built on. Bf4 is THE move — developing the bishop outside the pawn chain before e3 locks it in. Bh6 gives up that structural edge for nothing.",
    a3: "Ba3 isn't a London idea at all. The system's signature is Bf4 — develop outside the chain, then build the pawn triangle d4–e3–c3 behind it. Ba3 throws away the one bishop plan the opening was designed around.",
  },
};

// ---------------------------------------------------------------------------
// Fallback: destination-specific advice when the opening isn't in the table
// or when we're past the first handful of moves. These use the general
// principles of the c1 bishop (structure fit, pawn chain, tempo, pin value)
// without opening-specific flavor.
// ---------------------------------------------------------------------------

export const QB_ADVICE_FALLBACK = {
  f4: "Bf4 develops the queenside bishop outside the pawn chain — a strong plan whenever you're heading toward an e3+d4 structure. Just watch for ...Nh5 or ...Bd6 ideas that can ask the bishop to decide whether to trade or retreat.",
  g5: "Bg5 is the classical queen's-pawn bishop development: outside the chain, pinning f6, pressing e7. It's only as good as the pin, though — if Black can play ...h6 and ...g5 comfortably, the bishop may be spending tempo for decoration.",
  e3: "Be3 is a quiet, supportive square. It's solid, but often it's the square the bishop ends up on because f4 or g5 was missed. Before committing, ask whether the bishop could have been more active one move earlier.",
  d2: "Bd2 is a passive square. It blocks the queen, doesn't pressure anything, and usually means the bishop ran out of good options. In most openings the c1 bishop is better off home than on d2.",
  b2: "Bb2 turns the c1 bishop into a long-diagonal piece. This works when the center stays open or semi-open — in a closed d4–e4 structure the diagonal dies. Check that your pawn plan keeps the bishop alive.",
  h6: "Bh6 is the classic overextended bishop square. Unless there's a concrete tactic on g7, it simply gets traded or stranded. In routine opening play this is almost always a wasted move.",
  a3: "Ba3 this early in the game is unusual. The diagonal is often blocked, the bishop blocks its own a-pawn, and the tempo rarely produces anything concrete. Strong reasons only.",
};

// ---------------------------------------------------------------------------
// Structure add-ons: appended when the position meets a specific condition.
// These teach the "outside the chain" principle contextually.
// ---------------------------------------------------------------------------

export const QB_STRUCTURE_HINTS = {
  // Appended when White played e3 BEFORE moving the c1 bishop (classic
  // "bishop behind the chain" mistake). Fires on Bd2 / Be3 (which is now
  // blocked by the e-pawn anyway won't apply) — mainly Bd2, or on the rare
  // Bb2 with a cramped center.
  afterE3:
    " Note the e-pawn already sat on e3 — that means the c1 bishop was already boxed in by its own pawns before it moved. In d4 systems, the rule is simple: get the bishop out BEFORE e3.",

  // Appended when the player moves the same bishop twice in the opening —
  // "piece-twice" is already detected elsewhere but we add a targeted note.
  secondMove:
    " This is the second time this bishop has moved — that's a tempo you won't get back. A bishop moving twice in the opening usually means its first square was wrong.",

  // Appended when the bishop went to a square where Black has an immediate
  // attacker ready (...Nh5 against Bf4, ...h6 against Bg5 with a clear
  // retreat cost). Kept generic so it reads cleanly.
  easyTempo:
    " Black has an immediate way to ask this bishop a question — make sure you already know what you'll do when they do.",
};

// ---------------------------------------------------------------------------
// Public lookup function
// ---------------------------------------------------------------------------

/**
 * Return the best queenside-bishop coaching line for this move, or null if
 * the move isn't a c1-bishop move we want to handle.
 *
 * @param {object} args
 * @param {object} args.moveObj - chess.js move object (has piece, from, to, flags, san)
 * @param {string|null} args.openingId - current opening id (italian / queensGambit / etc.)
 * @param {string[]} args.historySan - full SAN history up to but not including this move
 * @param {number} args.ply - ply of this move (1-indexed)
 * @returns {string|null}
 */
export function getQueensideBishopAdvice({ moveObj, openingId, historySan = [], ply }) {
  if (!moveObj) return null;
  if (moveObj.piece !== "b") return null;
  if (moveObj.from !== "c1") return null;
  // Only fire in the opening phase — past move ~7 other logic should take over.
  if (ply > 15) return null;

  const dest = moveObj.to;
  const byOpening = openingId && QB_ADVICE[openingId];
  const openingLine = byOpening && byOpening[dest];
  const fallbackLine = QB_ADVICE_FALLBACK[dest];

  let line = openingLine || fallbackLine;
  if (!line) return null;

  // Structure add-on: e3 already played before the bishop came out.
  // Applies most painfully when the bishop can't escape through the chain
  // (Bd2 / Bb2 via earlier b3 — note Be3 itself requires the e-pawn to NOT
  // be on e3, so we don't include it here).
  const whiteSan = historySan.filter((_, i) => i % 2 === 0);
  const playedE3Before = whiteSan.some((san) => san === "e3");
  if (playedE3Before && (dest === "d2" || dest === "b2" || dest === "a3")) {
    line += QB_STRUCTURE_HINTS.afterE3;
  }

  // Second bishop move — check whether this bishop (the c1 one) has moved
  // already. It would only move a second time if it first went somewhere
  // and then retreated. Detect by counting prior B-san moves whose start
  // square would have been c1 (we can't know FROM easily from SAN alone,
  // but we can heuristically check for any bishop move that ended on a
  // dark square the c1 bishop can reach). Safer: just count bishop moves
  // in white history — if there are 2+ bishop-looking moves before this
  // one, warn. This is best-effort; the main "piece-twice" detector in
  // critique.js still runs independently.
  // Note: "B" in SAN can be either bishop, so we can't perfectly separate
  // c1 from f1 without replaying. Skip this hint to avoid false positives.

  return line;
}
