import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

const COLLECTIONS = {
  profiles: 'StaffProfiles',
  shifts: 'Shifts',
  availability: 'Availability',
  clockRecords: 'ClockRecords',
};

async function getCurrentProfile() {
  const member = await currentMember.getMember();
  if (!member?._id) {
    throw new Error('Please sign in to use the staff portal.');
  }

  const result = await wixData.query(COLLECTIONS.profiles)
    .eq('memberId', member._id)
    .limit(1)
    .find();
  const profile = result.items[0];

  if (!profile || profile.active !== true) {
    throw new Error('Your staff portal access has not been configured.');
  }
  if (!['staff', 'manager'].includes(profile.role)) {
    throw new Error('Your staff profile has an invalid role.');
  }

  return { member, profile };
}

async function requireManager() {
  const context = await getCurrentProfile();
  if (context.profile.role !== 'manager') {
    throw new Error('Manager access is required.');
  }
  return context;
}

function requireDate(value, label) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} must be a valid date.`);
  }
  return date;
}

function validateTime(value, label) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error(`${label} must use 24-hour HH:mm format.`);
  }
  return value;
}

function startOfWeek(value) {
  const date = requireDate(value, 'weekStart');
  date.setHours(0, 0, 0, 0);
  return date;
}

function roundHours(clockInAt, clockOutAt, breakMinutes) {
  const elapsedMs = clockOutAt.getTime() - clockInAt.getTime();
  const paidMs = Math.max(0, elapsedMs - breakMinutes * 60_000);
  return Math.round((paidMs / 3_600_000) * 100) / 100;
}

export const getMyPortal = webMethod(Permissions.SiteMember, async () => {
  const { member, profile } = await getCurrentProfile();
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setDate(nextMonth.getDate() + 31);

  const [shifts, openClockRecords] = await Promise.all([
    wixData.query(COLLECTIONS.shifts)
      .eq('assignedMemberId', member._id)
      .ge('date', now)
      .le('date', nextMonth)
      .ne('status', 'cancelled')
      .ascending('date')
      .find(),
    wixData.query(COLLECTIONS.clockRecords)
      .eq('memberId', member._id)
      .eq('status', 'open')
      .limit(1)
      .find(),
  ]);

  return {
    profile: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      position: profile.position,
      role: profile.role,
    },
    shifts: shifts.items,
    openClockRecord: openClockRecords.items[0] || null,
  };
});

export const saveMyAvailability = webMethod(Permissions.SiteMember, async (weekStart, availability) => {
  const { member } = await getCurrentProfile();
  if (!availability || typeof availability !== 'object' || Array.isArray(availability)) {
    throw new Error('Availability must be an object keyed by day.');
  }

  const normalizedWeekStart = startOfWeek(weekStart);
  const existing = await wixData.query(COLLECTIONS.availability)
    .eq('memberId', member._id)
    .eq('weekStart', normalizedWeekStart)
    .limit(1)
    .find();
  const item = existing.items[0] || {
    memberId: member._id,
    weekStart: normalizedWeekStart,
  };

  item.availability = availability;
  item.submittedAt = new Date();
  return wixData.save(COLLECTIONS.availability, item);
});

export const clockIn = webMethod(Permissions.SiteMember, async (shiftId, notes = '') => {
  const { member } = await getCurrentProfile();
  if (typeof notes !== 'string' || notes.length > 1000) {
    throw new Error('Notes must be a string with at most 1,000 characters.');
  }

  const openRecords = await wixData.query(COLLECTIONS.clockRecords)
    .eq('memberId', member._id)
    .eq('status', 'open')
    .limit(1)
    .find();
  if (openRecords.items[0]) {
    throw new Error('You already have an open clock record.');
  }

  if (shiftId) {
    const shift = await wixData.get(COLLECTIONS.shifts, shiftId);
    if (!shift || shift.assignedMemberId !== member._id || shift.status !== 'published') {
      throw new Error('You can only clock in to one of your published shifts.');
    }
  }

  return wixData.insert(COLLECTIONS.clockRecords, {
    memberId: member._id,
    shiftId: shiftId || null,
    clockInAt: new Date(),
    breakMinutes: 0,
    status: 'open',
    notes,
  });
});

export const clockOut = webMethod(Permissions.SiteMember, async (clockRecordId, breakMinutes = 0, notes = '') => {
  const { member } = await getCurrentProfile();
  if (!Number.isInteger(breakMinutes) || breakMinutes < 0 || breakMinutes > 240) {
    throw new Error('Break minutes must be an integer between 0 and 240.');
  }
  if (typeof notes !== 'string' || notes.length > 1000) {
    throw new Error('Notes must be a string with at most 1,000 characters.');
  }

  const record = await wixData.get(COLLECTIONS.clockRecords, clockRecordId);
  if (!record || record.memberId !== member._id || record.status !== 'open') {
    throw new Error('Open clock record not found.');
  }

  const clockOutAt = new Date();
  record.clockOutAt = clockOutAt;
  record.breakMinutes = breakMinutes;
  record.totalHours = roundHours(new Date(record.clockInAt), clockOutAt, breakMinutes);
  record.status = 'completed';
  record.notes = notes || record.notes || '';
  return wixData.save(COLLECTIONS.clockRecords, record);
});

export const getManagerSchedule = webMethod(Permissions.SiteMember, async (from, to) => {
  await requireManager();
  const fromDate = requireDate(from, 'from');
  const toDate = requireDate(to, 'to');
  if (toDate < fromDate) {
    throw new Error('to must be on or after from.');
  }

  const [shifts, staff] = await Promise.all([
    wixData.query(COLLECTIONS.shifts).ge('date', fromDate).le('date', toDate).ascending('date').find(),
    wixData.query(COLLECTIONS.profiles).eq('active', true).ascending('lastName').find(),
  ]);
  return { shifts: shifts.items, staff: staff.items };
});

export const saveShift = webMethod(Permissions.SiteMember, async (shift) => {
  await requireManager();
  if (!shift || typeof shift !== 'object') {
    throw new Error('Shift is required.');
  }
  const date = requireDate(shift.date, 'date');
  const startTime = validateTime(shift.startTime, 'startTime');
  const endTime = validateTime(shift.endTime, 'endTime');
  if (endTime <= startTime) {
    throw new Error('endTime must be after startTime.');
  }
  if (shift.assignedMemberId) {
    const assignee = await wixData.query(COLLECTIONS.profiles)
      .eq('memberId', shift.assignedMemberId).eq('active', true).limit(1).find();
    if (!assignee.items[0]) {
      throw new Error('Assigned staff member is not active.');
    }
  }

  const item = shift._id ? await wixData.get(COLLECTIONS.shifts, shift._id) : {};
  Object.assign(item, {
    date,
    shiftType: String(shift.shiftType || ''),
    startTime,
    endTime,
    assignedMemberId: shift.assignedMemberId || null,
    roleRequired: String(shift.roleRequired || ''),
    status: ['draft', 'published', 'cancelled'].includes(shift.status) ? shift.status : 'draft',
    notes: String(shift.notes || ''),
  });
  return wixData.save(COLLECTIONS.shifts, item);
});

export const approveClockRecord = webMethod(Permissions.SiteMember, async (clockRecordId) => {
  const { member } = await requireManager();
  const record = await wixData.get(COLLECTIONS.clockRecords, clockRecordId);
  if (!record || record.status !== 'completed') {
    throw new Error('Completed clock record not found.');
  }
  record.status = 'approved';
  record.approvedByMemberId = member._id;
  record.approvedAt = new Date();
  return wixData.save(COLLECTIONS.clockRecords, record);
});
