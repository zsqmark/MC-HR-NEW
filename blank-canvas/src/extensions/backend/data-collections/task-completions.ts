import type { DataCollection } from '@wix/astro/builders';
import { text, dateTime, permissions } from './schema';

export const collectionIdSuffix = 'task-completions';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Task Completions',
  displayField: 'taskId',
  fields: [
    text('taskId', 'Task ID'),
    text('staffId', 'Staff ID'),
    text('date', 'Date'),
    dateTime('completedAt', 'Completed At'),
    text('completionNote', 'Completion Note'),
  ],
  dataPermissions: permissions,
  indexes: [{ fields: [{ path: 'taskId' }, { path: 'staffId' }, { path: 'date' }], unique: true }],
  initialData: [],
} satisfies DataCollection;
