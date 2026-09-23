/**
 * Tests for the CMS schema comparison.
 *
 * Each case here corresponds to a failure that is silent in production: Wix
 * accepts writes to non-existent fields and drops them, so a missing field or a
 * wrong type shows up as missing data rather than an error. The comparison is
 * therefore worth testing precisely.
 *
 * Run:  npx tsx scripts/test-schemaCompare.ts
 */
// Types come from wix/schema-compare.d.mts; the module itself is plain ESM so it
// can also run under node via wix/doctor.mjs.
import { compareSchema, isHealthy, normalizeActual, isSystemField } from '../wix/schema-compare.mjs';

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = '') {
  if (condition) passed++;
  else failures.push(`${label}${detail ? ` -> ${detail}` : ''}`);
}

/** One expected collection for tests. */
const expected = [
  {
    id: 'Shifts',
    fields: { day: 'TEXT', startTime: 'TEXT', notes: 'TEXT' },
    permissions: { read: 'SITE_MEMBER', insert: 'ADMIN', update: 'ADMIN', remove: 'ADMIN' },
  },
];

/** The same collection as the API would return it, including system fields. */
const goodActual = [
  {
    id: 'Shifts',
    fields: [
      { key: '_id', type: 'TEXT' },
      { key: '_createdDate', type: 'DATETIME' },
      { key: 'day', type: 'TEXT' },
      { key: 'startTime', type: 'TEXT' },
      { key: 'notes', type: 'TEXT' },
    ],
    permissions: { read: 'SITE_MEMBER', insert: 'ADMIN', update: 'ADMIN', remove: 'ADMIN' },
  },
];

/* ------------------------------------------------------------------ helpers */

check('system fields are recognised', isSystemField('_id') && isSystemField('_owner'));
check('normal fields are not system fields', !isSystemField('day'));

{
  const norm = normalizeActual(goodActual[0]);
  check('normalize drops system fields', !('_id' in norm.fields), Object.keys(norm.fields).join(','));
  check('normalize keeps real fields', norm.fields.day === 'TEXT');
  check('normalize reports the id', norm.id === 'Shifts');
}

/* -------------------------------------------------------------- clean match */

{
  const r = compareSchema(expected, goodActual);
  check('a matching schema is healthy', isHealthy(r), JSON.stringify(r.problems));
  check('matching collection is listed', r.matched.includes('Shifts'), r.matched.join(','));
  check('nothing missing', r.missingCollections.length === 0);
  check('no problems at all', r.problems.length === 0, JSON.stringify(r.problems));
}

/* --------------------------------------------------------- missing collection */

{
  const r = compareSchema(expected, []);
  check('absent collection is reported', r.missingCollections.includes('Shifts'));
  check('absent collection is unhealthy', !isHealthy(r));
  check('absent collection names the kind',
    r.problems[0]?.kind === 'missing_collection', r.problems[0]?.kind);
}

/* ------------------------------------------------------------- missing field */

{
  // "notes" was never created. Wix would silently drop every write to it.
  const actual = [
    {
      id: 'Shifts',
      fields: [
        { key: 'day', type: 'TEXT' },
        { key: 'startTime', type: 'TEXT' },
      ],
      permissions: goodActual[0].permissions,
    },
  ];
  const r = compareSchema(expected, actual);
  check('missing field detected', !isHealthy(r));
  const p = r.problems.find((x: any) => x.kind === 'missing_field');
  check('missing field names the field', p?.detail.includes('notes'), String(p?.detail));
  check('collection is not counted as matched', !r.matched.includes('Shifts'));
}

/* --------------------------------------------------------------- type drift */

{
  const actual = [
    {
      id: 'Shifts',
      fields: [
        { key: 'day', type: 'TEXT' },
        { key: 'startTime', type: 'NUMBER' }, // wrong
        { key: 'notes', type: 'TEXT' },
      ],
      permissions: goodActual[0].permissions,
    },
  ];
  const r = compareSchema(expected, actual);
  const p = r.problems.find((x: any) => x.kind === 'type_mismatch');
  check('type mismatch detected', !!p, JSON.stringify(r.problems));
  check('type mismatch reports both types',
    p?.detail.includes('NUMBER') && p?.detail.includes('TEXT'), String(p?.detail));
  check('type drift is unhealthy', !isHealthy(r));
}

{
  // Case differences in the enum must not be reported as drift.
  const actual = [
    {
      id: 'Shifts',
      fields: [
        { key: 'day', type: 'text' },
        { key: 'startTime', type: 'Text' },
        { key: 'notes', type: 'TEXT' },
      ],
      permissions: goodActual[0].permissions,
    },
  ];
  check('type comparison is case-insensitive', isHealthy(compareSchema(expected, actual)));
}

/* --------------------------------------------------------- permission drift */

{
  const actual = [
    {
      id: 'Shifts',
      fields: goodActual[0].fields,
      // read widened from SITE_MEMBER to ANYONE: pay-adjacent data exposed.
      permissions: { read: 'ANYONE', insert: 'ADMIN', update: 'ADMIN', remove: 'ADMIN' },
    },
  ];
  const r = compareSchema(expected, actual);
  const p = r.problems.find((x: any) => x.kind === 'permission_mismatch');
  check('widened permission detected', !!p, JSON.stringify(r.problems));
  check('permission drift names the action', p?.detail.startsWith('read is'), String(p?.detail));
  check('permission drift is unhealthy', !isHealthy(r));
}

{
  // Permissions absent from the response must not be invented as failures.
  const actual = [{ id: 'Shifts', fields: goodActual[0].fields }];
  check('missing permissions payload is tolerated', isHealthy(compareSchema(expected, actual)));
}

/* ------------------------------------------------------- extra field handling */

{
  const actual = [
    {
      id: 'Shifts',
      fields: [...goodActual[0].fields, { key: 'addedByAdmin', type: 'TEXT' }],
      permissions: goodActual[0].permissions,
    },
  ];
  const r = compareSchema(expected, actual);
  const p = r.problems.find((x: any) => x.kind === 'unexpected_field');
  check('extra field is reported', !!p, JSON.stringify(r.problems));
  check('extra field is not fatal', isHealthy(r), JSON.stringify(r.problems));
  check('extra field does not stop the collection matching', r.matched.includes('Shifts'));
}

/* ------------------------------------------------------------- multiple collections */

{
  const many = [
    { id: 'A', fields: { x: 'TEXT' }, permissions: null },
    { id: 'B', fields: { y: 'NUMBER' }, permissions: null },
    { id: 'C', fields: { z: 'BOOLEAN' }, permissions: null },
  ];
  const actualMany = [
    { id: 'A', fields: [{ key: 'x', type: 'TEXT' }] },
    { id: 'B', fields: [{ key: 'y', type: 'TEXT' }] },
  ];
  const r = compareSchema(many, actualMany);
  check('counts every expected collection', r.checkedCollections === 3, String(r.checkedCollections));
  check('only the clean ones are matched', r.matched.join(',') === 'A', r.matched.join(','));
  check('C is reported missing', r.missingCollections.join(',') === 'C', r.missingCollections.join(','));
  check('B has a type problem', r.problems.some((p: any) => p.collection === 'B' && p.kind === 'type_mismatch'));
}

/* --------------------------------------------------------------------- report */

console.log('\n  CMS schema comparison test');
console.log('  ' + '-'.repeat(58));
console.log(`  assertions passed : ${passed}`);
console.log(`  assertions failed : ${failures.length}`);

if (failures.length) {
  console.error('\n  FAILURES:');
  for (const f of failures) console.error(`    - ${f}`);
  process.exit(1);
}
console.log('\n  OK: schema drift, type drift and permission drift are all detected.\n');
