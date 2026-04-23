/*
 * Second-move coaching advice — hand-crafted lines for White's move 2.
 *
 * Why this file exists:
 *   After the first move, the tree explodes quickly — by move 3 we cannot
 *   pre-write every position. But move 2 is still small enough to cover
 *   thoughtfully, and it's where the coach can really teach: "Black just
 *   played the Sicilian. In the Italian we don't want to chase that; we want
 *   to stay in e5 territory." That kind of specific, opening-aware framing
 *   is what turns a generic engine verdict into actual chess understanding.
 *
 * Coverage philosophy:
 *   Per opening, we cover Black's top ~4 replies to White's first move.
 *   For each of those replies, we cover roughly 8–12 White second moves —
 *   the ones real players actually try. This is well beyond the statistical
 *   top 4 (Nf3, c4, d4, Nc3). We add Bc4, Bf4, Bg5, c3, f4, g3, d3, e3, e4
 *   wherever they plausibly appear, so players who experiment with sensible
 *   piece or pawn moves get specific feedback instead of a generic line.
 *
 * Structure:
 *   SECOND_MOVE_ADVICE[openingId][blackReplySan][whiteSecondSan] = string
 *
 * Fallback chain (handled in app.js):
 *   1. Exact: SECOND_MOVE_ADVICE[id][blackSan][whiteSan]
 *   2. Per-reply fallback: SECOND_MOVE_REPLY_FALLBACK[id][blackSan]
 *   3. Per-opening fallback: SECOND_MOVE_OPENING_FALLBACK[id]
 *   4. Global: SECOND_MOVE_FALLBACK
 *
 * Tone guardrails (shared with firstMoveAdvice.js):
 *   - Authoritative first, friendly second. Criticize clearly when warranted.
 *   - One teaching idea per line — a named variation, a theoretical reason,
 *     or a principle the player can carry forward.
 *   - Two to three sentences max.
 *   - Name the opening or variation when we can. Specific names stick.
 */

export const SECOND_MOVE_ADVICE = {
  // ==================================================================
  // ITALIAN GAME — 1.e4, then Black's reply, then White's second move.
  // ==================================================================
  italian: {
    // ---- 1.e4 e5 (the Italian path itself) ----
    e5: {
      Nf3:
        "Perfect. 2.Nf3 attacks e5 immediately and develops a knight toward the center in one move — the textbook second move of the Italian, the Ruy Lopez, and nearly every classical e-pawn opening. Black must now defend the pawn, which is exactly the tension we want.",
      Bc4:
        "That was the Italian Bishop move one turn early — the Bishop's Opening. Sound chess, but the Italian's trademark move order is 2.Nf3 first (attacking e5), then 3.Bc4 once Black has committed to ...Nc6. Playing Bc4 now lets Black equalize with ...Nf6 and a later ...Nxe4.",
      Nc3:
        "That was the Vienna Game — a perfectly respectable cousin of the Italian that also develops a knight and supports a future f4 push. But in our curriculum we're studying the Italian move order: Nf3 first, putting immediate pressure on e5.",
      d4:
        "The Center Game. It grabs the center aggressively, but after ...exd4 White's queen usually has to come out early to recapture, costing tempo. The Italian builds its attack patiently — we want 2.Nf3 to keep the pressure on without sacrificing structure.",
      f4:
        "The King's Gambit — one of the oldest and most romantic openings in chess, sacrificing a pawn for open lines and attack. Great fun, but philosophically the opposite of the Italian, which keeps its structure solid and develops pieces first.",
      Bb5:
        "That was the Ruy Lopez setup — one move out of order. The Ruy develops Nf3 first to attack e5, then brings the bishop to b5. Playing Bb5 before Nf3 lets Black respond ...c6 with tempo and equalize comfortably.",
      c3:
        "A preparation move for a later d4 — the Ponziani Opening when played on move two. It's a serious sideline but it delays development. The Italian's patient plan still starts with 2.Nf3 attacking the e5 pawn.",
      d3:
        "Too timid for move two. Development and central pressure are still the priority — 2.Nf3 hits e5 and readies the kingside for quick castling. d3 belongs inside the Italian's slower main lines, not on move two.",
      g3:
        "A hypermodern fianchetto idea. Reasonable chess, but it doesn't pressure Black's e5 pawn and concedes the initiative. The Italian is a classical opening — we hit e5 directly with the knight first.",
      Qh5:
        "The Wayward Queen attack, sometimes called the Parham. It threatens a quick mate but loses time the moment Black defends with ...Nc6 or ...g6. In the Italian we bring knights first, queens last — this move is the opposite of what good opening play looks like.",
      Qf3:
        "A Scholar's-Mate-style lunge. It develops the queen too early, blocks the f3 square the knight wants, and is refuted by simple defending moves. The Italian wins by sound development, not cheap threats.",
      a3: "A wasted tempo. Black has already staked a claim in the center with ...e5; our job is to challenge it with 2.Nf3, not shuffle rook pawns.",
      h3: "Prophylaxis with no target yet. We haven't developed anything for Black to pin. Play 2.Nf3 and put the e5 pawn under real pressure.",
    },

    // ---- 1.e4 c5 (the Sicilian — Black refuses the Italian) ----
    c5: {
      Nf3:
        "Textbook. Black went Sicilian — the sharpest, most combative reply to 1.e4 — so we're no longer heading into the Italian. 2.Nf3 is the mainline Open Sicilian move order, preparing d4 to fight for the center before Black gets organized.",
      Nc3:
        "The Closed Sicilian — a solid system where White avoids the big theoretical fights of the Open Sicilian. Respectable, and a reasonable weapon at club level, but not the Italian we came here to study.",
      c3:
        "The Alapin Sicilian — a very popular anti-Sicilian that prepares d4 without allowing Black's typical Open Sicilian counterplay. Known theory, but completely off the Italian's path.",
      d4:
        "The Smith-Morra Gambit idea (offering a pawn for development) or a premature center break, depending on Black's next move. Theoretically sound in the Morra but sharp and demanding. It is not the Italian — Black chose that path by playing ...c5.",
      f4:
        "The Grand Prix Attack's first move when combined with Nc3. It's a known anti-Sicilian weapon that avoids deep theory, but it isn't the Italian and it requires its own study.",
      Bc4:
        "The Bowdler Attack — aiming the bishop at f7. Against the Sicilian it's considered inferior: Black's ...e6 simply kicks the bishop and Black has a good game. In our curriculum, ...c5 already meant we'd left the Italian behind.",
      g3:
        "A hypermodern fianchetto approach against the Sicilian. Playable but passive compared to 2.Nf3 and d4. It's definitely not the Italian — ...c5 decided that the moment Black played it.",
      b3:
        "A Sicilian sideline with fianchetto ideas. It exists in theory but it's an offbeat line, not part of either the Italian or any mainline anti-Sicilian.",
      Ne2:
        "A quirky Sicilian sideline. It keeps the f-pawn free for a future f4, but the knight is worse placed than on f3. Neither Italian nor mainstream Sicilian theory.",
      a3:
        "The Mengarini Variation — a flexible waiting move that can transpose into many Sicilian sidelines. A novelty against prepared opponents, but strategically thin and far from the Italian we signed up to learn.",
    },

    // ---- 1.e4 e6 (the French — Black closes the center) ----
    e6: {
      d4:
        "Textbook against the French. With ...e6 Black prepared ...d5 to challenge our center; we beat them to it with 2.d4, claiming both big central squares and setting up the main French Defence tabiya. Not the Italian, but the correct principled response.",
      Nf3:
        "A respectable sideline sometimes called the King's Indian Attack setup against the French. Perfectly playable, but the main-line principled move is 2.d4 — claim both central squares before Black does.",
      Nc3:
        "A good developing move that enters French Defence mainlines, especially if Black plays ...d5 and we answer with e5 or exd5. But the sharpest and most common move is 2.d4, grabbing space first.",
      d3:
        "The King's Indian Attack setup against the French. Solid and respected, but it gives up the chance to plant a pawn on d4 and play a full classical French. Not the Italian either.",
      c4:
        "A transposition attempt toward English/Queen's-pawn territory. It's not wrong, but it abandons both the Italian (which we've already lost after ...e6) and the principled French reply of 2.d4.",
      Bc4:
        "Aimed at f7, but ...e6 already shored up that square and the bishop will be kicked by ...d5 next move. In the French we want central pawns, not a hopeful bishop sortie.",
      f4:
        "A King's Gambit style push, but Black hasn't played ...e5, so there's no gambit and no attack — just a weakening of our own kingside. The principled French move is 2.d4.",
    },

    // ---- 1.e4 c6 (the Caro-Kann) ----
    c6: {
      d4:
        "Textbook. Black played the Caro-Kann, preparing ...d5 with ...c6 supporting the pawn. We claim the center with 2.d4 and enter the Caro-Kann main line. Not Italian territory, but the correct principled reply.",
      Nf3:
        "The Two Knights Variation against the Caro-Kann when followed by Nc3. Perfectly playable, but the classical principled move is 2.d4 — grab the center before Black finishes the ...d5 plan.",
      Nc3:
        "The Two Knights setup against the Caro-Kann. Sound and respected theory, but the mainline is 2.d4 first. Note we left the Italian the moment Black chose ...c6.",
      c4:
        "A transposition attempt toward the Panov Attack after 2...d5 3.exd5 cxd5 4.cxd5. It's a legitimate weapon against the Caro-Kann, just a very different kind of position than the Italian.",
      d3:
        "The King's Indian Attack setup. Solid but passive — it gives up the chance to contest the center directly with 2.d4.",
      Bc4:
        "Hopeful, but ...c6 already prepared ...d5, which will kick the bishop with tempo. The Caro-Kann mainline goes through 2.d4, not optimistic bishop development.",
    },
  },

  // ==================================================================
  // RUY LOPEZ — 1.e4. The Ruy and the Italian share Black-reply trees,
  // but the mainline White second move here is the same Nf3.
  // ==================================================================
  ruyLopez: {
    // ---- 1.e4 e5 (the Spanish path) ----
    e5: {
      Nf3:
        "Perfect. 2.Nf3 is the first move of every serious classical e-pawn system, the Ruy Lopez included. It attacks e5 and readies the king for quick castling. Next move we'll finally play Bb5 — the defining bishop move the opening is named for.",
      Bb5:
        "That was the Ruy Lopez's signature bishop move one turn early. Without the knight on f3 pressuring e5 first, Black has the easy reply ...c6 with tempo. The Ruy's power comes from the move order: Nf3 first, Bb5 only after ...Nc6.",
      Bc4:
        "That was the Italian's bishop, played in a Ruy Lopez study. The Italian and Ruy are rival classical openings — both are great, but they belong to different move orders. The Ruy wants the bishop on b5, not c4.",
      Nc3:
        "The Vienna Game. A sound opening with deep theory of its own, but it isn't the Ruy Lopez. The Spanish's whole point is the b5 bishop — and that requires 2.Nf3 first to keep the e5 pawn under real pressure.",
      d4:
        "The Center Game. Grabs space but costs development when White's queen has to recapture on d4 after ...exd4. The Ruy Lopez values patient pressure over instant central occupation — play 2.Nf3 and keep the structure intact.",
      f4:
        "The King's Gambit. A glorious romantic opening, but the philosophical opposite of the Ruy Lopez, which keeps the structure solid and plays a long positional squeeze rather than a tactical firestorm.",
      d3:
        "Too passive. The Ruy Lopez doesn't need to hide — it needs to attack e5 with 2.Nf3. d3 gives up the opening pressure that makes the Spanish so effective.",
      c3:
        "The Ponziani Opening when played this move order. It's a serious sideline but it delays development and avoids the Ruy altogether. Our curriculum goes through 2.Nf3.",
      g3:
        "A hypermodern fianchetto idea that has nothing to do with the classical Spanish game. The Ruy Lopez wants the bishop on b5 and the knight on f3 — not bishops on g2.",
      Qh5:
        "The Wayward Queen. Against ...e5 this is a known beginner's mistake: ...Nc6 defends everything and now ...Nf6 hits the queen with tempo. The Ruy Lopez is built on sound development, not cheap tricks.",
      a3: "A useless tempo. Black has staked a claim in the center; we must challenge it with 2.Nf3, which begins the Ruy Lopez in earnest.",
    },

    // ---- 1.e4 c5, e6, c6 (Black declines the Spanish) ----
    c5: {
      Nf3:
        "Textbook. Black went Sicilian, so the Ruy Lopez is off the table — but 2.Nf3 is still correct, entering Open Sicilian territory. The Ruy's opening principles (fast development, quick castling) carry forward even into a completely different opening.",
      Nc3:
        "The Closed Sicilian. Respectable anti-Sicilian theory, but not the Ruy Lopez — that was ruled out the instant Black played ...c5. Our curriculum goes with 2.Nf3.",
      c3:
        "The Alapin Sicilian — a sound anti-Sicilian weapon, but it sidesteps both the Open Sicilian and the Ruy. We'd rather meet ...c5 with the principled 2.Nf3 and aim for a full classical fight.",
      Bb5:
        "The Rossolimo Variation when Black later plays ...Nc6 — a perfectly sound anti-Sicilian that does echo the Ruy's bishop move. It's good theory, but it's an anti-Sicilian, not a Ruy Lopez.",
      d4:
        "A premature central break against the Sicilian — after ...cxd4 we'd need to recapture with the queen or enter the Morra Gambit. The principled mainline is 2.Nf3 first.",
      f4:
        "The Grand Prix idea, usually combined with Nc3. It avoids Sicilian theory but isn't the Ruy. The Ruy requires ...e5, which Black declined.",
      Bc4:
        "The Bowdler Attack — an old, inferior try against the Sicilian since ...e6 simply kicks the bishop. Neither good Sicilian theory nor anything like the Ruy Lopez.",
    },
    e6: {
      d4:
        "Textbook against the French. With ...e6 Black prepared ...d5 to challenge our center; we strike first with 2.d4. The Ruy Lopez is off the table — Black denied us ...e5 — but this is the principled mainline response.",
      Nf3:
        "A King's Indian Attack flavor against the French. Playable, but the main line is 2.d4 — claim central space before Black finishes ...d5.",
      Nc3:
        "Develops into a French mainline where the center will become tense. Good theory, but the sharpest move is 2.d4 first, grabbing territory.",
      d3:
        "The King's Indian Attack setup against the French. Solid and well-studied, but it concedes central space — 2.d4 is the more ambitious principled move.",
      Bc4:
        "Hopeful but misguided: ...d5 will kick this bishop next move. Against the French we play 2.d4 and meet the ...d5 challenge head-on.",
    },
    c6: {
      d4:
        "Textbook against the Caro-Kann. Black's ...c6 prepares ...d5 with pawn support; we beat them to the center with 2.d4. The Ruy is not happening this game — that required ...e5 — but this is exactly how a classical player should respond.",
      Nf3:
        "The Two Knights approach when combined with Nc3 later. Perfectly playable against the Caro-Kann, though the main line is 2.d4 for full central occupation.",
      Nc3:
        "The Two Knights Variation. Sound Caro-Kann theory, just less ambitious than 2.d4.",
      c4:
        "Transposition bait toward the Panov Attack after ...d5 3.exd5 cxd5 4.cxd5. A legitimate sideline, very different from anything Ruy Lopez related.",
    },
  },

  // ==================================================================
  // QUEEN'S GAMBIT — 1.d4, followed by Black's reply and White's second.
  // ==================================================================
  queensGambit: {
    // ---- 1.d4 d5 (the Queen's Gambit Declined / Accepted path) ----
    d5: {
      c4:
        "The Queen's Gambit itself. With 2.c4 White offers the c-pawn to deflect Black's d5-pawn, aiming for central control regardless of whether Black accepts (takes with ...dxc4) or declines (with ...e6 or ...c6). This is the opening in its purest form.",
      Nf3:
        "A flexible developer that often transposes into the Queen's Gambit after a later c4, or into the London when White plays Bf4. Sound but not committal — our curriculum wants 2.c4 to state the gambit clearly from move two.",
      Bf4:
        "That was the London System's signature move. Solid, respected, and one of the most popular openings in modern club chess — but it's a different opening from the Queen's Gambit we're studying.",
      Bg5:
        "The Hodgson Attack (or Trompowsky-style idea played against ...d5). It's a legitimate surprise weapon but it doesn't play the gambit. Our curriculum wants the principled 2.c4.",
      Nc3:
        "The Veresov Attack when combined with Bg5. A respectable sideline with its own theory, but it commits the knight before challenging the d5 pawn with c4 — exactly what the Queen's Gambit wants us to do.",
      e3:
        "A solid but passive move. It frees the bishop slightly and prepares c4 later, but the Queen's Gambit's power comes from playing c4 immediately, before Black can consolidate.",
      e4:
        "The Blackmar-Diemer Gambit, an aggressive 19th-century pawn sacrifice. Theoretically dubious at the top level but popular at club level. It's a gambit, just not the Queen's Gambit.",
      c3:
        "A Slav-Colle idea that simply prepares e4 or a quiet setup. It doesn't offer the c-pawn and thus isn't the Queen's Gambit at all.",
      g3:
        "The Catalan setup when combined with Nf3 and Bg2. Highly respected at the elite level, but our curriculum is studying the classical Queen's Gambit — not the Catalan's fianchetto approach.",
    },

    // ---- 1.d4 Nf6 (Indian Defence territory) ----
    Nf6: {
      c4:
        "Textbook. Black played an Indian Defence; 2.c4 is correct regardless — it claims d5 from the flank and prevents Black from ever playing ...d5 comfortably. The game may now head to a King's Indian, Nimzo-Indian, or Grünfeld, but the Queen's Gambit spirit of c4-domination is intact.",
      Nf3:
        "A flexible developer often used to avoid Nimzo-Indian theory (since ...Bb4 can no longer pin anything useful). Sound but less principled than the immediate 2.c4.",
      Bg5:
        "The Trompowsky Attack — a respected anti-Indian system that pins the knight immediately and avoids mainstream theory. Legitimate chess, but not the Queen's Gambit we're studying.",
      Bf4:
        "A London-style move against the Indian setup. Solid and popular, but the Queen's Gambit curriculum wants 2.c4.",
      Nc3:
        "Ambitious — it prepares e4 and can transpose into the Four Pawns Attack. But the principled Queen's Gambit move is still 2.c4 first, claiming d5 before committing the knight.",
      e3:
        "The Colle System begins here. A very solid club-level weapon, but it concedes the d5-pressure that defines the Queen's Gambit.",
      g3:
        "The Catalan or King's Indian fianchetto approach. Respectable at all levels but a different opening system from our Queen's Gambit curriculum.",
      c3:
        "Too quiet. The Queen's Gambit wants c4, not c3 — the whole point is to lever Black's d5 pawn away from the center.",
    },

    // ---- 1.d4 e6 ----
    e6: {
      c4:
        "Textbook. 2.c4 keeps the Queen's Gambit structure regardless of whether Black now goes ...d5 (QGD), ...f5 (Dutch Stonewall setup), or ...Nf6 (Nimzo-/Queen's-Indian territory). The c-pawn move is the opening's identity.",
      Nf3:
        "Flexible. This avoids the Nimzo-Indian (since ...Bb4 would no longer pin Nc3) but delays the gambit offer. Sound, just less direct than the mainline 2.c4.",
      e4:
        "The Franco-Indian or a cheeky reversed-French try. Playable as a surprise, but it abandons the Queen's Gambit idea entirely.",
      Bf4:
        "London System style. Solid and modern, but our curriculum wants the gambit offered on move two with c4.",
      Nc3:
        "Ambitious — it allows a later e4 and avoids the Nimzo-Indian, but it commits the knight before pressuring d5. 2.c4 first is cleaner.",
    },

    // ---- 1.d4 f5 (the Dutch) ----
    f5: {
      c4:
        "Perfect. Against the Dutch, 2.c4 keeps the Queen's Gambit spirit alive — claiming d5 from the flank and preparing g3 or Nc3 as a full strategic plan against Black's kingside pawn advance.",
      Nc3:
        "A fighting move that prepares e4 to challenge Black's f5 pawn immediately — the Staunton Gambit if we follow up with e4. Sharp and aggressive, though not the quieter Queen's Gambit mainline.",
      g3:
        "The main positional system against the Dutch: fianchetto the bishop to g2, where it stares at Black's weakened long diagonal. Very sound, but in our curriculum we prefer to keep the c4 Queen's Gambit structure.",
      Nf3:
        "Flexible but non-committal. Against the Dutch it's sound, but the principled Queen's Gambit move is 2.c4.",
      Bg5:
        "The Hopton Attack — an anti-Dutch sideline aiming at Black's f6 square. Fine surprise weapon, just not the Queen's Gambit plan.",
      e4:
        "The Staunton Gambit — a sharp pawn sacrifice against the Dutch. Historically famous but theoretically questionable. It's a real system but it isn't the Queen's Gambit.",
    },

    // ---- 1.d4 g6 (King's Indian / Modern setups) ----
    g6: {
      c4:
        "Textbook. 2.c4 keeps the Queen's Gambit's positional pressure and guides the game toward King's Indian or Grünfeld territory — both of which remain inside the c4 family we're studying.",
      e4:
        "An aggressive central claim that heads toward the Pirc/Modern defences with colors reversed. Sound attacking chess, but a different family from the Queen's Gambit.",
      Nc3:
        "Sensible development, often transposing into King's Indian lines. Sound, but the Queen's Gambit's identity move is 2.c4.",
      Nf3:
        "Flexible, often transposing into King's Indian fianchetto systems. Fine chess but less committal than 2.c4.",
      Bf4:
        "London System against the Modern setup. A reasonable club-level choice, but off the Queen's Gambit path.",
    },
  },

  // ==================================================================
  // LONDON SYSTEM — 1.d4. The London is a system: Bf4 goes up regardless
  // of what Black plays, so correct second moves look similar across
  // Black's replies.
  // ==================================================================
  london: {
    // ---- 1.d4 d5 ----
    d5: {
      Bf4:
        "Textbook London. The whole point of this opening is to get the dark-squared bishop outside the pawn chain before committing to e3, and 2.Bf4 does exactly that. From here the setup almost builds itself: e3, Nf3, c3, Bd3.",
      Nf3:
        "A flexible move-order choice. Many modern London players go Nf3 first to avoid certain ...c5 lines where Bf4 invites immediate queenside pressure. Sound, just less classically pure than 2.Bf4.",
      c4:
        "That was the Queen's Gambit — a more ambitious cousin of the London. Both start with d4, but the London plays a system (Bf4, e3, Nf3, Bd3) while the Queen's Gambit plays specific theory. Not our opening today.",
      e3:
        "Solid but premature. Playing e3 before Bf4 locks the dark-squared bishop inside the pawn chain — the exact mistake the London is designed to avoid.",
      Nc3:
        "Develops but commits the knight before the bishop, which is backwards for the London. Here we want Bf4 first, then Nf3, then Nc3 much later if at all — often the queen's knight goes to d2 instead.",
      Bg5:
        "That was the Hodgson Attack / Trompowsky-style move, not the London. The London's bishop wants f4, not g5 — f4 controls the e5 square that defines the whole system.",
      c3:
        "Useful later in the London — it supports d4 — but played this early it accomplishes little. The characteristic bishop move comes first.",
      g3:
        "The Catalan setup. A strong opening in its own right, but it fianchettoes the wrong bishop for our purposes. The London's soul is the dark-squared bishop on f4.",
    },

    // ---- 1.d4 Nf6 ----
    Nf6: {
      Bf4:
        "Textbook London. It doesn't matter what Black plays first; Bf4 is the move. The London's beauty is that it works against almost any setup — Indian Defences included.",
      Nf3:
        "Flexible. Modern London players sometimes go Nf3 first to avoid ...c5 tricks, then play Bf4 on move three. Sound but slightly less pure than the classical 2.Bf4 move order.",
      c4:
        "The Queen's Gambit path, not the London. Both are valid 1.d4 openings, but they ask completely different questions: the QG grabs d5 pressure, the London builds a clockwork system.",
      Bg5:
        "The Trompowsky Attack — a respected anti-Indian weapon, but it's a different opening. The London wants Bf4, not Bg5.",
      Nc3:
        "Develops the knight but commits before the bishop, which is the wrong London order. Bf4 first.",
      e3:
        "Premature. Playing e3 now locks the dark-squared bishop inside its pawn chain — the exact mistake the London's move order is built to avoid.",
      g3:
        "A King's Indian fianchetto idea — fine chess, but not the London's classical setup. The London wants the bishop on f4, not g2.",
    },

    // ---- 1.d4 e6 ----
    e6: {
      Bf4:
        "Textbook London. Black's ...e6 prepares either ...d5 (a QGD setup against our London) or ...b6 ideas. Either way our plan is the same: Bf4, e3, Nf3, Bd3, c3 — the London system doesn't care much what Black does.",
      Nf3:
        "Flexible. Against ...e6 it's a reasonable move order since Black isn't threatening anything immediate. Bf4 next move keeps everything on track.",
      c4:
        "Queen's Gambit territory, not London. Both are respected, but our curriculum is building the London's specific piece setup, which wants Bf4 first and c3 later.",
      Nc3:
        "Commits the knight too early for the London. We prefer the bishop out first on f4, then decide later whether the knight belongs on c3 or d2.",
    },

    // ---- 1.d4 f5 (Dutch) ----
    f5: {
      Bf4:
        "The London applied to the Dutch — a sound approach because Bf4 still eyes e5 and can't be attacked by Black's kingside pawns easily. Keep following the London plan: e3, Nf3, Bd3.",
      Nc3:
        "Sharper — it readies e4 to challenge f5 directly, which is a specific anti-Dutch idea rather than the London system. Sound, but we're studying the London.",
      g3:
        "The main anti-Dutch fianchetto system, targeting Black's long diagonal. Strong theory, but a completely different plan from the London.",
      c4:
        "Queen's Gambit vs. Dutch territory. Fine chess, but not what we're building here.",
      Nf3:
        "Flexible and sound. Against the Dutch the London's Bf4 is still coming; Nf3 first is a respected move order.",
      e4:
        "The Staunton Gambit. A sharp pawn sacrifice that's fun but risky. Not a London move.",
    },

    // ---- 1.d4 g6 (Modern / KID setups) ----
    g6: {
      Bf4:
        "Textbook London. Black's Modern Defence doesn't scare the London — Bf4 is still the right move, controlling e5 and aiming at c7 once Black's fianchetto is complete.",
      c4:
        "The Queen's Gambit / King's Indian path. Ambitious and theory-heavy, but outside the London system we're studying.",
      e4:
        "A Pirc/Modern fight, going into wide-open attacking chess. Sound, but the London is a system opening — this move abandons the plan entirely.",
      Nf3:
        "Flexible move order. Sound London preparation; Bf4 still comes next move.",
      Nc3:
        "Too committal this early. The London wants bishop before queen's knight.",
    },
  },

  // ==================================================================
  // ENGLISH OPENING — 1.c4. The English is a flexible, hypermodern system.
  // ==================================================================
  english: {
    // ---- 1.c4 Nf6 ----
    Nf6: {
      Nc3:
        "Textbook English. 2.Nc3 adds a piece to the d5 fight Black's knight has joined — our pawn on c4 and knight on c3 now both pressure d5 without our ever having put a pawn there. That's the hypermodern heart of the English.",
      Nf3:
        "A flexible transpositional move that keeps the English's spirit while leaving the door open to English–Indian or Réti-style structures. Perfectly sound, just less committal than 2.Nc3.",
      g3:
        "The main fianchetto English — aiming the bishop at the long diagonal where it joins the d5-pressure party. Highly respected, especially at the grandmaster level, and very much within the English family.",
      d4:
        "A transposition toward Queen's Gambit / Indian territory. Sound chess, but it abandons the English's flank philosophy for classical central occupation.",
      e4:
        "The Flick-Knife Attack / Mikenas idea — an aggressive central push that commits early. Sharp and theory-dependent; it steps outside the quiet flank-control plan of the English.",
      b3:
        "A double-fianchetto English setup. A real system, but slower and less thematic than 2.Nc3 or 2.g3. Reasonable for surprise value.",
      e3:
        "A quieter English, often transposing into a slow positional squeeze. Sound but passive — 2.Nc3 is more principled.",
      Nd5:
        "Impossible on move two — the knight can't reach d5 yet. If you meant Nc3 or Nf3, use that; if this move appeared, it likely reflects a different earlier move.",
    },

    // ---- 1.c4 e5 (the Reversed Sicilian) ----
    e5: {
      Nc3:
        "Textbook English. Black's ...e5 makes this a Reversed Sicilian — we're playing the Sicilian with White's extra tempo. 2.Nc3 is the mainline move, developing toward d5 without committing a pawn there.",
      g3:
        "The fianchetto English, a grandmaster favorite against ...e5. The bishop on g2 eyes d5 and b7 simultaneously — a quieter but deeply positional choice compared to 2.Nc3.",
      Nf3:
        "This runs into ...e4, kicking the knight and giving Black easy play. Against ...e5 the English prefers Nc3 or g3 — moves that don't invite an immediate pawn kick.",
      d4:
        "Transposition to a Queen's-Pawn position after ...exd4. It's sound but it leaves the English identity behind — we came here to play flank chess, not classical.",
      e3:
        "A slow, quiet English that prepares d4 later. Solid but it gives Black time to consolidate.",
      e4:
        "A direct transposition to the King's Pawn world — after ...exd4 ideas this becomes a form of Center Game. Not the English at all.",
      b3:
        "A double-fianchetto setup. Reasonable, but 2.Nc3 or 2.g3 are more thematic English moves against ...e5.",
    },

    // ---- 1.c4 e6 ----
    e6: {
      Nc3:
        "Textbook English. Black prepared a ...d5 push with ...e6; we respond with 2.Nc3, adding a second attacker to d5 and keeping the English's hypermodern plan.",
      Nf3:
        "A flexible Réti-style developer. Sound, and it keeps transpositions into Queen's Gambit or Catalan territory open. Less committal than 2.Nc3.",
      g3:
        "The fianchetto English. Highly respected — the bishop on g2 joins the d5-fight immediately. Strong alternative to 2.Nc3.",
      d4:
        "Transposes toward Queen's Gambit lines. Sound, but it gives up the English's flank-control identity.",
      e4:
        "A reversed French idea, awkward to play with White's extra tempo actually working against our flexibility. Not an English main line.",
    },

    // ---- 1.c4 c5 (Symmetrical English) ----
    c5: {
      Nc3:
        "Textbook. With ...c5 Black mirrored our first move, entering the Symmetrical English. 2.Nc3 adds pressure on d5 and b5; from here the game becomes a subtle dance around who breaks the symmetry first.",
      Nf3:
        "A flexible approach that may reach Réti or hedgehog structures. Sound, just less committal than 2.Nc3.",
      g3:
        "The fianchetto Symmetrical English — extremely common at the top level. The bishop on g2 adds pressure on the long diagonal and fits the opening's flank philosophy perfectly.",
      d4:
        "A sharp central break, transposing into an Anti-Benoni or Queen's-Pawn territory. Strong but abandons the symmetrical dance.",
      e3:
        "A slow, quiet English that prepares d4 later. Playable but passive — breaking symmetry with an active move is usually better.",
      b3:
        "A double-fianchetto Symmetrical English. Deeply positional and respected, though less common than 2.Nc3 or 2.g3.",
      e4:
        "The Botvinnik System idea — ambitious but it commits the center early. Playable but moves beyond the English's usual flexible spirit.",
    },
  },
};

// ---------------------------------------------------------------------
// Fallbacks. Used when the exact triple isn't in the table.
// ---------------------------------------------------------------------

// When we know the Black reply but not the White second move, we can still
// give opening-aware advice pointing toward the reply's known theory.
export const SECOND_MOVE_REPLY_FALLBACK = {
  italian: {
    e5: "Black went into the e5 classical fight, exactly where the Italian wants to live. The mainline second move is 2.Nf3 — it attacks e5 immediately and develops toward quick castling.",
    c5: "Black played the Sicilian, so the Italian itself is off the table. The principled mainline is 2.Nf3, heading into an Open Sicilian where rapid development and an eventual d4 break are the plan.",
    e6: "Black played the French Defence. The Italian is out of reach, but the principled response is 2.d4 — claim the center before Black can challenge it with ...d5.",
    c6: "Black played the Caro-Kann. The Italian is not available today, but 2.d4 is the correct classical reply, staking central ground before Black finishes the ...d5 plan.",
  },
  ruyLopez: {
    e5: "Black entered classical e-pawn territory where the Ruy Lopez lives. The mainline second move is 2.Nf3, attacking e5 and preparing the Ruy's signature bishop move on move three.",
    c5: "Black's Sicilian rules out the Ruy Lopez, but 2.Nf3 is still the principled reply — it heads into an Open Sicilian where mainstream theory takes over.",
    e6: "Black's French Defence takes us off the Spanish path. The principled reply is 2.d4, claiming the center before Black's ...d5 challenge arrives.",
    c6: "Black played the Caro-Kann. Not a Ruy position, but 2.d4 is the classical principled answer — grab the center first.",
  },
  queensGambit: {
    d5: "Black accepted the central symmetry we asked for. The defining Queen's Gambit move is 2.c4 — offer the c-pawn and fight for d5 from the flank.",
    Nf6: "Black entered Indian Defence territory. 2.c4 is still correct — it keeps d5 under pressure no matter which Indian system Black chooses next.",
    e6: "Black played a flexible ...e6 setup. 2.c4 keeps the Queen's Gambit structure intact and forces Black to commit before we do.",
    f5: "Black chose the Dutch Defence. 2.c4 is still the principled Queen's Gambit move, maintaining d5-pressure; 2.g3 is the main positional alternative.",
    g6: "Black chose a Modern/King's-Indian setup. 2.c4 is still correct — it keeps the Queen's Gambit structure alive through the transposition.",
  },
  london: {
    d5: "Black gave us a classical pawn structure to work with. The London's trademark second move is 2.Bf4 — get the dark-squared bishop outside the pawn chain before committing to e3.",
    Nf6: "Black chose an Indian setup. The London's answer is the same as always: 2.Bf4, because this opening is a system, not a sequence of specific responses.",
    e6: "Black played flexibly. The London's response is unchanged: 2.Bf4, anchoring the bishop on its best diagonal.",
    f5: "Black played the Dutch. The London still wants 2.Bf4, keeping the bishop outside the pawn chain and eyeing e5.",
    g6: "Black played the Modern. The London's plan is unchanged — 2.Bf4 first, then e3, Nf3, Bd3, c3 as the system's five-piece setup comes together.",
  },
  english: {
    Nf6: "Black entered Indian territory. The English's principled response is 2.Nc3, adding a second piece to the d5 fight without ever putting a pawn there.",
    e5: "Black's ...e5 turns this into a Reversed Sicilian. 2.Nc3 and 2.g3 are the two mainline English replies — both keep the flank-control philosophy intact.",
    e6: "Black played a flexible ...e6 setup. The English's answer is 2.Nc3, joining the d5 battle with a second piece.",
    c5: "Black mirrored into the Symmetrical English. 2.Nc3 or 2.g3 are the two main paths — both press on d5 from the flank, consistent with the opening's spirit.",
  },
};

// When we don't recognize Black's reply at all (rare — someone played a
// sideline like ...a6 or ...Nh6), we still want something opening-flavored.
export const SECOND_MOVE_OPENING_FALLBACK = {
  italian:
    "Black's reply was off the beaten path, which is a small gift — our principled plan is unchanged. Develop knights before bishops, put a pawn in the center if we haven't already, and prepare to castle. In the Italian that usually means 2.Nf3.",
  ruyLopez:
    "Black's reply was unusual, which gives us a free hand. Stick to Ruy Lopez principles: 2.Nf3 to develop and pressure e5 (if it's there), then Bb5 on move three.",
  queensGambit:
    "Black's reply was unusual. The Queen's Gambit's spirit is still right: 2.c4 claims d5 from the flank regardless of what Black has played.",
  london:
    "Black's reply was unusual — but the London doesn't really care. 2.Bf4 is the system's defining move against almost anything Black plays.",
  english:
    "Black's reply was unusual, which is fine — the English is built to handle offbeat play. 2.Nc3 or 2.g3 both keep the flank-pressure philosophy intact.",
};

// Absolute last resort — used only if we have no opening context at all.
export const SECOND_MOVE_FALLBACK =
  "Second moves are where opening plans start to crystallize. The core questions are the same as on move one: did this move fight for the center, develop a piece, or help prepare castling? A move that does none of those is usually a wasted tempo.";
