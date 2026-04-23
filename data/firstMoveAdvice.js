/*
 * First-move coaching advice — 5 openings × 20 possible White first moves.
 *
 * Why this file exists:
 *   Players form a strong impression of the coach from its very first sentence.
 *   The generic plan-fit heuristic isn't specific enough to teach what the
 *   first move actually means in the context of the opening the player
 *   signed up to study. This file delivers a hand-written sentence for every
 *   combination so the coach can point directly at the theoretical idea
 *   behind each move — or explain exactly why a flank pawn push is a poor fit.
 *
 * Structure:
 *   FIRST_MOVE_ADVICE[openingId][san] = string
 *   - The `san` key matches the SAN notation chess.js reports (e.g. "Nf3", "e4").
 *   - Mainline first moves (e.g. "e4" for the Italian) are tagged as the
 *     opening's own move and receive a celebratory, teaching-forward line.
 *   - Sensible-but-off-topic moves (e.g. "d4" when studying the Italian) are
 *     treated as respectable theory choices that simply head elsewhere.
 *   - Flank-pawn and odd-knight first moves are honestly called out as weak,
 *     with a short reason tied to opening principles.
 *
 * Tone guardrails:
 *   - Authoritative first, friendly second. Never apologetic about criticizing.
 *   - Short. One to two sentences. Must fit on the verdict card cleanly.
 *   - Teach one concrete idea per line: a principle, a named opening, or a
 *     common theoretical reason.
 *   - Use the SAN of the move naturally; avoid over-using "you".
 *   - Past-conditional for non-mainline moves, present for the mainline.
 */

export const FIRST_MOVE_ADVICE = {
  // ------------------------------------------------------------------
  // ITALIAN GAME — mainline: 1.e4
  // ------------------------------------------------------------------
  italian: {
    // --- The top four most common first moves get the most crafted prose ---
    e4: "A textbook Italian start. 1.e4 is the most popular first move in chess for a reason — it claims a central square, frees the king's bishop, and opens a diagonal for the queen, all in a single stroke. Everything we'll study in the Italian begins from this exact foundation.",
    d4: "A completely respectable first move — statistically the second-most popular in master play — but it points us toward the Queen's Pawn family, not the Italian. The Italian is an e-pawn opening through and through, so the whole curriculum hinges on 1.e4 instead.",
    Nf3: "A strong, flexible developer played by many grandmasters as a move-order tool. In the Italian, though, we want a pawn in the center first. 1.e4 stakes the claim; Nf3 can always follow on move two, which is exactly what the mainline does.",
    c4: "That was the English Opening — a highly respectable flank strategy with its own deep theory. It controls d5 from the side rather than occupying e4 with a pawn, which is a completely different philosophy from the direct classical play we study in the Italian.",

    // --- Other playable pawn and knight first moves ---
    e3: "A timid cousin of 1.e4. It frees the bishop but only half-claims the center and gives up the extra space a two-square push would have grabbed. In the Italian we commit boldly with e4.",
    d3: "A modest pawn move that frees the light-squared bishop but concedes the center. The Italian is a classical opening — it wants pawns standing on e4 and eventually d4, not hovering timidly one square back.",
    c3: "Useful later in the Italian — it supports d4 — but played on move one it does nothing for the center and nothing for development. c3 is preparation, and you only prepare once the main idea is on the board.",
    b3: "That was Larsen's Opening — a hypermodern try that fianchettoes the queen's bishop. It's playable but passive compared to an e4 grab, and it has nothing to do with the Italian's e-pawn plan.",
    g3: "A hypermodern fianchetto try. Respectable in its own right, but the Italian is classical chess: we put pawns in the center and aim pieces at f7. A kingside fianchetto sets up for a completely different kind of game.",
    f3: "A weakening move that blocks the knight's best square and exposes the king's diagonal. The opening is about putting pieces on their best squares — f3 does the opposite.",
    Nc3: "A sound developing move, but in the Italian the queen's knight usually waits — we prefer to reveal our plan with 1.e4 and keep Nc3 as an option for later. Starting with a knight here just gives information away.",
    Nh3: "Technically legal, but the knight on h3 eyes no central square and blocks the h-pawn. 'Knights before bishops' is a good rule, but 'knights to good squares' is the rule behind the rule — and h3 is not a good square.",
    Na3: "Knights belong in the center. Na3 sits on the rim where it defends nothing important and attacks nothing important. There's a reason grandmasters almost never start this way.",

    // --- Flank pawn first moves — weak, honestly labeled ---
    a3: "A wasted move. a3 does nothing for the center, nothing for development, and nothing for king safety — the three jobs of the opening. In the Italian we spend our tempos far better.",
    a4: "A flank pawn push with no purpose. It ignores the center, ignores development, and gives Black a free tempo to play sensibly. The Italian is about putting that tempo to work with 1.e4.",
    h3: "A preparation move on the wrong side of the board. It's sometimes useful later to prevent ...Bg4 pins, but played first it simply burns a tempo while Black claims the initiative.",
    h4: "An aggressive-looking flank thrust that doesn't fight for the center and weakens your own kingside. Chess is won in the middle first — the wings come later.",
    b4: "The Sokolsky Opening — a genuinely offbeat try that grabs queenside space but surrenders the center. It's the kind of move that surprises club players and concedes to prepared ones. Not Italian chess at all.",
    f4: "An aggressive pawn push reminiscent of the Bird's Opening or a delayed King's Gambit idea, but played on move one it weakens the e1-h4 diagonal toward your king. The Italian is about classical control, not wild flank aggression.",
    g4: "A serious weakening of your own king's shelter. Grandmasters do play sharp g-pawn pushes, but only with heavy preparation and rarely on move one. For our purposes, this is the kind of move the coach has to gently steer you away from.",
  },

  // ------------------------------------------------------------------
  // QUEEN'S GAMBIT DECLINED — mainline: 1.d4
  // ------------------------------------------------------------------
  queensGambit: {
    // --- Top four most common ---
    d4: "A textbook Queen's Gambit start. 1.d4 stakes a central square with a pawn defended by the queen, and it prepares c4 — the gambit move itself — on the very next turn. Every idea we'll study in this opening begins from this exact pawn.",
    e4: "A beautiful move in its own right — the single most popular first move in chess — but it points us toward king-pawn openings, not the queen-side fight the Queen's Gambit is about. Our whole curriculum here begins with a d-pawn on d4.",
    Nf3: "A perfectly flexible developer, often used as a move-order trick to reach Queen's Gambit structures later. But in our curriculum we prefer the direct 1.d4 so the student sees the central claim first and the transposition game second.",
    c4: "The English Opening — a close cousin of the Queen's Gambit that also stakes a claim on d5, but from the flank rather than the center. It's respectable theory, just a different family tree from the one we're studying.",

    // --- Other playable pawns and knights ---
    d3: "A quieter sibling of 1.d4 that gives up the central two-square grab. The Queen's Gambit is about ambitious central play — d3 concedes the very idea we want to explore.",
    e3: "A modest first move associated with sidelines like the Van 't Kruijs. It neither claims the center nor develops a piece. The Queen's Gambit wants a bold d4 instead.",
    c3: "A preparatory pawn move that usually belongs on move two or three, never first. In the Queen's Gambit, the real work starts when the d-pawn takes d4.",
    b3: "Larsen's Opening — a reasonable hypermodern system, but it points away from the direct d4-c4 central battle the Queen's Gambit is built around.",
    g3: "A hypermodern setup with a kingside fianchetto. Fine in its own right, but the Queen's Gambit is a classical opening — we need a d-pawn first, and the bishop can go to its natural square later.",
    f3: "A weakening move that blocks the g1 knight's best square. The Queen's Gambit is about clean classical development — f3 is the opposite of clean.",
    Nc3: "A sound knight move, but starting with Nc3 gives away our plan. In the Queen's Gambit we'd rather play the central d4 first and keep the queenside knight flexible.",
    Nh3: "A rim knight with no central influence. 'Knights before bishops' assumes the knight goes to a useful square — h3 isn't one.",
    Na3: "The a3 knight doesn't touch a single central square. In a classical opening like the Queen's Gambit, that's the opposite of what a piece is supposed to do.",

    // --- Flank / bad pawns ---
    a3: "A do-nothing pawn move. In the opening we fight for the center, develop, and protect the king — a3 accomplishes none of those. In the Queen's Gambit it's especially wasteful.",
    a4: "A flank push that offers no central pressure and concedes a full tempo. The Queen's Gambit is about central ambition — a4 is its philosophical opposite.",
    h3: "Prophylaxis without a target. h3 can be useful later to prevent a bishop pin, but on move one it simply loses time.",
    h4: "Aggressive-looking, but it weakens your own kingside without contesting the center. The Queen's Gambit demands central play, not flank adventures.",
    b4: "The Sokolsky — an offbeat grab for queenside space that surrenders the center. The Queen's Gambit believes the center is where games are decided.",
    f4: "A Bird's Opening idea. It's a legitimate opening system, but it weakens the king's diagonal and has nothing to do with the classical d4/c4 plan we're learning.",
    g4: "A serious weakening of your own kingside shelter played with no preparation. In the Queen's Gambit we want calm, classical development — not an immediate king-side commitment.",
  },

  // ------------------------------------------------------------------
  // RUY LOPEZ — mainline: 1.e4
  // ------------------------------------------------------------------
  ruyLopez: {
    // --- Top four most common ---
    e4: "The Ruy Lopez begins here, and so does the history of modern chess theory. 1.e4 claims the center, opens lines for bishop and queen, and invites the great classical debate that's been studied for five centuries. This is exactly the move we wanted.",
    d4: "A fine opening move that points us toward the queen-side family of systems, not the Spanish. The Ruy Lopez is an e-pawn opening — everything we'll study here starts with the king's pawn stepping to e4.",
    Nf3: "A sound developer that can transpose into Ruy Lopez positions later through the Réti or King's Indian Attack. But for teaching purposes we want the classical 1.e4 first so the Spanish theme is on the board from move one.",
    c4: "The English Opening — a well-respected flank strategy. It's not wrong, it's just not the Ruy Lopez, which is built around the specific idea of pressuring e5 once Black plays it.",

    // --- Other playable pawns and knights ---
    e3: "A half-step that frees the bishop but surrenders the extra central space a full 1.e4 would have claimed. The Ruy Lopez thrives on an occupied center — e3 gives that up before the game even starts.",
    d3: "A modest move that concedes the center's tension before it ever develops. The Spanish is a fighting opening — it wants pawns on e4 and eventually d4, not passive pawn play.",
    c3: "A preparation move on the wrong turn. c3 supports d4, but without a piece in play yet, the support comes before there's anything to support.",
    b3: "Larsen's Opening. It fianchettoes a bishop, which is fine in its own hypermodern tradition, but it has no connection to the direct e-pawn fight at the heart of the Ruy Lopez.",
    g3: "A hypermodern setup. Reasonable in its own right, but the Spanish is classical chess — we claim the center with a pawn, not defer it for a bishop later.",
    f3: "A weakening first move that blocks the knight from its best square. Grandmasters avoid it for good reason — the piece we most want on f3 is the knight, not the pawn.",
    Nc3: "A reasonable developer, but in the Ruy Lopez the queenside knight generally waits. We first commit to the e-pawn advance, then decide where each knight belongs based on Black's response.",
    Nh3: "A rim knight blocks the h-pawn and controls no central square. In the Spanish, every piece earns its square — h3 is hard to earn.",
    Na3: "The a3 knight is a chess-club punchline for a reason: it defends and attacks nothing of value. Centralize your pieces.",

    // --- Flank / bad pawns ---
    a3: "A wasted first move. In the opening we fight for the center, develop pieces, and protect the king — a3 does none of those, and the Ruy Lopez has no use for it here.",
    a4: "A flank pawn push with no purpose on move one. The Ruy Lopez is about direct central play — a4 is the philosophical opposite.",
    h3: "A prophylactic move without a concrete target this early. It's a tempo burned before the game has even begun.",
    h4: "An aggressive-looking but strategically empty flank push that weakens your own kingside. The Ruy Lopez wants classical pressure on the center, not early flank adventures.",
    b4: "The Sokolsky — a genuine surprise weapon, but it gives up the center for queenside space. In the Ruy Lopez we want the exact opposite trade.",
    f4: "A sharp pawn push evocative of the King's Gambit, but it weakens the e1-h4 diagonal and has nothing to do with the Spanish's positional plan.",
    g4: "A serious weakening of your king's shelter played on the very first move. The Ruy Lopez is a deeply strategic opening — it has no room for a gambit this wild, this early.",
  },

  // ------------------------------------------------------------------
  // ENGLISH OPENING — mainline: 1.c4
  // ------------------------------------------------------------------
  english: {
    // --- Top four most common (ordered by relevance to this opening) ---
    c4: "A textbook English start. 1.c4 is the hypermodern alternative to the classical e4/d4 pawn grabs: instead of occupying the center, it controls the key d5 square from the flank and keeps White's structure flexible. This is the exact idea we're here to study.",
    e4: "A classical first move — in fact the most popular first move in chess — but it commits to central occupation rather than the flank control the English is built on. Completely sound chess, just a different philosophy from the one we're studying today.",
    d4: "A strong queen-pawn move that would have led into the Queen's Gambit and its many cousins. It's great theory, but the English takes a different path: control d5 from c4 instead of occupying it from d4.",
    Nf3: "That was the Réti Opening — a hypermodern system that shares the English's philosophy of flank control over direct occupation. Closely related, but the English's classical move order is 1.c4 first, Nf3 later.",

    // --- Other playable pawns and knights ---
    e3: "A modest pawn move that does little for the opening fight. The English wants an active flank move on c4, not a passive step with the e-pawn.",
    d3: "A timid move that concedes the center without even the benefit of flank pressure. The English is a purposeful opening — it wants c4 on move one.",
    c3: "A half-measure. c3 prepares d4 but doesn't exert the pressure on d5 that c4 does. The English is about grabbing flank influence in one confident step, not two small ones.",
    b3: "Larsen's Opening — another hypermodern try with a queenside fianchetto, but it lacks the sharp d5-pressure that makes the English so effective.",
    g3: "A fianchetto setup that usually reaches English or King's Indian Attack positions by transposition. In our curriculum we prefer the direct c4 move order so the flank idea is visible from move one.",
    f3: "A weakening move with no place in any serious opening system. The English is a sophisticated, flexible opening — f3 is its stylistic opposite.",
    Nc3: "A common move in later English lines, but playing it first gives away information and limits our pawn-structure choices. In the English move order, the c-pawn goes first.",
    Nf3: "The Réti move order — a very close relative of the English with similar flank ideas. Not wrong at all, just a different path into the same family. Our curriculum takes the pure English route.",
    Nh3: "A rim knight that does nothing the English asks of its pieces. Centralize or flank-pressure; don't do both badly at once.",
    Na3: "An eccentric knight move with no role in any standard English line. The a3 knight is almost always worse than a c-pawn push.",

    // --- Flank / bad pawns ---
    a3: "A wasted move. Even the English, a flank-oriented opening, doesn't want a3 — because c4 does the same kind of work with ten times the impact.",
    a4: "A flank push on the wrong flank. The English grabs space on the c-file; a4 just weakens the queenside light squares without accomplishing anything.",
    h3: "A prophylactic move played far too early. The English wants to strike on the queenside; h3 accomplishes nothing there.",
    h4: "An aggressive-looking but strategically empty push that weakens the kingside. The English is a sophisticated positional opening — h4 is neither.",
    b4: "The Sokolsky — a respectable surprise weapon, but in the English we want c4, not b4. The c-pawn's pressure on d5 is the entire point.",
    f4: "Bird's Opening — a legitimate system, but it heads in a completely different strategic direction from the English's flank control of d5.",
    g4: "A wild flank thrust with no preparation and no theoretical support. The English is a grandmaster's opening — g4 is a beginner's.",
  },

  // ------------------------------------------------------------------
  // LONDON SYSTEM — mainline: 1.d4
  // ------------------------------------------------------------------
  london: {
    // --- Top four most common ---
    d4: "A textbook London start. The London System is built on a simple, durable setup beginning with d4 — a pawn that stakes the center, defends e5, and prepares the signature Bf4 bishop move. Every London game starts from this exact pawn.",
    e4: "A great classical move — the most popular first move in chess — but it heads into king-pawn territory, not the quiet, system-based Queen's Pawn world the London lives in. Our London curriculum begins with 1.d4.",
    Nf3: "A flexible developer that can transpose into London structures later, but in our curriculum we prefer 1.d4 first so the characteristic pawn on d4 and the quick Bf4 idea are both visible from the very start.",
    c4: "The Queen's Gambit — a more ambitious and theory-heavy cousin of the London. Both start with 1.d4 and a c-pawn push, but the Queen's Gambit offers a pawn on move two while the London keeps things quiet and solid instead.",

    // --- Other playable pawns and knights ---
    e3: "An over-cautious move order. e3 often appears in the London on move three, but playing it first locks the dark-squared bishop in before it can reach f4 — which is the whole point of the opening.",
    d3: "A timid half-step. The London needs its d-pawn on d4 to defend e5 and anchor the system; d3 gives up the very square the opening revolves around.",
    c3: "Useful later to support d4, but played on move one it accomplishes nothing. The London wants its d-pawn first, its dark-squared bishop second, and its support moves third.",
    b3: "Larsen's Opening — a hypermodern fianchetto idea that competes with the London for the same strategic space. Both are solid setups, but they aim at different squares with different bishops.",
    g3: "A kingside fianchetto setup. Reasonable chess, but it sends the king's bishop to g2 — the London's soul is the other bishop, going to f4 via 1.d4 first.",
    f3: "A weakening first move that blocks the knight's best square and exposes the king. The London is a famously safe and solid system — f3 is the opposite of safe and solid.",
    Nc3: "A developing move that commits the queenside knight before we know our pawn structure. In the London we prefer to keep this knight flexible — often going to d2 later, not c3.",
    Nf3: "A flexible developer that sometimes appears before d4 in modern London move orders, but our curriculum keeps the classical order: d-pawn first, dark-squared bishop second, knight third.",
    Nh3: "A rim knight with no central influence. Every London piece has a clear, quiet job; h3 is not on any of them.",
    Na3: "An eccentric first move with no role in London theory. The a3 square is simply not a home for a knight in this kind of classical, system-based opening.",

    // --- Flank / bad pawns ---
    a3: "A wasted move. The London is a calm, purposeful opening — a3 has no purpose and no calm either.",
    a4: "A flank pawn move that does nothing for the London's central and piece-based plan. a4 simply hands Black the initiative for free.",
    h3: "A quiet preparation move that sometimes appears later in the London, but on move one it just burns a tempo before there's anything to prepare against.",
    h4: "An aggressive first move that contradicts the London's peaceful philosophy. The whole point of this opening is that it avoids early flank fights — h4 starts one on purpose.",
    b4: "The Sokolsky — a surprise weapon that has nothing to do with the London's steady, structure-first approach.",
    f4: "Bird's Opening. A legitimate reversed-Dutch system, but entirely off the London map. The London wants f-pawn activity much later, if at all.",
    g4: "A wild kingside lunge that weakens the king's own shelter. The London is, if anything, the least g4-ish opening in all of chess.",
  },
};

// Shared fallback advice used if some exotic SAN somehow isn't in the table.
// (Every legal White first move is covered, but this keeps the UI robust.)
export const FIRST_MOVE_FALLBACK =
  "An unusual first move. In the opening we fight for the center, develop pieces, and prepare to castle — any move that doesn't help one of those three jobs is usually a wasted tempo.";
