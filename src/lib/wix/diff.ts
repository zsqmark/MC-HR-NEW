/**
 * Minimal write-set computation for syncing local state to the Wix CMS.
 *
 * `AppContext` already fires one effect per collection on every change. Rather
 * than rewrite its ~30 mutation functions to make async Wix calls (which would
 * mean threading `await` through every handler and every component), the
 * existing state remains the source of truth for the UI and each effect hands
 * us the previous and next value. We then compute the smallest set of writes.
 *
 * This is why the module is pure and separate: "what changed" is the part that
 * can be wrong in a way nobody notices, so it is unit-tested rather than
 * assumed. See `scripts/test-diff.ts`.
 */

export interface CollectionDiff<T> {
  /** Items to insert or update, in `next` order. */
  upsert: T[];
  /** Ids present in `prev` but gone from `next`. */
  removed: string[];
}

/**
 * Stable serialisation for change detection.
 *
 * `JSON.stringify` respects key order, so a rebuilt object with identical values
 * in a different field order would look "changed" and trigger a pointless write
 * on every render pass. Sorting keys keeps comparison about values only.
 */
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
}

/** The same value modulo `undefined` fields and key order. */
export function sameEntity(a: unknown, b: unknown): boolean {
  return canonical(a) === canonical(b);
}

/**
 * Diff two id-keyed arrays.
 *
 * Note this is a *write-set*, not a patch: an unchanged item appears in neither
 * list, so a no-op state change produces no network traffic at all.
 */
export function diffById<T extends { id: string }>(prev: T[], next: T[]): CollectionDiff<T> {
  const prevById = new Map(prev.map((item) => [item.id, item]));
  const upsert: T[] = [];

  for (const item of next) {
    const before = prevById.get(item.id);
    if (!before || !sameEntity(before, item)) upsert.push(item);
  }

  const nextIds = new Set(next.map((item) => item.id));
  const removed = [...prevById.keys()].filter((id) => !nextIds.has(id));

  return { upsert, removed };
}

/** A `Record<key, T>` where `key` becomes the item's `id`. */
export function diffRecord<T>(
  prev: Record<string, T>,
  next: Record<string, T>,
): CollectionDiff<{ id: string; value: T }> {
  const toArray = (rec: Record<string, T>) =>
    Object.entries(rec).map(([id, value]) => ({ id, value }));
  return diffById(toArray(prev), toArray(next));
}

/** True when a diff contains no work. */
export function isEmptyDiff(diff: CollectionDiff<unknown>): boolean {
  return diff.upsert.length === 0 && diff.removed.length === 0;
}
