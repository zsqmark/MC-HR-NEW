/**
 * Wix Media Manager uploads.
 *
 * Photo evidence (checklists) and onboarding documents arrive from the browser
 * as base64 data URLs. Those must NOT go into CMS item fields: a single phone
 * photo is several megabytes of base64, Wix caps item size, and every read of
 * the collection would re-send the whole blob. So each upload is pushed to the
 * Media Manager and only the resulting URL is stored on the item.
 *
 * Flow: `generateFileUploadUrl` -> PUT the bytes to that URL ->
 * `generateFileDownloadUrl` -> store the URL.
 *
 * The parsing/sizing helpers are pure and separately tested
 * (`scripts/test-media.ts`), because getting base64 length or the MIME type
 * wrong here is silent: the upload succeeds and stores something subtly wrong.
 */
import { getWixClient, isWixConfigured, ensureFreshTokens } from './client';
import {
  parseDataUrl,
  dataUrlByteLength,
  isTooLarge,
  safeFileName,
  MAX_UPLOAD_BYTES,
} from './dataUrl';

// Re-exported so callers can reach the pure helpers without a second import path.
export {
  isDataUrl,
  parseDataUrl,
  dataUrlByteLength,
  isTooLarge,
  safeFileName,
  MAX_UPLOAD_BYTES,
} from './dataUrl';

/** Turn a base64 payload into bytes. Browser-only (`atob`). */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export class MediaUploadError extends Error {}

/**
 * Upload a base64 data URL to the Wix Media Manager and return its public URL.
 *
 * Throws `MediaUploadError` with an actionable message on every failure path, so
 * callers can surface it verbatim rather than inventing a message.
 */
export async function uploadDataUrl(dataUrl: string, fileName: string): Promise<string> {
  if (!isWixConfigured()) {
    throw new MediaUploadError('Cannot upload files: Wix is not configured (VITE_WIX_CLIENT_ID is missing).');
  }
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    throw new MediaUploadError('Cannot upload files: the data URL is malformed.');
  }
  const bytes = dataUrlByteLength(dataUrl);
  if (bytes === 0) {
    throw new MediaUploadError('Cannot upload an empty file.');
  }
  if (isTooLarge(dataUrl)) {
    throw new MediaUploadError(
      `File is ${(bytes / 1048576).toFixed(1)}MB, over the ${Math.round(MAX_UPLOAD_BYTES / 1048576)}MB limit. ` +
        'Please shrink or re-take the photo.',
    );
  }

  await ensureFreshTokens();
  const name = safeFileName(fileName, parsed.mimeType);
  const client = getWixClient();

  let uploadUrl: string | undefined;
  try {
    const res = await client.files.generateFileUploadUrl(parsed.mimeType, { fileName: name });
    uploadUrl = res?.uploadUrl;
  } catch (e) {
    throw new MediaUploadError(`Could not prepare the upload: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!uploadUrl) {
    throw new MediaUploadError('Wix did not return an upload URL.');
  }

  // The bytes are PUT verbatim; the content type must match what was declared.
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': parsed.mimeType },
    body: new Blob([base64ToBytes(parsed.base64)], { type: parsed.mimeType }),
  });
  if (!put.ok) {
    throw new MediaUploadError(`Upload failed (HTTP ${put.status}).`);
  }

  try {
    const dl = await client.files.generateFileDownloadUrl(name);
    const url = dl?.downloadUrls?.[0]?.url;
    if (!url) throw new MediaUploadError('Upload succeeded but Wix returned no download URL.');
    return url;
  } catch (e) {
    if (e instanceof MediaUploadError) throw e;
    throw new MediaUploadError(
      `File uploaded but its URL could not be read: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}
