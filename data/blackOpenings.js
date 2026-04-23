/*
 * Black defences — an informal reference database for the "Notes on
 * Opponent's Opening" section.
 *
 * Why this file exists:
 *   Stockfish is the Black engine. It plays serious opening theory from
 *   move 1, but the student has no idea what opening Stockfish is steering
 *   toward. This file encodes the signature moves of the major Black
 *   defences so a simple pattern-matcher can identify (or make an educated
 *   guess about) what Black is up to and clue the student in to the theory
 *   they're facing.
 *
 * Structure:
 *   Each entry is an opening record with:
 *     id          unique string
 *     name        human-readable display name
 *     family      which White first move it answers ('e4', 'd4', 'c4',
 *                 'any', 'Nf3')
 *     signature   array of move predicates. ALL must match for the
 *                 engine to claim a confident identification.
 *                 Each predicate is { ply, color, test(san) }.
 *     supporting  array of optional-but-consistent predicates that raise
 *                 confidence when they match.
 *     disqualifiers array of predicates that, if any matches, rule the
 *                 opening out.
 *     blurb       1–2 sentence teaching paragraph — authoritative and
 *                 specific, avoiding generic fluff.
 *     nextMoves   1–2 sentences on what Black typically plays next, so
 *                 the student knows what theory Stockfish is steering
 *                 toward.
 *     specificity priority weight — when several openings match, higher-
 *                 specificity entries (e.g. "Najdorf" over "Sicilian")
 *                 win. Use 0 for broad umbrellas, 1 for named defences,
 *                 2 for named sub-variations.
 *
 * How the engine uses it:
 *   See js/identifyBlackOpening.js. For each entry we check all predicates
 *   against the move history. We compute a confidence score and then pick
 *   the highest-specificity confident match. If no confident match exists,
 *   we fall back to the broadest family identification or to "Black hasn't
 *   committed to a named system yet."
 *
 * Ply conventions (chess.js 1-indexed in history terms, but here we use the
 * "ply" counter the app uses: ply 1 = White move 1, ply 2 = Black move 1,
 * ply 3 = White move 2, ply 4 = Black move 2, ...).
 */

// Small predicate helpers. Each returns a { ply, color, test } object.
const B = (ply, san) => ({ ply, color: "b", test: (s) => s === san });
const BIN = (ply, sans) => ({ ply, color: "b", test: (s) => sans.includes(s) });
const W = (ply, san) => ({ ply, color: "w", test: (s) => s === san });
const WIN = (ply, sans) => ({ ply, color: "w", test: (s) => sans.includes(s) });
// Matches any move at (ply, color) — useful for "we don't care what happened here".
const ANY = (ply, color) => ({ ply, color, test: () => true });

export const BLACK_OPENINGS = [
  // ================================================================
  // RESPONSES TO 1.e4
  // ================================================================

  // ---- Open Games (1.e4 e5) umbrella and children --------------------
  {
    id: "open_game",
    name: "Open Game (1.e4 e5)",
    family: "e4",
    signature: [B(2, "e5")],
    supporting: [],
    disqualifiers: [],
    specificity: 0,
    blurb:
      "Black answered 1.e4 with the classical 1...e5 — the oldest and most direct reply in chess. This is the starting square for a whole family of openings: Italian, Ruy Lopez, Scotch, Vienna, Petrov, Philidor, King's Gambit, and more. Which one we see depends on what both sides play next.",
    nextMoves:
      "Watch for ...Nc6 (Italian / Ruy territory), ...Nf6 (the Petrov), or ...d6 (the Philidor). Each leads to a very different style of game.",
  },
  {
    id: "petrov",
    name: "Petrov Defence (Russian Defence)",
    family: "e4",
    signature: [B(2, "e5"), W(3, "Nf3"), B(4, "Nf6")],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Petrov — also called the Russian Defence — counter-attacks our e-pawn immediately instead of defending the ...e5 pawn. It's known as one of Black's most reliable drawing weapons; world champions from Karpov to Kramnik have used it to neutralize White's initiative.",
    nextMoves:
      "After 3.Nxe5 Black usually plays the key move ...d6 (the Classical Petrov) first, then recaptures on e4. Watch for ...d6 next — it's the heart of the defence.",
  },
  {
    id: "philidor",
    name: "Philidor Defence",
    family: "e4",
    signature: [B(2, "e5"), W(3, "Nf3"), B(4, "d6")],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Philidor is a solid, old-school defence where Black defends the e5 pawn with the d-pawn rather than the knight. It's passive but extremely hard to break — the dark-squared pawn chain on d6–e5 gives Black a compact, defensible structure.",
    nextMoves:
      "Expect ...Nf6, ...Be7, and a slow consolidation with ...0-0 and ...c6. The modern Philidor sometimes involves a quick ...exd4 and ...Nf6 setup known as the Black Lion.",
  },
  {
    id: "two_knights",
    name: "Two Knights Defence",
    family: "e4",
    signature: [B(2, "e5"), W(3, "Nf3"), B(4, "Nc6"), W(5, "Bc4"), B(6, "Nf6")],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Two Knights Defence is one of chess's sharpest classical lines — Black ignores the threat on f7 and counter-attacks our e-pawn with ...Nf6. It leads to tactical, wide-open positions where both sides fight for the initiative from move 4.",
    nextMoves:
      "The critical move is 4.Ng5 (attacking f7) which Black meets with ...d5 — one of the most famous moves in opening theory. Otherwise ...Bc5 or ...Be7 for normal development.",
  },
  {
    id: "giuoco_piano",
    name: "Giuoco Piano (Italian classical main line)",
    family: "e4",
    signature: [B(2, "e5"), W(3, "Nf3"), B(4, "Nc6"), W(5, "Bc4"), B(6, "Bc5")],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Giuoco Piano — Italian for 'the quiet game' — is the oldest complete answer to the Italian. Black mirrors our bishop to c5, accepting a classical fight over the center on completely equal terms.",
    nextMoves:
      "Expect ...Nf6, ...d6, and ...0-0 — a slow, symmetrical buildup. The main theoretical fight comes when White plays c3 and d4 to break open the center.",
  },
  {
    id: "ruy_morphy",
    name: "Ruy Lopez — Morphy Defence",
    family: "e4",
    signature: [B(2, "e5"), W(3, "Nf3"), B(4, "Nc6"), W(5, "Bb5"), B(6, "a6")],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Morphy Defence is the mainline answer to the Ruy Lopez and one of the most heavily analyzed positions in all of chess. Black questions the b5 bishop with ...a6 — if we retreat to a4, the critical tension of the Spanish is fully established.",
    nextMoves:
      "After 4.Ba4 expect ...Nf6 (the Closed Ruy), or sometimes ...b5 and ...Na5 (older variations). The Berlin, Open, Chigorin, Zaitsev, and Marshall all branch from here.",
  },
  {
    id: "ruy_berlin",
    name: "Ruy Lopez — Berlin Defence",
    family: "e4",
    signature: [B(2, "e5"), W(3, "Nf3"), B(4, "Nc6"), W(5, "Bb5"), B(6, "Nf6")],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Berlin Defence is the ultra-solid Ruy Lopez choice made famous by Kramnik against Kasparov in 2000 — it's the reason Kasparov lost that world championship match. Black ignores the bishop on b5 and develops the knight to its best square immediately.",
    nextMoves:
      "The critical continuation is 4.0-0 Nxe4 5.d4, leading to the famous Berlin Endgame after Black takes and queens are exchanged. Extremely drawish at the top level but still fully playable.",
  },

  // ---- Sicilian and children --------------------
  {
    id: "sicilian",
    name: "Sicilian Defence",
    family: "e4",
    signature: [B(2, "c5")],
    supporting: [],
    disqualifiers: [],
    specificity: 0,
    blurb:
      "The Sicilian Defence is the most popular and most combative answer to 1.e4 at every level. Black fights for the center asymmetrically — the c-pawn aims at d4, and Black will usually get a queenside pawn majority that fuels a long-term attack.",
    nextMoves:
      "Against 2.Nf3 expect ...d6 (Najdorf or Scheveningen setups), ...Nc6 (Sveshnikov, Taimanov, Accelerated Dragon), or ...e6 (Kan, Taimanov, Paulsen). Which one we see by move 5 will reveal the sub-variation.",
  },
  {
    id: "sicilian_najdorf",
    name: "Sicilian — Najdorf Variation",
    family: "e4",
    signature: [
      B(2, "c5"),
      W(3, "Nf3"),
      B(4, "d6"),
      W(5, "d4"),
      ANY(6, "b"),
      W(7, "Nxd4"),
      B(8, "Nf6"),
      W(9, "Nc3"),
      B(10, "a6"),
    ],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Najdorf — played by Fischer, Kasparov, and countless other champions — is often called the Cadillac of openings. The little move ...a6 prepares ...e5 or ...b5 while preventing Nb5 and Bb5 from ever being played by White. Deeply theoretical and extraordinarily sharp.",
    nextMoves:
      "Expect ...e5 (the main line), ...e6 (the Scheveningen setup), or ...g6 (the Dragon-hybrid). Each leads to an entirely different kind of middlegame.",
  },
  {
    id: "sicilian_dragon",
    name: "Sicilian — Dragon Variation",
    family: "e4",
    signature: [
      B(2, "c5"),
      W(3, "Nf3"),
      B(4, "d6"),
      W(5, "d4"),
      ANY(6, "b"),
      W(7, "Nxd4"),
      B(8, "Nf6"),
      W(9, "Nc3"),
      B(10, "g6"),
    ],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Dragon is the sharpest of all Sicilians — Black fianchettos the dark-squared bishop to g7 where it rakes the long diagonal straight at our queenside. Every Dragon game becomes a race: White attacks on the kingside with h4-h5 and Bh6, Black attacks on the queenside with ...Rc8 and ...b5.",
    nextMoves:
      "Expect ...Bg7 and ...0-0 to complete the kingside fianchetto, then ...Nc6 and ...Rc8 to begin the queenside attack.",
  },
  {
    id: "sicilian_classical",
    name: "Sicilian — Classical Variation",
    family: "e4",
    signature: [
      B(2, "c5"),
      W(3, "Nf3"),
      B(4, "Nc6"),
      W(5, "d4"),
      ANY(6, "b"),
      W(7, "Nxd4"),
      B(8, "Nf6"),
      W(9, "Nc3"),
      B(10, "d6"),
    ],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Classical Sicilian develops both knights naturally without committing to a specific pawn structure on move 4. It's flexible and sound — Black keeps open the option of transposing to a Dragon, Scheveningen, or Richter–Rauzer depending on what we do.",
    nextMoves:
      "Expect ...e6 (Scheveningen setup) or ...g6 (Dragon setup) next. The critical theoretical fight begins with 6.Bg5 (the Richter–Rauzer).",
  },
  {
    id: "sicilian_accelerated_dragon",
    name: "Sicilian — Accelerated Dragon",
    family: "e4",
    signature: [
      B(2, "c5"),
      W(3, "Nf3"),
      B(4, "Nc6"),
      W(5, "d4"),
      ANY(6, "b"),
      W(7, "Nxd4"),
      B(8, "g6"),
    ],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Accelerated Dragon gets to the fianchetto one move earlier than the regular Dragon, which avoids the dreaded Yugoslav Attack (6.Be3 / Qd2 / 0-0-0 / h4) that scores so heavily for White in classical Dragon lines. The price is allowing the Maroczy Bind with c4.",
    nextMoves:
      "Expect ...Bg7 and ...Nf6 to finish the fianchetto setup. If White plays the Maroczy Bind (c4), Black aims for a long positional squeeze.",
  },
  {
    id: "sicilian_scheveningen",
    name: "Sicilian — Scheveningen",
    family: "e4",
    signature: [
      B(2, "c5"),
      W(3, "Nf3"),
      B(4, "e6"),
      W(5, "d4"),
      ANY(6, "b"),
      W(7, "Nxd4"),
      B(8, "Nf6"),
      W(9, "Nc3"),
      B(10, "d6"),
    ],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Scheveningen is the 'small-centre' Sicilian — Black builds a flexible pawn formation with pawns on d6 and e6 that can support either ...e5 or ...d5 breaks depending on how the game develops. It's one of the most flexible and theoretically deep Sicilian setups.",
    nextMoves:
      "Expect ...Be7, ...0-0, and then ...Nc6 or ...a6. White's sharpest try is the Keres Attack with 6.g4.",
  },
  {
    id: "sicilian_alapin_reply",
    name: "Sicilian vs Alapin (2.c3)",
    family: "e4",
    signature: [B(2, "c5"), W(3, "c3")],
    supporting: [BIN(4, ["Nf6", "d5", "e6", "d6"])],
    disqualifiers: [],
    specificity: 1,
    blurb:
      "The Alapin (2.c3) is a popular anti-Sicilian that sidesteps mainstream theory by preparing d4. Black's two main replies are 2...Nf6 (attacking e4 immediately, forcing e5) and 2...d5 (striking in the center before White plays d4).",
    nextMoves:
      "If Black played ...Nf6, we'll likely see ...d5 after 3.e5 Nd5. If Black played ...d5, expect ...Nc6 and ...e6 heading toward classical development.",
  },

  // ---- French --------------------
  {
    id: "french",
    name: "French Defence",
    family: "e4",
    signature: [B(2, "e6")],
    supporting: [BIN(4, ["d5"])],
    disqualifiers: [],
    specificity: 1,
    blurb:
      "The French Defence is one of Black's most principled answers to 1.e4 — ...e6 prepares ...d5 to challenge the center directly with a supported pawn. It typically leads to a closed, maneuvering game built around a strict pawn chain and queenside counterplay with ...c5.",
    nextMoves:
      "Expect ...d5 next if it hasn't been played yet — this is the defining second move of the French. After that, the main variations (Advance, Exchange, Tarrasch, Winawer, Classical) branch on move 3 based on how we respond.",
  },
  {
    id: "french_winawer",
    name: "French — Winawer Variation",
    family: "e4",
    signature: [B(2, "e6"), W(3, "d4"), B(4, "d5"), W(5, "Nc3"), B(6, "Bb4")],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Winawer is the sharpest and most combative French variation — Black pins the c3 knight immediately and forces White to choose between accepting doubled c-pawns or allowing a rock-solid Black position. It's famous for producing extremely double-edged, tactical games.",
    nextMoves:
      "After 4.e5 (the mainline) expect ...c5, hitting the d4 pawn that now anchors White's kingside space. Black will often sacrifice long-term structural damage for dynamic play on the queenside.",
  },
  {
    id: "french_classical",
    name: "French — Classical Variation",
    family: "e4",
    signature: [B(2, "e6"), W(3, "d4"), B(4, "d5"), W(5, "Nc3"), B(6, "Nf6")],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Classical French develops the knight to its best square and challenges e4. It's the most natural and positionally sound French variation — less sharp than the Winawer but very durable, favored by players who prefer solid chess over theoretical race cars.",
    nextMoves:
      "After 4.Bg5 expect ...Be7 (the Burn) or ...dxe4 (the Rubinstein). After 4.e5 expect ...Nfd7 and ...c5.",
  },

  // ---- Caro-Kann --------------------
  {
    id: "caro_kann",
    name: "Caro-Kann Defence",
    family: "e4",
    signature: [B(2, "c6")],
    supporting: [BIN(4, ["d5"])],
    disqualifiers: [],
    specificity: 1,
    blurb:
      "The Caro-Kann is one of Black's most solid and resilient answers to 1.e4 — popular with world champions like Capablanca, Petrosian, and Karpov. Black prepares ...d5 with ...c6 so that the d-pawn is supported, avoiding the French's bad bishop problem.",
    nextMoves:
      "Expect ...d5 next. After 3.exd5 cxd5 we have the Exchange Caro (symmetrical). After 3.Nc3/Nd2 dxe4 4.Nxe4 the main lines branch on Black's 4th move: ...Bf5 (Classical), ...Nd7 (Karpov), ...Nf6 (Modern).",
  },
  {
    id: "caro_classical",
    name: "Caro-Kann — Classical Variation",
    family: "e4",
    signature: [
      B(2, "c6"),
      W(3, "d4"),
      B(4, "d5"),
      W(5, "Nc3"),
      ANY(6, "b"),
      W(7, "Nxe4"),
      B(8, "Bf5"),
    ],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Classical Caro-Kann develops the problem bishop OUTSIDE the pawn chain before playing ...e6 — solving Black's main structural headache in one stroke. It's the positionally cleanest Caro variation and has been Karpov's lifelong choice.",
    nextMoves:
      "Expect ...Nd7, ...e6, ...Ngf6, and a slow, solid consolidation. Sometimes ...h6 and ...Bh7 to reroute the bishop.",
  },

  // ---- Scandinavian --------------------
  {
    id: "scandinavian",
    name: "Scandinavian Defence",
    family: "e4",
    signature: [B(2, "d5")],
    supporting: [],
    disqualifiers: [],
    specificity: 1,
    blurb:
      "The Scandinavian challenges 1.e4 immediately in the most direct way possible. It's an honest, straightforward defence: Black either recaptures with the queen (the Mieses) or the knight (the Modern), accepting a slight structural concession for active piece play.",
    nextMoves:
      "After 2.exd5 expect ...Qxd5 (classical, queen goes to a5 after Nc3 attack) or ...Nf6 (modern, delaying recapture). The queen lines are more solid; the knight lines are trickier but risk.",
  },

  // ---- Pirc / Modern --------------------
  {
    id: "pirc",
    name: "Pirc Defence",
    family: "e4",
    signature: [B(2, "d6"), ANY(3, "w"), B(4, "Nf6")],
    supporting: [BIN(6, ["g6", "c6", "Nbd7"])],
    disqualifiers: [B(2, "e5")],
    specificity: 1,
    blurb:
      "The Pirc is a hypermodern defence — Black lets White build a big pawn center and then attacks it from a distance with knight and fianchettoed bishop. It was used extensively by Korchnoi and is one of the most fighting answers to 1.e4 available.",
    nextMoves:
      "Expect ...g6, ...Bg7, ...0-0, and then either ...c6/...Nbd7 (Classical) or ...c5 (sharp). White's most critical try is the Austrian Attack with f4.",
  },
  {
    id: "modern",
    name: "Modern Defence",
    family: "e4",
    signature: [B(2, "g6")],
    supporting: [BIN(4, ["Bg7"]), BIN(6, ["d6", "c6", "a6"])],
    disqualifiers: [],
    specificity: 1,
    blurb:
      "The Modern Defence is the Pirc's wilder cousin — Black fianchettoes the bishop immediately without first committing to ...Nf6 or a specific pawn structure. It invites White to overextend and then strikes with ...c5 or ...e5.",
    nextMoves:
      "Expect ...Bg7 and then flexible development: ...d6 and ...Nf6 (Pirc transposition), ...c5/...Nc6 (Averbakh), or ...a6/...b5 (Tiger's Modern).",
  },

  // ---- Alekhine --------------------
  {
    id: "alekhine",
    name: "Alekhine Defence",
    family: "e4",
    signature: [B(2, "Nf6")],
    supporting: [],
    disqualifiers: [],
    specificity: 1,
    blurb:
      "The Alekhine is a provocative hypermodern defence — Black attacks our e-pawn with the knight, inviting us to chase it with pawns and build a big center that Black will later undermine. It's the chess equivalent of a matador's cape.",
    nextMoves:
      "After 2.e5 the knight retreats to d5 and White plays the Four Pawns Attack (c4, d4, f4) or Modern/Exchange variations. Expect ...Nb6, ...d6, ...Bf5 or ...g6 as Black rebuilds.",
  },

  // ================================================================
  // RESPONSES TO 1.d4
  // ================================================================

  // ---- Closed Games (1.d4 d5) --------------------
  {
    id: "qgd",
    name: "Queen's Gambit Declined",
    family: "d4",
    signature: [B(2, "d5"), W(3, "c4"), B(4, "e6")],
    supporting: [],
    disqualifiers: [],
    specificity: 1,
    blurb:
      "The QGD is Black's rock-solid classical answer to the Queen's Gambit — it defends the d5 pawn with e6, accepting a slightly passive light-squared bishop in exchange for a very durable pawn structure. Used by nearly every world champion at some point in their career.",
    nextMoves:
      "Expect ...Nf6, ...Be7, and ...0-0 in short order. The main lines are the Orthodox (...Nbd7, ...c6), the Tartakower (...b6), and the Lasker (...Ne4 idea).",
  },
  {
    id: "slav",
    name: "Slav Defence",
    family: "d4",
    signature: [B(2, "d5"), W(3, "c4"), B(4, "c6")],
    supporting: [],
    disqualifiers: [],
    specificity: 1,
    blurb:
      "The Slav defends d5 with the c-pawn instead of the e-pawn — solving the French/QGD bad-bishop problem in advance. Black's light-squared bishop gets a free diagonal via f5 or g4. Very sound, very popular, very hard to break.",
    nextMoves:
      "Expect ...Nf6 and then one of the big systems: ...dxc4 and ...b5 (Slav Accepted), ...Bf5 (Classical), or ...e6 with ...Nbd7 (Semi-Slav, a Queen's Gambit Declined relative).",
  },
  {
    id: "qga",
    name: "Queen's Gambit Accepted",
    family: "d4",
    signature: [B(2, "d5"), W(3, "c4"), B(4, "dxc4")],
    supporting: [],
    disqualifiers: [],
    specificity: 1,
    blurb:
      "The Queen's Gambit Accepted grabs the pawn and concedes the center — a sound and enterprising choice. Black doesn't really intend to hold the pawn; the idea is to let White rebuild the center, then counter with ...c5 or ...e5 at the right moment.",
    nextMoves:
      "Expect ...Nf6, ...e6, ...c5 as Black hits the center. Sometimes ...b5 to cling to the gambit pawn briefly before giving it back.",
  },
  {
    id: "chigorin",
    name: "Chigorin Defence",
    family: "d4",
    signature: [B(2, "d5"), W(3, "c4"), B(4, "Nc6")],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Chigorin is an offbeat, piece-play-oriented answer to the Queen's Gambit named for 19th-century Russian champion Mikhail Chigorin. Black develops the knight to c6 immediately, accepting a compromised pawn structure for dynamic piece activity.",
    nextMoves:
      "After 3.Nc3 expect ...dxc4 or ...Nf6. After 3.Nf3 expect ...Bg4 pinning the knight — a typical Chigorin plan.",
  },
  {
    id: "albin",
    name: "Albin Countergambit",
    family: "d4",
    signature: [B(2, "d5"), W(3, "c4"), B(4, "e5")],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Albin Countergambit is a sharp pawn sacrifice against the Queen's Gambit — Black gives up a pawn for a well-placed ...d4 pawn and rapid development. Famous for the Lasker Trap, one of the most spectacular swindles in opening theory.",
    nextMoves:
      "After 3.dxe5 expect ...d4 immediately, followed by ...Nc6 and ...Bg4 or ...Bf5 for rapid development. The key threat is ...Bb4+ pinning pieces to the queen.",
  },

  // ---- Indian Defences (1.d4 Nf6 umbrella and children) --------------------
  {
    id: "indian_game",
    name: "Indian Game (1.d4 Nf6)",
    family: "d4",
    signature: [B(2, "Nf6")],
    supporting: [],
    disqualifiers: [],
    specificity: 0,
    blurb:
      "Black answered 1.d4 with the hypermodern ...Nf6 — refusing to symmetrize with ...d5 and instead controlling the center with pieces first. This is the umbrella for a whole family of openings: King's Indian, Nimzo-Indian, Queen's Indian, Grünfeld, Benoni, and more.",
    nextMoves:
      "Which Indian we see depends on our 2nd move and Black's 3rd. Watch for ...g6 (King's Indian or Grünfeld), ...e6 (Nimzo-Indian or Queen's Indian), or ...c5 (Benoni).",
  },
  {
    id: "kings_indian",
    name: "King's Indian Defence",
    family: "d4",
    signature: [B(2, "Nf6"), W(3, "c4"), B(4, "g6"), ANY(5, "w"), B(6, "Bg7")],
    supporting: [BIN(8, ["d6", "O-O", "0-0"])],
    disqualifiers: [B(4, "d5")],
    specificity: 2,
    blurb:
      "The King's Indian Defence is the great hypermodern fighting weapon — Black lets White build a big center and then blows it up with a kingside attack featuring ...f5, ...f4, and marching kingside pawns. Fischer and Kasparov used it to become world champion.",
    nextMoves:
      "Expect ...0-0 and ...d6, then ...e5 (Classical main line), ...c5 (Benoni-style), or ...Nc6 (Panno). The famous race of wings begins once White plays d5.",
  },
  {
    id: "grunfeld",
    name: "Grünfeld Defence",
    family: "d4",
    signature: [
      B(2, "Nf6"),
      W(3, "c4"),
      B(4, "g6"),
      W(5, "Nc3"),
      B(6, "d5"),
    ],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Grünfeld is the King's Indian's counter-striking cousin — rather than letting White build a center, Black challenges it with ...d5 immediately. After the critical exchange sequence, Black uses the fianchettoed bishop and queenside pawn majority as long-term weapons.",
    nextMoves:
      "After 4.cxd5 Nxd5 5.e4 Nxc3 6.bxc3, the position crystallizes: White has a big center, Black has a safe king and a clear plan of hitting d4 and c3 with ...c5 and pieces.",
  },
  {
    id: "nimzo_indian",
    name: "Nimzo-Indian Defence",
    family: "d4",
    signature: [B(2, "Nf6"), W(3, "c4"), B(4, "e6"), W(5, "Nc3"), B(6, "Bb4")],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Nimzo-Indian is one of the most respected openings in chess, period. Black pins the c3 knight to prevent e4 — a pure positional idea that fundamentally changes how the game has to be played. Used by essentially every world champion of the last hundred years.",
    nextMoves:
      "After 4.e3 (Rubinstein), 4.Qc2 (Classical), or 4.a3 (Sämisch), Black's typical plan involves ...0-0, ...d5 or ...c5, and either releasing the pin with ...Bxc3 at the right moment or maintaining it.",
  },
  {
    id: "queens_indian",
    name: "Queen's Indian Defence",
    family: "d4",
    signature: [B(2, "Nf6"), W(3, "c4"), B(4, "e6"), W(5, "Nf3"), B(6, "b6")],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Queen's Indian is the Nimzo's positional cousin — when White avoids Nc3 (to sidestep the Nimzo pin), Black fianchettos the queen's bishop to b7 instead, creating pressure on e4 from a distance. Elegant, flexible, and deeply strategic.",
    nextMoves:
      "Expect ...Bb7 next, then ...Be7 and ...0-0. The main plans involve ...d5 to simplify, or ...c5 to open the position.",
  },
  {
    id: "bogo_indian",
    name: "Bogo-Indian Defence",
    family: "d4",
    signature: [B(2, "Nf6"), W(3, "c4"), B(4, "e6"), W(5, "Nf3"), B(6, "Bb4+")],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Bogo-Indian is the light-theory version of the Nimzo — Black checks with the bishop a move earlier, simplifying into a quiet position with less memorization required. Very popular at club level precisely because of this.",
    nextMoves:
      "After 4.Bd2 expect ...Qe7 or ...a5 to maintain the bishop. After 4.Nbd2 expect ...0-0 and patient development.",
  },
  {
    id: "benoni_modern",
    name: "Modern Benoni",
    family: "d4",
    signature: [B(2, "Nf6"), W(3, "c4"), B(4, "c5"), W(5, "d5"), B(6, "e6")],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Modern Benoni is one of the most dangerous and double-edged defences in chess — Black creates immediate imbalance with ...c5 and ...e6, aiming for queenside counterplay and the famous ...b5 pawn break. Tal and Kasparov used it in their most fighting moods.",
    nextMoves:
      "After 6.exd5, expect ...d6, ...g6, ...Bg7 — the classical Benoni setup with kingside fianchetto and queenside pressure via ...a6 and ...b5.",
  },
  {
    id: "benko",
    name: "Benko Gambit",
    family: "d4",
    signature: [
      B(2, "Nf6"),
      W(3, "c4"),
      B(4, "c5"),
      W(5, "d5"),
      B(6, "b5"),
    ],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Benko Gambit offers a pawn on b5 for long-term positional compensation — open a- and b-files, a fianchettoed bishop sniping at b2, and a permanent bind on the queenside. One of the most strategically pure gambits in chess.",
    nextMoves:
      "After 4.cxb5 a6 expect ...g6, ...Bg7, ...0-0, and pressure down the queenside files. Black doesn't try to regain the pawn — the positional edge IS the compensation.",
  },

  // ---- Dutch --------------------
  {
    id: "dutch",
    name: "Dutch Defence",
    family: "d4",
    signature: [B(2, "f5")],
    supporting: [],
    disqualifiers: [],
    specificity: 1,
    blurb:
      "The Dutch is Black's most aggressive answer to 1.d4 — the f-pawn push immediately fights for the e4 square and aims at an eventual kingside attack. It's double-edged: Black accepts kingside weakening for active piece play.",
    nextMoves:
      "Expect ...Nf6 and then one of three setups: ...e6 and ...d5 (Stonewall — the fortress), ...e6 and ...Be7 (Classical), or ...g6 and ...Bg7 (Leningrad — the most dynamic).",
  },
  {
    id: "dutch_stonewall",
    name: "Dutch — Stonewall Variation",
    family: "d4",
    signature: [B(2, "f5"), ANY(3, "w"), B(4, "Nf6"), ANY(5, "w"), B(6, "e6")],
    supporting: [BIN(8, ["d5", "c6"])],
    disqualifiers: [B(6, "g6"), B(6, "Be7")],
    specificity: 2,
    blurb:
      "The Stonewall Dutch is a defensive fortress — Black builds pawns on f5, e6, d5, and c6, creating an iron grip on e4 at the cost of a bad light-squared bishop. If Black can get the knight to e4 and coordinate pieces, the kingside attack can be devastating.",
    nextMoves:
      "Expect ...d5, ...c6, ...Bd6, and ...0-0 to complete the formation. The critical question is always what to do with the c8 bishop — usually ...b6 and ...Bb7 or ...Bd7 and ...Be8-h5.",
  },
  {
    id: "englund",
    name: "Englund Gambit",
    family: "d4",
    signature: [B(2, "e5")],
    supporting: [],
    disqualifiers: [],
    specificity: 2,
    blurb:
      "The Englund Gambit is a cheeky attempt to avoid the Queen's Pawn mainlines entirely. Objectively dubious — White wins a clean pawn with 2.dxe5 — but loaded with traps for unprepared players, especially in blitz. Nearly 60% of White responses after 2.dxe5 Nc6 are imprecise.",
    nextMoves:
      "After 2.dxe5 expect ...Nc6 hitting e5, then ...Qe7 preparing ...Qb4+ traps. The main trap is 3.Nf3 Qe7 4.Bf4 Qb4+ which can win the b-pawn if White isn't careful.",
  },
  {
    id: "old_benoni",
    name: "Old Benoni Defence",
    family: "d4",
    signature: [B(2, "c5")],
    supporting: [],
    disqualifiers: [B(2, "Nf6")],
    specificity: 1,
    blurb:
      "The Old Benoni is the direct version of the Benoni — Black strikes at the center with ...c5 immediately, without first developing the knight. After 2.d5, Black typically plays ...e6 and transposes to Modern Benoni territory, or stays flexible with ...e5.",
    nextMoves:
      "After 2.d5 expect ...e6 (into Modern Benoni) or ...e5 (Czech Benoni — a slow, closed position). After 2.dxc5 Black plays ...e6 and regains the pawn.",
  },

  // ================================================================
  // RESPONSES TO 1.c4 (English Opening)
  // ================================================================
  {
    id: "english_reversed_sicilian",
    name: "Reversed Sicilian (1.c4 e5)",
    family: "c4",
    signature: [B(2, "e5")],
    supporting: [BIN(4, ["Nf6", "Nc6"])],
    disqualifiers: [],
    specificity: 1,
    blurb:
      "Black answered the English with ...e5 — a confident, classical approach that turns the game into a Sicilian with colors reversed and White's extra tempo. Black argues the extra tempo isn't enough to fundamentally change the game's character.",
    nextMoves:
      "Expect ...Nf6, ...Nc6, and setups that mirror Sicilian theory. The key theoretical question is whether the tempo matters — at GM level, usually not as much as you'd expect.",
  },
  {
    id: "english_symmetrical",
    name: "Symmetrical English (1.c4 c5)",
    family: "c4",
    signature: [B(2, "c5")],
    supporting: [],
    disqualifiers: [],
    specificity: 1,
    blurb:
      "The Symmetrical English mirrors White's first move — a flexible, hypermodern reply that often becomes a slow maneuvering battle. Whoever breaks the symmetry first usually commits to the first concrete plan.",
    nextMoves:
      "Expect ...Nc6, ...g6, ...Bg7 — a fianchetto setup that often transposes into Sicilian Reversed positions or Hedgehog structures.",
  },
  {
    id: "english_indian",
    name: "English — Anglo-Indian (1.c4 Nf6)",
    family: "c4",
    signature: [B(2, "Nf6")],
    supporting: [],
    disqualifiers: [],
    specificity: 1,
    blurb:
      "Black answered the English with ...Nf6 — the flexible Indian-style response. The game can transpose into King's Indian, Queen's Indian, or pure English territory depending on what both sides do next.",
    nextMoves:
      "If we play d4 next, expect a quick transposition to Nimzo/Queen's Indian/KID territory. If we stay with 2.Nc3, expect ...e5 (Reversed Sicilian) or ...e6.",
  },
];

// Family-level fallbacks used when no specific opening has confidently matched yet.
export const BLACK_FAMILY_FALLBACK = {
  e4: {
    name: "a 1.e4 defence",
    blurb:
      "Black is answering 1.e4 but hasn't yet committed to one of the named defences. The main families are the Open Game (1...e5), Sicilian (1...c5), French (1...e6), Caro-Kann (1...c6), Scandinavian (1...d5), Pirc (1...d6), and Modern (1...g6).",
    nextMoves:
      "Black's very next move usually reveals which family we're in — so pay close attention to what they play now.",
  },
  d4: {
    name: "a 1.d4 defence",
    blurb:
      "Black is answering 1.d4 but the opening identity isn't clear yet. The main families are the Closed Games (1...d5 — Queen's Gambit territory), the Indian Defences (1...Nf6), the Dutch (1...f5), and the Benoni (1...c5).",
    nextMoves:
      "Black's next move typically reveals the family — watch for whether Black plays ...d5, ...Nf6, ...c5, or ...f5.",
  },
  c4: {
    name: "an English Opening defence",
    blurb:
      "Black is responding to the English. The main setups are ...e5 (Reversed Sicilian — classical), ...c5 (Symmetrical — hypermodern dance), and ...Nf6 (Anglo-Indian — flexible and transpositional).",
    nextMoves:
      "Which family Black's setup drifts into usually becomes clear by move 3 or 4.",
  },
  Nf3: {
    name: "a 1.Nf3 setup",
    blurb:
      "Against the Réti-style 1.Nf3, Black has enormous flexibility — almost any classical defence is reachable by transposition. Most often we see ...d5, ...Nf6, or ...c5.",
    nextMoves:
      "Keep watching — 1.Nf3 almost always transposes into a named opening by move 3 or 4.",
  },
};

// Last-ditch fallback when we can't even identify the family.
export const BLACK_UNCATEGORIZED = {
  name: "an offbeat setup",
  blurb:
    "Black has chosen a rare or offbeat first move. These don't appear in mainstream theory — Black is either surprising us or playing by feel rather than by the book.",
  nextMoves:
    "Without a known opening to follow, treat Black's moves on their own merits: is each one fighting for the center, developing a piece, or preparing to castle?",
};
