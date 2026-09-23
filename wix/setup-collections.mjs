/**
 * Creates the Wix CMS collections this app needs.
 *
 * Idempotent: re-running skips collections that already exist, so it is safe to
 * run again after adding a field to the schema below.
 *
 * Requires an ADMIN API key with the "Manage Data Collections" scope:
 *   WIX_API_KEY=<key>  WIX_SITE_ID=<metasiteId>  node wix/setup-collections.mjs
 *
 * Use `--plan` to print the exact request bodies without calling Wix. That is
 * useful for reviewing the schema, and is how this script can be checked
 * before any credentials exist. (Not `--dry-run`: npm treats that as its own
 * flag when the script is invoked through `npm run`.)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FIELD TYPES: only universally supported types are used (TEXT / NUMBER /
 * BOOLEAN). Harmony sites REJECT OBJECT, ARRAY, TAGS, DOCUMENT, IMAGE,
 * MEDIA_GALLERY and MULTI_REFERENCE with a WDE0080 error, so composite values
 * are stored as JSON in TEXT fields. The field keys here MUST match the keys
 * produced by src/lib/wix/mappers.ts — `npm run test:mappers` guards that.
 *
 * PERMISSIONS: `read: SITE_MEMBER_AUTHOR` means "the member who created the
 * item, plus admins". That is what keeps bank details in Onboarding private to
 * each staff member.
 *
 * IMPORTANT CONSEQUENCE: Wix only knows about two tiers here - admins and site
 * members. The app's "manager" role therefore has to correspond to a Wix SITE
 * ADMIN (or a role with CMS edit rights), because ADMIN-level permissions are
 * what gate writes to Shifts, StaffMembers and StaffDirectory. Invite your
 * managers as site admins/roles; ordinary staff stay plain members.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const API = 'https://www.wixapis.com/wix-data/v2/collections';
// `--plan` rather than `--dry-run`: npm intercepts `--dry-run` as its own flag
// and never forwards it. Both spellings work when run via `node` directly.
const DRY_RUN = process.argv.includes('--plan') || process.argv.includes('--dry-run');

/* ------------------------------------------------------------------ env load */

function loadEnvFile() {
  const p = path.resolve('.env');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, '');
    if (!process.env[m[1]] && value) process.env[m[1]] = value;
  }
}
loadEnvFile();

const API_KEY = process.env.WIX_API_KEY || '';
const SITE_ID = process.env.WIX_SITE_ID || '';

/* --------------------------------------------------------------- field helpers */

const TEXT = 'TEXT';
const NUMBER = 'NUMBER';
const BOOLEAN = 'BOOLEAN';

/** Turn `firstName` into `First Name` for the CMS UI. */
const label = (key) =>
  key
    .replace(/Json$/, ' (JSON)')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());

/** Build a field list from a compact `key: TYPE` map. */
const fields = (spec) =>
  Object.entries(spec).map(([key, type]) => ({ key, displayName: label(key), type }));

const ADMIN = 'ADMIN';
const MEMBER = 'SITE_MEMBER';
const AUTHOR = 'SITE_MEMBER_AUTHOR';

/* ------------------------------------------------------------- the schema */

export const COLLECTIONS = [
  {
    id: 'StaffMembers',
    displayName: 'Staff Members',
    displayField: 'firstName',
    // Holds hourlyRate, contact details and invite tokens: admins only.
    permissions: { read: ADMIN, insert: ADMIN, update: ADMIN, remove: ADMIN },
    fields: {
      memberId: TEXT, firstName: TEXT, lastName: TEXT, email: TEXT, phone: TEXT,
      role: TEXT, staffType: TEXT, position: TEXT, avatar: TEXT,
      hourlyRate: NUMBER, onboardingCompleted: BOOLEAN, onboardingSubmittedAt: TEXT,
      onboardingStatus: TEXT, tfnProvided: BOOLEAN, invitationSentAt: TEXT,
      inviteToken: TEXT, welcomeNote: TEXT,
    },
  },
  {
    id: 'StaffDirectory',
    displayName: 'Staff Directory (no pay)',
    displayField: 'firstName',
    // The only staff collection ordinary members may read. Pay, phone, TFN flag
    // and invite tokens stay in StaffMembers. `memberId` and `email` are here so
    // a signed-in member can be matched to their own roster row.
    permissions: { read: MEMBER, insert: ADMIN, update: ADMIN, remove: ADMIN },
    fields: {
      memberId: TEXT, firstName: TEXT, lastName: TEXT, email: TEXT, position: TEXT,
      staffType: TEXT, role: TEXT, avatar: TEXT, onboardingCompleted: BOOLEAN,
      onboardingStatus: TEXT,
    },
  },
  {
    id: 'Shifts',
    displayName: 'Shifts',
    displayField: 'dateStr',
    permissions: { read: MEMBER, insert: ADMIN, update: ADMIN, remove: ADMIN },
    fields: {
      day: TEXT, dateStr: TEXT, shiftType: TEXT, startTime: TEXT, endTime: TEXT,
      assignedStaffId: TEXT, roleRequired: TEXT, status: TEXT, notes: TEXT,
    },
  },
  {
    id: 'Availability',
    displayName: 'Staff Availability',
    displayField: 'staffId',
    permissions: { read: MEMBER, insert: MEMBER, update: AUTHOR, remove: ADMIN },
    fields: { staffId: TEXT, weekStartDate: TEXT, submittedAt: TEXT, availabilitiesJson: TEXT },
  },
  {
    id: 'ClockRecords',
    displayName: 'Clock Records',
    displayField: 'staffName',
    permissions: { read: MEMBER, insert: MEMBER, update: AUTHOR, remove: ADMIN },
    fields: {
      staffId: TEXT, staffName: TEXT, position: TEXT, date: TEXT, shiftType: TEXT,
      clockInTime: TEXT, clockOutTime: TEXT, breakMinutes: NUMBER, totalHours: NUMBER,
      status: TEXT, breakStartTime: TEXT, hourlyRate: NUMBER, notes: TEXT,
    },
  },
  {
    id: 'Tasks',
    displayName: 'Tasks',
    displayField: 'title',
    // Staff must be able to tick a task off, so update is open to members.
    permissions: { read: MEMBER, insert: ADMIN, update: MEMBER, remove: ADMIN },
    fields: {
      title: TEXT, description: TEXT, taskType: TEXT, recurringDaysJson: TEXT,
      assignedToStaffId: TEXT, assignedStaffName: TEXT, assignedByManager: TEXT,
      priority: TEXT, shift: TEXT, targetRole: TEXT, dueDate: TEXT,
      isCompleted: BOOLEAN, completedAt: TEXT, completedByStaffName: TEXT,
      completedByStaffId: TEXT, completionNote: TEXT,
    },
  },
  {
    id: 'ChecklistItems',
    displayName: 'Checklist Items',
    displayField: 'title',
    permissions: { read: MEMBER, insert: ADMIN, update: MEMBER, remove: ADMIN },
    fields: {
      category: TEXT, roleSet: TEXT, title: TEXT, instructions: TEXT,
      isCompleted: BOOLEAN, completedBy: TEXT, completedAt: TEXT,
      requiresTemp: BOOLEAN, tempReading: TEXT, requiresPhoto: BOOLEAN,
      maxPhotos: NUMBER, photosJson: TEXT,
    },
  },
  {
    id: 'RestaurantDocuments',
    displayName: 'Restaurant Documents',
    displayField: 'title',
    permissions: { read: MEMBER, insert: MEMBER, update: ADMIN, remove: ADMIN },
    fields: {
      title: TEXT, category: TEXT, fileName: TEXT, fileSize: TEXT, fileUrl: TEXT,
      uploadedBy: TEXT, uploadedFor: TEXT, uploadedAt: TEXT, description: TEXT,
      isProtected: BOOLEAN,
    },
  },
  {
    id: 'Onboarding',
    displayName: 'Onboarding Forms',
    displayField: 'q2_firstNameMiddle',
    // Bank and superannuation details: readable only by their author + admins.
    permissions: { read: AUTHOR, insert: MEMBER, update: AUTHOR, remove: ADMIN },
    fields: {
      q1_email: TEXT, q2_firstNameMiddle: TEXT, q3_lastName: TEXT, q4_dob: TEXT,
      q5_mobile: TEXT, q6_emailAddress: TEXT, q7_superProvider: TEXT,
      q8_superMemberNumber: TEXT, q9_bankName: TEXT, q10_bankBsb: TEXT,
      q11_bankAccountNumber: TEXT, q12_vevoDocJson: TEXT, q13_foodHandlerDocJson: TEXT,
      q14_tfnDocJson: TEXT, q15_foodHygieneCertJson: TEXT,
    },
  },
];

/* ----------------------------------------------------------------- the request */

/** Split a field list into the maximum number of fields allowed per PUT. */
async function call(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: API_KEY,
      'wix-site-id': SITE_ID,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

async function existingCollectionIds() {
  const { ok, status, json } = await call('GET', `${API}?limit=200`);
  if (!ok) {
    // 404 simply means no collections yet.
    if (status === 404) return new Set();
    throw new Error(`Could not list collections (HTTP ${status}): ${JSON.stringify(json)}`);
  }
  const list = json.collections ?? [];
  return new Set(list.map((c) => c.id));
}

async function main() {
  console.log('\n  Wix CMS collection setup');
  console.log('  ' + '-'.repeat(58));
  console.log(`  site        ${SITE_ID || '(unset)'}`);
  console.log(`  collections ${COLLECTIONS.length}`);
  console.log(`  mode        ${DRY_RUN ? 'DRY RUN (no API calls)' : 'live'}`);

  if (DRY_RUN) {
    for (const c of COLLECTIONS) {
      const body = {
        collection: {
          id: c.id,
          displayName: c.displayName,
          displayField: c.displayField,
          fields: fields(c.fields),
          permissions: c.permissions,
        },
      };
      const fieldCount = body.collection.fields.length;
      console.log(`\n  POST ${API}`);
      console.log(`    ${c.id}  (${fieldCount} fields, read=${c.permissions.read})`);
      console.log(`    ${JSON.stringify(body.collection.fields.map((f) => f.key).join(','))}`);
    }
    console.log('\n  Dry run complete: request bodies are well formed.\n');
    return;
  }

  if (!API_KEY) {
    console.error('\n  ERROR: WIX_API_KEY is not set.');
    console.error('  Create an admin API key with the "Manage Data Collections" scope:');
    console.error('    https://manage.wix.com/account/api-keys');
    console.error('  Then set WIX_API_KEY and WIX_SITE_ID in .env, or preview with');
    console.error('  `npm run wix:setup:plan`.\n');
    process.exit(1);
  }
  if (!SITE_ID) {
    console.error('\n  ERROR: WIX_SITE_ID is not set (the metasiteId from your dashboard URL).\n');
    process.exit(1);
  }

  const existing = await existingCollectionIds();
  let created = 0;
  let skipped = 0;
  const failed = [];

  for (const c of COLLECTIONS) {
    if (existing.has(c.id)) {
      console.log(`  skip    ${c.id} (already exists)`);
      skipped++;
      continue;
    }
    const body = {
      collection: {
        id: c.id,
        displayName: c.displayName,
        displayField: c.displayField,
        fields: fields(c.fields),
        permissions: c.permissions,
      },
    };
    try {
      const { ok, status, json } = await call('POST', API, body);
      if (ok) {
        console.log(`  create  ${c.id} (${body.collection.fields.length} fields)`);
        created++;
      } else {
        const msg = json?.message || JSON.stringify(json);
        console.log(`  FAIL    ${c.id} (HTTP ${status}): ${msg}`);
        failed.push(`${c.id}: ${msg}`);
      }
    } catch (e) {
      console.log(`  FAIL    ${c.id}: ${e.message}`);
      failed.push(`${c.id}: ${e.message}`);
    }
  }

  console.log('\n  ' + '-'.repeat(58));
  console.log(`  created ${created}, skipped ${skipped}, failed ${failed.length}`);
  if (failed.length) {
    console.error('\n  Failures:');
    for (const f of failed) console.error(`    - ${f}`);
    console.error('\n  A WDE0080 error means the site is a Harmony site and rejected a');
    console.error('  field type. The schema here avoids the known-rejected types, so');
    console.error('  report the exact field and type if you see one.\n');
    process.exit(1);
  }
  console.log('\n  Next: seed the collections with `npm run wix:seed`.\n');
}

// Only run when invoked directly, so tests can import COLLECTIONS without
// triggering API calls.
const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((e) => {
    console.error(`\n  ERROR: ${e.message}\n`);
    process.exit(1);
  });
}