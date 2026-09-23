/**
 * Wix Members sign-in using the Wix-hosted login page.
 *
 * Flow (all browser-side, PKCE, no client secret):
 *   startWixLogin()  -> generateOAuthData + getAuthUrl -> redirect to Wix
 *   Wix authenticates the member and redirects back with `code` + `state`
 *   completeWixLoginIfPresent() -> getMemberTokens -> setTokens + persist
 *
 * This replaces the demo `1234` manager PIN as the source of identity.
 * Authorisation still comes from the `role` field on the staff record, but the
 * identity is now a verified Wix member rather than a shared secret.
 *
 * Dashboard prerequisites (these are the usual causes of failure):
 *  - The site must be PUBLISHED, or `getAuthUrl()` fails.
 *  - `buildRedirectUri()` must exactly match an allowed authorization redirect
 *    URI in Headless Settings.
 *  - The client's **Login URL** field must be EMPTY for the Wix-hosted page.
 */
import {
  getWixClient,
  isWixConfigured,
  saveTokens,
  clearTokens,
  ensureFreshTokens,
} from './client';

const OAUTH_DATA_KEY = 'malaya_wix_oauth_data_v1';

/**
 * The redirect URI Wix returns to. Uses origin + pathname so it stays stable
 * regardless of query string or fragment, and so it can be registered once in
 * Headless Settings.
 */
export function buildRedirectUri(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

/** Every auth-related query/fragment key Wix may append. */
const AUTH_PARAMS = ['code', 'state', 'error', 'error_description', 'errorDescription'];

function stripAuthParamsFromUrl(): void {
  try {
    const url = new URL(window.location.href);
    for (const k of AUTH_PARAMS) url.searchParams.delete(k);
    for (const k of AUTH_PARAMS) url.hash = url.hash.replace(new RegExp(`[#&]?${k}=[^&]*`, 'g'), '');
    const cleaned = url.pathname + (url.search ? url.search : '') + (url.hash && url.hash !== '#' ? url.hash : '');
    window.history.replaceState({}, document.title, cleaned);
  } catch {
    /* non-fatal: a stale code in the URL is harmless after exchange */
  }
}

/** Redirect the member to the Wix-hosted login page. */
export async function startWixLogin(): Promise<void> {
  if (!isWixConfigured()) {
    throw new Error('Wix is not configured: VITE_WIX_CLIENT_ID is missing.');
  }
  const client = getWixClient();
  const oauthData = client.auth.generateOAuthData(buildRedirectUri(), window.location.href);
  localStorage.setItem(OAUTH_DATA_KEY, JSON.stringify(oauthData));
  const { authUrl } = await client.auth.getAuthUrl(oauthData);
  window.location.href = authUrl;
}

/**
 * Finish a login if the current URL carries a Wix auth response.
 * Returns true when a session was established.
 */
export async function completeWixLoginIfPresent(): Promise<boolean> {
  if (!isWixConfigured()) return false;

  const client = getWixClient();
  const returned = client.auth.parseFromUrl();
  if (!returned.code && !returned.error) return false;

  if (returned.error) {
    localStorage.removeItem(OAUTH_DATA_KEY);
    stripAuthParamsFromUrl();
    throw new Error(returned.errorDescription || returned.error);
  }

  const raw = localStorage.getItem(OAUTH_DATA_KEY);
  if (!raw) {
    // The member landed here without starting the flow in this browser.
    stripAuthParamsFromUrl();
    throw new Error('Login could not be completed: no stored OAuth data for this browser session.');
  }

  try {
    const oauthData = JSON.parse(raw);
    const tokens = await client.auth.getMemberTokens(returned.code, returned.state, oauthData);
    localStorage.removeItem(OAUTH_DATA_KEY);
    client.auth.setTokens(tokens);
    saveTokens(tokens);
    return true;
  } finally {
    stripAuthParamsFromUrl();
  }
}

/** True when a member session is present. */
export function isMemberLoggedIn(): boolean {
  if (!isWixConfigured()) return false;
  try {
    return getWixClient().auth.loggedIn();
  } catch {
    return false;
  }
}

/**
 * The signed-in member's id, used to resolve the matching staff record.
 * Returns null when nobody is signed in or the session cannot be read.
 */
export async function getCurrentMemberId(): Promise<string | null> {
  const member = await getCurrentMember();
  return member?.id ?? null;
}

export interface CurrentMember {
  id: string;
  /** The member's login email, used to match an unclaimed roster row. */
  email: string | null;
}

/**
 * The signed-in member's identity.
 *
 * The email matters because it is how a member who has never been linked to a
 * roster row gets matched to one; see `src/lib/wix/link.ts`.
 */
export async function getCurrentMember(): Promise<CurrentMember | null> {
  if (!isMemberLoggedIn()) return null;
  try {
    await ensureFreshTokens();
    const { member } = await getWixClient().members.getCurrentMember();
    if (!member?._id) return null;
    const m = member as typeof member & {
      loginEmail?: string;
      contact?: { emails?: string[] };
    };
    const email = m.loginEmail ?? m.contact?.emails?.[0] ?? null;
    return { id: m._id, email };
  } catch {
    return null;
  }
}

/** Sign out of Wix, then return to the app. */
export async function logoutFromWix(): Promise<void> {
  clearTokens();
  try {
    const client = getWixClient();
    const { logoutUrl } = await client.auth.logout(buildRedirectUri());
    window.location.href = logoutUrl;
  } catch {
    window.location.reload();
  }
}
