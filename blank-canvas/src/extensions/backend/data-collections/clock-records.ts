import type { DataCollection } from '@wix/astro/builders';
import { text, dateTime, number, permissions } from './schema';

export const collectionIdSuffix = 'clock-records';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Clock Records',
  displayField: 'staffName',
  fields: [
    text('staffId', 'Staff ID'),
    text('staffName', 'Staff Name'),
    text('position', 'Position'),
    text('date', 'Date'),
    text('shiftType', 'Shift Type'),
    dateTime('clockInAt', 'Clock In'),
    dateTime('clockOutAt', 'Clock Out'),
    number('breakMinutes', 'Break Minutes'),
    number('totalHours', 'Total Hours'),
    text('status', 'Status'),
    dateTime('breakStartAt', 'Break Start'),
    number('hourlyRate', 'Hourly Rate', true),
    text('notes', 'Notes'),
  ],
  dataPermissions: permissions,
  indexes: [{ fields: [{ path: 'staffId' }, { path: 'date' }] }],
  initialData: [],
} satisfies DataCollection;
