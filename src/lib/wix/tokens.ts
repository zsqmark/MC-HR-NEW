/**
 * Token expiry arithmetic.
 *
 * This is separated from `client.ts` for two reasons: it has no Vite-only
 * imports so it can be unit-tested in Node, and it encodes a unit convention
 * that is easy to get wrong.
 *
 * **`expiresAt` is epoch MILLISECONDS.** The SDK constructs it as
 * `Date.now() + expires_in * 1000` and compares it with `cachedToken.expiresAt >
 * Date.now()`. The published docs example (`expiresAt: 1234567890`) *looks* like
 * seconds, which is exactly the trap: multiplying it by 1000 again turns a
 * perfectly valid token into one that appears to expire in the year 41,000, so
 * renewal never fires and the session starts failing once the real token lapses.
 *
 * `expiryToMillis` therefore normalises rather than assuming: anything below
 * the millisecond epoch of 2001 cannot be milliseconds, so it is read as seconds.
 */

/** Epoch ms for 2001-09-09. Any "expiry" below this cannot be a real ms stamp. */
const MILLIS_FLOOR = 1e12;

/** Renew slightly before the real expiry so an in-flight request cannot race it. */
export const RENEW_SKEW_MS = 60_000;

/**
 * Normalise an `expiresAt` value to epoch milliseconds.
 * Returns 0 for missing/zero values, which callers treat as "already expired".
 */
export function expiryToMillis(expiresAt: number | undefined | null): number {
  if (typeof expiresAt !== 'number' || !Number.isFinite(expiresAt) || expiresAt <= 0) return 0;
  return expiresAt < MILLIS_FLOOR ? expiresAt * 1000 : expiresAt;
}

/**
 * Whether the access token should be renewed now.
 *
 * The skew window is **inclusive**: with 60s or less remaining, renew. A missing
 * or zero expiry also counts as needing renewal, because the SDK uses
 * `expiresAt: 0` for an empty token slot and a refresh token may well still be
 * usable.
 */
export function needsRenewal(
  expiresAt: number | undefined | null,
  now: number = Date.now(),
  skewMs: number = RENEW_SKEW_MS,
): boolean {
  const expiryMs = expiryToMillis(expiresAt);
  if (expiryMs === 0) return true;
  return expiryMs - now <= skewMs;
}
