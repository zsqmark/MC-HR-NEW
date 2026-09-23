/**
 * Tests for the Wix startup gate's view selection.
 *
 * The property under test is a safety one: the app must never render before its
 * data is ready. Every component dereferences the loaded collections, so an
 * early render crashes or shows an empty roster as though it were real data.
 *
 * The cross product is only 4 x 5 = 20 states, so this asserts all of them
 * exhaustively rather than sampling - there is no reason to spot-check a
 * decision table this small.
 *
 * Run:  npx tsx scripts/test-gateView.ts
 */
import {
  selectGateView,
  gateAllowsApp,
  type AuthStatus,
  type DataStatus,
} from '../src/context/gateView';

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = '') {
  if (condition) passed++;
  else failures.push(`${label}${detail ? ` -> ${detail}` : ''}`);
}

const DATA: DataStatus[] = ['loading', 'ready', 'error', 'unprovisioned'];
const AUTH: AuthStatus[] = ['idle', 'authenticating', 'signed_in', 'signed_out', 'error'];

/* ------------------------------------------------------- the fail-closed property */

{
  let premature = 0;
  let checked = 0;
  for (const data of DATA) {
    for (const auth of AUTH) {
      checked++;
      const view = selectGateView(data, auth);
      if (data !== 'ready' && gateAllowsApp(view)) {
        premature++;
        failures.push(`app would render with dataStatus=${data}, authStatus=${auth}`);
      }
      if (data !== 'ready' && view === 'ready') {
        premature++;
      }
    }
  }
  check('every state combination was exercised', checked === DATA.length * AUTH.length, String(checked));
  check('the app NEVER renders before data is ready', premature === 0, `${premature} premature render(s)`);
}

{
  // And the converse: a ready dataset must actually render the app, otherwise the
  // gate would deadlock with no way in.
  let blocked = 0;
  for (const auth of AUTH) {
    if (!gateAllowsApp(selectGateView('ready', auth))) blocked++;
  }
  check('a ready dataset always renders the app', blocked === 0, `${blocked} blocked`);
}

/* --------------------------------------------------------------- specific states */

check('loaded -> app', selectGateView('ready', 'signed_in') === 'ready');
check('loading + signed in -> loading screen',
  selectGateView('loading', 'signed_in') === 'loading', selectGateView('loading', 'signed_in'));
check('loading + signed out -> sign-in', selectGateView('loading', 'signed_out') === 'signin');
check('loading + idle -> sign-in', selectGateView('loading', 'idle') === 'signin');
check('loading + authenticating -> sign-in (shows redirect notice)',
  selectGateView('loading', 'authenticating') === 'signin');
check('loading + auth error -> sign-in (shows the error)',
  selectGateView('loading', 'error') === 'signin');

check('unprovisioned -> explanation', selectGateView('unprovisioned', 'signed_in') === 'unprovisioned');
check('unprovisioned wins over signed-out',
  selectGateView('unprovisioned', 'signed_out') === 'unprovisioned',
  selectGateView('unprovisioned', 'signed_out'));
check('error -> retry screen', selectGateView('error', 'signed_in') === 'error');
check('error wins over signed-out',
  selectGateView('error', 'signed_out') === 'error', selectGateView('error', 'signed_out'));

/* ---------------------------------------------------------------- exhaustiveness */

{
  // Pin the whole table so an accidental reorder of the conditions is caught.
  const expected: Record<string, string> = {
    'ready|idle': 'ready',
    'ready|authenticating': 'ready',
    'ready|signed_in': 'ready',
    'ready|signed_out': 'ready',
    'ready|error': 'ready',
    'loading|idle': 'signin',
    'loading|authenticating': 'signin',
    'loading|signed_in': 'loading',
    'loading|signed_out': 'signin',
    'loading|error': 'signin',
    'error|idle': 'error',
    'error|authenticating': 'error',
    'error|signed_in': 'error',
    'error|signed_out': 'error',
    'error|error': 'error',
    'unprovisioned|idle': 'unprovisioned',
    'unprovisioned|authenticating': 'unprovisioned',
    'unprovisioned|signed_in': 'unprovisioned',
    'unprovisioned|signed_out': 'unprovisioned',
    'unprovisioned|error': 'unprovisioned',
  };
  let mismatches = 0;
  for (const [key, want] of Object.entries(expected)) {
    const [data, auth] = key.split('|') as [DataStatus, AuthStatus];
    const got = selectGateView(data, auth);
    if (got !== want) {
      mismatches++;
      failures.push(`table ${key}: got ${got}, want ${want}`);
    }
  }
  check('full decision table matches', mismatches === 0, `${mismatches} mismatch(es)`);
  check('table covers every combination', Object.keys(expected).length === DATA.length * AUTH.length,
    String(Object.keys(expected).length));
}

/* ---------------------------------------------------------------------- report */

console.log('\n  Wix startup gate test');
console.log('  ' + '-'.repeat(58));
console.log(`  assertions passed : ${passed}`);
console.log(`  assertions failed : ${failures.length}`);

if (failures.length) {
  console.error('\n  FAILURES:');
  for (const f of failures.slice(0, 30)) console.error(`    - ${f}`);
  process.exit(1);
}
console.log('\n  OK: the gate is fail-closed and the full decision table is pinned.\n');
