/**
 * Type declarations for `schema-compare.mjs`.
 *
 * That module is plain ESM so it can run under `node` (via `wix/doctor.mjs`) as
 * well as be imported by this TypeScript test suite. Without these declarations
 * TypeScript infers the return types through the `.mjs` and gets them wrong, so
 * property access fails type-checking.
 */

export interface SchemaProblem {
  collection: string;
  kind:
    | 'missing_collection'
    | 'missing_field'
    | 'type_mismatch'
    | 'permission_mismatch'
    | 'unexpected_field';
  detail: string;
}

export interface CompareResult {
  /** Collections present and fully correct. */
  matched: string[];
  /** Expected collections that do not exist on the site at all. */
  missingCollections: string[];
  /** Everything worth reporting; filter by `kind` for fatal vs informational. */
  problems: SchemaProblem[];
  checkedCollections: number;
}

export interface NormalizedCollection {
  id?: string;
  fields: Record<string, string>;
  permissions: Record<string, string> | null;
}

export function isSystemField(key: unknown): boolean;
export function normalizeActual(collection: unknown): NormalizedCollection;
export function compareSchema(expected: unknown, actual: unknown): CompareResult;
export function isHealthy(result: CompareResult): boolean;
