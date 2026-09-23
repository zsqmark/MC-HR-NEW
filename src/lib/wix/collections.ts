/**
 * Wix CMS collection IDs.
 *
 * Shared by the runtime repository (`repo.ts`) and the setup script
 * (`wix/setup-collections.mjs`) so the two can never drift apart.
 */
export const COLLECTIONS = {
  /** Full staff records, including pay. Admin-only. */
  staffMembers: 'StaffMembers',
  /** Pay-free projection of staff, readable by all site members. */
  staffDirectory: 'StaffDirectory',
  shifts: 'Shifts',
  availability: 'Availability',
  clockRecords: 'ClockRecords',
  tasks: 'Tasks',
  checklistItems: 'ChecklistItems',
  documents: 'RestaurantDocuments',
  onboarding: 'Onboarding',
} as const;

export type CollectionKey = keyof typeof COLLECTIONS;
