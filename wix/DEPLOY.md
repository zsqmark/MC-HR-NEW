# Deploying the HR portal on Wix

Self-managed headless: **your existing Wix site is the backend**, the React app is
a static frontend that talks to it. No server is needed, and no client secret is
involved — Wix Headless OAuth uses PKCE.

Read this top to bottom; steps 1–5 are the ones only you can do.

---

## Already done in the repo

| Piece | Where |
| --- | --- |
| CMS schema (9 collections) | `wix/collections.md` |
| Creates the collections | `wix/setup-collections.mjs` |
| Seeds your 143 existing records | `wix/seed-cms.ts` |
| Entity ⇄ Wix mapping | `src/lib/wix/mappers.ts` |
| Wix client, token refresh | `src/lib/wix/client.ts`, `src/lib/wix/tokens.ts` |
| Wix Members sign-in/out | `src/lib/wix/auth.ts` |
| Member ⇄ roster linking | `src/lib/wix/link.ts` |
| Media Manager uploads | `src/lib/wix/media.ts`, `src/lib/wix/dataUrl.ts` |
| Data access + diff sync | `src/lib/wix/repo.ts`, `src/lib/wix/diff.ts` |
| State layer, mode-aware | `src/context/AppContext.tsx` |
| Verification (1952 assertions across 11 gates) | `npm run test` |
| Read-only CMS preflight | `wix/doctor.mjs` |

The app runs in two modes, chosen by whether `VITE_WIX_CLIENT_ID` is set:

- **set** → Wix is the backend, sign-in via Wix Members, PIN disabled
- **unset** → the original offline demo (mock data + `1234` PIN)

---

## Step 1 — Create the headless client  *(you)*

On **your existing site's dashboard**:

**Settings → Development & integrations → Headless Settings → Create New Client**

- Name it something like `HR Portal`
- Pick the JavaScript stack when asked
- **Copy the Client ID.** It is public — safe to put in `.env` and in the bundle.

**Leave the client's "Login URL" field EMPTY.** That field is only for custom
login pages; setting it breaks the Wix-hosted login flow.

## Step 2 — Enable Members and publish  *(you)*

1. Add the **Members Area** app to the site.
2. **Publish the site.** `getAuthUrl()` fails on an unpublished site — this is
   the most common cause of "sign-in does nothing".

## Step 3 — Create an admin API key  *(you)*

<https://manage.wix.com/account/api-keys> — needs the **Manage Data Collections**
scope. Used **only** by the setup/seed scripts, never by the app.

> An API key grants admin access to your Wix account. Revoke it once steps 5–6
> are done. Nothing here stores it; it is read from `.env` at run time.
>
> Prefer not to issue one? Create the collections by hand from
> `wix/collections.md` and skip to step 7. It is nine collections, and the field
> lists must match exactly — the mapping test will tell you if they don't.

## Step 4 — Configure `.env`

```bash
cp .env.example .env
```

```ini
VITE_WIX_CLIENT_ID="<client id from step 1>"
WIX_API_KEY="<key from step 3>"
WIX_SITE_ID="<metasiteId from your dashboard URL>"
```

`WIX_SITE_ID` is the id in your dashboard URL immediately after `/dashboard/`.

## Step 5 — Create the collections

```bash
npm run wix:setup:plan    # prints the 9 request bodies; no credentials needed
npm run wix:setup         # creates them
```

Idempotent: re-running skips collections that already exist. A `WDE0080` error
means the site is a Harmony site and rejected a field type — the schema avoids
all known-rejected types, so report the exact field and type if you see one.

### Then verify the schema

```bash
npm run wix:doctor        # read-only; safe to run at any time
```

This is worth running even if `wix:setup` reported success, and it is **essential**
if you created the collections by hand. Wix does not error on a write to a field
that does not exist — it silently drops it — so a typo'd field name or a wrong
field type shows up later as data that never appears. The doctor reports, per
collection:

- collections that are missing entirely
- fields that are absent (the dangerous case) or have the wrong type
- permissions that differ from the design (for example `read` widened to `ANYONE`)
- fields that exist but the app never writes (informational only)

It also confirms the site accepts every field type used here, which is what
settles the Harmony question.

## Step 6 — Seed your data

```bash
npm run wix:seed:plan     # lists 143 items; no credentials needed
npm run wix:seed          # writes them
```

Upserts by `_id`, so re-running updates rather than duplicating. It never
deletes.

**It refuses to run against a site that already holds records.** Because
`bulkSave` upserts by `_id`, seeding a populated site would either overwrite any
record whose id collides with a demo one (`staff-john`, `staff-mark`, …) or mix
143 demo shifts and clock records into live data. The seeder counts each
collection first and stops with an explanation if any is non-empty:

```
REFUSING TO SEED.
3 collection(s) already contain data: Shifts, StaffMembers, Tasks. ...
```

If those rows are demo leftovers you want gone, delete them in the Wix CMS. To
seed anyway and overwrite, use `npm run wix:seed:force`.

## Step 7 — Link yourself and your managers  *(you)*

Sign in, and you will land on **"No staff record for this account"** unless your
row is already linked. That is deliberate — an unlinked account gets no access
rather than falling back to a default identity.

In the Wix CMS, open **`StaffDirectory`** and set **`memberId`** on the manager's
row to their Wix member id. The id is in your dashboard under **Members**.

Repeat for each manager. Ordinary staff do **not** need this: a member whose login
email matches an unclaimed roster row is linked automatically.

> Auto-claiming cannot be made self-service, because nothing in Wix's collection
> permissions can validate *which* row a member is entitled to. Wix backend code
> (`.web.js`) could, but it exists only in Wix-managed **Astro** projects, not on
> this path. See `wix/collections.md` for the full reasoning.

## Step 8 — Host the frontend  *(you, once)*

```bash
npm run build             # must have VITE_WIX_CLIENT_ID set in .env
node scripts/prepare-wix-drop.mjs
```

The packager **refuses** to run unless the client ID is actually baked into the
bundle, so a demo-mode build cannot be shipped by accident. (Add `--demo` only if
you deliberately want the offline demo.)

Then drag `wix-drop/` onto <https://www.wix.com/headless/drop>. That gives you a
`*.wix-site-host.com` URL.

## Step 9 — Register the redirect URI  *(you)*

**This is what makes sign-in work.** In **Headless Settings → your client → URLs**:

- **Allow Authorization Redirect URIs**: the app's URL from step 8, exactly —
  including scheme, host, and path, with no trailing slash mismatch.
- **Allow Redirect Domains**: the app's domain.

The app requests `origin + pathname` as its redirect URI, so registering
`https://your-app.wix-site-host.com/` covers it.

Finally, link the app from your Wix site (or embed it) and publish.

---

## Verification checklist

| Check | Expected |
| --- | --- |
| `npm test` | 1952 assertions pass |
| `npm run wix:seed` on a populated site | refuses, and names the collections |
| `npm run wix:doctor` | schema matches, or it names exactly what is wrong |
| `npm run wix:setup:plan` | 9 collections listed |
| `npm run wix:seed:plan` | 143 items listed |
| App URL in a browser | redirects to the Wix login page |
| Sign in as a linked manager | Manager Console, no PIN prompt |
| Sign in as an unlinked member | "No staff record for this account" |
| Staff member signs in | Employee Portal only; no manager pages |
| Edit a shift, reload | the change persists (it went to the CMS) |
| Wix CMS `Shifts` | the edited row is there |

## Known gaps before this is production-real

1. **Media uploads are implemented but not verified against a live session.**
   Checklist photos and onboarding documents are now pushed to the Wix Media
   Manager and only the resulting URL is stored (`src/lib/wix/media.ts`). Sync is
   paused while an upload is in flight, so a base64 payload can never reach a CMS
   item field, and the base64 parsing/sizing logic is unit-tested
   (`scripts/test-dataUrl.ts`). **However, the upload itself has never been run
   against a real Wix session** — Media Manager uploads may need a scope an
   ordinary site member does not have. Test with a staff account early. If it is
   denied, either grant the scope or disable photo capture for non-managers.
2. **Managers must be Wix site admins** (or hold a role with CMS edit rights).
   Wix knows only "admin" and "site member", and `Shifts`/`StaffMembers` writes
   are admin-gated. Ordinary staff stay plain members.
3. **Any signed-in member can read colleagues' work email addresses**, because
   `StaffDirectory` is member-readable and email is needed for matching. Pay,
   phone, TFN and invite tokens stay admin-only. This is a deliberate trade-off,
   asserted in `scripts/test-mappers.ts`.
4. **Refresh tokens live in `localStorage`.** Wix recommends refreshing
   server-side. This app has no server, so it refreshes in the browser. The
   access token is short-lived; the refresh token is exposed to any XSS.
5. **Bundle is ~1.8 MB** (under Wix's 3 MB per-file limit, but close). Adding
   dependencies should be weighed against that ceiling.
6. **Whether your site is a Harmony site** no longer has to be guessed:
   `npm run wix:doctor` confirms it indirectly, because a healthy schema check
   means the site accepted every field type used here. The schema was written
   around the types Harmony rejects (no `Object`, `Array`, `Tags`, `Document`,
   `Image`, `Media Gallery` or `Multi-Reference`), so it works either way.
