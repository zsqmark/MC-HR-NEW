/**
 * Entity <-> Wix CMS item mappers.
 *
 * These are deliberately pure, synchronous, dependency-free functions so they
 * can be unit-tested without a Wix connection (see `scripts/test-mappers.ts`).
 * That matters: the mapper layer is where a silent field-name typo would cause
 * data loss that only shows up in production.
 *
 * Conventions:
 *  - The app's own id is written as the Wix `_id`, so round-tripping preserves
 *    identity and every existing lookup keeps working.
 *  - Nested / array values are JSON-encoded into `*Json` Text fields, because
 *    Harmony sites reject the Object, Array, Tags, and Media Gallery types.
 *  - Dates and times stay Text: the app treats them as opaque display strings
 *    and does its own 15-minute rounding arithmetic on them.
 *  - `undefined` is never written to Wix, and reads return `undefined` for
 *    absent optional fields so round-trips are lossless.
 */
import type {
  StaffUser,
  ShiftSlot,
  StaffWeeklyAvailability,
  ClockRecord,
  TaskItem,
  ChecklistItem,
  RestaurantDocument,
  OnboardingFormData,
  UploadedFileMeta,
} from '../../types';

export type WixItem = Record<string, unknown>;

/* ------------------------------------------------------------------ helpers */

const str = (v: unknown): string | undefined =>
  v === undefined || v === null ? undefined : String(v);

const num = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

const bool = (v: unknown): boolean | undefined =>
  v === undefined || v === null ? undefined : Boolean(v);

/** JSON-encode a composite value into a Text field. */
const enc = (v: unknown): string | undefined => (v === undefined ? undefined : JSON.stringify(v));

/** Decode a JSON Text field, tolerating null / empty / malformed content. */
function dec<T>(v: unknown, fallback?: T): T | undefined {
  if (typeof v !== 'string' || v.length === 0) return fallback;
  try {
    const parsed = JSON.parse(v) as T;
    return parsed === null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

/** Drop undefined values so we never write empty fields into the CMS. */
function compact(o: WixItem): WixItem {
  const out: WixItem = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
  return out;
}

/* -------------------------------------------------------------- StaffMembers */

export function staffToWix(s: StaffUser): WixItem {
  return compact({
    _id: s.id,
    memberId: s.memberId,
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    phone: s.phone,
    role: s.role,
    staffType: s.staffType,
    position: s.position,
    avatar: s.avatar,
    hourlyRate: s.hourlyRate,
    onboardingCompleted: s.onboardingCompleted,
    onboardingSubmittedAt: s.onboardingSubmittedAt,
    onboardingStatus: s.onboardingStatus,
    tfnProvided: s.tfnProvided,
    invitationSentAt: s.invitationSentAt,
    inviteToken: s.inviteToken,
    welcomeNote: s.welcomeNote,
  });
}

export function staffFromWix(item: WixItem): StaffUser {
  return {
    id: str(item._id) ?? '',
    memberId: str(item.memberId),
    firstName: str(item.firstName) ?? '',
    lastName: str(item.lastName) ?? '',
    email: str(item.email) ?? '',
    phone: str(item.phone) ?? '',
    role: (str(item.role) as StaffUser['role']) ?? 'staff',
    staffType: str(item.staffType) as StaffUser['staffType'],
    position: str(item.position) ?? '',
    avatar: str(item.avatar),
    hourlyRate: num(item.hourlyRate) ?? 0,
    onboardingCompleted: bool(item.onboardingCompleted) ?? false,
    onboardingSubmittedAt: str(item.onboardingSubmittedAt),
    onboardingStatus: (str(item.onboardingStatus) as StaffUser['onboardingStatus']) ?? 'not_started',
    tfnProvided: bool(item.tfnProvided),
    invitationSentAt: str(item.invitationSentAt),
    inviteToken: str(item.inviteToken),
    welcomeNote: str(item.welcomeNote),
  };
}

/**
 * Pay-free projection published to `StaffDirectory`.
 *
 * This is the collection every signed-in member can read, so it must carry
 * everything the staff-facing UI needs (names for rosters, `role` for RBAC,
 * `staffType` for the bar/wait rules, onboarding status for the guard) and
 * nothing sensitive. Pay, phone, TFN flag and invite tokens stay in the
 * admin-only `StaffMembers`.
 *
 * `memberId` and `email` are included deliberately: they are what let a signed-in
 * member be matched to their roster row without needing admin read access.
 */
export function staffToDirectory(s: StaffUser): WixItem {
  return compact({
    _id: s.id,
    memberId: s.memberId,
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    position: s.position,
    staffType: s.staffType,
    role: s.role,
    avatar: s.avatar,
    onboardingCompleted: s.onboardingCompleted,
    onboardingStatus: s.onboardingStatus,
  });
}

/**
 * Read a `StaffDirectory` row back into a full `StaffUser`.
 *
 * Fields the directory deliberately omits (pay, phone, invite token) come back
 * as safe defaults. That is acceptable because nothing in the app displays pay
 * to a non-manager: `ClockRecord.hourlyRate` is written but never read for
 * payroll, so a 0 here cannot corrupt any timesheet figure.
 */
export function staffFromDirectory(item: WixItem): StaffUser {
  return {
    id: str(item._id) ?? '',
    memberId: str(item.memberId),
    firstName: str(item.firstName) ?? '',
    lastName: str(item.lastName) ?? '',
    email: str(item.email) ?? '',
    phone: '',
    role: (str(item.role) as StaffUser['role']) ?? 'staff',
    staffType: str(item.staffType) as StaffUser['staffType'],
    position: str(item.position) ?? '',
    avatar: str(item.avatar),
    hourlyRate: 0,
    onboardingCompleted: bool(item.onboardingCompleted) ?? false,
    onboardingStatus: (str(item.onboardingStatus) as StaffUser['onboardingStatus']) ?? 'not_started',
  };
}

/* -------------------------------------------------------------------- Shifts */

export function shiftToWix(s: ShiftSlot): WixItem {
  return compact({
    _id: s.id,
    day: s.day,
    dateStr: s.dateStr,
    shiftType: s.shiftType,
    startTime: s.startTime,
    endTime: s.endTime,
    assignedStaffId: s.assignedStaffId,
    roleRequired: s.roleRequired,
    status: s.status,
    notes: s.notes,
  });
}

export function shiftFromWix(item: WixItem): ShiftSlot {
  return {
    id: str(item._id) ?? '',
    day: (str(item.day) as ShiftSlot['day']) ?? 'MON',
    dateStr: str(item.dateStr) ?? '',
    shiftType: (str(item.shiftType) as ShiftSlot['shiftType']) ?? 'lunch',
    startTime: str(item.startTime) ?? '',
    endTime: str(item.endTime),
    assignedStaffId: str(item.assignedStaffId),
    roleRequired: str(item.roleRequired) ?? 'Wait Staff',
    status: (str(item.status) as ShiftSlot['status']) ?? 'published',
    notes: str(item.notes),
  };
}

/* -------------------------------------------------------------- Availability */

export function availabilityToWix(a: StaffWeeklyAvailability): WixItem {
  return compact({
    _id: a.id,
    staffId: a.staffId,
    weekStartDate: a.weekStartDate,
    submittedAt: a.submittedAt,
    availabilitiesJson: enc(a.availabilities),
  });
}

export function availabilityFromWix(item: WixItem): StaffWeeklyAvailability {
  return {
    id: str(item._id) ?? '',
    staffId: str(item.staffId) ?? '',
    weekStartDate: str(item.weekStartDate) ?? '',
    submittedAt: str(item.submittedAt) ?? '',
    availabilities: dec<StaffWeeklyAvailability['availabilities']>(item.availabilitiesJson, {} as StaffWeeklyAvailability['availabilities'])!,
  };
}

/* ------------------------------------------------------------- ClockRecords */

export function clockRecordToWix(c: ClockRecord): WixItem {
  return compact({
    _id: c.id,
    staffId: c.staffId,
    staffName: c.staffName,
    position: c.position,
    date: c.date,
    shiftType: c.shiftType,
    clockInTime: c.clockInTime,
    clockOutTime: c.clockOutTime,
    breakMinutes: c.breakMinutes,
    totalHours: c.totalHours,
    status: c.status,
    breakStartTime: c.breakStartTime,
    hourlyRate: c.hourlyRate,
    notes: c.notes,
  });
}

export function clockRecordFromWix(item: WixItem): ClockRecord {
  return {
    id: str(item._id) ?? '',
    staffId: str(item.staffId) ?? '',
    staffName: str(item.staffName) ?? '',
    position: str(item.position) ?? '',
    date: str(item.date) ?? '',
    shiftType: (str(item.shiftType) as ClockRecord['shiftType']) ?? 'lunch',
    clockInTime: str(item.clockInTime) ?? '',
    clockOutTime: str(item.clockOutTime),
    breakMinutes: num(item.breakMinutes) ?? 0,
    totalHours: num(item.totalHours),
    status: (str(item.status) as ClockRecord['status']) ?? 'completed',
    breakStartTime: str(item.breakStartTime),
    hourlyRate: num(item.hourlyRate) ?? 0,
    notes: str(item.notes),
  };
}

/* --------------------------------------------------------------------- Tasks */

export function taskToWix(t: TaskItem): WixItem {
  return compact({
    _id: t.id,
    title: t.title,
    description: t.description,
    taskType: t.taskType,
    recurringDaysJson: enc(t.recurringDays),
    assignedToStaffId: t.assignedToStaffId,
    assignedStaffName: t.assignedStaffName,
    assignedByManager: t.assignedByManager,
    priority: t.priority,
    shift: t.shift,
    targetRole: t.targetRole,
    dueDate: t.dueDate,
    isCompleted: t.isCompleted,
    completedAt: t.completedAt,
    completedByStaffName: t.completedByStaffName,
    completedByStaffId: t.completedByStaffId,
    completionNote: t.completionNote,
  });
}

export function taskFromWix(item: WixItem): TaskItem {
  return {
    id: str(item._id) ?? '',
    title: str(item.title) ?? '',
    description: str(item.description) ?? '',
    taskType: (str(item.taskType) as TaskItem['taskType']) ?? 'one_off',
    recurringDays: dec<TaskItem['recurringDays']>(item.recurringDaysJson),
    assignedToStaffId: str(item.assignedToStaffId),
    assignedStaffName: str(item.assignedStaffName),
    assignedByManager: str(item.assignedByManager) ?? '',
    priority: (str(item.priority) as TaskItem['priority']) ?? 'medium',
    shift: (str(item.shift) as TaskItem['shift']) ?? 'all',
    targetRole: str(item.targetRole) as TaskItem['targetRole'],
    dueDate: str(item.dueDate) ?? '',
    isCompleted: bool(item.isCompleted) ?? false,
    completedAt: str(item.completedAt),
    completedByStaffName: str(item.completedByStaffName),
    completedByStaffId: str(item.completedByStaffId),
    completionNote: str(item.completionNote),
  };
}

/* ------------------------------------------------------------ ChecklistItems */

export function checklistToWix(c: ChecklistItem): WixItem {
  return compact({
    _id: c.id,
    category: c.category,
    roleSet: c.roleSet,
    title: c.title,
    instructions: c.instructions,
    isCompleted: c.isCompleted,
    completedBy: c.completedBy,
    completedAt: c.completedAt,
    requiresTemp: c.requiresTemp,
    tempReading: c.tempReading,
    requiresPhoto: c.requiresPhoto,
    maxPhotos: c.maxPhotos,
    photosJson: enc(c.photos),
  });
}

export function checklistFromWix(item: WixItem): ChecklistItem {
  return {
    id: str(item._id) ?? '',
    category: (str(item.category) as ChecklistItem['category']) ?? 'Opening',
    roleSet: (str(item.roleSet) as ChecklistItem['roleSet']) ?? 'wait_staff',
    title: str(item.title) ?? '',
    instructions: str(item.instructions),
    isCompleted: bool(item.isCompleted) ?? false,
    completedBy: str(item.completedBy),
    completedAt: str(item.completedAt),
    requiresTemp: bool(item.requiresTemp),
    tempReading: str(item.tempReading),
    requiresPhoto: bool(item.requiresPhoto),
    maxPhotos: num(item.maxPhotos),
    photos: dec<string[]>(item.photosJson),
  };
}

/* -------------------------------------------------------- RestaurantDocuments */

export function documentToWix(d: RestaurantDocument): WixItem {
  return compact({
    _id: d.id,
    title: d.title,
    category: d.category,
    fileName: d.fileName,
    fileSize: d.fileSize,
    fileUrl: d.fileUrl,
    uploadedBy: d.uploadedBy,
    uploadedFor: d.uploadedFor,
    uploadedAt: d.uploadedAt,
    description: d.description,
    isProtected: d.isProtected,
  });
}

export function documentFromWix(item: WixItem): RestaurantDocument {
  return {
    id: str(item._id) ?? '',
    title: str(item.title) ?? '',
    category: (str(item.category) as RestaurantDocument['category']) ?? 'Policy & Handbook',
    fileName: str(item.fileName) ?? '',
    fileSize: str(item.fileSize) ?? '',
    fileUrl: str(item.fileUrl),
    uploadedBy: str(item.uploadedBy) ?? '',
    uploadedFor: str(item.uploadedFor) ?? 'all',
    uploadedAt: str(item.uploadedAt) ?? '',
    description: str(item.description),
    isProtected: bool(item.isProtected),
  };
}

/* ---------------------------------------------------------------- Onboarding */

const ONBOARDING_TEXT_KEYS = [
  'q1_email',
  'q2_firstNameMiddle',
  'q3_lastName',
  'q4_dob',
  'q5_mobile',
  'q6_emailAddress',
  'q7_superProvider',
  'q8_superMemberNumber',
  'q9_bankName',
  'q10_bankBsb',
  'q11_bankAccountNumber',
] as const;

const ONBOARDING_FILE_KEYS = [
  ['q12_vevoDocJson', 'q12_vevoDoc'],
  ['q13_foodHandlerDocJson', 'q13_foodHandlerDoc'],
  ['q14_tfnDocJson', 'q14_tfnDoc'],
  ['q15_foodHygieneCertJson', 'q15_foodHygieneCert'],
] as const;

/** One onboarding item per staff member; `_id` is the staff id. */
export function onboardingToWix(staffId: string, d: OnboardingFormData): WixItem {
  const out: WixItem = { _id: staffId };
  for (const k of ONBOARDING_TEXT_KEYS) out[k] = d[k];
  for (const [wixKey, appKey] of ONBOARDING_FILE_KEYS) out[wixKey] = enc(d[appKey]);
  return compact(out);
}

export function onboardingFromWix(item: WixItem): OnboardingFormData {
  const out = {} as OnboardingFormData;
  for (const k of ONBOARDING_TEXT_KEYS) out[k] = str(item[k]) ?? '';
  for (const [wixKey, appKey] of ONBOARDING_FILE_KEYS) {
    out[appKey] = dec<UploadedFileMeta>(item[wixKey]);
  }
  return out;
}

/** Onboarding item ids are staff ids, so this is the reverse lookup. */
export function onboardingStaffId(item: WixItem): string {
  return str(item._id) ?? '';
}
