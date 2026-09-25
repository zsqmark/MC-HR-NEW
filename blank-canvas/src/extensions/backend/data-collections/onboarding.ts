import type { DataCollection } from '@wix/astro/builders';
import { text, dateTime, object, permissions } from './schema';

export const collectionIdSuffix = 'onboarding';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Onboarding',
  displayField: 'staffId',
  fields: [
    text('staffId', 'Staff ID'),
    text('status', 'Status'),
    dateTime('submittedAt', 'Submitted At'),
    text('q1Email', 'Email', true),
    text('q2FirstNameMiddle', 'First and Middle Name', true),
    text('q3LastName', 'Last Name', true),
    text('q4Dob', 'Date of Birth', true),
    text('q5Mobile', 'Mobile', true),
    text('q6EmailAddress', 'Email Address', true),
    text('q7SuperProvider', 'Super Provider', true),
    text('q8SuperMemberNumber', 'Super Member Number', true),
    text('q9BankName', 'Bank Name', true),
    text('q10BankBsb', 'BSB', true),
    text('q11BankAccountNumber', 'Bank Account', true),
    object('q12VevoDoc', 'VEVO Document', true),
    object('q13FoodHandlerDoc', 'Food Handler Document', true),
    object('q14TfnDoc', 'TFN Document', true),
    object('q15FoodHygieneCert', 'Food Hygiene Certificate', true),
  ],
  dataPermissions: permissions,
  indexes: [{ fields: [{ path: 'staffId' }], unique: true }],
  initialData: [],
} satisfies DataCollection;
