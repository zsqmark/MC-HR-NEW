import type { DataCollection } from '@wix/astro/builders';
import { text, number, boolean, dateTime, permissions } from './schema';

export const collectionIdSuffix = 'staff';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Staff',
  displayField: 'firstName',
  fields: [
    text('memberId', 'Wix Member ID'),
    text('firstName', 'First Name'),
    text('lastName', 'Last Name'),
    text('email', 'Email', true),
    text('phone', 'Phone', true),
    text('role', 'Role'),
    text('staffType', 'Staff Type'),
    text('position', 'Position'),
    number('hourlyRate', 'Hourly Rate', true),
    boolean('onboardingCompleted', 'Onboarding Complete'),
    text('onboardingStatus', 'Onboarding Status'),
    dateTime('onboardingSubmittedAt', 'Onboarding Submitted'),
    dateTime('invitationSentAt', 'Invitation Sent'),
    text('welcomeNote', 'Welcome Note'),
  ],
  dataPermissions: permissions,
  indexes: [{ fields: [{ path: 'memberId' }], unique: true }],
  initialData: [],
} satisfies DataCollection;
