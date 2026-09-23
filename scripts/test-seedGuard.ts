/**
 * Tests for the seed guard.
 *
 * The failure this prevents is destructive and easy to trigger: `wix:seed`
 * upserts by `_id`, so running it against a site that already holds real records
 * overwrites any id collision and otherwise mixes 143 demo records into live
 * data. It must refuse in that case and only proceed when explicitly forced.
 *
 * Run:  npx tsx scripts/test-seedGuard.ts
 */
import { decideSeed } from '../src/lib/wix/seedGuard';

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = '') {
  if (condition) passed++;
  else failures.push(`${label}${detail ? ` -> ${detail}` : ''}`);
}

/* ---------------------------------------------------------------- empty site */

{
  const d = decideSeed({ Shifts: 0, Tasks: 0, StaffMembers: 0 });
  check('empty site is allowed', d.allowed);
  check('empty site reports nothing non-empty', d.nonEmpty.length === 0, d.nonEmpty.join(','));
  check('empty site reason says so', d.reason.includes('empty'), d.reason);
}

{
  // A completely empty count map (no collections reported) is also allowed.
  const d = decideSeed({});
  check('no collections reported is allowed', d.allowed);
  check('no collections means none non-empty', d.nonEmpty.length === 0);
}

/* ------------------------------------------------------- data already present */

{
  const d = decideSeed({ Shifts: 58, Tasks: 0 });
  check('non-empty collection blocks the seed', !d.allowed);
  check('blocking names the collection', d.nonEmpty.includes('Shifts'), d.nonEmpty.join(','));
  check('blocking reason names it too', d.reason.includes('Shifts'), d.reason);
  check('blocking reason mentions --force', d.reason.includes('--force'), d.reason);
}

{
  // The realistic worst case: a live site with real records in every collection.
  const d = decideSeed({
    StaffMembers: 15, StaffDirectory: 15, Shifts: 58, Availability: 5,
    ClockRecords: 4, Tasks: 7, ChecklistItems: 29, RestaurantDocuments: 9, Onboarding: 1,
  });
  check('a fully populated site is blocked', !d.allowed);
  check('all nine collections are listed', d.nonEmpty.length === 9, String(d.nonEmpty.length));
  check('the list is sorted for readability',
    d.nonEmpty.join(',') === [...d.nonEmpty].sort().join(','), d.nonEmpty.join(','));
}

{
  // A single record is enough to block: one real clock record matters.
  const d = decideSeed({ ClockRecords: 1 });
  check('even one existing record blocks', !d.allowed, d.reason);
}

/* ------------------------------------------------------------------ --force */

{
  const d = decideSeed({ Shifts: 58, Tasks: 7 }, { force: true });
  check('--force overrides the block', d.allowed);
  check('--force still reports what it will touch', d.nonEmpty.length === 2, String(d.nonEmpty.length));
  check('--force reason admits the overwrite', d.reason.includes('overwriting/adding to'), d.reason);
}

{
  // Forcing on an empty site must not claim it is overwriting anything.
  const d = decideSeed({ Shifts: 0 }, { force: true });
  check('--force on empty site is allowed', d.allowed);
  // Match the exact marker rather than the word "overwrite": the empty-site
  // message legitimately reads "Nothing to overwrite".
  check('--force on empty site does not claim an overwrite',
    !d.reason.includes('overwriting/adding to'), d.reason);
}

/* ------------------------------------------------------------------ edge cases */

{
  // Negative or non-numeric counts must not be treated as "has data".
  const d = decideSeed({ A: -1, B: 0 });
  check('negative counts do not block', d.allowed, d.reason);
  check('negative counts are not listed', d.nonEmpty.length === 0, d.nonEmpty.join(','));
}

{
  // The guard must not mutate its input.
  const counts = { Shifts: 3 };
  decideSeed(counts, { force: true });
  check('input counts are not mutated', counts.Shifts === 3, String(counts.Shifts));
}

/* ---------------------------------------------------------------------- report */

console.log('\n  Seed guard test');
console.log('  ' + '-'.repeat(58));
console.log(`  assertions passed : ${passed}`);
console.log(`  assertions failed : ${failures.length}`);

if (failures.length) {
  console.error('\n  FAILURES:');
  for (const f of failures) console.error(`    - ${f}`);
  process.exit(1);
}
console.log('\n  OK: seeding refuses to touch a site that already has data.\n');
