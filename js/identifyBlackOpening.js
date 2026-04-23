/*
 * Black-opening identifier.
 *
 * Given the move history so far, find the best-matching named Black defence
 * from data/blackOpenings.js. The matcher is deliberately simple and
 * transparent — we're not trying to replicate a million-game opening book,
 * just give the student a plain-English hint about what Stockfish is doing.
 *
 * Scoring:
 *   For each candidate opening:
 *     - If ANY disqualifier matches, the candidate is rejected outright.
 *     - Count how many signature predicates have matched so far. Note:
 *       predicates at plies we haven't reached yet are "pending", not
 *       "failed" — we only fail a predicate whose ply has been played and
 *       whose test returned false.
 *     - Count how many supporting predicates have matched.
 *     - confidence = (matched-signature / total-signature) * 0.85
 *                  + (matched-supporting / total-supporting) * 0.15
 *                  (the supporting term is 0 if no supporting predicates)
 *     - We DEMAND that no signature predicate has outright failed. If any
 *       signature predicate at a ply that's already been played returned
 *       false, the candidate is rejected.
 *
 * Output:
 *   identifyBlackOpening(history, whiteFirstMove) returns:
 *     {
 *       primary:   { entry, confidence, confirmed } | null
 *       secondary: { entry, confidence, confirmed } | null
 *       familyFallback: entry | null  // when nothing specific matches
 *       fallback:  entry | null       // when even family is unclear
 *     }
 *
 * The rendering layer then formats the result into user-facing copy.
 */

import {
  BLACK_OPENINGS,
  BLACK_FAMILY_FALLBACK,
  BLACK_UNCATEGORIZED,
} from "../data/blackOpenings.js";

// Evaluate a single predicate against the move history.
// history is an array of { ply, san, byStudent } objects (app.js shape).
// Returns 'match' | 'miss' | 'pending' (ply not yet played).
function evalPredicate(pred, history) {
  // History is 0-indexed but the ply inside history matches our global ply
  // counter. Find the entry at this ply.
  const entry = history.find((h) => h.ply === pred.ply);
  if (!entry) return "pending";
  // Confirm color matches (White = odd ply, Black = even ply).
  const entryColor = entry.ply % 2 === 1 ? "w" : "b";
  if (entryColor !== pred.color) return "miss";
  return pred.test(entry.san) ? "match" : "miss";
}

// Score a single opening candidate against the history.
function scoreCandidate(opening, history, whiteFirstMove) {
  // Family gate: an entry with family 'e4' / 'd4' / 'c4' / 'Nf3' only matches
  // when White actually played that first move. 'any' entries skip this gate.
  // This prevents e.g. the Englund Gambit (family 'd4', sig ...e5) from
  // matching after 1.e4 e5.
  const fam = opening.family;
  if (fam && fam !== "any" && whiteFirstMove) {
    if (fam === "Nf3") {
      if (whiteFirstMove !== "Nf3") {
        return { confidence: 0, confirmed: false, rejected: true };
      }
    } else if (whiteFirstMove !== fam) {
      return { confidence: 0, confirmed: false, rejected: true };
    }
  }
  // Reject immediately if any disqualifier matches.
  for (const dq of opening.disqualifiers || []) {
    if (evalPredicate(dq, history) === "match") {
      return { confidence: 0, confirmed: false, rejected: true };
    }
  }
  // Check signatures: any outright miss kills the candidate.
  let sigMatched = 0;
  let sigTotal = opening.signature.length;
  let sigFailed = 0;
  for (const p of opening.signature) {
    const r = evalPredicate(p, history);
    if (r === "match") sigMatched++;
    else if (r === "miss") sigFailed++;
  }
  if (sigFailed > 0) {
    return { confidence: 0, confirmed: false, rejected: true };
  }
  // Check supporting — misses don't kill the candidate, just don't add score.
  let supMatched = 0;
  let supTotal = (opening.supporting || []).length;
  for (const p of opening.supporting || []) {
    if (evalPredicate(p, history) === "match") supMatched++;
  }
  // Confidence: primary weight on the signature match ratio.
  const sigScore = sigTotal === 0 ? 0 : sigMatched / sigTotal;
  const supScore = supTotal === 0 ? 0 : supMatched / supTotal;
  const confidence = sigScore * 0.85 + supScore * 0.15;
  // We say a line is "confirmed" only when every signature move has been
  // played AND matched (no pending ones left).
  const confirmed = sigMatched === sigTotal;
  return { confidence, confirmed, rejected: false, sigMatched, sigTotal };
}

// Public: identify what Black is playing.
// history:  array of move entries (as in app.js state.history)
// whiteFirstMove: the SAN White played on move 1 (e.g. "e4", "d4"); used
//                 for family fallback. Pass null/undefined if not yet known.
export function identifyBlackOpening(history, whiteFirstMove) {
  // Only consider history up through moves already played. No predictions.
  const played = history.filter((h) => h && typeof h.ply === "number");
  // If no Black move has been played yet, there's nothing to say.
  const anyBlackPlayed = played.some((h) => h.ply % 2 === 0);
  if (!anyBlackPlayed) {
    return {
      primary: null,
      secondary: null,
      familyFallback: null,
      fallback: null,
      empty: true,
    };
  }

  // Determine White's actual first move for the family gate. Prefer the
  // caller's hint; otherwise pull from history.
  const actualWhiteFirst =
    whiteFirstMove ||
    (played.find((h) => h.ply === 1) && played.find((h) => h.ply === 1).san) ||
    null;

  // Score every candidate.
  const scored = BLACK_OPENINGS.map((op) => ({
    entry: op,
    ...scoreCandidate(op, played, actualWhiteFirst),
  })).filter((c) => !c.rejected);

  // Sort: prefer confirmed first, then by (specificity * 10 + confidence).
  // The specificity bonus ensures a confirmed sub-variation ("Najdorf")
  // beats a confirmed umbrella ("Sicilian") when both match.
  scored.sort((a, b) => {
    // Confirmed beats unconfirmed at any specificity >= the other's.
    const aRank = (a.confirmed ? 100 : 0) + a.entry.specificity * 10 + a.confidence;
    const bRank = (b.confirmed ? 100 : 0) + b.entry.specificity * 10 + b.confidence;
    return bRank - aRank;
  });

  // Pick the best, plus the next-best with a different name (not a
  // specificity-0 umbrella of the same family the winner already covers).
  const primary = scored[0] || null;
  let secondary = null;
  for (let i = 1; i < scored.length; i++) {
    const cand = scored[i];
    if (!primary) { secondary = cand; break; }
    // Don't show the umbrella if its child is already winning.
    const isUmbrellaOfPrimary =
      cand.entry.specificity < primary.entry.specificity &&
      cand.entry.family === primary.entry.family;
    if (isUmbrellaOfPrimary) continue;
    // Don't show a 2nd candidate that's too far behind.
    if (cand.confidence < 0.35) break;
    secondary = cand;
    break;
  }

  // If the primary isn't at least somewhat confident, fall back.
  const primaryConfident = primary && (primary.confirmed || primary.confidence >= 0.5);
  let familyFallback = null;
  let fallback = null;
  if (!primaryConfident) {
    const familyKey = whiteFirstMove;
    familyFallback = BLACK_FAMILY_FALLBACK[familyKey] || null;
    if (!familyFallback) fallback = BLACK_UNCATEGORIZED;
  }

  return {
    primary: primaryConfident ? primary : null,
    // If the primary is weak, also null the secondary — we'll show the family fallback instead.
    secondary: primaryConfident ? secondary : null,
    familyFallback,
    fallback,
    empty: false,
    // For debugging / transparency:
    _debug: {
      primaryCandidate: primary,
      topScored: scored.slice(0, 5).map((c) => ({
        id: c.entry.id,
        name: c.entry.name,
        confidence: c.confidence,
        confirmed: c.confirmed,
        specificity: c.entry.specificity,
      })),
    },
  };
}

// Convenience: build the full user-facing payload for the UI.
// Returns { title, blurb, nextMoves, altName? } or null if nothing to show.
export function buildOpponentOpeningNote(history, whiteFirstMove) {
  const result = identifyBlackOpening(history, whiteFirstMove);
  if (result.empty) return null;

  if (result.primary) {
    const { entry, confirmed } = result.primary;
    // Confident identification.
    const verb = confirmed ? "Black is playing" : "This looks like";
    let payload = {
      title: `${verb} the ${entry.name}`,
      blurb: entry.blurb,
      nextMoves: entry.nextMoves,
      altName: null,
    };
    // Only surface an alternative if BOTH the primary and the secondary are
    // confirmed (every signature move actually played). Unconfirmed guesses
    // — where some signature predicates are still pending — are misleading to
    // the student because there are usually several equally-likely candidates
    // at that point. The primary blurb's "likely next" copy already handles
    // the branching explanation.
    if (
      result.secondary &&
      result.secondary.confirmed &&
      confirmed &&
      result.secondary.entry.specificity >= entry.specificity
    ) {
      payload.altName = result.secondary.entry.name;
    }
    return payload;
  }

  // No confident primary — use family fallback.
  const fb = result.familyFallback || result.fallback;
  if (fb) {
    return {
      title: `Black is playing ${fb.name}`,
      blurb: fb.blurb,
      nextMoves: fb.nextMoves,
      altName: null,
    };
  }

  return null;
}
