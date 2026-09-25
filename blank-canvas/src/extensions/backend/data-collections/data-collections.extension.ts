import { extensions } from '@wix/astro/builders'

import staffCollection from './staff';

import shiftsCollection from './shifts';

import availabilitiesCollection from './availabilities';

import clockRecordsCollection from './clock-records';

import tasksCollection from './tasks';

import checklistsCollection from './checklists';

import documentsCollection from './documents';

import onboardingCollection from './onboarding';

import checklistCompletionsCollection from './checklist-completions';

import taskCompletionsCollection from './task-completions';

export default extensions.dataCollections({
  id: '29d48b54-2c36-488e-8d32-ad5ebc7ecb88',
  name: 'Data Collections',
  collections: [
    staffCollection,
    shiftsCollection,
    availabilitiesCollection,
    clockRecordsCollection,
    tasksCollection,
    checklistsCollection,
    documentsCollection,
    onboardingCollection,
    checklistCompletionsCollection,
    taskCompletionsCollection
  ],
});
