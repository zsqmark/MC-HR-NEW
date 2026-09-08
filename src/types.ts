export type Role = 'manager' | 'staff';

export type StaffType = 'bar_staff' | 'wait_staff';

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type ShiftType = 'lunch' | 'dinner';

export interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  staffType?: StaffType; // 'bar_staff' or 'wait_staff'
  position: string; // e.g. 'Bar Staff', 'Wait Staff', 'Shift Supervisor', 'General Manager'
  avatar?: string;
  hourlyRate: number;
  onboardingCompleted: boolean;
  onboardingSubmittedAt?: string;
  onboardingStatus: 'not_started' | 'pending_review' | 'approved' | 'revision_requested' | 'invite_sent';
  tfnProvided?: boolean;
  invitationSentAt?: string;
  inviteToken?: string;
  welcomeNote?: string;
}

export interface ShiftSlot {
  id: string;
  day: DayOfWeek;
  dateStr: string; // e.g., '2026-09-07'
  shiftType: ShiftType;
  startTime: string; // e.g., '11:15' or '16:45'
  endTime?: string;  // Optional - finish time is only a suggestion in restaurant business
  assignedStaffId?: string; // staff assigned by manager
  roleRequired: string;
  status: 'draft' | 'published';
  notes?: string;
}

export interface DayAvailability {
  lunch: boolean;
  dinner: boolean;
  notes?: string;
}

export interface StaffWeeklyAvailability {
  id: string;
  staffId: string;
  weekStartDate: string; // e.g., '2026-09-07'
  submittedAt: string;
  availabilities: Record<DayOfWeek, DayAvailability>;
}

export interface ClockRecord {
  id: string;
  staffId: string;
  staffName: string;
  position: string;
  date: string;
  shiftType: ShiftType;
  clockInTime: string; // ISO string or HH:mm
  clockOutTime?: string;
  breakMinutes: number;
  totalHours?: number;
  status: 'clocked_in' | 'on_break' | 'completed' | 'approved';
  breakStartTime?: string;
  hourlyRate: number;
  notes?: string;
}

export type TaskType = 'one_off' | 'recurring_weekly';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  taskType: TaskType;
  recurringDays?: ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN')[];
  assignedToStaffId?: string;
  assignedStaffName?: string;
  assignedByManager: string;
  priority: 'low' | 'medium' | 'high';
  shift: 'lunch' | 'dinner' | 'all';
  targetRole?: 'all' | 'bar_staff' | 'wait_staff'; // which role this task applies to
  dueDate: string;
  isCompleted: boolean;
  completedAt?: string;
  completedByStaffName?: string;
  completedByStaffId?: string;
  completionNote?: string;
}

export interface ChecklistItem {
  id: string;
  category: 'Opening' | 'Mid-Shift Food Safety' | 'Closing';
  roleSet: 'bar_staff' | 'wait_staff'; // distinct checklist set based on employee type
  title: string;
  instructions?: string;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
  requiresTemp?: boolean;
  tempReading?: string;
  requiresPhoto?: boolean; // whether staff are required to upload photo evidence
  maxPhotos?: number; // Manager limit on maximum pictures allowed for this question (1-5)
  photos?: string[]; // Array of base64 data URLs / image URLs uploaded by staff
}

/**
 * Core Operational Rule:
 * Bar staff can do wait staff jobs, but NOT the other way around.
 */
export function canPerformJob(
  staffType?: StaffType,
  requiredRole?: 'bar_staff' | 'wait_staff' | 'all' | string
): boolean {
  if (!requiredRole || requiredRole === 'all') return true;
  const normalized = requiredRole.toLowerCase();

  // If the job or shift is for Wait Staff, BOTH Bar Staff and Wait Staff can do it!
  if (normalized.includes('wait')) {
    return true;
  }

  // If the job or shift is for Bar Staff, ONLY Bar Staff can do it!
  if (normalized.includes('bar')) {
    return staffType === 'bar_staff';
  }

  return true;
}

export interface UploadedFileMeta {
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedAt: string;
  dataUrl?: string;
}

export interface OnboardingFormData {
  // 15 questions from New Staff Onboarding Form (PDF)
  q1_email: string;
  q2_firstNameMiddle: string;
  q3_lastName: string;
  q4_dob: string;
  q5_mobile: string;
  q6_emailAddress: string;
  q7_superProvider: string;
  q8_superMemberNumber: string;
  q9_bankName: string;
  q10_bankBsb: string;
  q11_bankAccountNumber: string;
  q12_vevoDoc?: UploadedFileMeta;
  q13_foodHandlerDoc?: UploadedFileMeta;
  q14_tfnDoc?: UploadedFileMeta;
  q15_foodHygieneCert?: UploadedFileMeta;
}

export interface RestaurantDocument {
  id: string;
  title: string;
  category: 'Policy & Handbook' | 'Food Safety & Hygiene' | 'Tax & Super' | 'Staff Submission' | 'Training';
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  uploadedBy: string; // e.g. 'Manager (Mark Zhang)' or Staff Name
  uploadedFor: 'all' | string; // 'all' or specific staffId
  uploadedAt: string;
  description?: string;
  isProtected?: boolean;
}

