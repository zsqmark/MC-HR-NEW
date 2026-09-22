# Malaya Corner Staff Portal — Wix Velo rebuild

This directory is a Wix Velo implementation starter for the staff portal. It is
intended to be copied into a Wix Studio site with **Dev Mode / Velo** enabled;
Wix does not deploy this source directory automatically from this repository.

## What is included

- `backend/portal.web.js`: server-side web methods. Every method derives the
  caller from the signed-in Wix member session and enforces staff/manager access.
- `pages/staff-portal.js`: controller for a member-only staff page.
- `pages/manager-portal.js`: controller for a manager page.
- `CMS_SCHEMA.md`: required collections, fields, indexes, and data permissions.

## Wix setup

1. In Wix Studio, enable **Dev Mode** and add a Members Area.
2. Create Wix member roles named `Staff` and `Manager`.
3. Create the CMS collections in `CMS_SCHEMA.md`. Keep every collection's
   write permission restricted; this implementation accesses CMS from backend
   code, rather than granting browser users direct write access.
4. Copy `backend/portal.web.js` to the Wix Backend folder.
5. Create two pages:
   - `/staff-portal`: Members Only; add the element IDs in the staff controller.
   - `/manager-portal`: Manager role only; add the element IDs in the manager
     controller.
6. Copy each matching page controller into its page code panel.
7. Have a manager add a `StaffProfiles` item for each member. Its `memberId`
   must be the Wix member ID, `role` must be `staff` or `manager`, and `active`
   must be true.

## Security model

The browser never supplies an acting member ID or role. `portal.web.js` reads
the currently signed-in Wix member in backend code, loads the corresponding
staff profile, and checks its role before every query or mutation. Keep CMS
collection permissions restrictive even when using these web methods.

The `Manager` Wix role protects the manager page, but backend `requireManager()`
is still required because a visitor can call an exposed web method directly.

## Production work still required

- Build the remaining visual screens in Wix Studio (tasks, onboarding,
  checklists, documents, and reports).
- Configure media uploads through Wix Media Manager and store file metadata in
  the `Documents` collection.
- Add payroll/report export and an audit-log collection before operational use.
- Test with separate staff and manager accounts; do not test authorization with
  a single browser identity.
