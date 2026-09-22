# HousingFinder

Next.js App Router app with Supabase data and Google Maps. The live flow is: register as a landlord, add a listing with coordinates, find it in Explore and on the map, register as a student, save it, and request a viewing. Landlords can accept or decline requests.

Listings can be browsed and filtered by proximity to six major Thai universities — Chulalongkorn University, Thammasat University (Rangsit Campus), Kasetsart University, Mahidol University (Salaya Campus), Chiang Mai University, and Rangsit University — defined in `supabase/migrations/20260921000000_universities.sql` and mirrored in `src/lib/universities.js`. A listing's "nearest university" is either the campus its landlord tagged when creating it, or, if untagged, whichever of the six is geographically closest.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill in `.env.local` with your Supabase project URL and **publishable** key, plus a browser-restricted Google Maps key and a Google Map ID. Restart the dev server after editing environment variables. Never put a Supabase secret/service role key in a `NEXT_PUBLIC_` variable.

1. Create a Supabase project or reuse an empty one. If reusing a project with the legacy `categories`, `resources`, and `search_runs` tables, run `supabase/legacy-project-cleanup.sql` in its SQL Editor first. Run the SQL files in `supabase/migrations/` in filename order in the SQL Editor. They create tables, Row Level Security policies, storage buckets, and a restricted function for landlord responses.
2. In Supabase Auth URL Configuration, set your Site URL to `http://localhost:3000` for local development and add `http://localhost:3000/update-password` and `http://localhost:3000/profile` as redirect URLs. Add the production URLs when deploying. Email confirmation can stay enabled; new users then confirm their email before signing in.
3. If you want the Google sign-in button, enable Google as a provider in Supabase Auth and configure the OAuth credentials and callback there. Email/password works without this provider.
4. In Google Cloud, enable Maps JavaScript API and billing, create a Map ID, and create a browser API key restricted to your localhost and production website origins and to Maps JavaScript API. Put that key and the Map ID in `.env.local`.
5. Register a landlord account, then use **My Listings → Add listing**. Click the property location on the map, use your current location when at the property, or enter coordinates. Published listings appear in Explore and on the map.
6. To create an admin, register an account, then promote that account in the Supabase SQL Editor: `update public.profiles set role = 'admin' where id = 'USER_UUID';`. Look up the UUID in Supabase Auth Users. Public registration cannot create admins.

```bash
npm run build
```

## University demo accounts

Run all migrations first, then add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` using your Supabase project's service role key (or server secret key). This is used only by the local setup script; never prefix it with `NEXT_PUBLIC_`.

```bash
npm run setup:demo
```

Requires Node.js 20.12 or newer. The script creates email-confirmed accounts, assigns their database roles, uploads the sample photos into the landlord's storage folder, and creates six published listings. It verifies password login, roles and landlord/admin listing access before reporting success. These credentials work **after setup completes**; adding this code alone does not create accounts in your Supabase project.

| Account | Email | Password | Destination after login |
| --- | --- | --- | --- |
| Landlord | `landlord@housingfinder.example` | `LandlordDemo2026!` | `/landlord` |
| Admin | `admin@housingfinder.example` | `AdminDemo2026!` | `/admin` |
| Student | `student@housingfinder.example` | `StudentDemo2026!` | `/` |

Use the normal `/login` page for all three. These are fictional university demonstration accounts, not real people. Re-running setup resets these demo passwords and roles, preserves existing listing edits and publication decisions, and recreates deleted demo homes. It refuses to overwrite unrelated accounts with the same email addresses.

### Landlord account criteria and permissions

- Has a confirmed email/password login and a `profiles.role` of `landlord`. New landlords choose Landlord during registration; the demo script supplies a fictional name and confirms the demo email automatically.
- Owns the six sample homes through `listings.landlord_id`. Can create homes, edit rent/details/photos, publish or unpublish, delete owned homes, and accept or decline viewing requests for those homes.
- A listing needs a title, property type, nonnegative rent, address and valid coordinates. University, photo, description and minimum lease are optional.
- Can submit a name, phone number and document for verification. Verification is optional for publication in this project; the seeded landlord starts without an approved verification. Use a fictional document for the classroom demo.
- Cannot access admin functions or manage another landlord's homes; Supabase policies enforce ownership.

### Admin panel

The admin role is assigned by the setup script using the server key; public registration cannot create admins. `/admin` links to landlord verification review, users, listing moderation and viewing reports. `/manage-listings` shows the owner and publication status of each home and supports publishing, unpublishing and deleting it. Admins can approve/reject verification submissions and inspect viewing activity.

Run `npm run verify:demo` after setup to check landlord editing, student saving/viewing requests, landlord acceptance, admin moderation and access restrictions against Supabase. It creates a temporary home and deletes it (and its dependent saves/requests) afterward.

### Presentation walkthrough

1. Sign in as landlord and open **My Listings** to see and edit the six homes.
2. Sign out, sign in as student, save a home and request a future viewing.
3. Sign in as landlord and accept or decline it in **Appointments**.
4. Sign in as admin, inspect the users/listings/reports, and unpublish a home. It disappears from public Explore while remaining visible to its landlord and the admin.

## What works

- Email registration, login, password reset, profile editing, and sign out via Supabase Auth.
- Landlord listing creation, editing, deletion, and up to 10 photos per home (JPG/PNG/WebP, 5 MB each), with previews, photo removal and cover selection. Detail pages show a thumbnail gallery and owner controls. Apply `supabase/migrations/20260922000001_listing_photos.sql` to existing databases before saving galleries. Existing single-photo listings remain compatible. Removed photo references are saved with the listing; existing storage files are retained.
- Explore filters by text, property type, and maximum rent. `/search` redirects to `/explore`.
- Six fictional demo homes, one near each supported university, can be seeded into Supabase with `npm run setup:demo`. They belong to the demo landlord, appear in the admin panel, and support editing, saving and viewing requests. Photos are generated examples and map pins are approximate. Explore and Map now display database listings only.
- Explore and Map can be filtered to a single university; landlords can tag a listing with its nearest campus when creating or editing it, and listing cards and the room detail page show distance to that campus.
- Listing details, saved homes, viewing requests, and landlord accept/decline actions.
- Google Maps markers for published listings, with a list fallback if the Maps key is missing.
- Private landlord verification document uploads under **Profile → Identity verification**, with admin approval or rejection. The old `/landlord-verification` URL redirects to the profile. Admins can review listings, users, and viewing activity.
- Responsive light/dark UI; the theme choice is saved locally.

Landlords can currently publish listings without admin approval; verification status is tracked separately and does not gate publication. Before production use, decide whether publication should require approval and add that policy if needed.

## Security notes

The frontend uses only the Supabase publishable key. Supabase Row Level Security controls access to rows; listing images live in an upload-restricted bucket. Restrict the Google Maps browser key to your sites and the Maps JavaScript API. See [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Maps key guidance](https://developers.google.com/maps/api-security-best-practices), and the [Google Maps loader](https://developers.google.com/maps/documentation/javascript/load-maps-js-api).

## Listing costs and transport

Apply `supabase/migrations/20260922000002_listing_costs_transport.sql` in the SQL Editor to enable the new fields. The preceding photo migration is also required for the current listing form; do not rerun migrations already applied.

Landlords can enter the total security deposit in THB (blank means unspecified; zero means no deposit), separate utility billing methods and rates, and university van availability with route, schedule and fare notes. Electricity and water support per-unit rates; all utilities support monthly fees, inclusion in rent, provider billing, or not provided. Detail cards show the saved values with SVG icons. Existing listings remain unspecified until edited. Run `node --test scripts/listing-costs.test.mjs scripts/listing-photos.test.mjs` for local validation and `npm run verify:demo` after applying both migrations for database checks.

## Listing verification

Apply `supabase/migrations/20260922000003_listing_verification.sql` to enable the detail page's landlord name and verification badges. A restricted function exposes only the name and latest identity verification result for an accessible listing; private verification documents and contact data stay private. Admins separately approve or reject properties in **Manage listings**. Property content edits clear the review; changing publication status alone does not. Unreviewed listings remain browsable when published, but never receive an approval badge.

## Account moderation

Apply `supabase/migrations/20260922000004_account_moderation.sql` before using **Users → Suspend / Reactivate / Delete**. Configure `SUPABASE_SERVICE_ROLE_KEY` only in the server environment (including your deployment); restart the server after changing it. The API validates the caller's access token and active admin role. Administrator accounts cannot be moderated through this UI.

Suspension bans sign-in and blocks existing sessions through restrictive database policies. Published homes stay publicly visible; admins can unpublish them separately. Reactivation restores access. Deletion requires typing DELETE and permanently removes the user's uploaded files, auth/profile records, owned listings and dependent records. If deletion fails partway, the account stays suspended and the admin can retry; some files may already have been deleted.
