/*
 * White queen coaching advice — 5 openings × every early queen destination.
 *
 * Why this file exists:
 *   The queen is the strongest piece on the board and the most commonly
 *   misused in the opening. The report's central thesis is that a queen
 *   in the first 3-5 moves is usually strongest when it is USEFUL WITHOUT
 *   BECOMING TARGETABLE — and that "no queen move yet" is often excellent
 *   opening play. The coach needs to celebrate quiet, structural queen
 *   placements (Qe2, Qc2, Qb3 when it fits) and criticize flashy early
 *   queen adventures (Qh5 in the Italian, Qf3 before it's earned, early
 *   Qa4/Qd2/Qd3 without a plan).
 *
 * Structure:
 *   QUEEN_ADVICE[openingId][toSquare] = string
 *     - Keyed only by destination because the queen always starts from d1
 *       in the opening phase. Once she's moved, a second queen move in the
 *       first 5 moves is itself suspicious — we cover that via PLY guards.
 *     - Covered destinations (from d1 in the opening): d2, d3, e2, c2, b3,
 *       a4, f3, g4, h5, and a few opening-specific squares (Qe1, Qd4 etc.
 *       intentionally not covered — if the coach can't name a reason, it
 *       falls through to the "no specific idea here" fallback).
 *
 *   QUEEN_PERSONALITY[openingId] = the report's one-line psychology line
 *   used in role-based fallbacks when an uncovered destination is played.
 *
 * Tone guardrails (from the Queen Strategy Report):
 *   - "Authoritative first, friendly second." Do NOT apologize when the
 *     queen move is ill-considered.
 *   - Celebrate quiet queen discipline — Qe2, Qc2, Qb3 when they fit the
 *     structure. The report is emphatic that these are the model squares.
 *   - Criticize Qh5 firmly in the Italian — it's the canonical beginner
 *     tempo trap. The report: "visually attacks f7; Black answers with
 *     development while gaining tempo."
 *   - Criticize any queen move that Black can hit with a natural
 *     developing move (Qa4 when c6 is coming, Qd3 with e5 in the air, etc).
 *   - Two to three sentences max. No emojis.
 *
 * Interop with the other advice overrides:
 *   - The queen is the ONE piece type where "no move" is itself a lesson.
 *     That is reflected inside each curated line — we don't silence the
 *     override for quiet queen moves; we celebrate quiet placements and
 *     criticize loud ones.
 *   - If a queen move happens on ply 1 (which would require a nonsense
 *     move-order), FIRST_MOVE_ADVICE's entry for that SAN still wins
 *     because app.js checks ply === 1 before this override runs. In
 *     practice the queen can't legally move on White's move 1 from d1.
 */

// ---------------------------------------------------------------------------
// Per-opening × per-destination advice
// ---------------------------------------------------------------------------

export const QUEEN_ADVICE = {
  // =========================================================================
  // ITALIAN GAME
  // Personality (from report): "Tempted to be flashy; should be disciplined."
  // The Italian's Bc4 creates visual f7 pressure that lures the queen out
  // to h5 too early. The report is blunt: Qh5 usually invites Black to
  // develop with tempo. Good Italian queens wait, then go to e2 or c2.
  // =========================================================================
  italian: {
    // --- MODEL SQUARES: quiet support that fits the Italian's coordination ---
    e2: "Qe2 is a model Italian queen move — it supports e4, connects the rooks for castling, and keeps the queen hard to attack. The Italian asks the queen to be a **patient support piece**, and e2 is exactly that square: useful without becoming a target.",
    c2: "Qc2 is a quiet, coordinated Italian queen move — it supports e4, fits the Bc4-and-c3-d4 plan, and stays off any natural Black tempo-gaining square. This is the sort of queen move that **earns its square** instead of demanding attention.",

    // --- THE CLASSIC ITALIAN TRAP MOVE ---
    h5: "Qh5 is the Italian's most famous beginner mistake. It visually threatens f7, but Black defends with Nc6 or g6 while **developing with tempo** — the queen becomes a target, the opening stalls, and the f7 idea evaporates. Flash doesn't beat development. The Italian rewards discipline, not heroics.",

    // --- OTHER TEMPTING BUT USUALLY WRONG SQUARES ---
    f3: "Qf3 in the Italian is premature. The Italian's f3 square belongs to **the knight**, which is one of the opening's most important pieces — plopping the queen there blocks Nf3 and overexposes the queen to ...Nc6, ...Nd4, or tactical pressure. If you want queen activity, play Qe2 later instead.",
    g4: "Qg4 in the Italian is an adventure move with no purpose. The Italian wants the queen **useful but hard to hit** — g4 is neither. Black defends with ...Nf6 or ...d5 and gains time on a misplaced queen. Go back to quiet development.",
    a4: "Qa4 in the Italian is usually too cute — ...Nc6 or ...Bd7 neutralizes it while Black develops naturally, and the queen ends up stranded on the rim. The Italian wants the queen patient, supporting e4 and coordination, not raiding the queenside this early.",
    d2: "Qd2 in the Italian is passive and blocks the natural c1-bishop development square. The Italian's queen usually does better on e2 or c2 — or, most often, **stays on d1** until the pieces are out and the structure is clear.",
    d3: "Qd3 in the Italian is an awkward placement — it blocks the d-pawn (which the Italian wants to push to d4 after c3), and it puts the queen on a square where natural Black pieces can harass it. Move a minor piece instead and keep the queen home.",
    b3: "Qb3 in the Italian is occasionally played (sometimes to double-attack f7 with Bc4 + Qb3), but it's usually too early — Black responds with ...Nc6/...Nd4 and the queen becomes the target. The Italian's mainline wants **Nf3, O-O, c3, d4** first; the queen can join later if the structure calls for it.",
  },

  // =========================================================================
  // QUEEN'S GAMBIT DECLINED (we're White in the QGD)
  // Personality (from report): "Quiet, structural, and patient."
  // The QGD is a pure structure opening. The queen's job is to support the
  // d4-c4 identity pawns and the piece coordination, not to create threats.
  // =========================================================================
  queensGambit: {
    // --- MODEL SQUARES ---
    c2: "Qc2 is one of the QGD's most thematic queen moves — it supports e4 ideas, reinforces the c-file and central tension, and coordinates naturally with the bishops. The QGD wants the queen to be **structurally useful and hard to attack**, and c2 delivers both.",
    b3: "Qb3 is a classical QGD queen move, pressuring b7 and coordinating with a bishop on f4 or g5. Good square — but the report warns this one must be **well-timed**: if it comes before the pieces are out, Black answers efficiently and the queen becomes the loose piece. Make sure the structure has earned it.",
    e2: "Qe2 is a quiet, modest QGD queen move — it supports the e-pawn, fits the classical QGD support structure, and stays out of harm's way. Not the flashiest square, but the QGD rewards quiet queen play: **late, calm, structurally purposeful**.",

    // --- QUESTIONABLE SQUARES ---
    h5: "Qh5 in the QGD is out of character — the QGD is a pure structure opening, not a king-hunt. The queen walks far from the d4+c4 identity she should be supporting and gives Black easy development. This is a move from a different opening.",
    f3: "Qf3 in the QGD blocks the natural Nf3 square, which the QGD absolutely needs — Nf3 is a core piece in the classical QGD setup. Use e2, c2, or b3 instead, or keep the queen on d1 and develop knights first.",
    g4: "Qg4 in the QGD is a genuine mistake. The QGD is a positional, pressure-based opening — queen raids on g4 contradict its philosophy and expose the queen to ...Nf6 or ...h5 gaining tempo. Play for structure, not fireworks.",
    a4: "Qa4 in the QGD is occasionally seen against the Chigorin, but as a general early move it's premature. The QGD's queen should usually wait for the pieces to declare themselves — then go to c2 or b3, not a4.",
    d2: "Qd2 in the QGD is possible in some Bg5-plus-long-castling setups, but as an early move it blocks the c1-bishop, which the QGD wants on f4 or g5. If you want to develop, move a knight or a bishop first; the queen can wait.",
    d3: "Qd3 in the QGD is awkward — it sits in front of the d-pawn and obstructs the Bf1 bishop's path to d3, one of the most natural QGD bishop squares. The report is emphatic: queen moves without a plan are just decoration.",
  },

  // =========================================================================
  // RUY LOPEZ
  // Personality (from report): "Strategic helper, never the main actor early."
  // The Ruy has a deep pressure system already — Nf3 hitting e5, Bb5 pinning
  // c6. The queen's job is to support and coordinate, not to steal the show.
  // Qe2, Qc2, and (later, carefully) Qf3 are the natural homes.
  // =========================================================================
  ruyLopez: {
    // --- MODEL SQUARES ---
    e2: "Qe2 is a textbook Ruy Lopez queen move — it supports e4, connects the rooks, and fits castling logic. The Ruy's pressure system (Nf3 hitting e5, Bb5 pinning c6) is already doing the heavy lifting; the queen's job is to **support without becoming loose**, and e2 does exactly that.",
    c2: "Qc2 is a quiet, coordinated Ruy queen move — it reinforces e4, harmonizes with the bishops and rooks, and keeps the queen safe from ...Nf6 or ...b5 tempo hits. Classical Ruy discipline.",
    f3: "Qf3 in the Ruy is more committal — it can support kingside pressure and aim at f7, but only when the structure has earned it. The report warns this move needs to be **carefully timed**: too early and the queen distracts from the core Ruy tasks of castling, central clarity, and coordination. Make sure you have a concrete plan.",

    // --- QUESTIONABLE SQUARES ---
    h5: "Qh5 in the Ruy is almost always wrong. The Ruy is a **strategic** opening — its power is slow, accumulating pressure through Nf3 and Bb5, not queen raids. Qh5 burns a tempo, exposes the queen to ...g6, and steals attention from the opening's real plan. Play Nf3, Bb5, O-O instead.",
    g4: "Qg4 in the Ruy is an adventure with no structural foundation. The Ruy's first-wave pieces (knight on f3, bishop on b5) are the stars early; queen raids like this are an afterthought move. Black defends easily and White's tempo is gone.",
    a4: "Qa4 in the Ruy is occasionally useful to pin or threaten queenside structures, but as an early move it's premature — Black can answer with ...Bd7 or ...c6 and the queen retreats having achieved little. The Ruy wants the queen to be a **second-wave** piece, not a first-wave forager.",
    d2: "Qd2 in the Ruy is quiet but passive — it blocks the c1-bishop's most active squares and doesn't do much for e4 or the Ruy pressure system. Prefer Qe2 (supports e4 directly) or simply leave the queen home.",
    d3: "Qd3 in the Ruy is unusual and awkward — it obstructs the d-pawn and blocks the f1-diagonal. The Ruy's queen should be **supportive and hard to hit**; d3 is neither.",
    b3: "Qb3 in the Ruy is possible in some specific lines but is not the mainline queen home — it's far from the e-file pressure the opening is built around. The Ruy's workshop queen squares are e2 and c2; go there instead.",
  },

  // =========================================================================
  // ENGLISH OPENING
  // Personality (from report): "Flexible, but only if White understands
  // the structure." The English gives the queen more potential early homes
  // than the e-pawn openings, but it also punishes aimless queen wandering.
  // Qc2 is the most "English-like" queen square.
  // =========================================================================
  english: {
    // --- MODEL SQUARES ---
    c2: "Qc2 is the English's signature queen square — it supports e4 ideas, reinforces the c-file (which is the English's identity), and coordinates with the light-squared bishop whether it goes to g2 or d3. The report calls this **'the most English-like queen square'**, and for good reason.",
    b3: "Qb3 is a strong English queen move when the structure justifies it — it pressures b7, supports queenside-central pressure, and pairs well with a g2 fianchetto. The key word is *when*: the report is firm that Qb3 needs timing. Make sure your pawns and pieces have declared themselves first.",
    e2: "Qe2 in the English is a quiet, flexible queen move — it supports a potential e-pawn advance and keeps the queen modest. Fine move, though Qc2 is usually more thematic in the English since c2 sits behind the opening's identity pawn.",

    // --- QUESTIONABLE SQUARES ---
    h5: "Qh5 in the English is out of character. The English is a **slow, strategic, flank-pressure opening** — queen raids contradict every one of those qualities. Black answers with ...Nf6 gaining a tempo, and White's queen walks back having accomplished nothing.",
    f3: "Qf3 in the English blocks the natural Nf3 square, which the English usually wants. The English gives the queen real flexibility, but not the freedom to jam your own knight's square. Use Qc2, Qb3, or keep the queen home.",
    g4: "Qg4 in the English is a serious misread of the opening. The English wants **hypermodern, patient pressure**, not early queen sorties. This move weakens White's kingside before the fianchetto is even set up and hands Black free tempo.",
    a4: "Qa4 in the English is occasionally part of specific queenside-pressure setups, but as an early move it's premature — the English wants its queen to be structure-sensitive, not to commit before c4-Nc3-g3-Bg2-Nf3 have declared which English variation you're playing.",
    d2: "Qd2 in the English is an unusual, usually passive square. The English's most natural queen homes are c2 and b3 — squares that work with the c4 identity pawn. d2 offers no particular support to the c-file or the eventual center breaks.",
    d3: "Qd3 in the English is awkward — it obstructs the d-pawn (which the English deliberately holds back as a **reserve pawn**, per the pawn report) and blocks potential bishop development to d3. This is the opposite of the English's flexible queen ideal.",
  },

  // =========================================================================
  // LONDON SYSTEM
  // Personality (from report): "Supportive architect of a prebuilt system."
  // The London's shell (d4, Nf3, Bf4, e3, c3, Nbd2) is largely fixed. The
  // queen's job is to fit the shell once it's built, not reinvent it.
  // Qc2, Qb3, Qe2 are all natural — with Qc2 being the classical pick.
  // =========================================================================
  london: {
    // --- MODEL SQUARES ---
    c2: "Qc2 is one of the London System's most natural queen moves — it supports e4 ideas, coordinates with the Bd3 bishop, and stays comfortably hard to attack. The London wants the queen to be a **supportive architect of the system**, and c2 is the architect's desk.",
    b3: "Qb3 is a classical London queen move — it pressures b7 and supports queenside-central pressure while coordinating with the bishop on f4. The key from the report: this is a **supportive** move, not a raiding move. It works best once the d4-e3-c3 shell and Bf4 are already in place.",
    e2: "Qe2 in the London is a quiet, modest queen placement — it supports e-pawn ideas, connects the rooks, and fits slower London setups. Not the flashiest London queen square (Qc2 and Qb3 are more thematic), but perfectly consistent with the opening's patient character.",

    // --- QUESTIONABLE SQUARES ---
    h5: "Qh5 in the London is a genuine mistake. The London is the **calmest opening we study** — a methodical, shell-building, system-based setup. Qh5 contradicts every one of those traits. Black defends with ...Nf6 gaining tempo, and the queen walks back exposed.",
    f3: "Qf3 in the London blocks the Nf3 square, which is a **core shell piece** — the London needs that knight on f3. Play Qc2 or Qb3 instead, or simply keep the queen on d1 until the shell is built.",
    g4: "Qg4 in the London is completely off-system. The London is about a compact d4-e3-c3 shell with Bf4 — kingside queen raids are not part of the plan. This move trades structural solidity for a bad attacking position.",
    a4: "Qa4 in the London is rare and usually premature. The London's queen wants to **fit the shell**, not venture to the queenside rim before the shell is even finished. Get the structure in place first.",
    d2: "Qd2 in the London conflicts with the system — d2 is the **Nbd2 square**, and the London's knight pathway runs d2 → f1 → g3/e3 in many mainlines. Blocking d2 with the queen breaks the London's piece coordination. Use c2 or b3 instead.",
    d3: "Qd3 in the London conflicts with the bishop — **Bd3** is the classical London light-squared bishop square, so Qd3 either prevents that bishop from developing or forces an awkward alternative. The London's queen belongs on c2 or b3; d3 is the bishop's office.",
  },
};

// ---------------------------------------------------------------------------
// Per-opening queen personality lines (from the report's Part VI)
// Used in fallback messaging when an uncovered destination is played.
// ---------------------------------------------------------------------------

export const QUEEN_PERSONALITY = {
  italian:      { name: "Italian Game",            line: "Tempted to be flashy; should be disciplined." },
  queensGambit: { name: "Queen's Gambit",          line: "Quiet, structural, and patient." },
  ruyLopez:     { name: "Ruy Lopez",               line: "A strategic helper, never the main actor early." },
  english:      { name: "English Opening",         line: "Flexible, but only if you understand the structure first." },
  london:       { name: "London System",           line: "A supportive architect of a prebuilt system." },
};

// ---------------------------------------------------------------------------
// Fallback messaging for uncovered destinations.
//
// The queen's opening paradox: the strongest piece is also the most common
// tempo target. When the destination isn't in QUEEN_ADVICE[openingId], we
// still want to teach the report's Rule 1: "useful but hard to hit" —
// reminding the student that queen adventures cost tempo.
// ---------------------------------------------------------------------------

function queenFallback(openingId, ply, isSecondQueenMove) {
  const p = QUEEN_PERSONALITY[openingId];
  const name = (p && p.name) || "your opening";
  const personality = p && p.line;

  // Two queen moves inside the first 5 moves is a red flag per the report.
  if (isSecondQueenMove) {
    return `Moving the queen twice in the opening is a warning sign — the report's verdict is blunt: it usually means something has gone off the rails or the position has turned tactical. In the ${name}, the queen should usually be a **second-wave support piece**, not a wanderer. Finish development and get the king to safety instead.`;
  }

  // General early queen move without a curated entry.
  const base = `Early queen moves in the ${name} need a very clear purpose — either supporting the center, coordinating with a bishop, or solving a specific tactical problem. If this move doesn't do one of those, you're probably just decorating the position.`;
  const tail = personality ? ` The queen's personality in this opening: **${personality}**` : "";
  return base + tail;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * getQueenAdvice({ moveObj, openingId, historySan, ply })
 *
 * Returns an opening-aware teaching string for a queen move, or null when
 * this override doesn't apply (not a queen move, or no opening id).
 *
 * Lookup order:
 *   1. Exact QUEEN_ADVICE[opening][to]
 *   2. Fallback that teaches the report's core law: "useful but hard to hit",
 *      with extra sting if this is the queen's second move in the first 5.
 *   3. null if we genuinely have nothing — letting the existing plan-fit
 *      text stand.
 */
export function getQueenAdvice({ moveObj, openingId, historySan, ply }) {
  if (!moveObj || moveObj.piece !== "q") return null;
  if (!openingId) return null;

  // Detect whether this is the queen's *second* move in the opening phase.
  // historySan is the SAN list of all prior moves (both colors). Count
  // queen SANs played by White — those start with "Q".
  let priorWhiteQueenMoves = 0;
  if (Array.isArray(historySan)) {
    // White plays on even indices (0, 2, 4, ...). ply starts at 1 for White's
    // first move, so historySan here is [W1, B1, W2, B2, ...] up to (but not
    // including) the move just played.
    for (let i = 0; i < historySan.length; i += 2) {
      const san = historySan[i] || "";
      if (san.charAt(0) === "Q") priorWhiteQueenMoves++;
    }
  }
  const isSecondQueenMove = priorWhiteQueenMoves >= 1 && ply <= 10;

  const toSq = moveObj.to;
  const byOpening = QUEEN_ADVICE[openingId];
  const exact = byOpening && toSq && byOpening[toSq];

  if (exact && !isSecondQueenMove) return exact;

  // If it's a second queen move, override any curated line with the
  // "moving the queen twice" warning — the report is emphatic about this.
  if (isSecondQueenMove) {
    return queenFallback(openingId, ply, true);
  }

  // Otherwise, fall back to the generic early-queen lesson.
  return queenFallback(openingId, ply, false);
}
