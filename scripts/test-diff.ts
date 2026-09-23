/**
 * Tests for the Wix sync write-set computation.
 *
 * The dangerous failure mode here is silence: if the diff misses an update, the
 * UI shows the change and the database never learns about it. So this covers
 * the cases that matter — adds, updates, deletes, no-ops, and the key-order
 * false positive that would cause a write on every render.
 *
 * Run:  npx tsx scripts/test-diff.ts
 */
import { diffById, diffRecord, sameEntity, isEmptyDiff } from '../src/lib/wix/diff';

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = '') {
  if (condition) passed++;
  else failures.push(`${label}${detail ? ` -> ${detail}` : ''}`);
}

const task = (id: string, title: string, extra: Record<string, unknown> = {}) => ({
  id,
  title,
  ...extra,
});

/* ------------------------------------------------------------------ diffById */

{
  const prev = [task('a', 'One'), task('b', 'Two')];

  // No change at all must produce zero writes.
  const noop = diffById(prev, [task('a', 'One'), task('b', 'Two')]);
  check('unchanged list produces no upserts', noop.upsert.length === 0, JSON.stringify(noop.upsert));
  check('unchanged list produces no removals', noop.removed.length === 0);
  check('isEmptyDiff agrees', isEmptyDiff(noop));
}

{
  // Key order must not count as a change.
  const prev = [{ id: 'a', title: 'One', priority: 'high', dueDate: '2026-01-01' }];
  const next = [{ dueDate: '2026-01-01', priority: 'high', title: 'One', id: 'a' }];
  const diff = diffById(prev, next as typeof prev);
  check('reordered keys are not a change', diff.upsert.length === 0, `got ${diff.upsert.length}`);
  check('sameEntity ignores key order', sameEntity(prev[0], next[0]));
}

{
  // undefined fields must not count as a change either.
  const prev = [{ id: 'a', title: 'One' }];
  const next = [{ id: 'a', title: 'One', note: undefined }];
  check('undefined field is not a change', diffById(prev, next as typeof prev).upsert.length === 0);
}

{
  const prev = [task('a', 'One'), task('b', 'Two')];
  const next = [task('a', 'One renamed'), task('b', 'Two')];
  const diff = diffById(prev, next);
  check('single edit yields exactly one upsert', diff.upsert.length === 1, `got ${diff.upsert.length}`);
  check('the upsert is the edited item', diff.upsert[0]?.id === 'a');
  check('an edit is not a removal', diff.removed.length === 0);
}

{
  const prev = [task('a', 'One')];
  const next = [task('a', 'One'), task('c', 'Three')];
  const diff = diffById(prev, next);
  check('insert detected', diff.upsert.length === 1 && diff.upsert[0].id === 'c');
  check('insert is not a removal', diff.removed.length === 0);
}

{
  const prev = [task('a', 'One'), task('b', 'Two')];
  const next = [task('b', 'Two')];
  const diff = diffById(prev, next);
  check('delete detected', diff.removed.length === 1 && diff.removed[0] === 'a', diff.removed.join(','));
  check('delete is not an upsert', diff.upsert.length === 0);
}

{
  // A wholesale replacement: every item new, every old one gone.
  const prev = [task('a', 'One'), task('b', 'Two')];
  const next = [task('c', 'Three'), task('d', 'Four')];
  const diff = diffById(prev, next);
  check('full replacement upserts all new', diff.upsert.length === 2);
  check('full replacement removes all old', diff.removed.length === 2);
}

{
  // Empty -> items (initial seed / first load) and items -> empty (reset).
  const seed = diffById([], [task('a', 'One')]);
  check('empty prev upserts everything', seed.upsert.length === 1 && seed.removed.length === 0);
  const wipe = diffById([task('a', 'One')], []);
  check('empty next removes everything', wipe.upsert.length === 0 && wipe.removed.length === 1);
}

{
  // Nested values must be compared, not reference-compared.
  const prev = [task('a', 'One', { photos: ['x', 'y'] })];
  const nextSame = [task('a', 'One', { photos: ['x', 'y'] })];
  const nextDiff = [task('a', 'One', { photos: ['x', 'z'] })];
  check('equal nested arrays are not a change', diffById(prev, nextSame).upsert.length === 0);
  check('different nested arrays are a change', diffById(prev, nextDiff).upsert.length === 1);
}

/* ---------------------------------------------------------------- diffRecord */

{
  const prev = { 'staff-john': { weekStartDate: '2026-09-07', lunch: true } };
  const same = { 'staff-john': { weekStartDate: '2026-09-07', lunch: true } };
  const changed = { 'staff-john': { weekStartDate: '2026-09-07', lunch: false } };
  const added = { ...same, 'staff-kai': { weekStartDate: '2026-09-07', lunch: true } };

  check('record diff: no change', diffRecord(prev, same).upsert.length === 0);
  check('record diff: change detected', diffRecord(prev, changed).upsert.length === 1);
  check('record diff: key carried as id', diffRecord(prev, changed).upsert[0]?.id === 'staff-john');
  check('record diff: addition detected', diffRecord(prev, added).upsert.length === 1);
  check('record diff: removal detected', diffRecord(added, prev).removed.length === 1);
  check('record diff: removal names the key', diffRecord(added, prev).removed[0] === 'staff-kai');
}

/* -------------------------------------------------------------------- report */

console.log('\n  Wix sync diff test');
console.log('  ' + '-'.repeat(58));
console.log(`  assertions passed : ${passed}`);
console.log(`  assertions failed : ${failures.length}`);

if (failures.length) {
  console.error('\n  FAILURES:');
  for (const f of failures) console.error(`    - ${f}`);
  process.exit(1);
}
console.log('\n  OK: the diff computes minimal, correct write-sets.\n');
