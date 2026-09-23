/**
 * Base64 data-URL parsing and sizing.
 *
 * Kept free of any Vite-only import (`import.meta.env`) or Wix SDK import so it
 * can be unit-tested in Node. The upload logic in `media.ts` builds on this.
 *
 * Why this exists at all: photo evidence and onboarding documents arrive from
 * the browser as base64 data URLs, and those must never be written into a CMS
 * item field. A phone photo is several megabytes of base64, Wix caps item size,
 * and every read of the collection would re-send the blob. They are uploaded to
 * the Media Manager instead, and only the URL is stored.
 */

/**
 * Refuse anything larger than this before spending a round trip.
 *
 * Wix's own Media Manager limit is higher, but a 25MB upload from a phone on
 * restaurant wifi is a bad experience and is almost always an un-downscaled
 * camera photo. Failing fast with a clear message beats a long hang.
 */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export interface ParsedDataUrl {
  mimeType: string;
  /** The base64 payload, without the `data:` prefix. */
  base64: string;
}

/**
 * True for a `data:` URL that carries a base64 payload.
 *
 * Deliberately permissive about parameters before `;base64`: real data URLs
 * include things like `data:image/png;charset=utf-8;base64,...`, and a stricter
 * regex silently classifies those as malformed so the upload fails with a
 * confusing message. `parseDataUrl` does the precise validation.
 */
export function isDataUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.startsWith('data:')) return false;
  const comma = value.indexOf(',');
  if (comma < 0) return false;
  return value
    .slice(5, comma)
    .split(';')
    .some((p) => p.trim().toLowerCase() === 'base64');
}

/**
 * Split a base64 data URL into its MIME type and payload.
 * Returns null for anything malformed, so callers can fall back safely.
 */
export function parseDataUrl(value: unknown): ParsedDataUrl | null {
  if (!isDataUrl(value)) return null;
  const comma = value.indexOf(',');
  if (comma < 0) return null;
  const header = value.slice(5, comma); // strip leading "data:"
  const parts = header.split(';');
  const rawMime = parts[0];
  if (!parts.slice(1).some((p) => p.trim().toLowerCase() === 'base64')) return null;
  return {
    mimeType: rawMime && rawMime.trim() ? rawMime.trim() : 'application/octet-stream',
    base64: value.slice(comma + 1),
  };
}

/**
 * Decoded byte length of a base64 data URL, without decoding it.
 *
 * base64 encodes 3 bytes per 4 characters; `=` padding removes 1 or 2. This lets
 * an oversized upload be rejected without allocating the whole buffer first.
 */
export function dataUrlByteLength(value: unknown): number {
  const parsed = parseDataUrl(value);
  if (!parsed) return 0;
  const b64 = parsed.base64.replace(/\s/g, '');
  if (b64.length === 0) return 0;
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  const bytes = Math.floor((b64.length * 3) / 4) - padding;
  return bytes > 0 ? bytes : 0;
}

/** Whether a data URL exceeds the upload ceiling. */
export function isTooLarge(value: unknown, limit: number = MAX_UPLOAD_BYTES): boolean {
  return dataUrlByteLength(value) > limit;
}

/**
 * Make a name safe for the Media Manager.
 *
 * Wix derives the stored file's identity from the name, so this strips path
 * separators and characters that would be reinterpreted, and appends an
 * extension derived from the MIME type when the original had none.
 */
export function safeFileName(name: string, mimeType?: string): string {
  const base = (name || 'upload')
    .replace(/[\\/]+/g, '-')
    .replace(/[^\w.\- ]+/g, '_')
    .replace(/\s+/g, '-')
    .replace(/^[.\-]+/, '')
    .slice(0, 100);
  const withName = base.length > 0 ? base : 'upload';
  if (/\.[A-Za-z0-9]{2,5}$/.test(withName)) return withName;
  const ext = mimeType?.split('/')[1]?.replace(/[^A-Za-z0-9]/g, '');
  return ext ? `${withName}.${ext}` : withName;
}
