/** Minimum grammar % required to count writing as complete for module unlock. */
export const GRAMMAR_PASS_PERCENT = 60

export function grammarScorePassed(score) {
  if (score == null || Number.isNaN(Number(score))) return false
  return Number(score) >= GRAMMAR_PASS_PERCENT
}
