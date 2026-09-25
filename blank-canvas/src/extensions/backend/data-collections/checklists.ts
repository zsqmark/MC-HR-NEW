import type { DataCollection } from '@wix/astro/builders';
import { text, boolean, dateTime, number, object, permissions } from './schema';

export const collectionIdSuffix = 'checklists';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Checklists',
  displayField: 'title',
  fields: [
    text('category', 'Category'),
    text('roleSet', 'Role Set'),
    text('title', 'Title'),
    text('instructions', 'Instructions'),
    boolean('isCompleted', 'Completed'),
    text('completedBy', 'Completed By'),
    dateTime('completedAt', 'Completed At'),
    boolean('requiresTemp', 'Requires Temperature'),
    text('tempReading', 'Temperature Reading'),
    boolean('requiresPhoto', 'Requires Photo'),
    number('maxPhotos', 'Maximum Photos'),
    object('photos', 'Photo References'),
  ],
  dataPermissions: permissions,
  indexes: [],
  initialData: [],
} satisfies DataCollection;
