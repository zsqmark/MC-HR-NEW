/**
 * Tests for Wix member <-> staff record linking.
 *
 * The case that matters most is the last one: a roster row already linked to a
 * different member must not be claimable by matching its email. Getting that
 * wrong would let anyone register a Wix account with a known work address and
 * take over that employee's record - pay rate, onboarding documents and all.
 *
 * Run:  npx tsx scripts/test-link.ts
 */
import { findStaffForMember, normalizeEmail } from '../src/lib/wix/link';
import type { StaffUser } from '../src/types';

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = '') {
  if (condition) passed++;
  else failures.push(`${label}${detail ? ` -> ${detail}` : ''}`);
}

const staff = (id: string, email: string, memberId?: string): StaffUser => ({
  id,
  memberId,
  firstName: id,
  lastName: 'Test',
  email,
  phone: '',
  role: 'staff',
  position: 'Wait Staff',
  hourlyRate: 26.5,
  onboardingCompleted: true,
  onboardingStatus: 'approved',
});

/* ------------------------------------------------------------- normalizeEmail */

check('lowercases', normalizeEmail('John.Tan@Example.COM') === 'john.tan@example.com');
check('trims', normalizeEmail('  a@b.com  ') === 'a@b.com');
check('handles undefined', normalizeEmail(undefined) === '');
check('handles null', normalizeEmail(null) === '');
check('handles empty', normalizeEmail('') === '');

/* ---------------------------------------------------------------- memberId wins */

{
  const list = [staff('staff-john', 'john@x.com', 'member-1'), staff('staff-kai', 'kai@x.com')];
  // Email points at kai, but the explicit link on john is authoritative.
  const r = findStaffForMember({ id: 'member-1', email: 'kai@x.com' }, list);
  check('explicit memberId wins over email', r.reason === 'memberId', r.reason);
  check('explicit memberId returns that row', r.match?.id === 'staff-john', String(r.match?.id));
}

{
  // Email must not re-point an existing link even if the stored email changed.
  const list = [staff('staff-john', 'old@x.com', 'member-1')];
  const r = findStaffForMember({ id: 'member-1', email: 'new@x.com' }, list);
  check('existing link survives an email change', r.match?.id === 'staff-john' && r.reason === 'memberId');
}

/* --------------------------------------------------------------- email matching */

{
  const list = [staff('staff-john', 'john.tan@Example.com'), staff('staff-kai', 'kai@x.com')];
  const r = findStaffForMember({ id: 'member-9', email: '  JOHN.TAN@example.COM ' }, list);
  check('email match ignores case and space', r.match?.id === 'staff-john', `${r.reason}:${r.match?.id}`);
  check('email match reported as email', r.reason === 'email');
  check('a single candidate is reported', r.candidates.length === 1, String(r.candidates.length));
}

{
  const list = [staff('staff-john', 'john@x.com')];
  const r = findStaffForMember({ id: 'member-9', email: 'nobody@x.com' }, list);
  check('unknown email does not match', r.match === null && r.reason === 'none', r.reason);
  check('unknown email yields no candidates', r.candidates.length === 0, String(r.candidates.length));
}

{
  const list = [staff('staff-john', 'john@x.com')];
  const r = findStaffForMember({ id: 'member-9' }, list);
  check('member without email does not match', r.match === null && r.reason === 'none', r.reason);
}

{
  const list = [staff('staff-john', '')];
  const r = findStaffForMember({ id: 'member-9', email: '' }, list);
  check('empty email on both sides does not match', r.match === null, `${r.reason}:${r.match?.id}`);
}

/* ------------------------------------------------------------------- ambiguous */

{
  const list = [staff('staff-john', 'shared@x.com'), staff('staff-john2', 'shared@x.com')];
  const r = findStaffForMember({ id: 'member-9', email: 'shared@x.com' }, list);
  check('duplicate emails are ambiguous, not arbitrary', r.match === null && r.reason === 'ambiguous', r.reason);
  check('both candidates reported', r.candidates.length === 2, String(r.candidates.length));
  check('ambiguous match is refused outright', r.match === null);
}

/* -------------------------------------------------------------- SECURITY CASES */

{
  // staff-john already belongs to member-1. An attacker registers a Wix account
  // with john's work email and must NOT be able to claim the row.
  const list = [staff('staff-john', 'john@x.com', 'member-1')];
  const r = findStaffForMember({ id: 'attacker', email: 'john@x.com' }, list);
  check('claimed row is not claimable by email', r.match === null, `claimed by ${r.match?.memberId}`);
  check('claimed row reports none, not a stale match', r.reason === 'none', r.reason);
  check('claimed row is excluded from candidates', r.candidates.length === 0, String(r.candidates.length));
}

{
  // A claimed row must not even block a legitimate unclaimed row... but it must
  // not be selected either. Mixed case: one claimed, one free, same email.
  const list = [staff('staff-john', 'shared@x.com', 'member-1'), staff('staff-new', 'shared@x.com')];
  const r = findStaffForMember({ id: 'member-9', email: 'shared@x.com' }, list);
  check('claimed row excluded from candidates', r.candidates.length === 1, String(r.candidates.length));
  check('unclaimed row is matched', r.match?.id === 'staff-new', String(r.match?.id));
}

{
  // Empty-string memberId must count as unclaimed, not as claimed by "".
  const list = [staff('staff-john', 'john@x.com', '')];
  const r = findStaffForMember({ id: 'member-9', email: 'john@x.com' }, list);
  check('empty memberId counts as unclaimed', r.match?.id === 'staff-john', r.reason);
}

/* ---------------------------------------------------------------------- report */

console.log('\n  Wix member linking test');
console.log('  ' + '-'.repeat(58));
console.log(`  assertions passed : ${passed}`);
console.log(`  assertions failed : ${failures.length}`);

if (failures.length) {
  console.error('\n  FAILURES:');
  for (const f of failures) console.error(`    - ${f}`);
  process.exit(1);
}
console.log('\n  OK: linking is correct, and a claimed row cannot be taken over.\n');
