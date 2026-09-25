import { app } from '@wix/astro/builders';

import dataCollections from './extensions/backend/data-collections/data-collections.extension.ts';

import mcHr from './extensions/dashboard/pages/mc-hr/mc-hr.extension.ts';

import mcHrStaff from './extensions/site/widgets/mc-hr-staff/mc-hr-staff.extension.ts';

export default app()
  .use(dataCollections).use(mcHr).use(mcHrStaff);
