/**
 * Guard that stops the seeder from writing demo data over real data.
 *
 * `wix:seed` upserts by `_id`. That is safe on an empty site and on a re-run of
 * the same seed, but on a site that already holds real records it does one of
 * two bad things: it overwrites any record whose `_id` collides with a mock one
 * (the mock staff ids are `staff-john`, `staff-mark`, …), or it adds 143 demo
 * shifts and clock records alongside the real data. Either way the outcome is
 * destructive or confusing, and the operator gets no warning.
 *
 * So seeding refuses unless every target collection is empty, or the caller
 * explicitly forces it. Pure and dependency-free so the decision is unit-tested
 * (`scripts/test-seedGuard.ts`).
 */

export interface SeedDecision {
  /** Whether the seed may write. */
  allowed: boolean;
  /** Collections that already contain at least one record. */
  nonEmpty: string[];
  /** Human-readable explanation, suitable for printing verbatim. */
  reason: string;
}

/**
 * Decide whether seeding may proceed.
 *
 * @param counts  records currently present, keyed by collection name
 * @param options.force  operator explicitly accepted overwriting
 */
export function decideSeed(
  counts: Record<string, number>,
  options: { force?: boolean } = {},
): SeedDecision {
  const nonEmpty = Object.entries(counts)
    .filter(([, n]) => Number(n) > 0)
    .map(([collection]) => collection)
    .sort();

  if (options.force) {
    return {
      allowed: true,
      nonEmpty,
      reason: nonEmpty.length
        ? `--force given: overwriting/adding to ${nonEmpty.length} non-empty collection(s).`
        : 'Nothing to overwrite; seeding an empty site.',
    };
  }

  if (nonEmpty.length === 0) {
    return {
      allowed: true,
      nonEmpty,
      reason: 'All target collections are empty.',
    };
  }

  return {
    allowed: false,
    nonEmpty,
    reason:
      `${nonEmpty.length} collection(s) already contain data: ${nonEmpty.join(', ')}. ` +
      'Seeding now would overwrite any record whose id matches a demo record, or mix ' +
      'demo shifts and clock records into real data. Re-run with --force if that is ' +
      'genuinely what you want.',
  };
}
