/*
 * Kingside bishop (the f1 bishop) coaching advice.
 *
 * Why this file exists:
 *   The f1 bishop is the aggressive half of White's bishop pair in classical
 *   openings. Where the c1 bishop is a quiet supporting actor, the f1 bishop
 *   is usually the star of the show — Bc4 defines the Italian, Bb5 defines
 *   the Ruy, Bg2 defines the English's hypermodern plan, Bd3 is the London's
 *   support bishop. Every f1-bishop square tells a story about the opening's
 *   identity, so when the student moves this bishop we deliver an opening-
 *   aware, destination-aware coaching line.
 *
 * Structure:
 *   KB_ADVICE[openingId][destSquare] = string
 *   Plus KB_ADVICE_FALLBACK[destSquare] for openings not covered.
 *   Plus KB_STRUCTURE_HINTS for context-sensitive add-ons (e.g. "Black has
 *   already played ...a6 — this bishop is in the target's crosshairs now").
 *
 * Tone guardrails:
 *   - Authoritative first, friendly second. We will celebrate the defining
 *     move of an opening, and we will firmly criticize a bishop move that
 *     abandons the opening's identity.
 *   - Two to three sentences max. Must read cleanly on the verdict card.
 *   - Teach one concrete principle per line: opening identity, piece activity,
 *     king safety, pin value, or a named plan.
 *
 * Covered destinations from f1 (after e-pawn or d-pawn has moved to open the
 * diagonal): c4, b5, d3, e2, g2 (needs g3), h3 (needs g-pawn gone, or via g2),
 * a6 (needs b5 + tempo, pretty rare). We handle captures generically.
 */

// ---------------------------------------------------------------------------
// Per-opening × per-destination advice
// ---------------------------------------------------------------------------

export const KB_ADVICE = {
  // =========================================================================
  // ITALIAN GAME
  // Bc4 is the DEFINING move of the Italian — the whole opening is named for
  // this bishop. Any other f1-bishop square in an Italian is off-plan: the
  // Italian wants a bishop on c4 eyeing f7, period. This is one of the most
  // important "opening identity" lessons we can teach.
  // =========================================================================
  italian: {
    c4: "Bc4 is the Italian Game — this is the defining move. The bishop eyes f7, the weakest square in Black's camp, and stakes out the classical center alongside e4. Every other Italian move is built around supporting this bishop; you just played the idea the whole opening is named for.",
    b5: "Bb5 is the Ruy Lopez, not the Italian. The Italian's identity is Bc4 hitting f7; by going to b5 you've switched openings mid-stream, and without the matching move order (Nf3+Nc3+a-pawn play) this bishop is on a square it can't defend. Pick an opening and commit to its plan.",
    d3: "Bd3 in the Italian is too modest. The whole point of the Italian is Bc4 — the bishop on c4 pressures f7 and makes the opening what it is. On d3 the bishop blocks your own d-pawn, stares into its own knight on f3, and surrenders the Italian's attacking idea for nothing.",
    e2: "Be2 in the Italian is a timid retreat of the opening's best piece. The Italian is built on Bc4 eyeing f7 — Be2 is the square bishops go when the player can't decide where to develop. In this opening, Bc4 is not optional; it's the whole point.",
    g2: "Bg2 in the Italian is off-plan entirely. A kingside fianchetto needs g3 first, and the Italian's e4 pawn blocks the long diagonal the instant the bishop gets there. This is an English/Catalan plan forced into an Italian position — it just doesn't fit.",
    h3: "Bh3 in the Italian is a bizarre square. The bishop bites on its own f-pawn, defends nothing, and abandons the Bc4 attack on f7 for no tactical gain. If you wanted the Italian, go Bc4. If you didn't, pick a different opening and commit.",
    a6: "Ba6 in the Italian is off the map. The diagonal runs into nothing useful, the bishop blocks your own a-pawn, and you've thrown away the Bc4 idea the opening is literally named for. This is not a real plan — reset and aim for f7 with Bc4.",
  },

  // =========================================================================
  // QUEEN'S GAMBIT DECLINED
  // In the QGD the f1 bishop is the QUIET bishop, the c1 one is the hero.
  // Standard development is Be2 — modest, flexible, behind e3. Bd3 is playable
  // but often awkward after e3. Bc4 is too exposed once Black plays ...dxc4
  // or ...c5. The model square is Be2.
  // =========================================================================
  queensGambit: {
    e2: "Be2 is the textbook Queen's Gambit kingside development. It supports the center, keeps king safety simple, and lets the c1 bishop (already out to f4 or g5, you hope) do the active work. In the QGD the f1 bishop is the quiet one — Be2 is exactly the right note to hit.",
    d3: "Bd3 in the QGD is playable but a bit awkward — after e3, the bishop on d3 blocks its own pawn on d4 from advancing, and the c4 square is usually unavailable anyway once Black captures. The cleaner move is Be2: quieter, more flexible, better positioned for a middlegame pivot.",
    c4: "Bc4 in the QGD is too exposed. Once Black plays ...dxc4 or ...c5, the bishop has no stable home and you'll spend tempo shuffling it back. The QGD is the opposite of the Italian: here, the f1 bishop is the quiet one — Be2 is the model square.",
    b5: "Bb5 in the QGD is off-identity. You've borrowed the Ruy Lopez's signature move in a queen's-pawn opening where the bishop has no supporting structure behind it. The QGD wants Be2 — quiet development, let the c1 bishop do the showing off.",
    g2: "Bg2 in the QGD is a Catalan move, not a QGD one. The Catalan (1.d4 Nf6 2.c4 e6 3.g3) is a whole different opening with its own theory; grafting a fianchetto onto a QGD after you've already committed to e3/Nf3 just leaves the bishop staring at your own d-pawn.",
    h3: "Bh3 in the QGD makes no sense. The bishop hits nothing, blocks nothing useful, and you've given up Be2 (the QGD's standard square) for a showy move with no follow-up. In the QGD, the kingside bishop is the quiet developer — just play Be2.",
    a6: "Ba6 from a QGD is not a real plan. You'd need b-pawn moves and several tempi just to reach the square, and the diagonal arrives at nothing. The QGD wants Be2; this is the opposite of that.",
  },

  // =========================================================================
  // RUY LOPEZ
  // Bb5 is THE signature move — the Spanish Bishop. The whole opening is named
  // for this bishop's pin/pressure on the Nc6. Critically, this is STRATEGIC
  // pressure, not a direct attack: the bishop doesn't win anything immediately,
  // it just makes Black's life harder forever. Understanding Bb5 is
  // understanding what the Ruy Lopez actually is.
  // =========================================================================
  ruyLopez: {
    b5: "Bb5 is the Spanish Bishop — the move that gives the Ruy Lopez its name. This is strategic pressure, not an attack: you're not threatening to win the knight (…a6 and …b5 chase the bishop away) but you're forcing Black to commit pawns on the queenside and to defend e5 carefully for the rest of the game. This is long-term squeeze chess at its purest.",
    c4: "Bc4 is the Italian, not the Ruy Lopez. The Ruy is defined by Bb5 — the Spanish Bishop applying strategic pressure against c6 and e5. By going c4 you've switched openings mid-stream and given up the whole point of the Ruy's opening battle.",
    d3: "Bd3 in the Ruy is timid. The Ruy's whole identity is Bb5 — the Spanish Bishop creating long-term pressure on the knight and e5. Bd3 is a quiet developing move that skips that pressure entirely. If you wanted a Ruy, commit to Bb5 — that's the opening.",
    e2: "Be2 in the Ruy is far too quiet — this is the opening of the Spanish Bishop. Bb5 is not an optional flourish; it's the idea the whole system is built around. Dropping the bishop to e2 on move 3 is a surrender of the Ruy's one big strategic theme.",
    g2: "Bg2 in the Ruy Lopez is off-plan. The Ruy is an open-center, classical opening — a kingside fianchetto belongs in flank systems, not here. Commit to Bb5 (the Spanish Bishop) and let the Ruy be the Ruy.",
    h3: "Bh3 in the Ruy is a decorative mistake. The bishop belongs on b5 creating long-term queenside pressure; Bh3 gives up the Spanish Bishop's entire job for a square that does nothing. Reset and head for b5.",
    a6: "Ba6 in the Ruy Lopez isn't real chess. The bishop's job is Bb5 — applying strategic pressure on c6 and e5 — not wandering to a6 where it attacks nothing and blocks your own a-pawn. This is the opposite of the Ruy's idea.",
  },

  // =========================================================================
  // ENGLISH OPENING
  // The English is the hypermodern kingside-fianchetto case. After 1.c4 +
  // g3, Bg2 puts the bishop on the long diagonal pressuring the center from
  // the side. Bc4/Bb5/Bd3 are all classical e-pawn moves in a flank opening
  // where they don't fit — the English's whole point is that the f1 bishop
  // belongs on g2, not in the classical center.
  // =========================================================================
  english: {
    g2: "Bg2 is the English's signature kingside development. After c4 and g3, the bishop fianchettos onto the long diagonal and exerts hypermodern pressure on the center from the flank. This is exactly what the English is about — controlling the center with pieces, not pawns.",
    c4: "Bc4 in the English is an e-pawn move in a flank opening — the square is occupied by your own c-pawn, and the bishop is aiming at a classical center that the English is deliberately avoiding. The English wants Bg2 (after g3) on the long diagonal.",
    b5: "Bb5 in the English is off-identity. The Ruy Lopez's Spanish Bishop belongs in an e-pawn opening with Nf3 and Nc3 supporting it — in the English, the bishop's natural home is g2, pressuring the center from the flank. Different opening, different bishop plan.",
    d3: "Bd3 in the English is a classical move in a hypermodern opening. The English is built on piece pressure from the flanks (Bg2, Bb2) — not classical pawn-and-bishop center play. Bd3 here just blocks the d-pawn and misses the fianchetto the opening wants.",
    e2: "Be2 in the English is quiet but misplaced. The English's signature is Bg2 after g3 — long-diagonal pressure against the center. Be2 is a classical e-pawn bishop move grafted onto a flank opening where it just sits inert.",
    h3: "Bh3 in the English is bizarre. If you wanted the kingside fianchetto (which is the whole English idea), the bishop goes to g2, not h3. Bh3 bites on g2 itself and blocks nothing — this is not a real English plan.",
    a6: "Ba6 in the English is off the map. The bishop belongs on g2 on the long diagonal — that's the English's defining idea. Ba6 wanders to the wrong flank entirely and hits nothing worth hitting.",
  },

  // =========================================================================
  // LONDON SYSTEM
  // In the London the f1 bishop is the SUPPORT bishop — Bd3 is the standard
  // square, behind the e3 pawn, reinforcing the e4/e5 squares and eyeing h7
  // for kingside attacks once the pieces coordinate. Be2 is playable but
  // less active; Bc4 is too exposed (Black plays ...c5 and ...d5 and the
  // bishop has no home).
  // =========================================================================
  london: {
    d3: "Bd3 is the London's support bishop. Behind the e3 pawn and supporting e4 pushes, eyeing h7 when the attack comes — this is exactly where the London wants this bishop. Classic London development.",
    e2: "Be2 in the London is playable but passive. The London's support bishop wants to be on d3 — actively eyeing h7, reinforcing the center, ready to join a kingside attack. On e2 the bishop just sits; d3 is strictly more active.",
    c4: "Bc4 in the London is too exposed. Black will play ...c5 and ...d5 and the bishop gets harassed with no real home to run to. The London is a support system, not an attacking one: the f1 bishop belongs on d3, behind e3, where the structure actually protects it.",
    b5: "Bb5 in the London is off-identity. That's the Ruy Lopez's signature, and it belongs in an e-pawn opening with knight-and-pawn support. The London is a d-pawn support system — Bd3 is the bishop's square here, not b5.",
    g2: "Bg2 in the London is a different opening. A kingside fianchetto belongs in the English or a Catalan, not in the London's classical d4+e3+c3 structure. The London's support bishop is Bd3; commit to that plan.",
    h3: "Bh3 in the London is a decorative mistake. The London's plan is simple and strict: Bd3 as the support bishop, behind e3, eyeing h7. Bh3 accomplishes none of that and leaves the bishop on the edge of the board.",
    a6: "Ba6 in the London isn't a real plan. The bishop belongs on d3 — that's the system's whole idea. Wandering to a6 abandons the London setup for nothing.",
  },
};

// ---------------------------------------------------------------------------
// Fallback: destination-specific advice when the opening isn't in the table.
// Uses general principles of f1-bishop play (classical pressure vs quiet
// support vs fianchetto) without opening-specific flavor.
// ---------------------------------------------------------------------------

export const KB_ADVICE_FALLBACK = {
  c4: "Bc4 is the classical Italian-style kingside bishop — aimed at f7, the weakest square in Black's camp. It's an attacking move that only works when you're committed to an e-pawn opening with Nf3 support. In non-classical structures, it's often the wrong square.",
  b5: "Bb5 is the Spanish Bishop — strategic pressure on c6 and e5. It's the Ruy Lopez's defining move and only makes sense in that system. Outside the Ruy it's usually misplaced.",
  d3: "Bd3 is the support-bishop square — quiet development behind a pawn chain, eyeing h7 for later kingside attacks. It's the London's standard move and is fine anywhere the structure supports it.",
  e2: "Be2 is the humblest kingside bishop development: safe, flexible, and without ambition. It's often the right move when the opening calls for patience, but in aggressive systems it can be a missed chance.",
  g2: "Bg2 is the hypermodern kingside fianchetto — pressuring the center from the flank on the long diagonal. It's the English's signature but needs g3 first and wants an open long diagonal to stay alive.",
  h3: "Bh3 is almost always a mistake in the first fifteen moves. The bishop hits nothing, blocks nothing useful, and gives up more natural development for a showy square.",
  a6: "Ba6 this early is an extreme choice. The diagonal usually runs into nothing and the bishop blocks your own a-pawn. Strong reasons only.",
};

// ---------------------------------------------------------------------------
// Structure add-ons: appended when the position meets a specific condition.
// These teach opening-specific principles contextually.
// ---------------------------------------------------------------------------

export const KB_STRUCTURE_HINTS = {
  // Appended in the Ruy Lopez when Black has already played ...a6, so the
  // b5 bishop will get chased to a4 shortly. This teaches the tempo cost.
  ruyAfterA6:
    " Note Black has already played …a6 — this bishop will have to decide whether to trade on c6 or retreat to a4 next move. The Spanish Bishop's job is to apply pressure, not to avoid being chased; know your plan before committing.",

  // Appended when the kingside bishop has moved before (second bishop move
  // in the opening is almost always a tempo loss).
  secondMove:
    " This is the second time this bishop has moved — tempo you won't get back. A bishop that moves twice in the opening usually means its first square was wrong.",

  // Appended when the bishop goes somewhere that bites on White's own
  // pawn structure (e.g. Bg2 but e4 is blocking the long diagonal).
  bitesOnOwnPawn:
    " One catch: your own pawn is already blocking this bishop's diagonal, so the piece's activity is lower than it looks. Bishops need open lines to justify their long-term cost.",
};

// ---------------------------------------------------------------------------
// Public lookup function
// ---------------------------------------------------------------------------

/**
 * Return the best kingside-bishop coaching line for this move, or null if
 * the move isn't an f1-bishop move we want to handle.
 *
 * @param {object} args
 * @param {object} args.moveObj - chess.js move object (has piece, from, to, flags, san)
 * @param {string|null} args.openingId - current opening id (italian / queensGambit / etc.)
 * @param {string[]} args.historySan - full SAN history up to and including this move
 * @param {number} args.ply - ply of this move (1-indexed)
 * @returns {string|null}
 */
export function getKingsideBishopAdvice({ moveObj, openingId, historySan = [], ply }) {
  if (!moveObj) return null;
  if (moveObj.piece !== "b") return null;
  if (moveObj.from !== "f1") return null;
  // Only fire in the opening phase.
  if (ply > 15) return null;

  const dest = moveObj.to;
  const byOpening = openingId && KB_ADVICE[openingId];
  const openingLine = byOpening && byOpening[dest];
  const fallbackLine = KB_ADVICE_FALLBACK[dest];

  let line = openingLine || fallbackLine;
  if (!line) return null;

  // Ruy Lopez-specific: if Black has already played ...a6 and the bishop is
  // heading to b5 (or any square, really, but b5 is where it matters most),
  // add the tempo-cost hint.
  const blackSan = historySan.filter((_, i) => i % 2 === 1);
  const blackPlayedA6 = blackSan.some((san) => san === "a6");
  if (blackPlayedA6 && dest === "b5" && openingId === "ruyLopez") {
    line += KB_STRUCTURE_HINTS.ruyAfterA6;
  }

  // Bg2 "bites on own pawn" hint — if the bishop goes to g2 but White's
  // e-pawn is still on e4 (blocking the a8–h1 diagonal), the fianchetto's
  // punch is reduced. We check by looking for e4 in prior White moves and
  // no subsequent e4-pawn capture (best-effort: SAN "exd5"/"exf5" etc.).
  if (dest === "g2") {
    const whiteSan = historySan.filter((_, i) => i % 2 === 0);
    const playedE4 = whiteSan.some((san) => san === "e4");
    const eCaptured = whiteSan.some((san) => /^e[x]?[a-h]\d/.test(san) && san !== "e4" && san !== "e3");
    if (playedE4 && !eCaptured) {
      line += KB_STRUCTURE_HINTS.bitesOnOwnPawn;
    }
  }

  return line;
}
