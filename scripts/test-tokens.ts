/**
 * Tests for token expiry arithmetic.
 *
 * This exists because of a real bug: the SDK stores `expiresAt` in epoch
 * MILLISECONDS, but its own documentation example looks like seconds. Reading it
 * as seconds makes a valid token look like it expires in the year 41,000, so
 * renewal never fires and the app starts 401-ing once the token actually lapses -
 * roughly an hour into a session, and only in production.
 *
 * Run:  npx tsx scripts/test-tokens.ts
 */
import { expiryToMillis, needsRenewal, RENEW_SKEW_MS } from '../src/lib/wix/tokens';

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = '') {
  if (condition) passed++;
  else failures.push(`${label}${detail ? ` -> ${detail}` : ''}`);
}

// A fixed "now" so the tests are deterministic.
const NOW = Date.UTC(2026, 0, 15, 12, 0, 0); // 2026-01-15T12:00:00Z
const MIN = 60_000;

/* ------------------------------------------------------------- expiryToMillis */

check('milliseconds pass through', expiryToMillis(NOW) === NOW, String(expiryToMillis(NOW)));
check(
  'seconds are upscaled to milliseconds',
  expiryToMillis(1_700_000_000) === 1_700_000_000_000,
  String(expiryToMillis(1_700_000_000)),
);
check('undefined becomes 0', expiryToMillis(undefined) === 0);
check('null becomes 0', expiryToMillis(null) === 0);
check('0 stays 0', expiryToMillis(0) === 0);
check('negative becomes 0', expiryToMillis(-5) === 0);
check('NaN becomes 0', expiryToMillis(Number.NaN) === 0);
check('Infinity becomes 0', expiryToMillis(Number.POSITIVE_INFINITY) === 0);

/* --------------------------------------------------------------- needsRenewal */

// The bug this module exists to prevent: a token valid for another hour, stored
// as epoch milliseconds, must NOT be renewed.
{
  const oneHourOut = NOW + 60 * MIN;
  check('valid ms token is not renewed', needsRenewal(oneHourOut, NOW) === false);
}

// The same instant expressed in seconds must behave identically.
{
  const oneHourOutSeconds = Math.floor((NOW + 60 * MIN) / 1000);
  check('valid seconds token is not renewed', needsRenewal(oneHourOutSeconds, NOW) === false);
}

// Inside the skew window: renew early so an in-flight call cannot race expiry.
{
  const thirtySecondsOut = NOW + 30_000;
  check('token inside the skew window renews', needsRenewal(thirtySecondsOut, NOW) === true);
  check('skew window is one minute', RENEW_SKEW_MS === 60_000);
}

// Boundary: exactly at the skew edge renews; one second beyond does not.
{
  check('exactly at skew edge renews', needsRenewal(NOW + RENEW_SKEW_MS, NOW) === true);
  check('one second beyond skew does not renew', needsRenewal(NOW + RENEW_SKEW_MS + 1000, NOW) === false);
}

// Already expired.
{
  check('expired ms token renews', needsRenewal(NOW - MIN, NOW) === true);
  check('expired seconds token renews', needsRenewal(Math.floor((NOW - MIN) / 1000), NOW) === true);
}

// Missing / empty slot: the SDK uses 0 for an empty token, so renew.
{
  check('zero expiry renews', needsRenewal(0, NOW) === true);
  check('undefined expiry renews', needsRenewal(undefined, NOW) === true);
  check('null expiry renews', needsRenewal(null, NOW) === true);
}

/* ----------------------------------------------- the regression, stated plainly */

{
  // Old buggy behaviour: expiresAt * 1000. Reproduce it and prove it was wrong.
  const oneHourOut = NOW + 60 * MIN;
  const buggyExpiringSoon = oneHourOut * 1000 - NOW < RENEW_SKEW_MS;
  check('regression guard: the old *1000 maths never renewed', buggyExpiringSoon === false);
  check(
    'regression guard: the fix renews only when actually due',
    needsRenewal(oneHourOut, NOW) === false && needsRenewal(NOW + 30_000, NOW) === true,
  );
}

/* ---------------------------------------------------------------------- report */

console.log('\n  Wix token expiry test');
console.log('  ' + '-'.repeat(58));
console.log(`  assertions passed : ${passed}`);
console.log(`  assertions failed : ${failures.length}`);

if (failures.length) {
  console.error('\n  FAILURES:');
  for (const f of failures) console.error(`    - ${f}`);
  process.exit(1);
}
console.log('\n  OK: expiry units are normalised and renewal fires when due.\n');
