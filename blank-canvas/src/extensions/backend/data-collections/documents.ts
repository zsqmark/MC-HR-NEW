import type { DataCollection } from '@wix/astro/builders';
import { text, dateTime, boolean, permissions } from './schema';

export const collectionIdSuffix = 'documents';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Documents',
  displayField: 'title',
  fields: [
    text('title', 'Title'),
    text('category', 'Category'),
    text('fileName', 'File Name'),
    text('fileSize', 'File Size'),
    text('fileUrl', 'Private File Reference', true),
    text('uploadedBy', 'Uploaded By'),
    text('uploadedFor', 'Visible To Staff ID'),
    dateTime('uploadedAt', 'Uploaded At'),
    text('description', 'Description'),
    boolean('isProtected', 'Protected'),
  ],
  dataPermissions: permissions,
  indexes: [{ fields: [{ path: 'uploadedFor' }] }],
  initialData: [],
} satisfies DataCollection;
