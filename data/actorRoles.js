/*
 * Opening-specific actor role overlays.
 *
 * From the White Opening Units Manual: each opening has a cast —
 *   Lead actors:   the pieces that define the opening's identity
 *   Reserve actors: the pieces that should stay home early
 * The coach offers two visual overlays the student can toggle:
 *   - "Lead actors"     tints lead pieces gold
 *   - "Reserve actors"  halves the opacity of reserve pieces
 *
 * The keys below are ORIGIN squares (the squares the pieces start on).
 * We track pieces by origin rather than current location so that when
 * the e-pawn moves from e2 to e4, it keeps its gold tint — the OVERLAY
 * REFRESH function below maps origin squares to current squares via
 * the chess.js history.
 *
 * Reserve actors list is intentionally conservative — it's the set of
 * pieces the manual explicitly calls "reserve" or "do-not-hurry." The
 * "support" actors get neither tint; they're the middle layer.
 */

export const ACTOR_ROLES = {
  italian: {
    // Leads: e-pawn, kingside knight (g1), kingside bishop (f1)
    leads: ["e2", "g1", "f1"],
    // Reserves: queenside bishop, queenside knight, queen, queenside rook
    reserves: ["c1", "b1", "d1", "a1"],
  },
  queensGambit: {
    // Leads: d-pawn, c-pawn, c1 bishop (the bishop-problem bishop IS a lead)
    leads: ["d2", "c2", "c1"],
    // Reserves: queen, queenside rook, b-pawn
    reserves: ["d1", "a1", "b2"],
  },
  ruyLopez: {
    // Leads: e-pawn, kingside knight (g1), kingside bishop (f1 -> Bb5)
    leads: ["e2", "g1", "f1"],
    // Reserves: queenside bishop, queenside knight, queen, queenside rook
    // (manual notes h-pawn slightly more than in some openings — leave out
    // of reserves; it's not strictly "do not touch")
    reserves: ["c1", "b1", "d1", "a1"],
  },
  english: {
    // Leads: c-pawn is the sole identity lead in the English (manual says so)
    leads: ["c2"],
    // Reserves: a-pawn, f-pawn, h-pawn, a1 rook (manual's "do-not-hurry" list)
    reserves: ["a2", "f2", "h2", "a1"],
  },
  london: {
    // Leads: d-pawn, c1 bishop (the Bf4 bishop is THE lead actor of the London)
    leads: ["d2", "c1"],
    // Reserves: queen, a1 rook, h-pawn
    reserves: ["d1", "a1", "h2"],
  },
};

/**
 * Given a chess.js instance, return the set of CURRENT squares that host
 * pieces whose ORIGIN was in `originSquares`. This is what the overlay
 * renderer needs: "where are my lead pieces right now?"
 *
 * Algorithm:
 *   - Start with originSquares as candidates.
 *   - Replay the history move by move. Whenever a move's `from` square
 *     matches a tracked square, update that track to point at `to`.
 *   - Captured pieces drop out of the set (tracked square is captured).
 *
 * @param {Object} chess        chess.js instance
 * @param {string[]} originSquares  list of origin squares to track
 * @returns {string[]} current squares for the tracked pieces that are still on the board
 */
export function currentSquaresForOrigins(chess, originSquares) {
  if (!chess || !Array.isArray(originSquares) || originSquares.length === 0) {
    return [];
  }
  // Map originSquare -> currentSquare. Pieces not captured remain tracked.
  const tracks = new Map();
  originSquares.forEach((sq) => tracks.set(sq, sq));

  let history;
  try {
    history = chess.history({ verbose: true });
  } catch (_) {
    return originSquares.slice();
  }

  for (const move of history) {
    // If this move captured one of our tracked pieces, drop it.
    // A capture's `to` square is where the captured piece was.
    if (move.captured) {
      for (const [origin, current] of tracks.entries()) {
        if (current === move.to) tracks.delete(origin);
      }
    }
    // En passant: captured pawn is not on `to` square, it's behind it.
    if (move.flags && move.flags.includes("e")) {
      // e.p. capture — the captured pawn is on the file of move.to, rank of move.from
      const epSq = move.to[0] + move.from[1];
      for (const [origin, current] of tracks.entries()) {
        if (current === epSq) tracks.delete(origin);
      }
    }
    // Update tracked pieces that moved.
    for (const [origin, current] of tracks.entries()) {
      if (current === move.from) {
        tracks.set(origin, move.to);
      }
    }
    // Castling also moves the rook. chess.js's `flags` contains 'k' or 'q'.
    if (move.flags && move.flags.includes("k")) {
      // Kingside castle: h1 -> f1 (for white), h8 -> f8 (for black).
      // We only track white pieces, but be safe and check color.
      if (move.color === "w") {
        for (const [origin, current] of tracks.entries()) {
          if (current === "h1") tracks.set(origin, "f1");
        }
      }
    }
    if (move.flags && move.flags.includes("q")) {
      if (move.color === "w") {
        for (const [origin, current] of tracks.entries()) {
          if (current === "a1") tracks.set(origin, "d1");
        }
      }
    }
  }

  return Array.from(tracks.values());
}

/**
 * Get the current squares to highlight for an opening's lead actors.
 *
 * @param {string} openingId
 * @param {Object} chess         chess.js instance
 * @returns {string[]}           list of current squares
 */
export function getLeadSquaresNow(openingId, chess) {
  const roles = ACTOR_ROLES[openingId];
  if (!roles) return [];
  return currentSquaresForOrigins(chess, roles.leads || []);
}

/**
 * Get the current squares to fade for an opening's reserve actors.
 *
 * @param {string} openingId
 * @param {Object} chess         chess.js instance
 * @returns {string[]}           list of current squares
 */
export function getReserveSquaresNow(openingId, chess) {
  const roles = ACTOR_ROLES[openingId];
  if (!roles) return [];
  return currentSquaresForOrigins(chess, roles.reserves || []);
}

export default {
  ACTOR_ROLES,
  currentSquaresForOrigins,
  getLeadSquaresNow,
  getReserveSquaresNow,
};
