/**
 * Schema-drift guard.
 *
 * The mapper layer and the collection setup script define the same contract
 * twice: `mappers.ts` decides which keys are written, and
 * `wix/setup-collections.mjs` decides which fields exist. Wix silently drops
 * writes to fields that do not exist, so a drift between them would show up as
 * quietly vanishing data rather than an error.
 *
 * This test runs every entity in the real mock data through its mapper and
 * asserts that every key produced exists as a declared collection field.
 *
 * Run:  npx tsx scripts/test-schema.ts
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
// eslint-disable-next-line
// @ts-ignore - plain ESM module, no type declarations
import { COLLECTIONS } from '../wix/setup-collections.mjs';

/** `_id` is a Wix system field and is never declared in a field list. */
const SYSTEM_FIELDS = new Set(['_id', '_owner', '_createdDate', '_updatedDate']);

const schemaById = new Map<string, Set<string>>(
  (COLLECTIONS as { id: string; fields: Record<string, string> }[]).map((c) => [
    c.id,
    new Set(Object.keys(c.fields)),
  ]),
);

if (schemaById.size === 0) {
  console.error('  ERROR: could not read the collection schema from wix/setup-collections.mjs');
  process.exit(1);
}

const failures: string[] = [];
let checked = 0;

function checkKeys(collectionId: string, items: WixItem[], label: string) {
  const declared = schemaById.get(collectionId);
  if (!declared) {
    failures.push(`collection ${collectionId} is not declared in setup-collections.mjs`);
    return;
  }
  for (const [index, item] of items.entries()) {
    for (const key of Object.keys(item)) {
      checked++;
      if (SYSTEM_FIELDS.has(key)) continue;
      if (!declared.has(key)) {
        failures.push(
          `${label}[${index}] writes "${key}" but ${collectionId} has no such field ` +
            `(Wix would silently drop it)`,
        );
      }
    }
  }
}

checkKeys('StaffMembers', INITIAL_STAFF_USERS.map(staffToWix), 'StaffUser');
checkKeys('StaffDirectory', INITIAL_STAFF_USERS.map(staffToDirectory), 'StaffDirectory');
checkKeys('Shifts', INITIAL_SHIFTS.map(shiftToWix), 'ShiftSlot');
checkKeys('Availability', Object.values(INITIAL_AVAILABILITIES).map(availabilityToWix), 'Availability');
checkKeys('ClockRecords', INITIAL_CLOCK_RECORDS.map(clockRecordToWix), 'ClockRecord');
checkKeys('Tasks', INITIAL_TASKS.map(taskToWix), 'TaskItem');
checkKeys('ChecklistItems', INITIAL_CHECKLISTS.map(checklistToWix), 'ChecklistItem');
checkKeys('RestaurantDocuments', INITIAL_DOCUMENTS.map(documentToWix), 'RestaurantDocument');
checkKeys(
  'Onboarding',
  Object.entries(INITIAL_ONBOARDING_DATA).map(([staffId, form]) => onboardingToWix(staffId, form)),
  'OnboardingFormData',
);

console.log('\n  Wix schema-drift guard');
console.log('  ' + '-'.repeat(58));
console.log(`  collections declared : ${schemaById.size}`);
console.log(`  field values checked : ${checked}`);
console.log(`  problems             : ${failures.length}`);

if (failures.length) {
  console.error('\n  DRIFT DETECTED:');
  for (const f of [...new Set(failures)].slice(0, 30)) console.error(`    - ${f}`);
  if (new Set(failures).size > 30) console.error(`    ... and more`);
  process.exit(1);
}
console.log('\n  OK: every mapped field exists in the declared collection schema.\n');
