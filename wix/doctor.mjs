/**
 * Preflight / doctor for the Wix CMS backend.
 *
 * Read-only: it never creates or modifies anything, so it is safe to run at any
 * time, before or after setting the site up.
 *
 * It answers the questions that cannot be settled from code alone:
 *   - does the API key actually work, and does it have the right scope?
 *   - which of the 9 collections exist, and are they still missing?
 *   - for collections that exist, does every field exist with the expected TYPE
 *     and the expected permissions?
 *   - is the frontend's client ID configured?
 *
 * That third point is the important one. Wix does not error on a write to a
 * field that does not exist - it drops it - so a hand-created collection with a
 * typo'd field name, or a wrong field type, otherwise shows up as data that
 * simply never appears.
 *
 * Usage:
 *   npm run wix:doctor
 */
import fs from 'node:fs';
import path from 'node:path';
import { COLLECTIONS } from './setup-collections.mjs';
import { compareSchema, isHealthy } from './schema-compare.mjs';

const API = 'https://www.wixapis.com/wix-data/v2/collections';

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

const apiKey = (process.env.WIX_API_KEY || '').trim();
const siteId = (process.env.WIX_SITE_ID || '').trim();
const clientId = (process.env.VITE_WIX_CLIENT_ID || '').trim();

const line = (s = '') => console.log(s);

/* -------------------------------------------------------------------- checks */

function reportConfig() {
  line('\n  Configuration');
  line('  ' + '-'.repeat(60));
  line(`  VITE_WIX_CLIENT_ID  ${clientId ? `set (${clientId.slice(0, 8)}...)` : 'MISSING'}`);
  line(`  WIX_API_KEY         ${apiKey ? `set (${apiKey.slice(0, 6)}..., ${apiKey.length} chars)` : 'MISSING'}`);
  line(`  WIX_SITE_ID         ${siteId || 'MISSING'}`);
}

async function listCollections() {
  const res = await fetch(`${API}?limit=200`, {
    headers: { Authorization: apiKey, 'wix-site-id': siteId, 'Content-Type': 'application/json' },
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text.slice(0, 400) }; }
  return { status: res.status, ok: res.ok, json };
}

/* ---------------------------------------------------------------------- main */

async function main() {
  line('\n  Wix backend doctor');
  line('  ' + '='.repeat(60));
  reportConfig();

  const missingConfig = [];
  if (!clientId) missingConfig.push('VITE_WIX_CLIENT_ID (from Headless Settings; needed to build the app)');
  if (!apiKey) missingConfig.push('WIX_API_KEY (needed to create/verify the CMS collections)');
  if (!siteId) missingConfig.push('WIX_SITE_ID (the metasiteId from your dashboard URL)');

  if (missingConfig.length) {
    line('\n  Cannot check the CMS: configuration is incomplete.');
    line('  Still needed:');
    for (const m of missingConfig) line(`    - ${m}`);
    line('\n  See wix/DEPLOY.md steps 1-4. Then re-run: npm run wix:doctor');
    line('');
    process.exitCode = 1;
    return;
  }

  line('\n  Querying the site\'s collections...');
  let result;
  try {
    result = await listCollections();
  } catch (e) {
    line(`\n  ERROR: could not reach the Wix API: ${e instanceof Error ? e.message : String(e)}`);
    line('  Check your internet connection and that www.wixapis.com is reachable.\n');
    process.exitCode = 1;
    return;
  }

  if (!result.ok) {
    line(`\n  ERROR: the API rejected the request (HTTP ${result.status}).`);
    if (result.status === 401 || result.status === 403) {
      line('  The API key is invalid, expired, or missing the "Manage Data Collections" scope.');
      line('  Create one at https://manage.wix.com/account/api-keys');
    } else {
      line(`  Response: ${JSON.stringify(result.json).slice(0, 400)}`);
    }
    line('');
    process.exitCode = 1;
    return;
  }

  const actual = result.json.collections ?? [];
  line(`  Found ${actual.length} collection(s) on the site.`);

  const comparison = compareSchema(COLLECTIONS, actual);

  line('\n  Schema check');
  line('  ' + '-'.repeat(60));
  line(`  expected collections : ${comparison.checkedCollections}`);
  line(`  present and correct  : ${comparison.matched.length}`);
  line(`  missing entirely     : ${comparison.missingCollections.length}`);

  if (comparison.matched.length) {
    line('\n  Correct:');
    for (const id of comparison.matched) line(`    ok    ${id}`);
  }

  const fatal = comparison.problems.filter((p) => p.kind !== 'unexpected_field');
  const minor = comparison.problems.filter((p) => p.kind === 'unexpected_field');

  if (fatal.length) {
    line('\n  Needs attention:');
    for (const p of fatal) line(`    ${p.collection}: ${p.detail}`);
  }
  if (minor.length) {
    line('\n  Informational (not a problem):');
    for (const p of minor) line(`    ${p.collection}: ${p.detail}`);
  }

  line('\n  ' + '='.repeat(60));

  if (isHealthy(comparison)) {
    line('  RESULT: the CMS schema matches what the app expects.');
    line('');
    line('  This also answers two questions types could not: the site accepts every');
    line('  field type used here (so the Harmony restrictions do not bite), and the');
    line('  permissions are as designed.');
    line('');
    line('  Next:');
    line('    npm run wix:seed:plan    # preview the seed');
    line('    npm run wix:seed         # write the 143 records');
    line('    npm run build            # then deploy wix-drop/');
    line('');
    return;
  }

  if (comparison.missingCollections.length === COLLECTIONS.length) {
    line('  RESULT: none of the collections exist yet.');
    line('  Next: npm run wix:setup:plan  then  npm run wix:setup');
    line('');
    return;
  }

  line('  RESULT: the schema does not match. See "Needs attention" above.');
  line('');
  line('  If you created the collections by hand, align the field names and types with');
  line('  wix/collections.md, or delete them and run `npm run wix:setup`.');
  line('  A "missing_field" entry is the dangerous one: Wix silently discards writes');
  line('  to a field that does not exist, so that data would never be saved.');
  line('');
  process.exitCode = 1;
}

main().catch((e) => {
  console.error(`\n  ERROR: ${e instanceof Error ? e.message : String(e)}\n`);
  // Set the code rather than calling process.exit(): exiting while fetch still
  // holds a keep-alive socket aborts libuv on Windows and masks the real status.
  process.exitCode = 1;
});
