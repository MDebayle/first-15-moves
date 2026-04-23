/*
 * Piece-role chart — the universal fallback reference for the coach.
 *
 * This file encodes the full "cast list" report: every White unit (all 8
 * pawns + 6 piece types) × all 5 opening systems, with each unit classified
 * into one of four roles:
 *
 *   "lead"    — one of the opening's defining early units (first 3-5 moves)
 *   "support" — important early, mainly because it helps the structure or
 *               the lead actors
 *   "reserve" — often powerful precisely because it stays flexible or waits
 *   "avoid"   — usually best left alone in the first 3-5 moves unless there
 *               is a very specific reason
 *
 * Why this file exists:
 *   The coach has hand-crafted advice modules for the bishops, knights,
 *   pawns, and queen. When a move isn't covered by any of those (e.g., a
 *   rook lift or king walk), the coach needs a SMART fallback — not
 *   generic "okay move" text. This module provides:
 *
 *     1. A universal role lookup for every (opening, piece/pawn) combo
 *     2. A role-aware teaching line factory
 *     3. Helpers to name the opening's "lead actors", "support actors",
 *        and "do-not-touch-early" units for the "Your Move" card
 *
 * Source: the full comparative chart across all five openings, keyed by
 * the report's Part I per-opening tables.
 */

// ---------------------------------------------------------------------------
// PIECE_ROLES[openingId][pieceKey] = role
//
// Piece keys follow chess.js piece types (k, q, r, b, n, p). For squares
// where the role depends on which side of the board the piece started from
// (c1 vs f1 bishop, b1 vs g1 knight, a1 vs h1 rook), we use composite keys
// like "b:c1", "n:b1", "r:a1". For pawns we use "p:<file>".
//
// When a move looks up a role, we try the composite key first (for pieces
// that came from a known home square), then fall back to the simple piece
// type (for pieces that have moved already).
// ---------------------------------------------------------------------------

export const PIECE_ROLES = {
  italian: {
    "k": "reserve",
    "q": "reserve",
    "r:a1": "avoid",
    "r:h1": "reserve",
    "r": "reserve",              // after a rook has moved
    "b:c1": "reserve",           // queenside bishop (dark-squared)
    "b:f1": "lead",              // kingside bishop (Bc4)
    "b": "support",              // generic bishop fallback
    "n:b1": "reserve",           // queenside knight (waits for c-pawn)
    "n:g1": "lead",              // kingside knight (Nf3)
    "n": "support",              // generic knight fallback
    "p:a": "avoid",
    "p:b": "avoid",
    "p:c": "support",            // c3 supports d4
    "p:d": "support",            // d4 is the break
    "p:e": "lead",               // e4 is the opening
    "p:f": "avoid",
    "p:g": "avoid",
    "p:h": "avoid",
  },

  queensGambit: {
    "k": "reserve",
    "q": "reserve",
    "r:a1": "avoid",
    "r:h1": "reserve",
    "r": "reserve",
    "b:c1": "lead",              // c1 bishop is a major issue (Bg5/Bf4)
    "b:f1": "support",
    "b": "support",
    "n:b1": "support",           // Nc3 supports d4/c4
    "n:g1": "support",           // Nf3 supports shell
    "n": "support",
    "p:a": "avoid",
    "p:b": "reserve",
    "p:c": "lead",               // c4 defines the QG
    "p:d": "lead",               // d4 is foundation
    "p:e": "support",            // e3 reinforces structure
    "p:f": "avoid",
    "p:g": "reserve",            // Catalan deviations
    "p:h": "avoid",
  },

  ruyLopez: {
    "k": "reserve",
    "q": "reserve",
    "r:a1": "avoid",
    "r:h1": "reserve",
    "r": "reserve",
    "b:c1": "reserve",
    "b:f1": "lead",              // Bb5
    "b": "support",
    "n:b1": "reserve",           // waits for c3 decision
    "n:g1": "lead",              // Nf3
    "n": "support",
    "p:a": "avoid",
    "p:b": "avoid",
    "p:c": "support",            // c3 supports d4 break
    "p:d": "support",            // d4 or d3 depending on line
    "p:e": "lead",               // e4 defines
    "p:f": "avoid",
    "p:g": "avoid",
    "p:h": "reserve",            // h3 has later prophylactic use
  },

  english: {
    "k": "reserve",
    "q": "reserve",
    "r:a1": "avoid",
    "r:h1": "reserve",
    "r": "reserve",
    "b:c1": "reserve",           // conditional: Bb2/Bf4/Bg5 depending on structure
    "b:f1": "support",           // Bg2 in fianchetto lines
    "b": "support",
    "n:b1": "support",           // Nc3 once c-pawn has moved
    "n:g1": "support",           // Nf3 with flexible timing
    "n": "support",
    "p:a": "avoid",
    "p:b": "reserve",            // sometimes b3/Bb2
    "p:c": "lead",               // c4 defines
    "p:d": "reserve",            // deliberately flexible
    "p:e": "reserve",            // deliberately flexible
    "p:f": "avoid",
    "p:g": "support",            // g3 is signature support
    "p:h": "avoid",
  },

  london: {
    "k": "reserve",
    "q": "reserve",
    "r:a1": "avoid",
    "r:h1": "reserve",
    "r": "reserve",
    "b:c1": "lead",              // Bf4 defines the London
    "b:f1": "support",           // Bd3 or Be2
    "b": "support",
    "n:b1": "support",           // Nbd2 (keeps c3 free)
    "n:g1": "support",           // Nf3 anchors shell
    "n": "support",
    "p:a": "avoid",
    "p:b": "reserve",
    "p:c": "support",            // c3 shell stone
    "p:d": "lead",               // d4 anchors
    "p:e": "support",            // e3 shell stone (near-lead)
    "p:f": "avoid",
    "p:g": "reserve",
    "p:h": "reserve",
  },
};

// ---------------------------------------------------------------------------
// Opening metadata used in role-aware teaching lines.
// The "cast" summary is the cleanest-possible version (Part VI of the report).
// ---------------------------------------------------------------------------

export const OPENING_CAST = {
  italian: {
    name: "Italian Game",
    identity: "a first-wave development opening — one pawn (e4), one knight (Nf3), one bishop (Bc4), then central support",
    leads: ["the e-pawn (e4)", "the kingside knight (Nf3)", "the kingside bishop (Bc4)"],
    supports: ["the c-pawn (c3)", "the d-pawn (d4)"],
    reserves: ["the queen", "the c1 bishop", "the b1 knight"],
  },
  queensGambit: {
    name: "Queen's Gambit Declined",
    identity: "a pawn-structure opening first and a piece-activity opening second",
    leads: ["the d-pawn (d4)", "the c-pawn (c4)", "the c1 bishop problem"],
    supports: ["the e-pawn (e3)", "both knights (Nf3 and Nc3)", "the f1 bishop"],
    reserves: ["the queen", "the b-pawn"],
  },
  ruyLopez: {
    name: "Ruy Lopez",
    identity: "the Italian's more strategic cousin — same cast, different bishop meaning (Bb5 pins instead of Bc4 attacks)",
    leads: ["the e-pawn (e4)", "the kingside knight (Nf3)", "the kingside bishop (Bb5)"],
    supports: ["the c-pawn (c3)", "the d-pawn (d4 or d3)"],
    reserves: ["the queen", "the c1 bishop", "the b1 knight", "the h-pawn slightly"],
  },
  english: {
    name: "English Opening",
    identity: "the opening of flexibility and reserve — not moving a unit can itself be strategic",
    leads: ["the c-pawn (c4)"],
    supports: ["Nc3", "g3 and Bg2", "sometimes b3 and Bb2"],
    reserves: ["the queen", "the d-pawn", "the e-pawn", "several minor-piece choices"],
  },
  london: {
    name: "London System",
    identity: "a system-shell opening — one lead pawn, one lead bishop, and a cluster of support units",
    leads: ["the d-pawn (d4)", "the c1 bishop (Bf4)"],
    supports: ["the e-pawn (e3)", "the c-pawn (c3)", "both knights", "the f1 bishop"],
    reserves: ["the queen", "the h-pawn"],
  },
};

// ---------------------------------------------------------------------------
// Role-copy: short human-readable phrasing for each role.
// ---------------------------------------------------------------------------

const ROLE_COPY = {
  lead: {
    noun: "lead actor",
    verb: "a defining early move",
    praise: "one of the opening's defining pieces",
    neutral: "one of the opening's lead actors",
    critique: "moving a lead actor badly damages the opening's entire plan",
  },
  support: {
    noun: "support piece",
    verb: "a structural support move",
    praise: "a key supporter of the opening's structure",
    neutral: "a supporting piece whose job is to brace the lead actors",
    critique: "a support piece needs to support — pointing it away from the center or the lead actors wastes its role",
  },
  reserve: {
    noun: "reserve piece",
    verb: "usually held back",
    praise: "one of the opening's reserve units — its power often lies in waiting",
    neutral: "a reserve piece whose flexibility is part of the opening's power",
    critique: "moving a reserve piece too early can cost the flexibility the opening depends on",
  },
  avoid: {
    noun: "a unit that's usually left alone",
    verb: "rarely moved in the first 3-5",
    praise: "this unit doesn't usually have an early role",
    neutral: "this unit is usually left alone in the first 3-5 moves",
    critique: "this unit shouldn't usually move early — it's not part of the opening's cast",
  },
};

// ---------------------------------------------------------------------------
// Unit display names for the fallback copy.
// ---------------------------------------------------------------------------

const UNIT_NAME = {
  "k": "the king",
  "q": "the queen",
  "r:a1": "the a1 rook",
  "r:h1": "the h1 rook",
  "r": "the rook",
  "b:c1": "the c1 bishop",
  "b:f1": "the f1 bishop",
  "b": "the bishop",
  "n:b1": "the b1 knight",
  "n:g1": "the g1 knight",
  "n": "the knight",
  "p:a": "the a-pawn",
  "p:b": "the b-pawn",
  "p:c": "the c-pawn",
  "p:d": "the d-pawn",
  "p:e": "the e-pawn",
  "p:f": "the f-pawn",
  "p:g": "the g-pawn",
  "p:h": "the h-pawn",
};

// ---------------------------------------------------------------------------
// Core role-lookup primitives
// ---------------------------------------------------------------------------

/**
 * Build the role-lookup key for a move.
 *   - Pawns:  "p:<file>"  (from the `from` square's file)
 *   - Pieces: "<type>:<home-square>" if move.from is the piece's home
 *             square; else just "<type>"
 *
 * Home squares for White (pieces that have distinct per-side roles):
 *   c1 bishop, f1 bishop, b1 knight, g1 knight, a1 rook, h1 rook.
 * The queen and king don't need per-side composite keys.
 */
export function roleKeyForMove(moveObj) {
  if (!moveObj || !moveObj.piece) return null;
  const type = moveObj.piece; // "p","n","b","r","q","k"
  const from = moveObj.from || "";

  if (type === "p") {
    const file = from[0];
    return file ? `p:${file}` : null;
  }

  const HOMES = {
    b: new Set(["c1", "f1"]),
    n: new Set(["b1", "g1"]),
    r: new Set(["a1", "h1"]),
  };

  if (HOMES[type] && HOMES[type].has(from)) {
    return `${type}:${from}`;
  }

  return type;
}

/**
 * Look up the role for a move in a given opening.
 *   1. Try the composite key (e.g., "b:c1")
 *   2. Fall back to the bare piece type
 *   3. Return null if nothing is registered
 */
export function roleForMove({ moveObj, openingId }) {
  if (!openingId) return null;
  const roles = PIECE_ROLES[openingId];
  if (!roles) return null;

  const key = roleKeyForMove(moveObj);
  if (!key) return null;

  // Try composite key first, then bare type
  if (roles[key] != null) return { role: roles[key], key };
  const bare = key.includes(":") ? key.split(":")[0] : key;
  if (roles[bare] != null) return { role: roles[bare], key: bare };
  return null;
}

// ---------------------------------------------------------------------------
// Coach teaching-line factory (main API for the verdict fallback)
// ---------------------------------------------------------------------------

/**
 * buildRoleAwareLine({ moveObj, openingId, verdictClass })
 *
 * Returns a short opening-aware sentence for the coach's Effect line
 * when none of the hand-crafted advice modules fired.
 *
 *   verdictClass — optional "book"|"theory"|"good"|"playable"|"inaccuracy"|
 *                  "mistake"|"blunder". Used to pick praise vs critique tone.
 *
 * Returns null when we can't classify the unit in this opening.
 */
export function buildRoleAwareLine({ moveObj, openingId, verdictClass }) {
  const info = roleForMove({ moveObj, openingId });
  if (!info) return null;
  const { role, key } = info;

  const cast = OPENING_CAST[openingId];
  const openingName = (cast && cast.name) || "this opening";
  const unitName = UNIT_NAME[key] || UNIT_NAME[key.split(":")[0]] || "this unit";
  const copy = ROLE_COPY[role];
  if (!copy) return null;

  // Verdict-class informs the tone: praise for good moves, critique for bad.
  const isPraise = verdictClass === "book" || verdictClass === "theory" || verdictClass === "good";
  const isCritique = verdictClass === "inaccuracy" || verdictClass === "mistake" || verdictClass === "blunder";

  // Lead-actor + praise → celebrate. Avoid-unit + critique → firm.
  if (role === "lead" && isPraise) {
    return `${capitalize(unitName)} is ${copy.praise} in the ${openingName} — moves that activate it well are usually worth playing.`;
  }
  if (role === "avoid" && isCritique) {
    return `${capitalize(unitName)} is not part of the ${openingName}'s early cast — ${copy.critique}. Redirect to a lead actor or a support piece instead.`;
  }

  // Neutral tone: describe the unit's role in the opening.
  return `${capitalize(unitName)} is ${copy.neutral} in the ${openingName}. ${buildRoleTail(role, openingId)}`;
}

function buildRoleTail(role, openingId) {
  const cast = OPENING_CAST[openingId];
  if (!cast) return "";
  if (role === "lead") {
    return `The ${cast.name}'s lead actors are ${listPhrase(cast.leads)} — plan around keeping them active and coordinated.`;
  }
  if (role === "support") {
    return `Its job is to brace ${listPhrase(cast.leads)} — make sure this move serves that purpose.`;
  }
  if (role === "reserve") {
    return `The ${cast.name} is **${cast.identity}** — reserve units pay off most when they wait for the structure to clarify.`;
  }
  if (role === "avoid") {
    return `Prefer moves involving ${listPhrase(cast.leads)} or ${listPhrase(cast.supports)}.`;
  }
  return "";
}

// ---------------------------------------------------------------------------
// "Your Move" enrichment — suggests an opening-specific next step that
// names a concrete lead/support piece the student hasn't deployed yet.
// ---------------------------------------------------------------------------

/**
 * buildNextActorSuggestion({ openingId, history, nextPly })
 *
 * Returns a short opening-aware follow-up line that names a specific
 * lead/support unit the student still hasn't moved. Returns null if all
 * the obvious early actors are already on their squares.
 *
 *   history — array of SAN strings (both colors)
 *   nextPly — the upcoming ply (White's next move number is Math.ceil(nextPly/2))
 */
export function buildNextActorSuggestion({ openingId, history, nextPly }) {
  const cast = OPENING_CAST[openingId];
  if (!cast) return null;

  // Pull the White moves' SAN history
  const whiteSan = [];
  if (Array.isArray(history)) {
    for (let i = 0; i < history.length; i += 2) {
      if (history[i]) whiteSan.push(history[i]);
    }
  }
  const played = new Set(whiteSan);

  // Build a per-opening "suggested next actor" plan. Priority: moves that
  // deploy lead actors the student hasn't played yet, then support actors.
  const plans = {
    italian: [
      { test: () => !played.has("e4"),                                 line: "Stake the center with **e4** — the e-pawn is the Italian's lead actor." },
      { test: () => !hasMoved("Nf3", played),                          line: "Develop **Nf3** next — the g1 knight is one of the Italian's three lead actors, and Nf3 does every job at once (center, castling, coordination)." },
      { test: () => !hasMoved("Bc4", played),                          line: "Bring out **Bc4** — the f1 bishop on c4 is the Italian's identity move, eyeing f7 and activating the kingside." },
      { test: () => !played.has("O-O"),                                line: "Castle kingside as soon as the path is clear — the Italian's king belongs in the reserve role, safely behind the pieces." },
      { test: () => !played.has("c3"),                                 line: "Play **c3** to prepare the central break — the c-pawn is one of the Italian's key support pieces." },
      { test: () => !played.has("d4") && played.has("c3"),             line: "With c3 in, **d4** delivers the Italian's classical central break — c3 supports, d4 strikes." },
    ],
    queensGambit: [
      { test: () => !played.has("d4"),                                 line: "**d4** anchors the Queen's Gambit — this is the opening's foundation pawn." },
      { test: () => !played.has("c4"),                                 line: "Play **c4** next — the c-pawn is the QGD's second lead actor and the pawn the whole gambit is named for." },
      { test: () => !hasMoved("Nf3", played),                          line: "Develop **Nf3** — a key QGD support piece that reinforces d4 and prepares castling." },
      { test: () => !hasMoved("Nc3", played),                          line: "Develop **Nc3** — the b1 knight belongs on c3 in the QGD, supporting the d4+c4 center." },
      { test: () => !hasMoved("Bg5", played) && !hasMoved("Bf4", played), line: "Solve the c1 bishop problem — **Bg5** or **Bf4** gets the dark-squared bishop outside the e3 pawn chain. This is one of the QGD's most important early decisions." },
      { test: () => !played.has("e3"),                                 line: "Play **e3** to solidify the center and unblock the f1 bishop — e3 is the QGD's classical support backbone." },
      { test: () => !played.has("O-O"),                                line: "Castle kingside — the QGD rewards patient, structurally-sound king safety." },
    ],
    ruyLopez: [
      { test: () => !played.has("e4"),                                 line: "Stake the center with **e4** — the e-pawn is the Ruy's lead identity pawn." },
      { test: () => !hasMoved("Nf3", played),                          line: "Develop **Nf3** next — the g1 knight attacking e5 is half of the Ruy's pressure system." },
      { test: () => !hasMoved("Bb5", played),                          line: "Play **Bb5** — the Ruy's signature move. Bb5 pinning the c6 knight is the opening's entire strategic idea." },
      { test: () => !played.has("O-O"),                                line: "Castle kingside — the Ruy is a slow, positional opening that wants the king tucked safely away before the real pressure builds." },
      { test: () => !played.has("c3"),                                 line: "**c3** is one of the Ruy's deepest support moves — it's why the b1 knight has been waiting. Play it to prepare a future d4 break." },
      { test: () => !played.has("d4") && played.has("c3"),             line: "With c3 in, a prepared **d4** is the Ruy's classical central lever." },
    ],
    english: [
      { test: () => !played.has("c4"),                                 line: "Play **c4** — the c-pawn is the English's sole lead actor, pressuring d5 from the flank." },
      { test: () => !hasMoved("Nc3", played),                          line: "Develop **Nc3** — a key English support piece that controls d5 and e4." },
      { test: () => !played.has("g3"),                                 line: "Play **g3** to prepare the Bg2 fianchetto — g3 is the English's signature support move." },
      { test: () => !hasMoved("Bg2", played),                          line: "Fianchetto the bishop with **Bg2** — paired with c4, it creates the hypermodern pressure the English is built on." },
      { test: () => !hasMoved("Nf3", played),                          line: "Develop **Nf3** — a flexible English support piece. Unlike the Italian/Ruy, the English gives you timing choices here." },
      { test: () => !played.has("O-O"),                                line: "Castle kingside — the English rewards patience before committing to a central break." },
      { test: () => true,                                              line: "Remember: in the English, the d- and e-pawns are **reserve** units. Their delay is the opening's power — don't push d4 or e4 without a concrete reason." },
    ],
    london: [
      { test: () => !played.has("d4"),                                 line: "**d4** anchors the London System — this is the opening's lead pawn." },
      { test: () => !hasMoved("Nf3", played),                          line: "Develop **Nf3** — a core shell piece in the London's piece coordination." },
      { test: () => !hasMoved("Bf4", played),                          line: "Play **Bf4** — the London's second lead actor. The c1 bishop on f4 must come out **before** e3 so it stays outside the pawn chain." },
      { test: () => !played.has("e3"),                                 line: "Play **e3** — the second stone in the London's three-pawn shell. Only after Bf4 is out." },
      { test: () => !played.has("c3"),                                 line: "Play **c3** — the third shell stone. d4-e3-c3 locked together is the London's foundation." },
      { test: () => !hasMoved("Bd3", played) && !hasMoved("Be2", played), line: "Develop the f1 bishop to **Bd3** (or Be2) — the London's light-squared support piece." },
      { test: () => !hasMoved("Nbd2", played),                         line: "Bring the b1 knight to **Nbd2** — keeping c3 free is exactly why the London's queenside knight waits." },
      { test: () => !played.has("O-O"),                                line: "Castle kingside — the London rewards completing the shell first, then tucking the king away." },
    ],
  };

  const plan = plans[openingId];
  if (!plan) return null;
  for (const step of plan) {
    try {
      if (step.test()) return step.line;
    } catch (_) { /* best-effort */ }
  }
  return null;
}

// Loose check: has White played any move starting with the given SAN prefix?
// Useful because e.g. "Nf3" may appear as "Nf3+" or "Nf3#" or "Nbf3" via
// disambiguation. We match the piece + destination pattern.
function hasMoved(targetSan, playedSet) {
  if (!playedSet) return false;
  if (playedSet.has(targetSan)) return true;
  // Look for disambiguated/annotated variants
  const type = targetSan[0];      // "N","B","R","Q","K"
  const dest = targetSan.slice(-2); // "f3","c4", etc.
  for (const san of playedSet) {
    if (san.length < 3) continue;
    if (san[0] !== type) continue;
    const d = san.replace(/[+#!?]+$/, "").slice(-2);
    if (d === dest) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function listPhrase(items) {
  if (!items || !items.length) return "the opening's lead actors";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
}
