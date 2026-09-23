/**
 * Linking a signed-in Wix member to their staff record.
 *
 * Without this, every new employee needs a manager to hand-write a `memberId`
 * into the CMS before they can sign in at all, which is both tedious and easy to
 * get wrong. So a member is matched to an unclaimed roster row by email, and the
 * match is used to explain the situation on the "no staff record" screen.
 *
 * Note it only *resolves* the match; nothing here writes it. Auto-claiming
 * cannot be made safe with collection permissions alone, because nothing can
 * validate which row a member is entitled to — see `wix/collections.md`. A
 * manager confirms the link by setting `memberId`.
 *
 * The security-relevant rule lives here: **a roster row already linked to a
 * different member is never claimable**, even by someone who knows the email
 * address on it. Matching by email alone would otherwise let anyone who can
 * register a Wix account with a known work address take over that person's
 * record, including their pay rate and onboarding documents.
 *
 * Pure and dependency-free so the matching rules are unit-tested; see
 * `scripts/test-link.ts`.
 */
import type { StaffUser } from '../../types';

export interface MemberIdentity {
  /** Wix member id. */
  id: string;
  /** Wix member email, if the login provided one. */
  email?: string | null;
}

export type LinkReason =
  /** Already linked: the roster row carries this member id. */
  | 'memberId'
  /** Matched one unclaimed row by email; safe to link. */
  | 'email'
  /** No row matched. */
  | 'none'
  /** More than one unclaimed row shares the email; a human must resolve it. */
  | 'ambiguous';

export interface LinkResult {
  match: StaffUser | null;
  reason: LinkReason;
  /** Rows that were considered, for diagnostics and manager messaging. */
  candidates: StaffUser[];
}

/** Emails are compared case-insensitively and without surrounding space. */
export function normalizeEmail(email?: string | null): string {
  return (email ?? '').trim().toLowerCase();
}

/**
 * Find the staff record that belongs to a signed-in member.
 *
 * Order matters: an explicit `memberId` always wins, so an existing link can
 * never be re-resolved to a different row by an email change.
 */
export function findStaffForMember(member: MemberIdentity, staffList: StaffUser[]): LinkResult {
  // 1. An explicit link is authoritative.
  const linked = staffList.find((s) => !!s.memberId && s.memberId === member.id);
  if (linked) return { match: linked, reason: 'memberId', candidates: [linked] };

  // 2. Fall back to email, but only against rows nobody has claimed yet.
  const email = normalizeEmail(member.email);
  if (!email) return { match: null, reason: 'none', candidates: [] };

  const candidates = staffList.filter((s) => !s.memberId && normalizeEmail(s.email) === email);

  if (candidates.length === 1) return { match: candidates[0], reason: 'email', candidates };
  if (candidates.length > 1) return { match: null, reason: 'ambiguous', candidates };
  return { match: null, reason: 'none', candidates: [] };
}
