/**
 * Typed data-access layer over the Wix CMS collections.
 *
 * This is the single place the app talks to Wix. It returns data already in the
 * app's own entity shapes, so `AppContext` can swap `localStorage` for these
 * calls without any component needing to change.
 */
import { getWixClient, ensureFreshTokens } from './client';
import { COLLECTIONS } from './collections';
import type { WixItem } from './mappers';
import {
  staffFromWix, staffToWix, staffToDirectory, staffFromDirectory,
  shiftFromWix, shiftToWix,
  availabilityFromWix, availabilityToWix,
  clockRecordFromWix, clockRecordToWix,
  taskFromWix, taskToWix,
  checklistFromWix, checklistToWix,
  documentFromWix, documentToWix,
  onboardingFromWix, onboardingToWix, onboardingStaffId,
} from './mappers';
import type {
  StaffUser,
  ShiftSlot,
  StaffWeeklyAvailability,
  ClockRecord,
  TaskItem,
  ChecklistItem,
  RestaurantDocument,
  OnboardingFormData,
} from '../../types';

/** Wix caps a single query page; this is the documented maximum for `limit`. */
const PAGE_SIZE = 1000;

/** Everything the app holds in state, in the app's own shapes. */
export interface AppData {
  staffUsers: StaffUser[];
  shifts: ShiftSlot[];
  availabilities: Record<string, StaffWeeklyAvailability>;
  clockRecords: ClockRecord[];
  tasks: TaskItem[];
  checklists: ChecklistItem[];
  documents: RestaurantDocument[];
  onboardingRecords: Record<string, OnboardingFormData>;
}

/* ------------------------------------------------------------------ low level */

async function queryAll<T>(collection: string, map: (i: WixItem) => T): Promise<T[]> {
  const client = getWixClient();
  const res = await client.items.query(collection).limit(PAGE_SIZE).find();
  const raw = (res?.items ?? []) as WixItem[];
  return raw.map(map);
}

/** Upsert one item (`items.save` creates or replaces by `_id`). */
export async function saveItem(collection: string, item: WixItem): Promise<void> {
  const client = getWixClient();
  await client.items.save(collection, item);
}

/** Delete one item by id. Silently succeeds if it is already gone. */
export async function removeItem(collection: string, id: string): Promise<void> {
  const client = getWixClient();
  await client.items.remove(collection, id);
}

/* ---------------------------------------------------------------- load everything */

/**
 * The member-readable roster.
 *
 * Every signed-in member can read `StaffDirectory`; nobody but an admin can read
 * `StaffMembers` (it holds pay). This is therefore the correct source for
 * resolving who a signed-in member is, and the right roster for non-managers.
 */
export async function loadDirectory(): Promise<StaffUser[]> {
  await ensureFreshTokens();
  return queryAll(COLLECTIONS.staffDirectory, staffFromDirectory);
}

/** Full records including pay. Admin-only, so only ever for a manager. */
export async function loadFullStaff(): Promise<StaffUser[]> {
  await ensureFreshTokens();
  return queryAll(COLLECTIONS.staffMembers, staffFromWix);
}

/**
 * Fetch every collection in parallel and assemble the app's state shape.
 *
 * `fullStaff` must be false for anyone who is not a manager: a non-admin read of
 * `StaffMembers` is denied by the collection permissions and would fail the
 * whole load, locking the staff member out of the app entirely.
 */
export async function loadAllData(options: { fullStaff?: boolean } = {}): Promise<AppData> {
  await ensureFreshTokens();

  const staffPromise = options.fullStaff ? loadFullStaff() : loadDirectory();

  const [staffUsers, shifts, availabilityRows, clockRecords, tasks, checklists, documents, onboardingPairs] =
    await Promise.all([
      staffPromise,
      queryAll(COLLECTIONS.shifts, shiftFromWix),
      queryAll(COLLECTIONS.availability, availabilityFromWix),
      queryAll(COLLECTIONS.clockRecords, clockRecordFromWix),
      queryAll(COLLECTIONS.tasks, taskFromWix),
      queryAll(COLLECTIONS.checklistItems, checklistFromWix),
      queryAll(COLLECTIONS.documents, documentFromWix),
      // Onboarding items are keyed by staff id, so keep the id alongside the form.
      queryAll(COLLECTIONS.onboarding, (i) => ({
        staffId: onboardingStaffId(i),
        form: onboardingFromWix(i),
      })),
    ]);

  const availabilities: Record<string, StaffWeeklyAvailability> = {};
  for (const a of availabilityRows) {
    // One record per staff per week; the newest submission wins.
    const existing = availabilities[a.staffId];
    if (!existing || a.weekStartDate >= existing.weekStartDate) availabilities[a.staffId] = a;
  }

  const onboardingRecords: Record<string, OnboardingFormData> = {};
  for (const { staffId, form } of onboardingPairs) {
    if (staffId) onboardingRecords[staffId] = form;
  }

  return { staffUsers, shifts, availabilities, clockRecords, tasks, checklists, documents, onboardingRecords };
}

/* ------------------------------------------------------------------ per-entity */

export const wixRepo = {
  loadAllData,
  loadDirectory,
  loadFullStaff,

  staff: {
    save: (s: StaffUser) => saveItem(COLLECTIONS.staffMembers, staffToWix(s)),
    remove: (id: string) => removeItem(COLLECTIONS.staffMembers, id),
    /** Keep the pay-free directory row in step with the full record. */
    saveDirectory: (s: StaffUser) => saveItem(COLLECTIONS.staffDirectory, staffToDirectory(s)),
    removeDirectory: (id: string) => removeItem(COLLECTIONS.staffDirectory, id),

    /**
     * Resolve the staff record owned by a signed-in Wix member.
     * This is the join that replaces the manager PIN.
     */
    async findByMemberId(memberId: string): Promise<StaffUser | null> {
      const client = getWixClient();
      const res = await client.items
        .query(COLLECTIONS.staffMembers)
        .eq('memberId', memberId)
        .limit(1)
        .find();
      const first = ((res?.items ?? []) as WixItem[])[0];
      return first ? staffFromWix(first) : null;
    },
  },

  shifts: {
    save: (s: ShiftSlot) => saveItem(COLLECTIONS.shifts, shiftToWix(s)),
    remove: (id: string) => removeItem(COLLECTIONS.shifts, id),
  },

  availability: {
    save: (a: StaffWeeklyAvailability) => saveItem(COLLECTIONS.availability, availabilityToWix(a)),
    remove: (id: string) => removeItem(COLLECTIONS.availability, id),
  },

  clockRecords: {
    save: (c: ClockRecord) => saveItem(COLLECTIONS.clockRecords, clockRecordToWix(c)),
    remove: (id: string) => removeItem(COLLECTIONS.clockRecords, id),
  },

  tasks: {
    save: (t: TaskItem) => saveItem(COLLECTIONS.tasks, taskToWix(t)),
    remove: (id: string) => removeItem(COLLECTIONS.tasks, id),
  },

  checklists: {
    save: (c: ChecklistItem) => saveItem(COLLECTIONS.checklistItems, checklistToWix(c)),
    remove: (id: string) => removeItem(COLLECTIONS.checklistItems, id),
  },

  documents: {
    save: (d: RestaurantDocument) => saveItem(COLLECTIONS.documents, documentToWix(d)),
    remove: (id: string) => removeItem(COLLECTIONS.documents, id),
  },

  onboarding: {
    /** Onboarding items are keyed by staff id. */
    save: (staffId: string, d: OnboardingFormData) =>
      saveItem(COLLECTIONS.onboarding, onboardingToWix(staffId, d)),
    remove: (staffId: string) => removeItem(COLLECTIONS.onboarding, staffId),
  },
};
