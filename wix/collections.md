# Wix CMS collections for the Malaya Corner HR app

Design for replacing the app's `localStorage` / `mockData` state with Wix CMS
collections, authenticated by Wix Members.

## Design rules

1. **The app's own IDs become the Wix `_id`.** Every entity already has a stable
   string id (`staff-john`, `s-custom-…`, `clk-…`). Writing that as the item
   `_id` makes the mapping 1:1 and keeps every existing `find`/`map` call site
   working unchanged.
2. **Only universally supported field types.** Harmony sites reject `Array`,
   `Object`, `Tags`, `Document`, `Image`, `Media Gallery`, `Multi-Reference`,
   `Address`, `Color`, and `Video` with `WDE0080`
   ([field type support](https://dev.wix.com/docs/api-reference/business-solutions/cms/data-types-in-wix-data.md)).
   Because we don't yet know whether the target site is Harmony, every nested
   value is flattened into scalar fields or stored as a JSON string in a `Text`
   field. This costs some CMS dashboard niceness and buys portability.
3. **Dates and times stay `Text`.** The app treats `dateStr` ('2026-09-07'),
   `clockInTime` ('11:15'), and `submittedAt` as opaque display strings and does
   its own 15-minute rounding maths on them. Converting to `Date and Time`
   objects would add `{$date: …}` unwrapping everywhere for no gain.
4. **Money and hours are `Number`** so the CMS can sum them.

## Collections

### 1. `StaffMembers`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | Text | app id, e.g. `staff-john` |
| `memberId` | Text | **Wix member id** — links a login to a staff record |
| `firstName`, `lastName` | Text | |
| `email` | Text | not `Email`: matches app type, avoids validation surprises |
| `phone` | Text | |
| `role` | Text | `manager` \| `staff` — the RBAC source of truth |
| `staffType` | Text | `bar_staff` \| `wait_staff` |
| `position` | Text | e.g. `Bar Staff` |
| `avatar` | Text | URL |
| `hourlyRate` | Number | |
| `onboardingCompleted` | Boolean | |
| `onboardingSubmittedAt` | Text | |
| `onboardingStatus` | Text | `not_started` \| `pending_review` \| `approved` \| `revision_requested` \| `invite_sent` |
| `tfnProvided` | Boolean | |
| `invitationSentAt`, `inviteToken`, `welcomeNote` | Text | |

`memberId` is the join that makes real logins work. **This replaces the `1234` PIN.**

### 2. `StaffDirectory` — the member-readable roster

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | Text | staff id |
| `memberId` | Text | the linking join; opaque id |
| `firstName`, `lastName` | Text | |
| `email` | Text | **used to match a signed-in member to their row** |
| `position`, `staffType`, `role` | Text | role drives RBAC, staffType the bar/wait rules |
| `avatar` | Text | |
| `onboardingCompleted` | Boolean | drives the onboarding guard |
| `onboardingStatus` | Text | |

**Why this collection exists.** `StaffMembers` holds `hourlyRate`, so it must be
admin-only. But a non-manager cannot read it at all, which means:

- the app **cannot** resolve a staff member's identity from `StaffMembers`, and
- loading the roster from there would be *denied* and would lock every ordinary
  staff member out of the app entirely.

So a signed-in member is resolved against `StaffDirectory` (readable by all
members), and only a manager's session also loads `StaffMembers`. The app asks
for the full records only when the resolved role is `manager`
(`loadAllData({ fullStaff: true })`).

**Stated trade-off:** `email` is in this collection, so any signed-in member can
read colleagues' work email addresses. That is deliberate — it is what makes
member-to-roster matching possible without admin read access — and it is far
less sensitive than the pay data this collection exists to protect. It is
asserted in `scripts/test-mappers.ts` so it cannot drift silently.

**Consequence worth knowing:** a non-manager's in-memory staff records carry
`hourlyRate: 0` (the directory has no pay). This is safe *today* only because
nothing reads `ClockRecord.hourlyRate` for pay — the record stamps a rate at
clock-in but no screen or export ever consumes it. If payroll calculations are
ever added, they must resolve the rate from a manager-readable source rather
than from the clock record.

#### Linking a member to a roster row

Matching lives in `src/lib/wix/link.ts`, tested in `scripts/test-link.ts`:

1. an explicit `memberId` match always wins, so an existing link can never be
   re-pointed by an email change;
2. otherwise the member's login email is matched against **unclaimed** rows only.

Rule 2 is a security boundary, not a convenience. A row already linked to a
different member is never claimable, even by someone who knows the email on it —
otherwise anyone able to register a Wix account with a known work address could
take over that employee's record, including their pay rate and documents.

**This cannot be made self-service.** Auto-claiming means letting a member write
their own `memberId` into a roster row, and nothing in the collection permission
model can validate *which* row they are entitled to. Wix backend code
(`.web.js`) is the natural place for that check, but it exists only in
Wix-managed Astro projects — not on this self-managed path. So the app resolves
and *explains* the match and a manager confirms it by setting `memberId`; the
unprovisioned screen names the matched row, or reports the duplicate.

### 3. `Shifts`
`_id`, `day` (Text), `dateStr` (Text), `shiftType` (Text `lunch`|`dinner`),
`startTime` (Text), `endTime` (Text), `assignedStaffId` (Text),
`roleRequired` (Text), `status` (Text `draft`|`published`), `notes` (Text).

### 4. `Availability`
`_id` (e.g. `avail-staff-john-2026-09-07`), `staffId` (Text),
`weekStartDate` (Text), `submittedAt` (Text), `availabilitiesJson` (Text).

The app's `Record<DayOfWeek, DayAvailability>` is a nested object, so it is
serialised into `availabilitiesJson`. The app loads *all* availability records
and indexes them client-side by `staffId`, so no server-side query needs to
reach inside it. If the site is **not** Harmony, this can become an `Object`
field for a nicer CMS view.

### 5. `ClockRecords`
`_id`, `staffId`, `staffName`, `position` (Text), `date` (Text),
`shiftType` (Text), `clockInTime`, `clockOutTime`, `breakStartTime` (Text),
`breakMinutes` (Number), `totalHours` (Number), `status` (Text),
`hourlyRate` (Number), `notes` (Text).

### 6. `Tasks`
`_id`, `title`, `description` (Text), `taskType` (Text), `recurringDaysJson` (Text,
JSON array of day codes), `assignedToStaffId`, `assignedStaffName`,
`assignedByManager`, `priority`, `shift`, `targetRole`, `dueDate` (Text),
`isCompleted` (Boolean), `completedAt`, `completedByStaffName`,
`completedByStaffId`, `completionNote` (Text).

### 7. `ChecklistItems`
`_id`, `category`, `roleSet`, `title`, `instructions` (Text), `isCompleted`
(Boolean), `completedBy`, `completedAt` (Text), `requiresTemp` (Boolean),
`tempReading` (Text), `requiresPhoto` (Boolean), `maxPhotos` (Number),
`photosJson` (Text — JSON array of data URLs / media URLs).

> **Size warning.** Checklist photos are captured as base64 data URLs, so a
> single completed checklist can be megabytes. Wix caps items (and this would
> bloat every read). Photo evidence must move to **Wix Media Manager** via the
> [Upload API](https://dev.wix.com/docs/rest/assets/media/media-manager/files/upload-api.md),
> storing only URLs here. This is the one place where the current code cannot be
> ported mechanically.

### 8. `RestaurantDocuments`
`_id`, `title`, `category`, `fileName`, `fileSize` (Text), `fileUrl` (Text),
`uploadedBy`, `uploadedFor`, `uploadedAt`, `description` (Text),
`isProtected` (Boolean).

`fileUrl` is `Text` rather than `Document` so Harmony sites accept it. Uploaded
PDFs go to Media Manager; only the URL is stored.

### 9. `Onboarding`
One item per staff member, `_id` = staffId.
`q1_email` … `q11_bankAccountNumber` (Text), then the four uploads
(`q12_vevoDoc`, `q13_foodHandlerDoc`, `q14_tfnDoc`, `q15_foodHygieneCert`) each
as a JSON `Text` field holding `UploadedFileMeta`.

> `q9_bankName`, `q10_bankBsb`, `q11_bankAccountNumber` are bank details and
> `q8_superMemberNumber` is a superannuation number. **These must not be
> readable by all site members.** See permissions below.

## Permissions — the part that needs a decision

The current app enforces RBAC entirely in the browser, which is cosmetic: the
`1234` PIN and the "staff cannot switch to manager" check are both bypassable
from devtools. Moving to Wix only improves security if collection permissions
actually do the enforcing, and Wix's are **per-collection, not per-field**.

Recommended baseline ([Data Permissions](https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-permissions/introduction.md)):

| Collection | Read | Write |
| --- | --- | --- |
| `Shifts`, `Tasks`, `ChecklistItems` | Site member | Admin (managers via role) |
| `ClockRecords`, `Availability` | Site member | Site member (own records) |
| `StaffMembers` | Admin | Admin |
| `Onboarding` | Admin | Admin |
| `RestaurantDocuments` | Site member | Admin |

Two consequences worth stating plainly:

- **`StaffMembers` cannot be world-readable**, because it holds `hourlyRate`.
  But the UI needs staff names to render rosters, so we need a small
  **`StaffDirectory`** collection (id, name, position, staffType — no pay) for
  shared reads, with pay kept in the admin-only `StaffMembers`.
- **Per-collection permissions cannot express "staff may read only their own
  clock records"** precisely. Wix supports special permissions per member, but
  the simpler route is to enforce ownership in the write path and accept that
  members can read colleagues' hours, or to route sensitive reads through Wix
  backend code (only available in an Astro-integrated project — see below).

## Deployment blocker to be aware of

This is a **self-managed headless** setup (existing site as backend, we host the
frontend). Wix's own `wix-headless` agent skill marks the `self-managed`
authentication reference as **"TBD — the auth step will stop with a clear 'not
wired yet' error"**, so the automated tooling won't drive this path; I'll follow
the published docs directly instead.

Also note: **Wix backend code (`.web.js` extensions) is only available in
Wix-managed Astro projects.** On the self-managed path there is no server-side
place to enforce logic Wix's collection permissions can't express, and no place
to keep a secret. This is fine for us — no client secret is needed — but it does
mean permissions are the only lever.
