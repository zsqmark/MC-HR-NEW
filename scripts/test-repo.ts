/**
 * Integration test for the Wix data layer, driven by a fake client.
 *
 * Everything else in the suite tests pure functions. This exercises the real
 * `repo.ts` wiring — the actual collection ids, query shapes and write payloads
 * — which would otherwise only be type-checked, because the Wix runtime path
 * cannot execute without a real client ID.
 *
 * It closes two specific gaps:
 *   1. mock data -> mappers -> (fake Wix) -> repo -> mappers -> same data, i.e.
 *      that the read path is wired to the right collections with the right
 *      mapping, including the two-tier staff load;
 *   2. that every value written is *type-compatible with its declared CMS field
 *      type*. Wix silently coerces or drops mismatches, so writing a boolean
 *      into a TEXT field, or an object into a NUMBER field, would fail quietly.
 *
 * Run:  npx tsx scripts/test-repo.ts
 */
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
import { setWixClientForTesting, type MalayaWixClient } from '../src/lib/wix/client';
import { loadAllData, wixRepo } from '../src/lib/wix/repo';
import { COLLECTIONS } from '../src/lib/wix/collections';
import {
  staffToWix, staffToDirectory,
  shiftToWix, availabilityToWix, clockRecordToWix,
  taskToWix, checklistToWix, documentToWix, onboardingToWix,
  type WixItem,
} from '../src/lib/wix/mappers';
// @ts-ignore - plain ESM module, no type declarations
import { COLLECTIONS as SCHEMA } from '../wix/setup-collections.mjs';

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = '') {
  if (condition) passed++;
  else failures.push(`${label}${detail ? ` -> ${detail}` : ''}`);
}

const norm = (v: unknown) => JSON.parse(JSON.stringify(v ?? null));

function canonical(v: unknown): unknown {
  const n = norm(v);
  if (Array.isArray(n)) return n.map(canonical);
  if (n && typeof n === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(n as Record<string, unknown>).sort()) {
      out[k] = canonical((n as Record<string, unknown>)[k]);
    }
    return out;
  }
  return n;
}
const same = (a: unknown, b: unknown) =>
  JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

/** Declared CMS field types, for type-conformance checks. */
const fieldTypes = new Map<string, Record<string, string>>(
  (SCHEMA as { id: string; fields: Record<string, string> }[]).map((c) => [c.id, c.fields]),
);

/** JS type allowed by each Wix field type used in this schema. */
const ALLOWED_JS: Record<string, string> = {
  TEXT: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
};

const SYSTEM_FIELDS = new Set(['_id', '_owner', '_createdDate', '_updatedDate']);

/** Assert a write payload is type-compatible with the declared schema. */
function assertConforms(collection: string, item: WixItem, label: string) {
  const declared = fieldTypes.get(collection);
  if (!declared) {
    failures.push(`${label}: collection ${collection} is not in the schema`);
    return;
  }
  for (const [key, value] of Object.entries(item)) {
    if (SYSTEM_FIELDS.has(key)) continue;
    const fieldType = declared[key];
    if (!fieldType) {
      failures.push(`${label}: writes "${key}" but ${collection} declares no such field`);
      continue;
    }
    if (value === undefined) {
      failures.push(`${label}: "${key}" is undefined (Wix rejects or drops these)`);
      continue;
    }
    const allowed = ALLOWED_JS[fieldType];
    if (allowed && typeof value !== allowed) {
      failures.push(`${label}: "${key}" is ${typeof value}, but ${fieldType} needs ${allowed}`);
    }
  }
}

/* ------------------------------------------------------------- the fake client */

function makeFakeClient() {
  const store = new Map<string, WixItem[]>();
  const queried: string[] = [];
  const saved: { collection: string; item: WixItem }[] = [];
  const removed: { collection: string; id: string }[] = [];

  const query = (collection: string) => {
    const filters: [string, unknown][] = [];
    const builder = {
      limit: () => builder,
      skip: () => builder,
      eq: (field: string, value: unknown) => {
        filters.push([field, value]);
        return builder;
      },
      find: async () => {
        queried.push(collection);
        let rows = store.get(collection) ?? [];
        for (const [field, value] of filters) rows = rows.filter((r) => r[field] === value);
        return { items: rows };
      },
    };
    return builder;
  };

  const client = {
    items: {
      query,
      save: async (collection: string, item: WixItem) => {
        saved.push({ collection, item });
        return item;
      },
      remove: async (collection: string, id: string) => {
        removed.push({ collection, id });
        return null;
      },
      bulkSave: async (collection: string, items: WixItem[]) => {
        for (const item of items) saved.push({ collection, item });
      },
    },
    // ensureFreshTokens() must find no refresh token and return immediately.
    auth: { getTokens: () => ({}) },
  };

  return { client, store, queried, saved, removed };
}

const fake = makeFakeClient();
setWixClientForTesting(fake.client as unknown as MalayaWixClient);

/* ------------------------------------------------- seed the "collections" */

fake.store.set(COLLECTIONS.staffMembers, INITIAL_STAFF_USERS.map(staffToWix));
fake.store.set(COLLECTIONS.staffDirectory, INITIAL_STAFF_USERS.map(staffToDirectory));
fake.store.set(COLLECTIONS.shifts, INITIAL_SHIFTS.map(shiftToWix));
fake.store.set(COLLECTIONS.availability, Object.values(INITIAL_AVAILABILITIES).map(availabilityToWix));
fake.store.set(COLLECTIONS.clockRecords, INITIAL_CLOCK_RECORDS.map(clockRecordToWix));
fake.store.set(COLLECTIONS.tasks, INITIAL_TASKS.map(taskToWix));
fake.store.set(COLLECTIONS.checklistItems, INITIAL_CHECKLISTS.map(checklistToWix));
fake.store.set(COLLECTIONS.documents, INITIAL_DOCUMENTS.map(documentToWix));
fake.store.set(
  COLLECTIONS.onboarding,
  Object.entries(INITIAL_ONBOARDING_DATA).map(([staffId, form]) => onboardingToWix(staffId, form)),
);

/* ------------------------------------------------------ the read path, runner */

async function main() {
  /* -------------------------------------------------- manager load (full staff) */

  {
    const data = await loadAllData({ fullStaff: true });
    check('manager load returns full staff records', same(data.staffUsers, INITIAL_STAFF_USERS),
      `got ${data.staffUsers.length}`);
    check('manager load reads StaffMembers',
      fake.queried.includes(COLLECTIONS.staffMembers), fake.queried.join(','));
    check('manager load: shifts round-trip', same(data.shifts, INITIAL_SHIFTS));
    check('manager load: clock records round-trip', same(data.clockRecords, INITIAL_CLOCK_RECORDS));
    check('manager load: tasks round-trip', same(data.tasks, INITIAL_TASKS));
    check('manager load: checklists round-trip', same(data.checklists, INITIAL_CHECKLISTS));
    check('manager load: documents round-trip', same(data.documents, INITIAL_DOCUMENTS));
  }

  /* --------------------------------------------- staff load (directory only) */

  {
    fake.queried.length = 0;
    const data = await loadAllData({ fullStaff: false });
    check('staff load reads StaffDirectory',
      fake.queried.includes(COLLECTIONS.staffDirectory), fake.queried.join(','));
    check('staff load does NOT read StaffMembers',
      !fake.queried.includes(COLLECTIONS.staffMembers), fake.queried.join(','));

    const first = data.staffUsers[0];
    const expected = INITIAL_STAFF_USERS[0];
    check('staff load keeps identity', first?.id === expected.id, String(first?.id));
    check('staff load keeps name', first?.firstName === expected.firstName);
    check('staff load keeps role (RBAC depends on it)', first?.role === expected.role, String(first?.role));
    check('staff load keeps staffType (bar/wait rules depend on it)',
      first?.staffType === expected.staffType, String(first?.staffType));
    check('staff load keeps onboarding status (the guard depends on it)',
      first?.onboardingStatus === expected.onboardingStatus, String(first?.onboardingStatus));
    check('staff load zeroes pay (directory has none)', first?.hourlyRate === 0, String(first?.hourlyRate));
    check('staff load still returns every row',
      data.staffUsers.length === INITIAL_STAFF_USERS.length, String(data.staffUsers.length));
  }

  /* ------------------------------------------------------- derived collections */

  {
    const data = await loadAllData({ fullStaff: true });
    const availKeys = Object.keys(data.availabilities);
    check('availabilities are keyed by staffId', availKeys.length === Object.keys(INITIAL_AVAILABILITIES).length,
      availKeys.join(','));
    check('availabilities keep their nested days',
      same(data.availabilities[availKeys[0]], Object.values(INITIAL_AVAILABILITIES)[0]),
      JSON.stringify(data.availabilities[availKeys[0]]));

    const onboardKeys = Object.keys(data.onboardingRecords);
    check('onboarding is keyed by staffId',
      onboardKeys.length === Object.keys(INITIAL_ONBOARDING_DATA).length, onboardKeys.join(','));
    check('onboarding keeps bank fields verbatim',
      data.onboardingRecords[onboardKeys[0]]?.q10_bankBsb ===
        Object.values(INITIAL_ONBOARDING_DATA)[0].q10_bankBsb);
  }

  /* ---------------------------------------------- findByMemberId (the join) */

  {
    fake.queried.length = 0;
    const target = INITIAL_STAFF_USERS[0];
    fake.store.set(COLLECTIONS.staffMembers, [
      { ...staffToWix(target), memberId: 'member-abc' },
      ...INITIAL_STAFF_USERS.slice(1).map(staffToWix),
    ]);
    const found = await wixRepo.staff.findByMemberId('member-abc');
    check('findByMemberId resolves the right row', found?.id === target.id, String(found?.id));
    const missing = await wixRepo.staff.findByMemberId('member-nope');
    check('findByMemberId returns null when unlinked', missing === null, String(missing));

    // Restore for later assertions.
    fake.store.set(COLLECTIONS.staffMembers, INITIAL_STAFF_USERS.map(staffToWix));
  }

  /* ------------------------------------------------------------ the write path */

  fake.saved.length = 0;

  await wixRepo.staff.save(INITIAL_STAFF_USERS[0]);
  await wixRepo.staff.saveDirectory(INITIAL_STAFF_USERS[0]);
  await wixRepo.shifts.save(INITIAL_SHIFTS[0]);
  await wixRepo.availability.save(Object.values(INITIAL_AVAILABILITIES)[0]);
  await wixRepo.clockRecords.save(INITIAL_CLOCK_RECORDS[0]);
  await wixRepo.tasks.save(INITIAL_TASKS[0]);
  await wixRepo.checklists.save(INITIAL_CHECKLISTS[0]);
  await wixRepo.documents.save(INITIAL_DOCUMENTS[0]);
  const firstOnboarding = Object.entries(INITIAL_ONBOARDING_DATA)[0];
  await wixRepo.onboarding.save(firstOnboarding[0], firstOnboarding[1]);

  const expectedCollections = [
    COLLECTIONS.staffMembers,
    COLLECTIONS.staffDirectory,
    COLLECTIONS.shifts,
    COLLECTIONS.availability,
    COLLECTIONS.clockRecords,
    COLLECTIONS.tasks,
    COLLECTIONS.checklistItems,
    COLLECTIONS.documents,
    COLLECTIONS.onboarding,
  ];
  const written = fake.saved.map((s) => s.collection);
  check('every collection was written to', expectedCollections.every((c) => written.includes(c)),
    written.join(','));

  for (const { collection, item } of fake.saved) {
    assertConforms(collection, item, `write to ${collection}`);
  }
  check('all write payloads are type-conformant', failures.length === 0, `${failures.length} problem(s)`);

  // _id must be the app id, or identity is lost on the way to the CMS.
  const staffWrite = fake.saved.find((s) => s.collection === COLLECTIONS.staffMembers);
  check('staff write carries the app id as _id',
    staffWrite?.item._id === INITIAL_STAFF_USERS[0].id, String(staffWrite?.item._id));

  /* --------------------------------------------------------------- removals */

  fake.removed.length = 0;
  await wixRepo.shifts.remove('s-123');
  check('remove targets the right collection and id',
    fake.removed[0]?.collection === COLLECTIONS.shifts && fake.removed[0]?.id === 's-123',
    JSON.stringify(fake.removed[0]));

  /* ------------------------- negative control: the guard is not vacuous */
  //
  // assertConforms passing for every real payload is only meaningful if it can
  // actually fail. Feed it payloads that are wrong in each way it claims to
  // detect, and require it to reject all of them.
  {
    const before = failures.length;

    assertConforms(COLLECTIONS.shifts, { day: 123 }, 'control: number in TEXT');
    const caughtType = failures.length > before;

    const base = failures.length;
    assertConforms(COLLECTIONS.shifts, { notAField: 'x' }, 'control: unknown field');
    const caughtUnknown = failures.length > base;

    const base2 = failures.length;
    assertConforms(COLLECTIONS.shifts, { day: undefined }, 'control: undefined value');
    const caughtUndefined = failures.length > base2;

    const base3 = failures.length;
    assertConforms('NoSuchCollection', { a: 1 }, 'control: unknown collection');
    const caughtCollection = failures.length > base3;

    // Discard the control's own failures so they don't fail the run.
    failures.length = before;

    check('conformance guard rejects a wrong field type', caughtType);
    check('conformance guard rejects an undeclared field', caughtUnknown);
    check('conformance guard rejects an undefined value', caughtUndefined);
    check('conformance guard rejects an unknown collection', caughtCollection);
  }

  /* ------------------------------------------------------------------ report */

  setWixClientForTesting(null);

  console.log('\n  Wix data-layer integration test (fake client)');
  console.log('  ' + '-'.repeat(58));
  console.log(`  assertions passed : ${passed}`);
  console.log(`  assertions failed : ${failures.length}`);

  if (failures.length) {
    console.error('\n  FAILURES:');
    for (const f of failures.slice(0, 30)) console.error(`    - ${f}`);
    process.exit(1);
  }
  console.log('\n  OK: reads hit the right collections and writes are schema-conformant.\n');
}

main().catch((e) => {
  console.error(`\n  ERROR: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
