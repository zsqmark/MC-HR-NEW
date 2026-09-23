/**
 * Which screen the Wix startup gate should show.
 *
 * Extracted from the JSX so it can be tested exhaustively, because the property
 * that matters here is not obvious from reading the component: **the app must
 * never render before its data is ready.** Many components dereference
 * `activeStaff` and every collection, so rendering early does not degrade
 * gracefully — it crashes, or worse, shows an empty roster as if it were real.
 *
 * Keeping the decision in a pure function means every combination of load status
 * and auth status can be asserted, including the ones that are hard to reach by
 * hand (auth error while data is loading, say).
 *
 * Pure: no React, no Wix, no Vite.
 */

export type DataStatus = 'loading' | 'ready' | 'error' | 'unprovisioned';
export type AuthStatus = 'idle' | 'authenticating' | 'signed_in' | 'signed_out' | 'error';

/** What the gate should render. `ready` means "render the actual app". */
export type GateView = 'ready' | 'loading' | 'signin' | 'unprovisioned' | 'error';

/**
 * Resolve the view for a given state.
 *
 * `dataStatus` takes precedence over `authStatus`, because once the CMS has been
 * read the auth outcome is already reflected in it: `unprovisioned` and `error`
 * are terminal outcomes that must be shown even if a session exists.
 */
export function selectGateView(dataStatus: DataStatus, authStatus: AuthStatus): GateView {
  // Only a fully loaded dataset may render the app.
  if (dataStatus === 'ready') return 'ready';
  if (dataStatus === 'unprovisioned') return 'unprovisioned';
  if (dataStatus === 'error') return 'error';

  // dataStatus === 'loading' from here.
  if (authStatus === 'signed_in') return 'loading'; // session is valid, CMS is still arriving
  return 'signin'; // idle | authenticating | signed_out | error
}

/** True when the gate should render the app rather than a placeholder. */
export function gateAllowsApp(view: GateView): boolean {
  return view === 'ready';
}
