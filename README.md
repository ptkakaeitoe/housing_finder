# HousingFinder

Next.js App Router app with Supabase data and Google Maps. The live flow is: register as a landlord, add a listing with coordinates, find it in Explore and on the map, register as a student, save it, and request a viewing. Landlords can accept or decline requests.

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

## What works

- Email registration, login, password reset, profile editing, and sign out via Supabase Auth.
- Landlord listing creation, editing, deletion, and image upload to Supabase Storage.
- Explore filters by text, property type, and maximum rent. `/search` redirects to `/explore`.
- Five fictional sample homes around Rangsit University appear in Explore and Map alongside live listings. Their photos are generated examples, map pins are approximate, and saving or requesting a viewing is disabled for them. They are kept in `src/lib/mockListings.js`, not inserted into Supabase.
- Listing details, saved homes, viewing requests, and landlord accept/decline actions.
- Google Maps markers for published listings, with a list fallback if the Maps key is missing.
- Private landlord verification document uploads and admin approval or rejection. Admins can review listings, users, and viewing activity.
- Responsive light/dark UI; the theme choice is saved locally.

Landlords can currently publish listings without admin approval; verification status is tracked separately and does not gate publication. Before production use, decide whether publication should require approval and add that policy if needed.

## Security notes

The frontend uses only the Supabase publishable key. Supabase Row Level Security controls access to rows; listing images live in an upload-restricted bucket. Restrict the Google Maps browser key to your sites and the Maps JavaScript API. See [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Maps key guidance](https://developers.google.com/maps/api-security-best-practices), and the [Google Maps loader](https://developers.google.com/maps/documentation/javascript/load-maps-js-api).
