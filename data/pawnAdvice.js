/*
 * Pawn coaching advice — 5 openings × every pawn × every reasonable destination.
 *
 * Why this file exists:
 *   Pawns are the soul of any chess opening. Unlike pieces (which can re-route),
 *   pawn moves are nearly irreversible — a pawn push commits squares, diagonals,
 *   and structural weaknesses for the rest of the game. The coach needs to
 *   teach the student which pawns are the "identity" pawns of their opening,
 *   which are "support" pawns, which are held in "reserve", and which are
 *   outright "avoid". Every pawn move the student makes after move 1 is a
 *   chance to show off this opening-specific pawn logic.
 *
 * Structure:
 *   PAWN_ADVICE[openingId][fromFile][toSquare] = string
 *   - `fromFile` is "a", "b", "c", "d", "e", "f", "g", "h" — derived from
 *     moveObj.from[0]. This lets us look up "the c-pawn moved to c3" without
 *     enumerating every (from, to) tuple — pawns only ever move forward or
 *     capture diagonally, and for teaching purposes we key off the file.
 *   - `toSquare` is the destination square (e.g., "c3", "c4", "d4", "e4").
 *
 *   PAWN_ROLES[openingId] describes each pawn's role in the opening system.
 *   This is used as a structured fallback when a specific (file, to) isn't
 *   covered — the coach can still say something meaningful like "the h-pawn
 *   plays no role in the English; avoid advancing it in the first fifteen".
 *
 * Tone guardrails (from the Pawn Strategy Report):
 *   - Authoritative first, friendly second. The report is emphatic that
 *     "pawn moves are the most permanent decisions in the opening", and the
 *     coach must reflect that seriousness.
 *   - Celebrate identity pawns (e-pawn for Italian/Ruy, d-pawn for QGD/London,
 *     c-pawn for English) when they advance to their signature squares.
 *   - Celebrate support pawns (c3 in Italian/Ruy/London, e3 in London/QGD)
 *     when they do their supporting job.
 *   - Criticize "reserve" pawn advances that break the opening's philosophy
 *     (e.g., d4 too early in the English destroys the reserve power).
 *   - Criticize "avoid" pawn moves (a-, h-, f- pawns in most systems) firmly.
 *   - Two to three sentences max. No emojis.
 *
 * Interop with firstMoveAdvice.js:
 *   This override is SKIPPED on ply === 1. The existing FIRST_MOVE_ADVICE
 *   table already covers every reasonable first-move pawn push with curated
 *   prose, and we don't want to overwrite that. Ply 2+ is this module's job.
 *
 * Report terminology used throughout:
 *   - "Important pawn"   = the opening's identity pawn(s).
 *   - "Support pawn"     = pawn whose job is to brace or prepare the break.
 *   - "Reserve pawn"     = pawn held back deliberately; its delay IS the plan.
 *   - "Avoid pawn"       = pawn that shouldn't move in the first fifteen.
 */

// ---------------------------------------------------------------------------
// Per-opening × per-pawn-file × per-destination advice
// ---------------------------------------------------------------------------

export const PAWN_ADVICE = {
  // =========================================================================
  // ITALIAN GAME
  // Identity: e-pawn (e4 is the opening). Support: c-pawn (c3 prepares d4),
  // d-pawn (d4 is the classical central break). Reserve: b-pawn. Avoid:
  // a-, f-, g-, h-pawns in the opening phase.
  // Italian mantra from the report: "one pawn starts the game (e4), one pawn
  // supports the break (c3), one pawn delivers the break (d4)."
  // =========================================================================
  italian: {
    a: {
      a3: "a3 in the Italian is a wasted tempo. The a-pawn does nothing for the center and nothing for development — every move you spend on the flank is a move you don't spend on **e4, c3, d4, or castling**, which is the Italian's entire to-do list.",
      a4: "a4 in the Italian is premature flank play. The Italian is an open-game opening that's won or lost in the center — by moving the a-pawn early, you're skipping the center fight entirely. This is the kind of move that costs the whole game by move 15.",
    },
    b: {
      b3: "b3 in the Italian signals a queenside fianchetto, but the Italian doesn't want one. The dark-squared bishop belongs on the a3-f8 diagonal through normal development, not locked behind a b2 pawn. Stick to Bc4, castle, and play c3 and d4.",
      b4: "b4 in the Italian is adventurous but structurally unsound. It abandons the classical center fight, weakens c4 and c3 (the Italian's support square), and hands Black easy counterplay. The Italian wants e4-c3-d4, not early flank expansion.",
    },
    c: {
      c3: "c3 is the textbook Italian support move — it braces the coming d4 push and gives White a **pawn-on-pawn collision in the center**, which is exactly what the Italian wants. The report's Italian mantra is literally: e4 starts, c3 supports, d4 delivers. You just played the middle step of that plan.",
      c4: "c4 in the Italian is unusually aggressive and drops the c3 support square the opening needs. The Italian depends on c3 to prop up a later d4 push — skipping straight to c4 leaves d4 unsupported and gives up the opening's structural backbone.",
    },
    d: {
      d3: "d3 is the Giuoco Pianissimo setup — solid but slow. It gives up the thematic **c3-then-d4 central break** in favor of a quiet maneuvering game. Perfectly playable, but if you're studying the mainline Italian, c3 first and then d4 is what the opening is built around.",
      d4: "d4 is the Italian's central break — this is the move the entire opening has been building toward. Combined with e4 and the c3 support pawn, d4 challenges Black in the center and opens lines for White's bishops. Pure Italian philosophy.",
    },
    e: {
      e5: "An unusual e-pawn move — in the Italian, the e4 pawn usually stays on e4 while c3 and d4 do the central work. Pushing to e5 here commits the pawn, concedes d5, and changes the opening's character. Be sure you have a specific tactical reason.",
    },
    f: {
      f3: "f3 in the Italian is a structural error. It weakens the a7-g1 diagonal (right into your king), blocks the natural Nf3 square, and contributes nothing to the center. The Italian wants Nf3, not a pawn on f3.",
      f4: "f4 in the Italian is overambitious. The Italian is a classical, coordinated opening — f4 weakens e4, opens the a7-g1 diagonal against your own king, and trades all of the opening's structural calm for a kingside attack you're not set up to deliver.",
    },
    g: {
      g3: "g3 in the Italian mixes openings. Fianchettoing the light-squared bishop on g2 contradicts the whole Italian plan of **Bc4 hitting f7**. If you want a g3 system, play one — the English or the Catalan — but don't graft it onto the Italian.",
      g4: "g4 in the Italian is a reckless weakening. It shreds the kingside pawn cover where you'll castle in two moves, contributes nothing to the center, and is the sort of move that loses the game before move 15.",
    },
    h: {
      h3: "h3 in the Italian is occasionally useful as a luft move later, but on an early move it's a tempo you can't afford. The Italian needs every move for **e4, Nf3, Bc4, c3, d4, and castling** — h3 is none of those.",
      h4: "h4 in the Italian is a serious mistake. It weakens the kingside you're about to castle into, does nothing for the center, and telegraphs that you've abandoned the opening's classical plan.",
    },
  },

  // =========================================================================
  // QUEEN'S GAMBIT DECLINED (we're White in the QGD — so d4, c4 is the plan)
  // Identity: d-pawn AND c-pawn together (d4+c4 is the gambit). Support:
  // e-pawn (e3 is the classical QGD support). Reserve: b-pawn (can come in
  // via b3 in some lines). Avoid: a-, f-, h-pawns.
  // Report quote: "The QGD is the only opening in our five where TWO pawns
  // share the identity role."
  // =========================================================================
  queensGambit: {
    a: {
      a3: "a3 in the Queen's Gambit is a waste of a tempo. The QGD is about **d4 + c4 together creating central pressure** — spending time on a3 when you could be developing pieces or solidifying the center is exactly the kind of move that lets Black equalize.",
      a4: "a4 in the QGD signals queenside expansion far too early. The Queen's Gambit wants to pressure the center first, then pick its moment for minority attacks. Early a4 throws away the move order without any compensating activity.",
    },
    b: {
      b3: "b3 in the Queen's Gambit is playable — it prepares Bb2 and sometimes appears in English-QGD hybrid systems — but it's a modern sideline, not the classical QGD structure. The mainline wants Nf3, Nc3, Bg5, e3, and Bd3 in some order, with b3 saved for specific structural needs.",
      b4: "b4 in the QGD is overambitious. The QGD is a positional, pressure-based opening — b4 neither supports d4 nor develops a piece, and it weakens c4, which is the gambit pawn the whole opening rides on.",
    },
    c: {
      c3: "c3 in the QGD undermines the opening's identity. The **whole gambit is c4** — pulling the c-pawn back to c3 makes it a support pawn for d4 rather than an identity pawn, which converts your Queen's Gambit into something closer to a London System. If you want to play c3, pick a c3-based opening.",
      c4: "c4 IS the Queen's Gambit. Combined with d4 it creates the two-pawn central identity the opening is built around — offering the c-pawn to pressure Black's d5 and open White's game no matter how Black responds. This is the opening's signature move.",
      c5: "c5 in the QGD is a rare advance — it gains space but locks the center and gives up the tension that pressures Black's d5 pawn. The Queen's Gambit thrives on **central tension**, not a locked pawn chain. Usually you'd prefer to keep c4 and c5 as a later option after piece development.",
    },
    d: {
      d3: "d3 in the QGD abandons the whole opening. The Queen's Gambit is built on d4 — without a pawn on d4, there is no gambit, no central pressure, and no reason for Black to respond with QGD-style moves. If you meant to play a quieter system, you picked the wrong opening.",
      d4: "d4 is the Queen's Gambit's primary identity pawn. Together with c4 it builds the signature two-pawn center the QGD is named for. The report's one-line summary: **the QGD is the opening where two pawns share the identity role, and d4 is the foundation of both.**",
      d5: "d5 in the QGD releases the tension prematurely. The whole point of d4 + c4 is the pressure on Black's d5 pawn — advancing your own d-pawn to d5 lets Black off the hook and closes the center. The QGD wants tension, not resolution.",
    },
    e: {
      e3: "e3 is the classical QGD support move — it solidifies d4, unblocks the f1 bishop toward d3 or e2, and sets up a rock-solid center. The report calls e3 **'the quiet backbone of the QGD'** — not flashy, but essential. Well played.",
      e4: "e4 in the QGD is aggressive and sometimes thematic (Marshall Gambit territory), but it commits a lot: it gives up the restrained, pressure-based QGD philosophy for direct central occupation. In the mainline QGD, **e3 is the move**, with e4 reserved for specific tactical windows.",
    },
    f: {
      f3: "f3 in the QGD is a rare structural move — it blocks the natural Nf3 square and weakens the e1-h4 diagonal. The QGD wants knights developed to f3 and c3, not a pawn sitting in a knight's way.",
      f4: "f4 in the QGD abandons the opening's character. The QGD is a positional, pressure-based opening built on d4 + c4 — f4 converts it into something resembling a Dutch Stonewall from the wrong side. Doesn't fit.",
    },
    g: {
      g3: "g3 in the QGD is occasionally seen in Catalan-leaning move orders (d4, c4, g3 is literally the Catalan). In pure QGD mainlines, though, the bishop heads to d3 or e2, not g2. If you want the Catalan, play it intentionally; if you want the QGD, skip g3 and prioritize **Nf3, Nc3, e3, Bd3**.",
      g4: "g4 in the QGD is a serious mistake. It weakens the kingside you'll castle into, contributes nothing to the central pressure the QGD is built on, and gives Black an easy attacking target.",
    },
    h: {
      h3: "h3 in the QGD is a luft move with no immediate purpose in the opening. The QGD's early moves should be **d4, c4, Nf3, Nc3, Bg5, e3, Bd3** — h3 can wait until the middlegame, if ever.",
      h4: "h4 in the QGD is an early weakening with no compensation. The QGD's pressure comes from the central d4 + c4 + Nf3 + Nc3 + Bg5 structure, not from kingside pawn storms. This move hurts your own king without helping your center.",
    },
  },

  // =========================================================================
  // RUY LOPEZ
  // Identity: e-pawn (e4 is the starting point). Support: c-pawn (c3 is famous
  // for preparing d4 — "one of the deepest Ruy support moves"). Support/break:
  // d-pawn (d4 at the right moment). Reserve: h-pawn (h3 is common Ruy luft).
  // Avoid: a-, b-, f-, g-pawns.
  // Report quote: "c3 is one of the deepest Ruy support moves — it's the
  // reason the b1-knight waits and doesn't go to c3 first."
  // =========================================================================
  ruyLopez: {
    a: {
      a3: "a3 in the Ruy is occasionally used against a Bb4 pin later, but on an early move it's purely a tempo loss. The Ruy's opening to-do list is **e4, Nf3, Bb5, O-O, Re1, c3, d4** — a3 is not on that list.",
      a4: "a4 in the Ruy is a real sideline (the 'Anti-Marshall'), but only after many preparatory moves. As an early move, it abandons the opening's central pressure for queenside play that hasn't been set up yet.",
    },
    b: {
      b3: "b3 in the Ruy contradicts the opening. The Ruy's dark-squared bishop typically stays on the b1-h6 diagonal through normal development — b3 and Bb2 is a completely different structure. If you want a fianchetto, pick a fianchetto opening.",
      b4: "b4 in the Ruy is the 'Evans Gambit style' idea, but the Ruy Lopez isn't set up for it. The Ruy wants **pressure on e5 via Nf3 and Bb5**, not flank gambits. This move abandons the opening's identity.",
    },
    c: {
      c3: "c3 is one of the Ruy's deepest support moves. The report calls it **'the reason the b1-knight waits'** — White holds the Nc3 square open specifically so that c3 can support the eventual d4 break. You just played the quiet move that makes the whole Ruy pressure system work.",
      c4: "c4 in the Ruy is unusually direct — it gives up the c3 support square that the d4 break depends on. The Ruy's pressure works through c3-then-d4 with the knight on c3 holding back; jumping straight to c4 breaks that chain.",
    },
    d: {
      d3: "d3 is the restrained Ruy setup — reasonable, solid, and a frequent modern choice (Anti-Berlin and Italian-esque Ruy lines). It gives up the most forcing central plan (c3-then-d4) for a slower maneuvering game, but it's fully theoretical.",
      d4: "d4 is a Ruy central break — thematic when it's supported by c3 and the pieces are ready. Make sure it's the right moment: an unsupported d4 can be met by exd4 when Black has time to consolidate. But as a **prepared break after c3**, this is the Ruy's main central lever.",
    },
    e: {
      e5: "e5 in the Ruy is rare — the e4 pawn usually stays put while Nf3 and Bb5 create the pressure. Pushing to e5 commits the pawn, gives up d5, and changes the opening's character. Be sure you have a concrete tactical reason.",
    },
    f: {
      f3: "f3 in the Ruy is a structural error — it blocks the Nf3 square that is the opening's *engine* and weakens the a7-g1 diagonal against your own king. The Ruy wants Nf3, not a pawn on f3.",
      f4: "f4 in the Ruy is an overextension. The Ruy is a pressure-based classical opening, not a kingside pawn storm — f4 weakens e4, opens the a7-g1 diagonal, and trades positional harmony for a speculative attack.",
    },
    g: {
      g3: "g3 in the Ruy contradicts the opening. The Ruy's light-squared bishop belongs on b5 (that's literally the opening's signature move) — a g3 setup puts the bishop on g2 instead, which is a different opening entirely.",
      g4: "g4 in the Ruy is a grave weakening. It hurts the kingside you're about to castle into, does nothing for the center, and is not a Ruy idea at any skill level.",
    },
    h: {
      h3: "h3 in the Ruy is thematic — it's the classic luft move that prevents ...Bg4 pinning the Nf3. The Ruy is famous for slow, prophylactic play, and h3 fits right in. Not a showpiece move, but a sound one in this opening.",
      h4: "h4 in the Ruy is too committal. Unlike h3 (which is the classic luft), h4 commits to kingside expansion that the Ruy doesn't support — the Ruy's action is in the center and the queenside minority attack.",
    },
  },

  // =========================================================================
  // ENGLISH OPENING
  // Identity: c-pawn (c4 is the opening). Support: g-pawn (g3 for fianchetto),
  // sometimes b-pawn. RESERVE: d-pawn AND e-pawn — their delay is the whole
  // point of the English. Avoid: a-, f-, h-pawns.
  // Report quote: "The English is the opening where d and e are RESERVE
  // pawns — their delay is part of the opening's power. Playing d4 or e4
  // too early destroys that power."
  // =========================================================================
  english: {
    a: {
      a3: "a3 in the English is a minor tempo waste. The English is a flexible opening that can absorb some slow moves, but your time is better spent on **Nc3, g3-Bg2, and then d4/e4 at the right moment**, not on a rook's pawn advance.",
      a4: "a4 in the English is occasionally seen in specific Botvinnik setups, but usually only after the kingside fianchetto is complete. As an early move it's premature flank play that gives up the English's flexibility.",
    },
    b: {
      b3: "b3 in the English is a legitimate sideline — it prepares a double fianchetto (b2 + g2) for a hypermodern squeeze on the center. It's not the mainline English but it's consistent with the opening's long-range philosophy of controlling the center from the flanks.",
      b4: "b4 in the English is the 'Bellón Gambit' territory — sharp, specific, and not for casual play. It gives up the English's quiet, long-range flexibility for an immediate tactical skirmish. Usually better to stay with g3 and Nc3.",
    },
    c: {
      c4: "c4 IS the English Opening. This is the identity move — the pawn that controls d5 from the flank and sets up the whole hypermodern approach of pressuring the center without occupying it. The report's take on the English is that **c4 is the opening**; everything else orbits around it.",
      c5: "c5 in the English is a significant commitment — it locks the c-file and gives up the flexibility that the c-pawn-as-identity provides. Usually the c-pawn stays on c4 to keep pressure on d5; advancing to c5 is reserved for specific transpositions into Benoni or symmetric-English structures.",
    },
    d: {
      d3: "d3 in the English is the restrained **King's English** setup — it keeps the d-pawn's reserve role intact while supporting e4 later. Perfectly consistent with the English's philosophy of delayed center action.",
      d4: "Careful: d4 in the English is a big commitment. The report is firm on this — **d and e pawns are RESERVE pawns in the English; their delay is the opening's power**. Pushing d4 too early converts your English into a Queen's Pawn opening and throws away the flank pressure the English depends on. If you want d4, you probably want the QGD instead.",
    },
    e: {
      e3: "e3 in the English is a quiet, restrained setup — it supports a possible later d4 while keeping the English's flexible character. Fine move, though many English players prefer g3 and the Bg2 fianchetto for more active piece placement.",
      e4: "e4 in the English is a serious commitment. The report's emphatic lesson on the English: **the d and e pawns are RESERVE pawns, and their delay is the whole point of the opening**. Playing e4 early turns your English into a pure e-pawn opening and surrenders the c4-g3 pressure that makes the English unique.",
    },
    f: {
      f3: "f3 in the English is a structural error — it blocks the Nf3 square and weakens the kingside. The English wants its knight on f3 (or c3), not a pawn on f3.",
      f4: "f4 in the English is a sharp 'Botvinnik system' component but only after the fianchetto and knights are in place. As an early standalone move it opens the kingside prematurely and gives up the English's hypermodern restraint.",
    },
    g: {
      g3: "g3 is the English's **signature support move** — it prepares Bg2 on the long diagonal, which together with c4 creates the hypermodern pressure on d5 and e4 that the English is famous for. This is textbook English development.",
      g4: "g4 in the English is a serious weakening. It shreds the kingside pawn cover you'll castle behind, contributes nothing to the c-file identity, and abandons the opening's long-range, patient philosophy for a reckless kingside lunge.",
    },
    h: {
      h3: "h3 in the English is an occasionally useful luft move, but as an early move it's a tempo you can't spare. The English needs **c4, Nc3, g3, Bg2, Nf3** in the first handful of moves — h3 is not on that list.",
      h4: "h4 in the English is a kingside weakening with no compensation. The English is a slow, patient opening about squeezing the center from the flanks — kingside pawn storms are not its game.",
    },
  },

  // =========================================================================
  // LONDON SYSTEM
  // Identity: d-pawn (d4 is the opening). Support: e-pawn (e3), c-pawn (c3)
  // — together they form the d4-e3-c3 pawn shell that defines the London.
  // Reserve: b-pawn. Avoid: a-, f-, g-, h-pawns.
  // Report quote: "The London System is a three-pawn shell: d4, e3, c3,
  // locked together like stones in a wall."
  // Key London sub-rule (already taught via bishop coaching): Bf4 should
  // come BEFORE e3 so the dark-squared bishop gets outside the pawn chain.
  // =========================================================================
  london: {
    a: {
      a3: "a3 in the London is a minor waste of tempo. The London's opening plan is the **d4-e3-c3 shell plus Bf4**, and every move outside that plan slows down your coordination. a3 doesn't advance the system.",
      a4: "a4 in the London is a structural error at this stage. The London is a compact, solid setup — early queenside flank moves don't fit, and a4 gives up tempo without doing anything for the d4-e3-c3 shell.",
    },
    b: {
      b3: "b3 in the London is sometimes seen in hybrid Zukertort-London systems, preparing a b2 fianchetto. It's a sideline — the classical London keeps the dark-squared bishop on f4, not b2. If you're studying the pure London, stick with **Bf4 first, then e3 and c3**.",
      b4: "b4 in the London is inconsistent with the opening. The London is about the **three-pawn shell and the Bf4 bishop** — b4 is a queenside pawn lunge that neither supports the shell nor develops a piece.",
    },
    c: {
      c3: "c3 is the third stone in the **London's d4-e3-c3 shell**. Together with d4 and e3 it creates the compact pawn wall the London is built on — solid, flexible, and hard to break down. The report calls this trio **'locked together like stones in a wall'**. Well played.",
      c4: "c4 in the London is actually a well-known transposition — the 'Neo-London' or London-to-QGD hybrid. It's fully playable, but it gives up the compact c3 shell-stone for a more ambitious central fight. If you're specifically studying the London System, **c3 is the classical choice**.",
    },
    d: {
      d4: "d4 IS the London System's identity pawn. The whole opening is built on d4 as the anchor, with e3 and c3 supporting it and Bf4 sitting outside the chain. This is the opening's foundation.",
      d5: "d5 in the London is an unusual push — it locks the center and gives up the d4-anchor flexibility that the London depends on. Normally the d-pawn stays on d4 so the three-pawn shell (d4-e3-c3) stays intact.",
    },
    e: {
      e3: "e3 is one of the London's three shell pawns, together with d4 and c3. **Important sequencing note**: the pure London plays Bf4 BEFORE e3 so the dark-squared bishop gets outside the pawn chain — otherwise it gets stuck behind the e3 pawn. If Bf4 is already on the board, e3 now is textbook London.",
      e4: "e4 in the London abandons the opening entirely. The London's character is the **solid, restrained d4-e3-c3 shell** — pushing e4 opens the position, breaks the shell, and turns your London into something closer to a QGD or King's Pawn opening. If you want an open game, you picked the wrong opening.",
    },
    f: {
      f3: "f3 in the London is a structural error. It blocks the Nf3 square the London needs for natural development and weakens the a7-g1 diagonal. The London wants **Nf3, not a pawn on f3**.",
      f4: "f4 in the London is a serious mistake — the **Bf4 bishop belongs on f4**, so pushing your f-pawn to f4 either traps or dislodges the bishop and shreds the London's most important piece placement. This is one of the worst pawn pushes possible in this opening.",
    },
    g: {
      g3: "g3 in the London contradicts the opening. The London's light-squared bishop usually heads to d3, not g2 — and the dark-squared bishop is the one that goes outside the chain, to f4. A g3-fianchetto is a different opening, not a London.",
      g4: "g4 in the London is a reckless kingside weakening. The London is a quiet, solid, no-nonsense opening about slow maneuvering behind the d4-e3-c3 wall — kingside pawn storms are the opposite of what the London wants.",
    },
    h: {
      h3: "h3 in the London is an occasionally useful luft move, but early it's a waste of tempo. The London has a tight to-do list: **d4, Nf3, Bf4, e3, c3, Bd3, Nbd2, O-O** — h3 isn't on it.",
      h4: "h4 in the London is a weakening with no compensation. The London's strength is its compact, solid structure — kingside pawn pushes don't fit, and h4 specifically undermines the king's future shelter.",
    },
  },
};

// ---------------------------------------------------------------------------
// Per-opening pawn role classification (from the report)
// Used for structured fallbacks when a specific (file, to) isn't covered.
// ---------------------------------------------------------------------------

export const PAWN_ROLES = {
  italian: {
    a: "avoid",    b: "avoid",    c: "support", d: "support",
    e: "important", f: "avoid",   g: "avoid",   h: "avoid",
  },
  queensGambit: {
    a: "avoid",    b: "reserve",  c: "important", d: "important",
    e: "support",  f: "avoid",    g: "reserve",   h: "avoid",
  },
  ruyLopez: {
    a: "avoid",    b: "avoid",    c: "support", d: "support",
    e: "important", f: "avoid",   g: "avoid",   h: "reserve",
  },
  english: {
    a: "avoid",    b: "support",  c: "important", d: "reserve",
    e: "reserve",  f: "avoid",    g: "support",   h: "avoid",
  },
  london: {
    a: "avoid",    b: "reserve",  c: "support", d: "important",
    e: "support",  f: "avoid",    g: "avoid",   h: "avoid",
  },
};

// ---------------------------------------------------------------------------
// Role-based fallback messaging — used when a specific (opening, file, to)
// isn't covered. The report's four roles map cleanly to four teaching tones.
// ---------------------------------------------------------------------------

const OPENING_NAMES = {
  italian: "Italian Game",
  queensGambit: "Queen's Gambit",
  ruyLopez: "Ruy Lopez",
  english: "English Opening",
  london: "London System",
};

function roleFallback(role, openingId, fileLetter) {
  const name = OPENING_NAMES[openingId] || "your opening";
  switch (role) {
    case "important":
      return `The ${fileLetter}-pawn is an identity pawn in the ${name} — it's one of the pawns the whole opening is built around. Moving it now is a major structural decision; make sure it's going to the square the opening actually wants.`;
    case "support":
      return `The ${fileLetter}-pawn is a support pawn in the ${name} — its job is to brace the central break or frame the piece structure. Good pawn to move at the right moment, but know what it's supporting before you push it.`;
    case "reserve":
      return `The ${fileLetter}-pawn is a reserve pawn in the ${name} — the opening deliberately keeps it back, and its delay is part of the opening's power. Advancing it early can destroy the very structure you're trying to build. Be sure this is the right moment.`;
    case "avoid":
      return `The ${fileLetter}-pawn has no role in the ${name} in the first fifteen moves. The report's verdict on flank pawn pushes is blunt: they waste tempo, weaken the king, and contribute nothing to the opening's identity. Develop pieces or support the center instead.`;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * getPawnAdvice({ moveObj, openingId, historySan, ply })
 *
 * Returns an opening-aware teaching string for a pawn move, or null when
 * this override doesn't apply (e.g., the move isn't a pawn move, or it's
 * ply 1 where FIRST_MOVE_ADVICE handles the teaching).
 *
 * Lookup order:
 *   1. Exact PAWN_ADVICE[opening][file][to]
 *   2. Role-based fallback via PAWN_ROLES[opening][file]
 *   3. null (so the caller leaves the existing effectTxt in place)
 */
export function getPawnAdvice({ moveObj, openingId, historySan, ply }) {
  // Guard: only fire for pawn moves.
  if (!moveObj || moveObj.piece !== "p") return null;

  // Guard: skip ply 1 — FIRST_MOVE_ADVICE already handles every first-move
  // pawn push with curated prose. The session directive is explicit that
  // the new pawn coaching must INTEGRATE with, not overwrite, the existing
  // turn-1 advice.
  if (ply === 1) return null;

  const fromSq = moveObj.from;
  const toSq = moveObj.to;
  if (!fromSq || !toSq) return null;

  const fileLetter = fromSq[0]; // a..h
  if (!fileLetter) return null;

  // 1. Try the exact curated line.
  const byOpening = openingId && PAWN_ADVICE[openingId];
  const byFile = byOpening && byOpening[fileLetter];
  const exact = byFile && byFile[toSq];
  if (exact) return exact;

  // 2. Role-based fallback.
  const rolesByOpening = openingId && PAWN_ROLES[openingId];
  const role = rolesByOpening && rolesByOpening[fileLetter];
  if (role) {
    const fb = roleFallback(role, openingId, fileLetter);
    if (fb) return fb;
  }

  // 3. No applicable advice — let the existing plan-fit text stand.
  return null;
}
