/**
 * Round-trip test for the Wix mapper layer.
 *
 * Runs the app's real mock data through `toWix` -> `fromWix` and asserts the
 * entity comes back byte-identical. This needs no Wix connection, so it can run
 * on every change and catches the class of bug that would otherwise only appear
 * as missing fields in production.
 *
 * Run:  npx tsx scripts/test-mappers.ts
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
import type { StaffUser } from '../src/types';
import {
  staffToWix, staffFromWix, staffToDirectory,
  shiftToWix, shiftFromWix,
  availabilityToWix, availabilityFromWix,
  clockRecordToWix, clockRecordFromWix,
  taskToWix, taskFromWix,
  checklistToWix, checklistFromWix,
  documentToWix, documentFromWix,
  onboardingToWix, onboardingFromWix,
  type WixItem,
} from '../src/lib/wix/mappers';

let passed = 0;
const failures: string[] = [];

/** Normalise away `undefined` keys, exactly as a JSON store would. */
const norm = (v: unknown) => JSON.parse(JSON.stringify(v ?? null));

/**
 * Recursively sort object keys. `JSON.stringify` preserves insertion order, so
 * comparing raw stringifications reports two objects as different purely
 * because the mapper declared fields in a different order than the fixture.
 * Only values matter here, not key order.
 */
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

const eq = (a: unknown, b: unknown) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

/** Find the first differing path, so failures are actionable. */
function diffPath(a: unknown, b: unknown, p = ''): string | null {
  if (eq(a, b)) return null;
  const na = norm(a);
  const nb = norm(b);
  if (na && nb && typeof na === 'object' && typeof nb === 'object' && !Array.isArray(na) && !Array.isArray(nb)) {
    const keys = [...new Set([...Object.keys(na), ...Object.keys(nb)])].sort();
    for (const k of keys) {
      const d = diffPath((na as WixItem)[k], (nb as WixItem)[k], p ? `${p}.${k}` : k);
      if (d) return d;
    }
  }
  return `${p || '<root>'}  got ${JSON.stringify(na)} want ${JSON.stringify(nb)}`;
}

function check(label: string, condition: boolean, detail = '') {
  if (condition) {
    passed++;
  } else {
    failures.push(`${label}${detail ? ` -> ${detail}` : ''}`);
  }
}

/** Assert a mapper round-trips an entity without loss. */
function roundTrip<T extends { id: string }>(
  entityName: string,
  entity: T,
  toWix: (e: T) => WixItem,
  fromWix: (i: WixItem) => T,
) {
  const label = `${entityName} ${entity.id}`;
  let item: WixItem;
  try {
    item = toWix(entity);
  } catch (e) {
    failures.push(`${label} toWix threw: ${(e as Error).message}`);
    return;
  }

  // No undefined may reach Wix; the API rejects or silently drops those.
  const undef = Object.entries(item).filter(([, v]) => v === undefined).map(([k]) => k);
  check(`${label} emits no undefined`, undef.length === 0, undef.join(','));

  // The app id must become the item _id, or identity is lost.
  check(`${label} _id preserved`, item._id === entity.id, `_id=${String(item._id)}`);

  const back = fromWix(item);
  const d = diffPath(back, entity);
  check(`${label} round-trips`, d === null, d ?? '');
}

/* ------------------------------------------------------------------ run all */

for (const s of INITIAL_STAFF_USERS) roundTrip('StaffUser', s, staffToWix, staffFromWix);
for (const s of INITIAL_SHIFTS) roundTrip('ShiftSlot', s, shiftToWix, shiftFromWix);
for (const [staffId, a] of Object.entries(INITIAL_AVAILABILITIES)) {
  roundTrip(`Availability(${staffId})`, a, availabilityToWix, availabilityFromWix);
}
for (const c of INITIAL_CLOCK_RECORDS) roundTrip('ClockRecord', c, clockRecordToWix, clockRecordFromWix);
for (const t of INITIAL_TASKS) roundTrip('TaskItem', t, taskToWix, taskFromWix);
for (const c of INITIAL_CHECKLISTS) roundTrip('ChecklistItem', c, checklistToWix, checklistFromWix);
for (const d of INITIAL_DOCUMENTS) roundTrip('RestaurantDocument', d, documentToWix, documentFromWix);

for (const [staffId, form] of Object.entries(INITIAL_ONBOARDING_DATA)) {
  const item = onboardingToWix(staffId, form);
  const label = `Onboarding ${staffId}`;
  check(`${label} _id is staff id`, item._id === staffId, String(item._id));
  const undef = Object.entries(item).filter(([, v]) => v === undefined).map(([k]) => k);
  check(`${label} emits no undefined`, undef.length === 0, undef.join(','));
  // Compare against the same key order the mapper writes.
  const back = onboardingFromWix(item);
  const d = diffPath(back, form);
  check(`${label} round-trips`, d === null, d ?? '');
}

/* --------------------------------------------------- schema lock + redaction */

// Lock the wire format: a rename here is a breaking schema change. This must
// use a FULLY populated record, because `compact()` omits absent optional
// fields, so a sparse fixture would only ever exercise a subset of the schema.
const fullStaff: StaffUser = {
  id: 'staff-fixture',
  memberId: 'member-fixture',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '0400 000 000',
  role: 'manager',
  staffType: 'bar_staff',
  position: 'General Manager',
  avatar: 'https://example.com/a.png',
  hourlyRate: 42.5,
  onboardingCompleted: true,
  onboardingSubmittedAt: '2026-01-01',
  onboardingStatus: 'approved',
  tfnProvided: true,
  invitationSentAt: '2026-01-02',
  inviteToken: 'tok-123',
  welcomeNote: 'Welcome aboard',
};
const staffItem = staffToWix(fullStaff);
const expectedStaffKeys = [
  '_id', 'memberId', 'firstName', 'lastName', 'email', 'phone', 'role', 'staffType',
  'position', 'avatar', 'hourlyRate', 'onboardingCompleted', 'onboardingSubmittedAt',
  'onboardingStatus', 'tfnProvided', 'invitationSentAt', 'inviteToken', 'welcomeNote',
].sort().join(',');
check(
  'StaffMembers wire format (fully populated)',
  Object.keys(staffItem).sort().join(',') === expectedStaffKeys,
  Object.keys(staffItem).sort().join(','),
);
check('fully populated staff round-trips', diffPath(staffFromWix(staffItem), fullStaff) === null);

const dir = staffToDirectory(INITIAL_STAFF_USERS[0]);

// The directory is readable by every signed-in member, so pay and private
// contact/onboarding fields must never appear in it.
check(
  'StaffDirectory excludes pay and private fields',
  !('hourlyRate' in dir) && !('phone' in dir) && !('inviteToken' in dir) && !('tfnProvided' in dir),
  Object.keys(dir).join(','),
);

// Email is deliberately INCLUDED: it is what lets a signed-in member be matched
// to their roster row without admin read access to StaffMembers (see
// src/lib/wix/link.ts). Asserted here so the trade-off stays explicit rather
// than becoming an accident nobody notices.
check(
  'StaffDirectory includes email for member matching',
  typeof dir.email === 'string' && dir.email.length > 0,
  String(dir.email),
);

// Role and onboarding status drive RBAC and the onboarding guard on the staff
// side, so they must survive into the member-readable projection.
check(
  'StaffDirectory keeps role and onboarding status',
  dir.role === INITIAL_STAFF_USERS[0].role && dir.onboardingStatus === INITIAL_STAFF_USERS[0].onboardingStatus,
  `${String(dir.role)}/${String(dir.onboardingStatus)}`,
);
check('StaffDirectory keeps identity and role', dir._id === INITIAL_STAFF_USERS[0].id && dir.role === 'manager');

// JSON composite fields must actually be strings on the wire.
const cl = INITIAL_CHECKLISTS.find((c) => c.photos && c.photos.length > 0);
if (cl) {
  const item = checklistToWix(cl);
  check('ChecklistItem photos encoded as Text', typeof item.photosJson === 'string');
  check('ChecklistItem photos decoded back', checklistFromWix(item).photos?.length === cl.photos!.length);
} else {
  check('ChecklistItem has photo fixture to test', false, 'no checklist item in mockData has photos');
}

const availItem = availabilityToWix(Object.values(INITIAL_AVAILABILITIES)[0]);
check('Availability encoded as Text', typeof availItem.availabilitiesJson === 'string');

// A malformed JSON field must degrade, never throw.
check(
  'malformed photosJson degrades to undefined',
  checklistFromWix({ _id: 'x', photosJson: '{not json' }).photos === undefined,
);
check(
  'malformed availabilitiesJson degrades to {}',
  typeof availabilityFromWix({ _id: 'x', availabilitiesJson: 'nope' }).availabilities === 'object',
);

/* -------------------------------------------------------------------- report */

console.log(`\n  Wix mapper round-trip test`);
console.log('  ' + '-'.repeat(58));
console.log(`  entities checked : ${INITIAL_STAFF_USERS.length} staff, ${INITIAL_SHIFTS.length} shifts, ` +
  `${Object.keys(INITIAL_AVAILABILITIES).length} availability, ${INITIAL_CLOCK_RECORDS.length} clock, ` +
  `${INITIAL_TASKS.length} tasks, ${INITIAL_CHECKLISTS.length} checklist, ` +
  `${INITIAL_DOCUMENTS.length} docs, ${Object.keys(INITIAL_ONBOARDING_DATA).length} onboarding`);
console.log(`  assertions passed: ${passed}`);
console.log(`  assertions failed: ${failures.length}`);

if (failures.length) {
  console.error('\n  FAILURES:');
  for (const f of failures.slice(0, 40)) console.error(`    - ${f}`);
  if (failures.length > 40) console.error(`    ... and ${failures.length - 40} more`);
  process.exit(1);
}
console.log('\n  OK: every entity round-trips through the Wix wire format losslessly.\n');
