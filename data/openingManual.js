/*
 * The White Opening Units Manual — per-opening "identity" reference.
 *
 * Why this file exists:
 *   The first five "piece-focused" reports told the coach what each PIECE
 *   does per opening. This manual tells the coach and the student what each
 *   OPENING *is*: its theme, who its leads are, what it feels like to play,
 *   and which player will love it most. This is the engine's identity layer,
 *   used in three places:
 *
 *     1. The opening-selector cards — each card can display a short theme
 *        line and a "lead actors" note drawn from this manual.
 *     2. The Help modal — when the user has chosen an opening, the modal
 *        can render the full manual entry so they can study the identity.
 *     3. Coach fallback — when no specific piece module has something to
 *        say, the coach can append a one-line theme reminder drawn from
 *        the manual so every move still reinforces the opening's character.
 *
 * Structure:
 *   OPENING_MANUAL[openingId] — per opening, containing:
 *     theme             — one-line character statement ("the architect's game")
 *     whyProsLoveIt     — one-sentence "why masters play it"
 *     symphony:
 *       leads           — array of lead-actor piece strings
 *       supports        — array of supporting-actor piece strings
 *       reserves        — array of reserve-piece strings
 *     rhythm            — 1-2 sentence narrative of how the opening unfolds
 *     summary           — one-sentence "if you remember only one thing" line
 *     idealPlayer       — 1-sentence player profile
 *
 * Tone guardrails:
 *   - Same standing directives as the advice modules: authoritative first,
 *     warm second. No apologetic hedging.
 *   - These lines will appear in marketing-style surfaces (selector cards)
 *     as well as analysis surfaces, so they should read naturally in both.
 */

export const OPENING_MANUAL = {
  italian: {
    theme: "The clearest statement of classical principles in all of chess.",
    whyProsLoveIt:
      "Pros trust the Italian because it punishes unprincipled play directly — every beginner mistake (slow development, weak f7, ignored castling) gets converted into a concrete advantage.",
    symphony: {
      leads: ["e-pawn (e4)", "King's Knight (Nf3)", "King's Bishop (Bc4)"],
      supports: ["c-pawn (c3)", "d-pawn (d3/d4)", "King (O-O)"],
      reserves: ["Queen (quiet on d1/e2)", "a1 rook, c1 bishop, b1 knight"],
    },
    rhythm:
      "The Italian opens with a pure claim on the center (e4), develops the kingside minors toward f7 (Nf3 and Bc4), supports with c3, castles, and only then prepares the central break d4. Every move is a principle in motion.",
    summary:
      "The Italian is classical chess with the volume turned up — the fastest way to learn what good development feels like.",
    idealPlayer:
      "Best fit for the player who wants to *understand* why the first principles work before trusting them in harder openings.",
  },

  queensGambit: {
    theme: "Positional chess taught at its highest level.",
    whyProsLoveIt:
      "World champions from Capablanca to Carlsen have lived in the QGD because it rewards long-range planning and accurate structural judgment over tactical brilliance.",
    symphony: {
      leads: ["d-pawn (d4)", "c-pawn (c4)"],
      supports: ["King's Knight (Nf3)", "Queen's Knight (Nc3)", "King's Bishop (e2/d3 after releasing c1)"],
      reserves: ["c1 bishop (the famous 'QGD problem')", "Queen (late, d2/c2)", "Both rooks (wait for c-file clarification)"],
    },
    rhythm:
      "The QGD offers a central pawn (c4) to provoke a structural decision, then slowly squeezes with d4-c4, Nf3, Nc3, and patient piece development. The whole opening is a study in deferred gratification — pieces wait, structure does the talking.",
    summary:
      "The QGD is chess played in long sentences — if you can wait, the position will reward you.",
    idealPlayer:
      "Best fit for the player who enjoys slow squeezing positions and trusts long-term structural advantages over sharp tactics.",
  },

  ruyLopez: {
    theme: "The deepest strategic opening in the 1.e4 e5 family.",
    whyProsLoveIt:
      "The Ruy has been the hallmark of elite 1.e4 play for over a century because its quiet moves (Bb5, c3, h3, Re1) apply relentless strategic pressure that punishes any lapse in Black's preparation.",
    symphony: {
      leads: ["e-pawn (e4)", "King's Knight (Nf3)", "King's Bishop (Bb5)"],
      supports: ["c-pawn (c3)", "d-pawn (d3, then d4)", "h-pawn (h3)"],
      reserves: ["Queen (quietly on e2 or d3)", "Queen's Knight (often reroutes b1\u2013d2\u2013f1\u2013g3)", "a1 rook, c1 bishop"],
    },
    rhythm:
      "The Ruy begins with the same e4/Nf3 as the Italian but swings the bishop to b5 to pressure c6 and e5 from a distance. White's plan is slow, architectural: c3, d3 or d4, castle, h3, Re1 — a grand setup that only looks quiet.",
    summary:
      "The Ruy is strategic pressure rendered into a 6-move setup — the patience opening played at championship depth.",
    idealPlayer:
      "Best fit for the player who has outgrown the Italian and wants to learn how top players squeeze equal positions into real advantages.",
  },

  english: {
    theme: "Flank-first flexibility with hypermodern roots.",
    whyProsLoveIt:
      "The English is a universal weapon at master level because it claims the center *from the flank* — and transposes into dozens of structures the moment Black commits.",
    symphony: {
      leads: ["c-pawn (c4)"],
      supports: ["Queen's Knight (Nc3)", "King's Knight (Nf3)", "g-pawn (g3) + King's Bishop (Bg2)"],
      reserves: ["d-pawn and e-pawn (central reserves, deployed later)", "Queen", "Both rooks"],
    },
    rhythm:
      "1.c4 claims the center diagonally, and White follows with Nc3, Nf3, g3, Bg2 — a flexible hypermodern shell that invites Black to commit first, then chooses its central break (d4 or e4) based on that commitment.",
    summary:
      "The English is chess played like a counterpuncher — stay flexible, let Black define the game, then answer with the structure that refutes their plan.",
    idealPlayer:
      "Best fit for the player who likes to keep their options open, transpose into familiar structures, and win by outlasting opponents' choices.",
  },

  london: {
    theme: "A self-assembling system opening — simplicity as a weapon.",
    whyProsLoveIt:
      "The London has quietly become a world-championship weapon (Carlsen, Caruana) because its compact shell — d4, Nf3, Bf4, e3, Bd3, c3, O-O — works against anything Black plays and hands White a healthy middlegame with almost no memorization.",
    symphony: {
      leads: ["d-pawn (d4)", "Queen's Bishop (Bf4 — outside the pawn chain)"],
      supports: ["King's Knight (Nf3)", "e-pawn (e3)", "King's Bishop (Bd3)", "c-pawn (c3)"],
      reserves: ["Queen (Qc2 or Qb3)", "Queen's Knight (Nbd2)", "Both rooks"],
    },
    rhythm:
      "The London's genius is independence from Black — White plays essentially the same 7-move shell (d4, Nf3, Bf4, e3, Bd3, c3, O-O) against most replies, and only then looks up to choose between e4 breaks, queenside expansion, or central pressure.",
    summary:
      "The London is a ready-made chess system — memorize the shell, and you've memorized 80% of every game you'll play with White.",
    idealPlayer:
      "Best fit for the player who wants a reliable, repeatable opening they can play without thinking in the first 7 moves — a practical weapon, not a theory marathon.",
  },
};

/**
 * Get the manual entry for an opening, or null.
 * @param {string} openingId
 * @returns {Object|null}
 */
export function getOpeningManual(openingId) {
  if (!openingId) return null;
  return OPENING_MANUAL[openingId] || null;
}

/**
 * Get a short (one-line) theme string the coach can append to a fallback
 * advice line. Used when no curated piece-module has taken ownership and
 * the role fallback has already produced a verdict — we add a single
 * sentence that reminds the student *what game they're playing*.
 *
 * @param {string} openingId
 * @returns {string|null}
 */
export function getOpeningThemeLine(openingId) {
  const entry = getOpeningManual(openingId);
  if (!entry) return null;
  return entry.theme || null;
}

export default {
  OPENING_MANUAL,
  getOpeningManual,
  getOpeningThemeLine,
};
