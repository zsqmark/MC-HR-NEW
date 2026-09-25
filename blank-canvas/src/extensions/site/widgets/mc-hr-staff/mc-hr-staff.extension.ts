import { extensions } from '@wix/astro/builders'

export default extensions.customElement({
  id: 'ff66e2b9-6cbc-49b8-b8e0-c79d90bc62d6',
  name: 'MC HR Staff',
  width: {
    defaultWidth: 450,
    allowStretch: true
  },
  height: {
    defaultHeight: 650
  },
  installation: {
    autoAdd: false
  },
  presets: [
    {
      id: '32cc598d-5056-4397-8781-7f4e4ec54728',
      name: 'default',
      thumbnailUrl: '{{BASE_URL}}/mc-hr-staff-thumbnail.png',
    },
  ],

  tagName: 'mc-hr-staff',
  element: './extensions/site/widgets/mc-hr-staff/mc-hr-staff.tsx',
  settings: './extensions/site/widgets/mc-hr-staff/mc-hr-staff.panel.tsx',
});
