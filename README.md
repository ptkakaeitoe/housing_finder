# HousingFinder

This project was developed for a Software Engineering class.

HousingFinder helps students find housing, compare properties, and arrange viewings with landlords.

Each listing’s room details page includes a **True Money Calculator** to estimate monthly rent, utilities, and other costs. Adjust sample usage or enter your own estimates; the deposit is shown separately.

## How it works

- **Students** can explore listings, filter by university and budget, view homes on a map, save favorites, and request a viewing for a future date and time. They can track whether the landlord accepts or declines their request.
- **Landlords** can add property details and photos, edit or publish their listings, and accept or decline viewing requests. They can also submit identity documents for verification.
- **Admins** can review landlord verification submissions, approve or reject properties, manage listing visibility, moderate non-admin accounts, and view viewing activity.

Visitors can browse without an account. Registration offers Student and Landlord accounts; admin access is assigned by the project team. All users sign in through the same login page.

Landlord verification and property approval are separate. Listings can currently be published before approval. The app supports housing discovery and viewings, but does not handle rent payments or rental contracts.

Users can choose English, Thai, Burmese, or Chinese and switch between light and dark themes. The layout works on desktop and mobile screens.

## Rebuild demo data from scratch

This removes all Auth accounts, uploaded files, and Storage buckets in the
Supabase project configured in `.env.local`, then rebuilds the HousingFinder
tables and demo data. Stop the app while resetting to prevent new signups or uploads.

1. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
2. Run `npm run reset:demo:clear` locally. This deletion cannot be rolled back.
3. Run the **entire** [supabase/reset-demo.sql](supabase/reset-demo.sql) file in
   the project's Supabase SQL Editor. It recreates the schema, security policies,
   required Storage buckets, and six universities in one transaction.
4. Run `npm run setup:demo` locally to create six homes with photos and three
   demo accounts. Their login details are printed by the script.
5. Run `npm run verify:demo`, then restart the app with `npm run dev`.

If the cleanup command fails partway through, fix the error and rerun it before
running the SQL file. The SQL file checks that Auth accounts and Storage buckets
have been removed before changing application tables.
