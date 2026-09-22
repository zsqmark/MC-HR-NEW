# CMS schema and permissions

Create the following collections with these exact collection IDs. In each
collection, set **Create**, **Update**, and **Delete** permissions to Admins
only. Reads may be Admins only because backend code performs the reads.

## StaffProfiles

| Field key | Type | Notes |
| --- | --- | --- |
| `memberId` | Text | Unique Wix Member ID; add a unique index. |
| `email` | Text | Staff email. |
| `firstName` / `lastName` | Text | Display name. |
| `position` | Text | Job title. |
| `role` | Text | Exactly `staff` or `manager`. |
| `active` | Boolean | Required; only active profiles can use the portal. |

## Shifts

| Field key | Type | Notes |
| --- | --- | --- |
| `date` | Date and Time | Start date of the shift. |
| `shiftType` | Text | e.g. Lunch or Dinner. |
| `startTime` / `endTime` | Text | Use `HH:mm` in local venue time. |
| `assignedMemberId` | Text | Wix member ID; index this field. |
| `roleRequired` | Text | Required position. |
| `status` | Text | `draft`, `published`, or `cancelled`. |
| `notes` | Text | Optional manager notes. |

## Availability

| Field key | Type | Notes |
| --- | --- | --- |
| `memberId` | Text | Wix member ID; index with `weekStart`. |
| `weekStart` | Date and Time | Week start at midnight. |
| `availability` | Object | Daily availability payload. |
| `submittedAt` | Date and Time | Server-written timestamp. |

## ClockRecords

| Field key | Type | Notes |
| --- | --- | --- |
| `memberId` | Text | Wix member ID; index this field. |
| `shiftId` | Text | Optional Wix CMS `_id` from Shifts. |
| `clockInAt` / `clockOutAt` | Date and Time | Server timestamps. |
| `breakMinutes` | Number | Zero or greater. |
| `totalHours` | Number | Server-calculated. |
| `status` | Text | `open`, `completed`, or `approved`. |
| `notes` | Text | Optional staff notes. |
| `approvedByMemberId` | Text | Manager ID, when approved. |

## Next collections

Use the same backend-only permission pattern for `Tasks`, `ChecklistTemplates`,
`ChecklistCompletions`, `Documents`, `OnboardingSubmissions`, and `AuditLog`.
Each user-owned item needs a `memberId`; each manager action should record the
acting member ID and a timestamp.
