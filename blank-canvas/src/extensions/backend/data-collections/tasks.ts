import type { DataCollection } from '@wix/astro/builders';
import { text, object, boolean, dateTime, permissions } from './schema';

export const collectionIdSuffix = 'tasks';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Tasks',
  displayField: 'title',
  fields: [
    text('title', 'Title'),
    text('description', 'Description'),
    text('taskType', 'Task Type'),
    object('recurringDays', 'Recurring Days'),
    text('assignedToStaffId', 'Assigned Staff ID'),
    text('assignedByManager', 'Assigned By'),
    text('priority', 'Priority'),
    text('shift', 'Shift'),
    text('targetRole', 'Target Role'),
    text('dueDate', 'Due Date'),
    boolean('isCompleted', 'Completed'),
    dateTime('completedAt', 'Completed At'),
    text('completedByStaffId', 'Completed By Staff ID'),
    text('completionNote', 'Completion Note'),
  ],
  dataPermissions: permissions,
  indexes: [{ fields: [{ path: 'assignedToStaffId' }, { path: 'dueDate' }] }],
  initialData: [],
} satisfies DataCollection;
