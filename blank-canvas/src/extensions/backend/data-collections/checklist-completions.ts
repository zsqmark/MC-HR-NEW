import type { DataCollection } from '@wix/astro/builders';
import { text, dateTime, object, permissions } from './schema';

export const collectionIdSuffix = 'checklist-completions';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Checklist Completions',
  displayField: 'date',
  fields: [
    text('checklistId', 'Checklist Item ID'),
    text('staffId', 'Staff ID'),
    text('date', 'Date'),
    dateTime('completedAt', 'Completed At'),
    text('tempReading', 'Temperature Reading'),
    object('photos', 'Private Photo References', true),
  ],
  dataPermissions: permissions,
  indexes: [{ fields: [{ path: 'checklistId' }, { path: 'staffId' }, { path: 'date' }], unique: true }],
  initialData: [],
} satisfies DataCollection;
