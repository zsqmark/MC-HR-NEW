import type { APIRoute } from 'astro';
import { auth } from '@wix/essentials';
import { items } from '@wix/data';
import { files } from '@wix/media';
import { brisbaneDate, brisbaneDay, canPerformJob, hoursWorked, validWeekStart } from '../../lib/hr-rules';

const collection = (suffix: string) => `mc-hr/${suffix}`;
const query = auth.elevate(items.query);
const insert = auth.elevate(items.insert);
const update = auth.elevate(items.update);
const uploadUrl = auth.elevate(files.generateFileUploadUrl);
const downloadUrl = auth.elevate(files.generateFileDownloadUrl);

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
const editable = (item: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(item).filter(([key]) => !key.startsWith('_')));

async function staffForRequest() {
  const token = await auth.getTokenInfo();
  if (!token.active || token.subjectType !== 'MEMBER' || !token.subjectId) return null;
  const result = await query(collection('staff')).eq('memberId', token.subjectId).limit(1).find();
  return result.items[0] ?? null;
}

async function related(suffix: string, staffId: string, field = 'staffId') {
  return (await query(collection(suffix)).eq(field, staffId).limit(100).find()).items;
}

export const GET: APIRoute = async () => {
  try {
    const staff = await staffForRequest();
    if (!staff) return json({ error: 'Staff membership required' }, 403);
    const [shifts, availability, clocks, assignedTasks, generalTasks, roleTasks, waitTasks,
      taskCompletions, checklists, completions, documents, commonDocuments, onboarding] = await Promise.all([
      related('shifts', staff._id, 'assignedStaffId'),
      related('availabilities', staff._id),
      related('clock-records', staff._id),
      related('tasks', staff._id, 'assignedToStaffId'),
      related('tasks', 'all', 'targetRole'),
      related('tasks', staff.staffType ?? '', 'targetRole'),
      staff.staffType === 'bar_staff' ? related('tasks', 'wait_staff', 'targetRole') : Promise.resolve([]),
      related('task-completions', staff._id),
      related('checklists', staff.staffType ?? '', 'roleSet'),
      related('checklist-completions', staff._id),
      related('documents', staff._id, 'uploadedFor'),
      related('documents', 'all', 'uploadedFor'),
      related('onboarding', staff._id),
    ]);
    const completedToday = new Set(completions.filter((row) => row.date === brisbaneDate(new Date()))
      .map((row) => row.checklistId));
    const todayDay = brisbaneDay(new Date());
    const visibleTasks = [...new Map([...assignedTasks, ...generalTasks, ...roleTasks, ...waitTasks]
      .filter((task) => !task.assignedToStaffId || task.assignedToStaffId === staff._id)
      .filter((task) => task.taskType !== 'recurring_weekly' ||
        (Array.isArray(task.recurringDays) && task.recurringDays.includes(todayDay)))
      .map((task) => [task._id, task])).values()];
    return json({
      profile: { id: staff._id, firstName: staff.firstName, lastName: staff.lastName,
        position: staff.position, staffType: staff.staffType, onboardingStatus: staff.onboardingStatus },
      shifts: shifts.filter((shift) => shift.status === 'published').map(({ _id, dateStr, shiftType, startTime, endTime, roleRequired, notes }) =>
        ({ _id, dateStr, shiftType, startTime, endTime, roleRequired, notes })),
      availability: availability.map(({ _id, weekStartDate, availabilities, submittedAt }) =>
        ({ _id, weekStartDate, availabilities, submittedAt })),
      clocks: clocks.map(({ _id, date, shiftType, clockInAt, clockOutAt, breakMinutes, totalHours, status }) =>
        ({ _id, date, shiftType, clockInAt, clockOutAt, breakMinutes, totalHours, status })),
      tasks: visibleTasks.map(({ _id, title, description, dueDate, priority, taskType }) =>
        ({ _id, title, description, dueDate, priority,
          isCompleted: taskCompletions.some((entry) => entry.taskId === _id &&
            (taskType !== 'recurring_weekly' || entry.date === brisbaneDate(new Date()))) })),
      checklists: checklists.map(({ _id, title, category, instructions, requiresPhoto, requiresTemp }) =>
        ({ _id, title, category, instructions, isCompleted: completedToday.has(_id), requiresPhoto, requiresTemp })),
      documents: [...documents, ...commonDocuments].map(({ _id, title, category, description }) =>
        ({ _id, title, category, description })),
      onboarding: onboarding[0] ? { status: onboarding[0].status } : null,
    });
  } catch (error) {
    console.error('Unable to load staff records', error);
    return json({ error: 'Unable to load staff records' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const staff = await staffForRequest();
    if (!staff) return json({ error: 'Staff membership required' }, 403);
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || !('action' in body)) return json({ error: 'Invalid request' }, 400);
    const input = body as Record<string, unknown>;

    if (input.action === 'document-download' && typeof input.documentId === 'string') {
      const document = await auth.elevate(items.get)(collection('documents'), input.documentId);
      if (!document || (document.uploadedFor !== staff._id && document.uploadedFor !== 'all') ||
        typeof document.fileUrl !== 'string')
        return json({ error: 'Document not found' }, 404);
      const result = await downloadUrl(document.fileUrl, { expirationInMinutes: 5 });
      return json({ downloadUrl: result.downloadUrls?.[0]?.url });
    }

    if (input.action === 'request-upload') {
      const kinds = ['vevo', 'food-handler', 'tfn', 'food-hygiene', 'checklist-photo'];
      if (typeof input.kind !== 'string' || !kinds.includes(input.kind) ||
        typeof input.fileName !== 'string' || !/^[\w .()-]{1,120}$/.test(input.fileName) ||
        typeof input.mimeType !== 'string' ||
        !['application/pdf', 'image/jpeg', 'image/png'].includes(input.mimeType))
        return json({ error: 'Unsupported upload' }, 400);
      const result = await uploadUrl(input.mimeType, {
        fileName: input.fileName, private: true, filePath: `/mc-hr/${staff._id}/${input.kind}`,
      });
      return json({ uploadUrl: result.uploadUrl });
    }

    if (input.action === 'onboarding-submit') {
      const fields = ['q1Email', 'q2FirstNameMiddle', 'q3LastName', 'q4Dob', 'q5Mobile',
        'q6EmailAddress', 'q7SuperProvider', 'q8SuperMemberNumber', 'q9BankName',
        'q10BankBsb', 'q11BankAccountNumber'];
      if (fields.some((field) => typeof input[field] !== 'string' || !(input[field] as string).trim() ||
        (input[field] as string).length > 300))
        return json({ error: 'Complete all onboarding details' }, 400);
      const documents = ['q12VevoDoc', 'q13FoodHandlerDoc', 'q14TfnDoc', 'q15FoodHygieneCert'];
      if (documents.some((field) => input[field] !== undefined && (
        !input[field] || typeof input[field] !== 'object' ||
        typeof (input[field] as Record<string, unknown>).id !== 'string')))
        return json({ error: 'Invalid document reference' }, 400);
      const existing = (await query(collection('onboarding')).eq('staffId', staff._id).limit(1).find()).items[0];
      const payload = { staffId: staff._id, status: 'pending_review', submittedAt: new Date(),
        ...Object.fromEntries(fields.map((field) => [field, input[field]])),
        ...Object.fromEntries(documents.filter((field) => input[field]).map((field) => [field, input[field]])) };
      if (existing) await update(collection('onboarding'), { _id: existing._id, ...payload });
      else await insert(collection('onboarding'), payload);
      await update(collection('staff'), { _id: staff._id, ...editable(staff),
        onboardingStatus: 'pending_review', onboardingSubmittedAt: new Date() });
      return json({ ok: true });
    }

    if (input.action === 'availability') {
      if (typeof input.weekStartDate !== 'string' || !validWeekStart(input.weekStartDate))
        return json({ error: 'Select a Monday as the week start' }, 400);
      if (!input.availabilities || typeof input.availabilities !== 'object' || Array.isArray(input.availabilities))
        return json({ error: 'Invalid availability' }, 400);
      const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      const availability = input.availabilities as Record<string, unknown>;
      if (Object.keys(availability).some((day) => !days.includes(day)) ||
        days.some((day) => !availability[day] || typeof availability[day] !== 'object' ||
          typeof (availability[day] as Record<string, unknown>).lunch !== 'boolean' ||
          typeof (availability[day] as Record<string, unknown>).dinner !== 'boolean'))
        return json({ error: 'Availability must contain seven valid days' }, 400);
      const existing = (await query(collection('availabilities')).eq('staffId', staff._id)
        .eq('weekStartDate', input.weekStartDate).limit(1).find()).items[0];
      const payload = { staffId: staff._id, weekStartDate: input.weekStartDate,
        availabilities: availability, submittedAt: new Date() };
      if (existing) await update(collection('availabilities'), { _id: existing._id, ...payload });
      else await insert(collection('availabilities'), payload);
      return json({ ok: true });
    }

    if (input.action === 'clock-in') {
      if (input.shiftType !== 'lunch' && input.shiftType !== 'dinner') return json({ error: 'Invalid shift' }, 400);
      const active = (await query(collection('clock-records')).eq('staffId', staff._id)
        .hasSome('status', ['clocked_in', 'on_break']).limit(1).find()).items[0];
      if (active) return json({ error: 'Already clocked in' }, 409);
      const now = new Date();
      await insert(collection('clock-records'), { staffId: staff._id,
        staffName: `${staff.firstName} ${staff.lastName}`, position: staff.position,
        hourlyRate: staff.hourlyRate, date: brisbaneDate(now),
        shiftType: input.shiftType, clockInAt: now, breakMinutes: 0, status: 'clocked_in' });
      return json({ ok: true });
    }

    if (input.action === 'clock-out') {
      const active = (await query(collection('clock-records')).eq('staffId', staff._id)
        .hasSome('status', ['clocked_in', 'on_break']).limit(1).find()).items[0];
      if (!active) return json({ error: 'No active shift' }, 409);
      const now = new Date();
      const started = new Date(active.clockInAt);
      const ongoingBreak = active.status === 'on_break' && active.breakStartAt
        ? Math.max(0, Math.round((now.getTime() - new Date(active.breakStartAt).getTime()) / 60000)) : 0;
      const breakMinutes = (Number(active.breakMinutes) || 0) + ongoingBreak;
      await update(collection('clock-records'), { _id: active._id, ...editable(active),
        clockOutAt: now, breakMinutes, breakStartAt: null,
        totalHours: hoursWorked(started, now, breakMinutes), status: 'completed' });
      return json({ ok: true });
    }

    if (input.action === 'break-start' || input.action === 'break-end') {
      const status = input.action === 'break-start' ? 'clocked_in' : 'on_break';
      const active = (await query(collection('clock-records')).eq('staffId', staff._id)
        .eq('status', status).limit(1).find()).items[0];
      if (!active) return json({ error: 'No shift in the required state' }, 409);
      const now = new Date();
      const minutes = input.action === 'break-end' && active.breakStartAt
        ? Math.max(0, Math.round((now.getTime() - new Date(active.breakStartAt).getTime()) / 60000)) : 0;
      await update(collection('clock-records'), { _id: active._id, ...editable(active),
        status: input.action === 'break-start' ? 'on_break' : 'clocked_in',
        breakStartAt: input.action === 'break-start' ? now : null,
        breakMinutes: (Number(active.breakMinutes) || 0) + minutes });
      return json({ ok: true });
    }

    if (input.action === 'complete-checklist' && typeof input.checklistId === 'string') {
      const checklist = await auth.elevate(items.get)(collection('checklists'), input.checklistId);
      if (!checklist || checklist.roleSet !== staff.staffType) return json({ error: 'Checklist item not found' }, 404);
      if (checklist.requiresPhoto && (!Array.isArray(input.photos) || !input.photos.length ||
        input.photos.length > (Number(checklist.maxPhotos) || 5) ||
        input.photos.some((photo) => !photo || typeof photo !== 'object' ||
          typeof (photo as Record<string, unknown>).id !== 'string')))
        return json({ error: 'Private photo evidence is required' }, 400);
      if (checklist.requiresTemp && (typeof input.tempReading !== 'string' ||
        !/^-?\d{1,3}(\.\d)?$/.test(input.tempReading)))
        return json({ error: 'A valid temperature is required' }, 400);
      const date = brisbaneDate(new Date());
      const existing = (await query(collection('checklist-completions')).eq('staffId', staff._id)
        .eq('checklistId', checklist._id).eq('date', date).limit(1).find()).items[0];
      if (!existing) await insert(collection('checklist-completions'), {
        staffId: staff._id, checklistId: checklist._id, date,
        completedAt: new Date(), tempReading: input.tempReading ?? '',
        photos: input.photos ?? [],
      });
      return json({ ok: true });
    }

    if (input.action === 'complete-task' && typeof input.taskId === 'string') {
      const task = await auth.elevate(items.get)(collection('tasks'), input.taskId);
      const allowedRole = canPerformJob(staff.staffType, task?.targetRole);
      if (!task || (task.assignedToStaffId && task.assignedToStaffId !== staff._id) ||
        (!task.assignedToStaffId && !allowedRole))
        return json({ error: 'Task not found' }, 404);
      const todayDay = brisbaneDay(new Date());
      if (task.taskType === 'recurring_weekly' &&
        (!Array.isArray(task.recurringDays) || !task.recurringDays.includes(todayDay)))
        return json({ error: 'Task is not due today' }, 409);
      const date = task.taskType === 'recurring_weekly' ? brisbaneDate(new Date()) : 'once';
      const existing = (await query(collection('task-completions')).eq('taskId', task._id)
        .eq('staffId', staff._id).eq('date', date).limit(1).find()).items[0];
      if (!existing) await insert(collection('task-completions'), {
        taskId: task._id, staffId: staff._id, date, completedAt: new Date(),
        completionNote: typeof input.note === 'string' ? input.note.slice(0, 500) : '',
      });
      if (task.assignedToStaffId === staff._id && task.taskType === 'one_off')
        await update(collection('tasks'), { _id: task._id, ...editable(task),
          isCompleted: true, completedAt: new Date(), completedByStaffId: staff._id });
      return json({ ok: true });
    }

    return json({ error: 'Unsupported action' }, 400);
  } catch (error) {
    console.error('Unable to update staff records', error);
    return json({ error: 'Unable to update staff records' }, 500);
  }
};
