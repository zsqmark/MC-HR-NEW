import type { DataCollection } from '@wix/astro/builders';
import { text, dateTime, object, permissions } from './schema';

export const collectionIdSuffix = 'availabilities';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Availabilities',
  displayField: 'weekStartDate',
  fields: [
    text('staffId', 'Staff ID'),
    text('weekStartDate', 'Week Start'),
    dateTime('submittedAt', 'Submitted At'),
    object('availabilities', 'Daily Availability'),
  ],
  dataPermissions: permissions,
  indexes: [{ fields: [{ path: 'staffId' }, { path: 'weekStartDate' }], unique: true }],
  initialData: [],
} satisfies DataCollection;
