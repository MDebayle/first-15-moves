/*
 * Opening trees for "The First 15 Moves"
 *
 * Each opening has a sequence of mainline moves plus annotated alternatives.
 * The critique engine looks up the current position by FEN-prefix
 * (piece placement + side to move, ignoring move counters) so that transpositions
 * and repeat visits to the same position are handled consistently.
 *
 * Each move entry:
 *   san         - the move in Standard Algebraic Notation
 *   label       - "mainline" | "playable" | "inaccuracy" | "mistake"
 *   why         - a one-sentence warm coach explanation
 *   concepts    - tags used for the concept score
 */

export const OPENINGS = {
  italian: {
    id: "italian",
    name: "Italian Game",
    eco: "C50",
    side: "white", // who the student plays
    tagline: "The most natural opening. A perfect starting point.",
    difficulty: "Beginner-friendly",
    intro:
      "The Italian Game is one of the oldest and friendliest openings. It teaches classical ideas: control the center, develop knights before bishops, aim the light-squared bishop at the weak f7 square, and castle quickly.",
    principles: [
      "Claim the center with pawns on e4 and d4.",
      "Develop knights before bishops.",
      "Aim your pieces at f7, the weakest square in Black's camp.",
      "Castle within the first 8 moves.",
    ],
    // Mainline played by the student (White) and computer replies (Black).
    // moves are listed as plies starting from ply 1 (White) then ply 2 (Black), etc.
    mainline: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3", "d6", "O-O", "O-O", "Re1", "a6", "Bb3", "Ba7"],
    // Alternatives keyed by ply index (1-based). The mainline move is implied.
    // Each listed move here applies to the position BEFORE that ply.
    alternatives: {
      1: [ // White's first move alternatives
        { san: "d4", label: "playable", why: "A perfectly good opening move — you're just heading into a different family of openings (the Queen's Pawn openings).", concepts: ["center", "flexible"] },
        { san: "c4", label: "playable", why: "The English Opening — solid but takes us away from the Italian Game we're studying.", concepts: ["center", "flank"] },
        { san: "Nf3", label: "playable", why: "A flexible developing move, but in the Italian we want e4 first to stake a claim in the center.", concepts: ["development"] },
        { san: "a4", label: "mistake", why: "A flank pawn move that doesn't help develop or control the center — in the opening, the center matters most.", concepts: ["center", "tempo"] },
        { san: "h4", label: "mistake", why: "This weakens your king-side without helping development. In the opening, prioritize the center.", concepts: ["king-safety", "tempo"] },
      ],
      3: [ // White ply 3, after 1.e4 e5
        { san: "Bc4", label: "playable", why: "This is the Bishop's Opening — a fine move. The Italian prefers Nf3 first to pressure e5 before developing the bishop.", concepts: ["development"] },
        { san: "Nc3", label: "playable", why: "A solid developer, but Nf3 is stronger because it attacks Black's e5 pawn while developing.", concepts: ["development"] },
        { san: "f4", label: "playable", why: "The King's Gambit — an aggressive old-school choice. Exciting, but not the quiet classical plan of the Italian.", concepts: ["initiative", "king-safety"] },
        { san: "Qh5", label: "mistake", why: "Bringing the queen out early feels attacking, but it just invites Black to develop with tempo by kicking the queen around.", concepts: ["queen-early", "tempo"] },
      ],
      5: [ // White ply 5, after 1.e4 e5 2.Nf3 Nc6
        { san: "Bb5", label: "playable", why: "That's the Ruy Lopez — an excellent alternative. In the Italian we aim the bishop at f7 with Bc4.", concepts: ["development", "target-f7"] },
        { san: "d4", label: "playable", why: "The Scotch Game. Opens the center aggressively — strong, but a different curriculum.", concepts: ["center"] },
        { san: "Nc3", label: "playable", why: "Solid development, but Bc4 fits the Italian plan of targeting f7 and preparing a quick castle.", concepts: ["development"] },
      ],
      7: [ // White ply 7, after 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5
        { san: "d3", label: "playable", why: "The Giuoco Pianissimo — very quiet and solid. c3 first is slightly more flexible because it prepares d4.", concepts: ["flexible"] },
        { san: "O-O", label: "playable", why: "King safety is always good. c3 first prepares d4 and keeps your options open.", concepts: ["king-safety"] },
        { san: "Ng5", label: "mistake", why: "This looks scary but it's premature — Black has ...d5 and you've moved the same piece twice without developing others.", concepts: ["development", "piece-moved-twice"] },
      ],
    },
    // Computer reply preferences — if the student deviates, what does the engine
    // play as Black? For deviations off mainline, we fall back to Stockfish.
    replyPolicy: "mainline-then-engine",
  },

  queensGambit: {
    id: "queensGambit",
    name: "Queen's Gambit Declined",
    eco: "D30",
    side: "white",
    tagline: "A bold pawn offer. Great for positional thinkers.",
    difficulty: "Intermediate",
    intro:
      "The Queen's Gambit is a classical opening where White offers a pawn to gain central control. The Declined is Black's most solid response. You'll learn about pawn structure, piece coordination, and the slow squeeze of classical play.",
    principles: [
      "Control the center with pawns, not just pieces.",
      "Develop knights to their natural squares (Nf3, Nc3).",
      "Don't rush — the Queen's Gambit is a long-game opening.",
      "Keep your pieces coordinated and castle on time.",
    ],
    mainline: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "Nbd7", "Rc1", "c6", "Bd3", "dxc4"],
    alternatives: {
      1: [
        { san: "e4", label: "playable", why: "A great move — it just leads to e-pawn openings instead of the Queen's Gambit we're studying here.", concepts: ["center"] },
        { san: "Nf3", label: "playable", why: "Flexible, but in the Queen's Gambit we want d4 first to claim the center with a pawn.", concepts: ["development"] },
        { san: "b3", label: "playable", why: "The Larsen Opening — playable but passive compared to staking the center with d4.", concepts: ["flank"] },
      ],
      3: [ // After 1.d4 d5
        { san: "Nf3", label: "playable", why: "A flexible developer. c4 is more ambitious — it puts the question to Black's d5 pawn right away.", concepts: ["development"] },
        { san: "Bf4", label: "playable", why: "The London System — very solid. The Queen's Gambit is more ambitious because it fights for the center immediately.", concepts: ["development"] },
        { san: "e3", label: "playable", why: "Solid but passive. c4 puts immediate pressure on Black's center.", concepts: ["center"] },
      ],
      5: [ // After 1.d4 d5 2.c4 e6
        { san: "Nf3", label: "playable", why: "Very natural — Nc3 is slightly more to the point because it also aims at d5.", concepts: ["development"] },
        { san: "cxd5", label: "playable", why: "The Exchange Variation — a different strategic plan. Nc3 keeps more tension and options.", concepts: ["pawn-structure"] },
      ],
    },
    replyPolicy: "mainline-then-engine",
  },

  ruyLopez: {
    id: "ruyLopez",
    name: "Ruy Lopez",
    eco: "C84",
    side: "white",
    tagline: "The Spanish Game. Chess's richest classical opening.",
    difficulty: "Intermediate",
    intro:
      "The Ruy Lopez, also called the Spanish Game, is the deepest and most respected 1.e4 e5 opening — played at the top of every world championship for over a century. White's bishop goes straight to b5 to pressure Black's knight and fight for the center. It's a masterclass in slow, strategic pressure.",
    principles: [
      "Pin Black's defender of e5 with Bb5.",
      "Don't rush tactics \u2014 the Ruy is a long strategic squeeze.",
      "Prepare c3 and d4 to build a strong pawn center.",
      "Castle early, then reroute the light-squared bishop along the a2\u2013g8 diagonal.",
    ],
    mainline: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O"],
    alternatives: {
      1: [
        { san: "d4", label: "playable", why: "A perfectly good opening \u2014 you just head into Queen's Pawn territory instead of the Spanish we're studying.", concepts: ["center", "flexible"] },
        { san: "c4", label: "playable", why: "The English Opening \u2014 solid but takes us away from the Ruy Lopez.", concepts: ["center", "flank"] },
        { san: "Nf3", label: "playable", why: "A flexible developer, but the Ruy wants e4 first to stake the center.", concepts: ["development"] },
        { san: "a4", label: "mistake", why: "A flank pawn move that doesn't help develop or control the center.", concepts: ["center", "tempo"] },
      ],
      3: [
        { san: "Bc4", label: "playable", why: "That's the Italian \u2014 a great opening, but in the Ruy we develop the knight first to pressure e5 before the bishop commits.", concepts: ["development"] },
        { san: "Nc3", label: "playable", why: "Solid, but Nf3 is stronger here because it attacks e5 while developing.", concepts: ["development"] },
        { san: "f4", label: "playable", why: "The King's Gambit \u2014 exciting and aggressive, but a completely different curriculum.", concepts: ["initiative", "king-safety"] },
        { san: "Qh5", label: "mistake", why: "Bringing the queen out early invites Black to develop with tempo.", concepts: ["queen-early", "tempo"] },
      ],
      5: [
        { san: "Bc4", label: "playable", why: "That's the Italian Game. In the Ruy the bishop aims at the knight on c6 to break up Black's center support.", concepts: ["development", "target-f7"] },
        { san: "d4", label: "playable", why: "The Scotch Game \u2014 strong, but opens the center before developing. The Ruy prefers slow pressure with Bb5.", concepts: ["center"] },
        { san: "Nc3", label: "playable", why: "Solid development, but Bb5 is the soul of the Ruy \u2014 it attacks Black's defender of e5.", concepts: ["development"] },
      ],
      7: [
        { san: "Bxc6", label: "playable", why: "The Exchange Variation \u2014 a respectable sideline that damages Black's pawns but surrenders the bishop pair. The main line keeps the bishop.", concepts: ["pawn-structure"] },
        { san: "Bc4", label: "inaccuracy", why: "Retreating to c4 wastes the tempo you spent on Bb5. Slide to a4 to keep pressure on c6 while staying on the long diagonal.", concepts: ["tempo"] },
      ],
      9: [
        { san: "d4", label: "playable", why: "Too early \u2014 Black's Nxe4 counter is annoying. Castle first, then prepare d4 with c3.", concepts: ["center", "king-safety"] },
        { san: "Nc3", label: "playable", why: "Solid, but castling first is cleaner \u2014 it gets the king safe before the center opens.", concepts: ["king-safety"] },
        { san: "Bxc6", label: "playable", why: "The Exchange Variation one move later \u2014 still fine, just a different strategic plan than the Closed Ruy we're learning.", concepts: ["pawn-structure"] },
      ],
    },
    replyPolicy: "mainline-then-engine",
  },

  english: {
    id: "english",
    name: "English Opening",
    eco: "A29",
    side: "white",
    tagline: "Control the center from the flank. A flexible hypermodern weapon.",
    difficulty: "Intermediate",
    intro:
      "The English Opening is a hypermodern weapon \u2014 instead of grabbing the center with a central pawn, White attacks it from the flank with c4. It's the most flexible opening in chess: you can transpose into dozens of systems, and the fianchettoed bishop on g2 gives you lasting pressure on the long diagonal. A favorite of world champions from Botvinnik to Carlsen.",
    principles: [
      "Hypermodern idea: control the center from the wings with pawns and pieces.",
      "Fianchetto the king's bishop to g2 \u2014 it rakes the long diagonal.",
      "Stay flexible \u2014 the English can transpose into many different structures.",
      "Develop naturally: Nc3, Nf3, g3, Bg2, O-O, then decide your plan.",
    ],
    mainline: ["c4", "e5", "Nc3", "Nf6", "g3", "d5", "cxd5", "Nxd5", "Bg2", "Nb6", "Nf3", "Nc6", "O-O", "Be7", "d3", "O-O"],
    alternatives: {
      1: [
        { san: "e4", label: "playable", why: "A classical choice \u2014 it just leads to e-pawn openings instead of the hypermodern English we're studying.", concepts: ["center"] },
        { san: "d4", label: "playable", why: "A solid Queen's Pawn opening, but the English stakes the center from the flank instead \u2014 a completely different plan.", concepts: ["center"] },
        { san: "Nf3", label: "playable", why: "The R\u00e9ti Opening \u2014 similar hypermodern ideas. c4 is the classical English move order.", concepts: ["development", "flank"] },
        { san: "b3", label: "playable", why: "Larsen's Opening \u2014 another hypermodern try, but less ambitious than c4.", concepts: ["flank"] },
      ],
      3: [
        { san: "Nf3", label: "playable", why: "A solid developer, but Nc3 is more thematic \u2014 it pressures Black's d5 square and supports a later e4 break.", concepts: ["development"] },
        { san: "g3", label: "playable", why: "The fianchetto move order \u2014 perfectly playable. Nc3 first keeps the center tenser.", concepts: ["development"] },
        { san: "d4", label: "playable", why: "Transposes into a Queen's Gambit line. Fine, but we're studying the pure English plan here.", concepts: ["center"] },
      ],
      5: [
        { san: "e4", label: "playable", why: "Transposes into a King's Indian Attack structure \u2014 a different but playable plan. g3 keeps the classic English setup.", concepts: ["center"] },
        { san: "e3", label: "playable", why: "The Bremen System \u2014 solid but passive. The fianchetto with g3 is more thematic and more ambitious.", concepts: ["development"] },
        { san: "Nf3", label: "playable", why: "A natural developer. In the Reversed Dragon we want g3 first so the bishop can go to g2 cleanly.", concepts: ["development"] },
      ],
      7: [
        { san: "Nf3", label: "playable", why: "A natural developer, but cxd5 first clarifies the center before Black can. That's the heart of the Reversed Dragon.", concepts: ["development"] },
        { san: "Bg2", label: "playable", why: "Developing the fianchetto bishop is fine, but cxd5 first reaches the exact structure we want.", concepts: ["development"] },
        { san: "d3", label: "inaccuracy", why: "Too passive in this position \u2014 Black's d5 push has challenged your c4 pawn. Resolve the tension with cxd5.", concepts: ["tempo", "center"] },
      ],
    },
    replyPolicy: "mainline-then-engine",
  },

  london: {
    id: "london",
    name: "London System",
    eco: "D02",
    side: "white",
    tagline: "A calm, repeatable setup. The same plan against almost anything.",
    difficulty: "Beginner-friendly",
    intro:
      "The London System is a beginner-friendly, 'system' opening — White plays the same setup against almost anything. It's perfect for learning opening principles without memorizing long theory. The bishop on f4 and pawns on c3 and d4 give you a rock-solid foundation.",
    principles: [
      "A 'system' means you play similar moves regardless of Black's response.",
      "Pawns on d4 and e3 make a solid triangle; Bf4 is outside the pawn chain.",
      "Develop Nf3, Bd3, and castle — no memorization required.",
      "Look for a later e3-e4 break when you're fully developed.",
    ],
    mainline: ["d4", "d5", "Bf4", "Nf6", "e3", "e6", "Nf3", "Bd6", "Bg3", "O-O", "Bd3", "c5", "c3", "Nc6", "Nbd2", "b6"],
    alternatives: {
      3: [ // After 1.d4 d5
        { san: "c4", label: "playable", why: "That's the Queen's Gambit — a more ambitious but theory-heavy choice. The London is simpler and calmer.", concepts: ["center"] },
        { san: "Nf3", label: "playable", why: "A flexible developer, but Bf4 is the soul of the London — get that bishop out before e3 locks it in.", concepts: ["development"] },
        { san: "e3", label: "inaccuracy", why: "Careful! Playing e3 before Bf4 locks your dark-squared bishop behind the pawn chain. Get the bishop out first.", concepts: ["bishop-trapped"] },
      ],
      5: [ // After 1.d4 d5 2.Bf4 Nf6
        { san: "Nf3", label: "playable", why: "A good developing move. e3 is the standard London order so you can develop Bd3 on the next move.", concepts: ["development"] },
        { san: "c3", label: "playable", why: "Solid, but e3 is more flexible — it lets the bishop out to d3 immediately.", concepts: ["development"] },
      ],
      7: [ // After 1.d4 d5 2.Bf4 Nf6 3.e3 e6
        { san: "Bd3", label: "playable", why: "A natural developer. In the modern London, Nf3 is preferred first to keep flexibility for the c-pawn.", concepts: ["development"] },
        { san: "c4", label: "playable", why: "A tempting try to transpose into a Queen's Gambit — but in the London, Nf3 keeps your setup consistent.", concepts: ["flexible"] },
      ],
    },
    replyPolicy: "mainline-then-engine",
  },
};

// Universal principle checks — applied to any move regardless of opening,
// to catch beginner mistakes like early queen sorties and flank pawn pushes.
export const UNIVERSAL_PRINCIPLES = {
  // Ply number below which these apply
  openingPlies: 20,

  // Early queen development (moving the queen more than once or too early)
  earlyQueenSquares: {
    white: new Set(["a4", "b5", "c4", "c5", "d5", "e5", "f3", "f5", "g4", "h4", "h5", "a5", "b4"]),
    black: new Set(["a5", "b4", "c5", "c4", "d4", "e4", "f6", "f4", "g5", "h5", "h4", "a4", "b5"]),
  },

  // Flank pawn moves in the opening (a/h files) generally unhelpful
  flankPawnFiles: new Set(["a", "h"]),
};
