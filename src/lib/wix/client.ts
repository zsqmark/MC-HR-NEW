/**
 * The single shared Wix client.
 *
 * The Wix docs are explicit that the app must use one shared client instance
 * rather than creating new ones in components, otherwise authentication state
 * is lost between calls. This module is the only place a client is built.
 *
 * No client secret is used anywhere: Wix Headless OAuth relies on PKCE, so the
 * client ID alone is sufficient for visitor and member flows. That is what
 * allows this app to stay a purely static SPA.
 */
import { createClient, OAuthStrategy, type Tokens } from '@wix/sdk';
import { items } from '@wix/data';
import { members } from '@wix/members';
import { files } from '@wix/media';
import { needsRenewal } from './tokens';

const TOKENS_KEY = 'malaya_wix_tokens_v1';

/**
 * Read the client ID defensively.
 *
 * Outside a Vite build (a Node script or test importing this module)
 * `import.meta.env` does not exist, and reading through it would throw at module
 * load instead of simply reporting "not configured".
 */
const ENV = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;

/** Public client ID from `VITE_WIX_CLIENT_ID`. */
export const WIX_CLIENT_ID: string = ENV?.VITE_WIX_CLIENT_ID ?? '';

/** True once a client ID has been configured; the app can run read-only demo mode without it. */
export const isWixConfigured = (): boolean => WIX_CLIENT_ID.trim().length > 0;

/* ------------------------------------------------------------ token storage */

/**
 * Tokens persist in localStorage so a member stays signed in across reloads.
 *
 * Note: the Wix docs recommend refreshing tokens server-side so the refresh
 * token is never exposed to the browser. This app has no server, so refresh
 * happens in the browser instead. That is an accepted trade-off for an internal
 * staff tool, but it is a real difference from Wix's hardened recommendation.
 */
export function loadTokens(): Tokens | undefined {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Tokens;
    if (!parsed?.accessToken?.value) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function saveTokens(tokens: Tokens): void {
  try {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  } catch {
    /* storage full or unavailable: session simply won't persist */
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(TOKENS_KEY);
  } catch {
    /* ignore */
  }
}

/* -------------------------------------------------------------- the singleton */

function buildClient() {
  return createClient({
    modules: { items, members, files },
    auth: OAuthStrategy({
      clientId: WIX_CLIENT_ID,
      tokens: loadTokens(),
    }),
  });
}

export type MalayaWixClient = ReturnType<typeof buildClient>;

let singleton: MalayaWixClient | null = null;

/** Get the shared client, creating it on first use. */
export function getWixClient(): MalayaWixClient {
  if (!singleton) singleton = buildClient();
  return singleton;
}

/**
 * Replace the shared client. **Testing only.**
 *
 * The Wix runtime path cannot execute without a real client ID, so the
 * repository layer would otherwise be verifiable only by type-checking. This
 * lets `scripts/test-repo.ts` drive the real `repo.ts` code against a fake
 * client and assert the collection IDs and write payloads it produces.
 */
export function setWixClientForTesting(client: MalayaWixClient | null): void {
  singleton = client;
}

/**
 * Refresh the access token when it has expired, and persist the new pair.
 * Safe to call before any batch of reads.
 */
export async function ensureFreshTokens(): Promise<void> {
  const client = getWixClient();
  const tokens = client.auth.getTokens();
  const refresh = tokens?.refreshToken?.value;
  if (!refresh) return;

  // Unit handling lives in ./tokens so it can be tested without Vite: the SDK
  // stores expiresAt in epoch MILLISECONDS, which is easy to misread as seconds.
  if (!needsRenewal(tokens?.accessToken?.expiresAt)) return;

  const renewed = await client.auth.renewToken(tokens.refreshToken!);
  client.auth.setTokens(renewed);
  saveTokens(renewed);
}
