/**
 * Seeds the Wix CMS collections with the app's current mock data.
 *
 * Uses the typed SDK with an admin API key, so it shares the exact mapper code
 * the app runs — there is no second, drifting definition of the wire format.
 *
 *   WIX_API_KEY=<key>  WIX_SITE_ID=<metasiteId>  npm run wix:seed
 *   npm run wix:seed -- --plan        # print what would be written, no writes
 *
 * Note the flag is `--plan`, not `--dry-run`: npm intercepts `--dry-run` as one
 * of its own flags and never forwards it to the script. `--dry-run` is still
 * honoured when the file is run directly with `npx tsx wix/seed-cms.ts`.
 *
 * Idempotent: `bulkSave` upserts by `_id`, so re-running updates rather than
 * duplicating. It deliberately never deletes — removing collections or wiping
 * data is an admin action for the Wix dashboard, not a side effect of seeding.
 *
 * Run `npm run wix:setup` first: writing to a collection that does not exist
 * fails, and Wix silently drops fields that aren't declared in the schema.
 */
import 'dotenv/config';
import { createClient, ApiKeyStrategy } from '@wix/sdk';
import { items } from '@wix/data';

import { COLLECTIONS } from '../src/lib/wix/collections';
import {
  staffToWix, staffToDirectory,
  shiftToWix,
  availabilityToWix,
  clockRecordToWix,
  taskToWix,
  checklistToWix,
  documentToWix,
  onboardingToWix,
  type WixItem,
} from '../src/lib/wix/mappers';
import {
  INITIAL_STAFF_USERS,
  INITIAL_SHIFTS,
  INITIAL_AVAILABILITIES,
  INITIAL_CLOCK_RECORDS,
  INITIAL_TASKS,
  INITIAL_CHECKLISTS,
  INITIAL_DOCUMENTS,
  INITIAL_ONBOARDING_DATA,
} from '../src/mockData';
import { decideSeed } from '../src/lib/wix/seedGuard';

const DRY_RUN = process.argv.includes('--plan') || process.argv.includes('--dry-run');
/** Explicitly accept overwriting existing records. */
const FORCE = process.argv.includes('--force');

/** Wix caps bulk writes per request. */
const BULK_CHUNK = 100;

const plan: { collection: string; label: string; rows: WixItem[] }[] = [
  { collection: COLLECTIONS.staffMembers, label: 'StaffMembers', rows: INITIAL_STAFF_USERS.map(staffToWix) },
  { collection: COLLECTIONS.staffDirectory, label: 'StaffDirectory', rows: INITIAL_STAFF_USERS.map(staffToDirectory) },
  { collection: COLLECTIONS.shifts, label: 'Shifts', rows: INITIAL_SHIFTS.map(shiftToWix) },
  {
    collection: COLLECTIONS.availability,
    label: 'Availability',
    rows: Object.values(INITIAL_AVAILABILITIES).map(availabilityToWix),
  },
  { collection: COLLECTIONS.clockRecords, label: 'ClockRecords', rows: INITIAL_CLOCK_RECORDS.map(clockRecordToWix) },
  { collection: COLLECTIONS.tasks, label: 'Tasks', rows: INITIAL_TASKS.map(taskToWix) },
  { collection: COLLECTIONS.checklistItems, label: 'ChecklistItems', rows: INITIAL_CHECKLISTS.map(checklistToWix) },
  { collection: COLLECTIONS.documents, label: 'RestaurantDocuments', rows: INITIAL_DOCUMENTS.map(documentToWix) },
  {
    collection: COLLECTIONS.onboarding,
    label: 'Onboarding',
    rows: Object.entries(INITIAL_ONBOARDING_DATA).map(([staffId, form]) => onboardingToWix(staffId, form)),
  },
];

async function main() {
  const total = plan.reduce((n, p) => n + p.rows.length, 0);

  console.log('\n  Wix CMS seed');
  console.log('  ' + '-'.repeat(58));
  for (const p of plan) console.log(`    ${String(p.rows.length).padStart(4)}  ${p.label}`);
  console.log(`    ${String(total).padStart(4)}  total items`);

  if (DRY_RUN) {
    console.log('\n  PLAN ONLY: nothing written. Run `npm run wix:seed` to seed.\n');
    return;
  }

  const apiKey = process.env.WIX_API_KEY || '';
  const siteId = process.env.WIX_SITE_ID || '';
  if (!apiKey) {
    console.error('\n  ERROR: WIX_API_KEY is not set.');
    console.error('  Set it in .env, or preview with `npm run wix:seed:plan`.\n');
    process.exit(1);
  }
  if (!siteId) {
    console.error('\n  ERROR: WIX_SITE_ID is not set (the metasiteId from your dashboard URL).\n');
    process.exit(1);
  }

  const client = createClient({
    modules: { items },
    auth: ApiKeyStrategy({ apiKey, siteId }),
  });

  /* ------------------------------------------------ pre-write safety check */
  //
  // bulkSave upserts by `_id`, so seeding a site that already holds real records
  // either overwrites id collisions or mixes 143 demo rows into live data. Count
  // what is already there and refuse unless it is empty or explicitly forced.
  const counts: Record<string, number> = {};
  const countFailures: string[] = [];
  for (const p of plan) {
    try {
      const res = await client.items.query(p.collection).limit(1).find();
      counts[p.label] = (res?.items ?? []).length;
    } catch (e) {
      countFailures.push(`${p.label}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (countFailures.length) {
    console.error('\n  ERROR: could not read the collections, so the seed was not started.');
    for (const f of countFailures) console.error(`    - ${f}`);
    console.error('\n  Run `npm run wix:setup` first, then `npm run wix:doctor` to verify.\n');
    process.exitCode = 1;
    return;
  }

  const decision = decideSeed(counts, { force: FORCE });
  if (!decision.allowed) {
    console.error('\n  REFUSING TO SEED.');
    console.error(`  ${decision.reason}`);
    console.error('\n  If this is a fresh site and those records are demo leftovers, delete');
    console.error('  them in the Wix CMS. To seed anyway and overwrite: npm run wix:seed:force\n');
    process.exitCode = 1;
    return;
  }
  console.log(`  guard   ${decision.reason}`);

  const failures: string[] = [];
  let written = 0;

  for (const p of plan) {
    if (p.rows.length === 0) continue;
    try {
      for (let i = 0; i < p.rows.length; i += BULK_CHUNK) {
        const chunk = p.rows.slice(i, i + BULK_CHUNK);
        await client.items.bulkSave(p.collection, chunk);
        written += chunk.length;
      }
      console.log(`  saved   ${p.label} (${p.rows.length})`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  FAIL    ${p.label}: ${msg}`);
      failures.push(`${p.label}: ${msg}`);
    }
  }

  console.log('\n  ' + '-'.repeat(58));
  console.log(`  written ${written}/${total}, failed collections ${failures.length}`);
  if (failures.length) {
    console.error('\n  Failures:');
    for (const f of failures) console.error(`    - ${f}`);
    console.error('\n  A "collection not found" error means `npm run wix:setup` has not run.\n');
    process.exit(1);
  }
  console.log('\n  Seeded. Next: set the manager records\' `memberId` so sign-in maps');
  console.log('  to the right staff row (see wix/collections.md).\n');
}

main().catch((e) => {
  console.error(`\n  ERROR: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
