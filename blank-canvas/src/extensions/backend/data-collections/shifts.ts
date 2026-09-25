import type { DataCollection } from '@wix/astro/builders';
import { text, permissions } from './schema';

export const collectionIdSuffix = 'shifts';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Shifts',
  displayField: 'dateStr',
  fields: [
    text('day', 'Day'),
    text('dateStr', 'Date'),
    text('shiftType', 'Shift Type'),
    text('startTime', 'Start Time'),
    text('endTime', 'End Time'),
    text('assignedStaffId', 'Assigned Staff ID'),
    text('roleRequired', 'Required Role'),
    text('status', 'Status'),
    text('notes', 'Notes'),
  ],
  dataPermissions: permissions,
  indexes: [{ fields: [{ path: 'dateStr' }] }],
  initialData: [],
} satisfies DataCollection;
