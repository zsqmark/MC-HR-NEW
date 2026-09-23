/**
 * Compares the schema this app expects against what a Wix site actually has.
 *
 * Pure and network-free so it can be unit-tested (`scripts/test-schemaCompare.ts`).
 * `wix/doctor.mjs` does the fetching and calls in here.
 *
 * This exists because the CMS schema is defined in two places that can drift:
 *   - `wix/setup-collections.mjs` (what we ask Wix to create)
 *   - the live site (what Wix actually holds, possibly hand-created)
 * Wix does not error on a missing field — it silently drops writes to fields
 * that do not exist — so a drifted schema shows up as vanishing data, not a
 * failure. That is worth a dedicated check.
 */

/** Wix adds these to every collection; they are never declared by us. */
export function isSystemField(key) {
  return typeof key === 'string' && key.startsWith('_');
}

/**
 * Normalise a collection returned by the API into `{ id, fields, permissions }`.
 * Field definitions come back as an array; the caller wants a key -> type map.
 */
export function normalizeActual(collection) {
  const fields = {};
  for (const field of collection?.fields ?? []) {
    if (!field?.key || isSystemField(field.key)) continue;
    fields[field.key] = field.type;
  }
  return {
    id: collection?.id,
    fields,
    permissions: collection?.permissions ?? null,
  };
}

/**
 * @param expected  [{ id, fields: { key: TYPE }, permissions: {...} }]
 * @param actual    raw collections as returned by the Data Collections API
 * @returns { matched, missingCollections, problems, checkedCollections }
 */
export function compareSchema(expected, actual) {
  const actualById = new Map();
  for (const raw of actual ?? []) {
    const norm = normalizeActual(raw);
    if (norm.id) actualById.set(norm.id, norm);
  }

  const matched = [];
  const missingCollections = [];
  const problems = [];

  for (const want of expected) {
    const got = actualById.get(want.id);

    if (!got) {
      missingCollections.push(want.id);
      problems.push({
        collection: want.id,
        kind: 'missing_collection',
        detail: 'collection does not exist yet (run: npm run wix:setup)',
      });
      continue;
    }

    let clean = true;

    // Every declared field must exist with exactly the declared type.
    for (const [key, wantType] of Object.entries(want.fields)) {
      const gotType = got.fields[key];
      if (gotType === undefined) {
        clean = false;
        problems.push({
          collection: want.id,
          kind: 'missing_field',
          detail: `"${key}" is missing (expected ${wantType}). Wix would silently drop writes to it.`,
        });
      } else if (String(gotType).toUpperCase() !== String(wantType).toUpperCase()) {
        clean = false;
        problems.push({
          collection: want.id,
          kind: 'type_mismatch',
          detail: `"${key}" is ${gotType}, expected ${wantType}`,
        });
      }
    }

    // A field we do not know about is only worth mentioning, not a failure:
    // it may be something an admin added deliberately.
    for (const key of Object.keys(got.fields)) {
      if (!(key in want.fields)) {
        problems.push({
          collection: want.id,
          kind: 'unexpected_field',
          detail: `"${key}" exists but the app never writes it`,
        });
      }
    }

    // Permissions decide who can read and write; a loosened one is a real risk.
    if (want.permissions && got.permissions) {
      for (const action of ['read', 'insert', 'update', 'remove']) {
        const wantRole = want.permissions[action];
        const gotRole = got.permissions[action];
        if (wantRole && gotRole && String(gotRole).toUpperCase() !== String(wantRole).toUpperCase()) {
          clean = false;
          problems.push({
            collection: want.id,
            kind: 'permission_mismatch',
            detail: `${action} is ${gotRole}, expected ${wantRole}`,
          });
        }
      }
    }

    if (clean) matched.push(want.id);
  }

  return {
    matched,
    missingCollections,
    problems,
    checkedCollections: expected.length,
  };
}

/** True when nothing needs fixing. `unexpected_field` alone is not fatal. */
export function isHealthy(result) {
  return !result.problems.some((p) => p.kind !== 'unexpected_field');
}
