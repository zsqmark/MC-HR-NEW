export type Resource = {
  id: string;
  label: string;
  summary: string[];
  fields: { key: string; label: string; kind?: 'number' | 'date' | 'choice' | 'boolean' | 'days'; choices?: string[]; required?: boolean }[];
  canCreate?: boolean;
  canEdit?: boolean;
};

export const resources: Resource[] = [
  {
    id: 'staff', label: 'Staff', summary: ['firstName', 'lastName', 'position', 'onboardingStatus'],
    canCreate: true, canEdit: true,
    fields: [
      { key: 'memberId', label: 'Wix member ID', required: true },
      { key: 'firstName', label: 'First name', required: true },
      { key: 'lastName', label: 'Last name', required: true },
      { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' },
      { key: 'role', label: 'Role', kind: 'choice', choices: ['staff', 'manager'], required: true },
      { key: 'staffType', label: 'Staff type', kind: 'choice', choices: ['wait_staff', 'bar_staff'] },
      { key: 'position', label: 'Position' },
      { key: 'hourlyRate', label: 'Hourly rate', kind: 'number' },
      { key: 'onboardingStatus', label: 'Onboarding', kind: 'choice', choices: ['not_started', 'pending_review', 'approved', 'revision_requested', 'invite_sent'] },
    ],
  },
  {
    id: 'shifts', label: 'Roster', summary: ['dateStr', 'shiftType', 'startTime', 'assignedStaffId', 'status'],
    canCreate: true, canEdit: true,
    fields: [
      { key: 'dateStr', label: 'Date', kind: 'date', required: true },
      { key: 'day', label: 'Day' },
      { key: 'shiftType', label: 'Shift', kind: 'choice', choices: ['lunch', 'dinner'], required: true },
      { key: 'startTime', label: 'Start (HH:mm)', required: true },
      { key: 'endTime', label: 'End (HH:mm)' },
      { key: 'assignedStaffId', label: 'Assigned staff ID' },
      { key: 'roleRequired', label: 'Required role', kind: 'choice', choices: ['wait_staff', 'bar_staff'] },
      { key: 'status', label: 'Status', kind: 'choice', choices: ['draft', 'published'], required: true },
      { key: 'notes', label: 'Notes' },
    ],
  },
  {
    id: 'availabilities', label: 'Availability', summary: ['staffId', 'weekStartDate', 'submittedAt'],
    fields: [],
  },
  {
    id: 'clock-records', label: 'Timesheets', summary: ['staffName', 'date', 'shiftType', 'totalHours', 'status'],
    canEdit: true,
    fields: [{ key: 'status', label: 'Status', kind: 'choice', choices: ['completed', 'approved'], required: true },
      { key: 'notes', label: 'Notes' }],
  },
  {
    id: 'tasks', label: 'Tasks', summary: ['title', 'dueDate', 'assignedToStaffId', 'isCompleted'],
    canCreate: true, canEdit: true,
    fields: [
      { key: 'title', label: 'Title', required: true }, { key: 'description', label: 'Description' },
      { key: 'taskType', label: 'Type', kind: 'choice', choices: ['one_off', 'recurring_weekly'], required: true },
      { key: 'recurringDays', label: 'Recurring days (MON,TUE,...)', kind: 'days' },
      { key: 'assignedToStaffId', label: 'Assigned staff ID' },
      { key: 'assignedByManager', label: 'Assigned by' },
      { key: 'priority', label: 'Priority', kind: 'choice', choices: ['low', 'medium', 'high'] },
      { key: 'shift', label: 'Shift', kind: 'choice', choices: ['lunch', 'dinner', 'all'] },
      { key: 'targetRole', label: 'Role', kind: 'choice', choices: ['all', 'bar_staff', 'wait_staff'] },
      { key: 'dueDate', label: 'Due date', kind: 'date', required: true },
    ],
  },
  {
    id: 'checklists', label: 'Checklists', summary: ['title', 'category', 'roleSet', 'isCompleted'],
    canCreate: true, canEdit: true,
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'category', label: 'Category', kind: 'choice', choices: ['Opening', 'Mid-Shift Food Safety', 'Closing'], required: true },
      { key: 'roleSet', label: 'Staff type', kind: 'choice', choices: ['bar_staff', 'wait_staff'], required: true },
      { key: 'instructions', label: 'Instructions' },
      { key: 'requiresTemp', label: 'Temperature required', kind: 'boolean', choices: ['false', 'true'] },
      { key: 'requiresPhoto', label: 'Photo required', kind: 'boolean', choices: ['false', 'true'] },
      { key: 'maxPhotos', label: 'Maximum photos', kind: 'number' },
    ],
  },
  {
    id: 'onboarding', label: 'Onboarding', summary: ['staffId', 'status', 'submittedAt'],
    canEdit: true,
    fields: [{ key: 'status', label: 'Status', kind: 'choice', choices: ['pending_review', 'approved', 'revision_requested'], required: true }],
  },
  {
    id: 'documents', label: 'Documents', summary: ['title', 'category', 'uploadedFor', 'uploadedAt'],
    canCreate: true,
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'category', label: 'Category', kind: 'choice',
        choices: ['Policy & Handbook', 'Food Safety & Hygiene', 'Tax & Super', 'Staff Submission', 'Training'] },
      { key: 'uploadedFor', label: 'Visible to staff ID, or all', required: true },
      { key: 'description', label: 'Description' },
    ],
  },
];
