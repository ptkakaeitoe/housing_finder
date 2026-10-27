import { createClient } from '@supabase/supabase-js';
import { pathToFileURL } from 'node:url';

function checked(result, action) {
  if (result.error) throw new Error(`${action}: ${result.error.message}`);
  return result.data;
}

// Destructive: deletes EVERY Storage bucket/file and Auth user in this project.
// SQL schema reset is a separate step: supabase/reset-demo.sql.
export async function clearProjectData(client, log = console.log) {
  // Check both admin APIs before starting irreversible work.
  checked(await client.auth.admin.listUsers({ page: 1, perPage: 1 }), 'Check Auth admin access');
  const buckets = [];
  for (let offset = 0; ; offset += 100) {
    const page = checked(await client.storage.listBuckets({ limit: 100, offset }), 'List Storage buckets');
    buckets.push(...page);
    if (page.length < 100) break;
  }

  // Remove files through Storage's API so underlying files are also deleted.
  // Users owning Storage objects cannot always be deleted until files are gone.
  for (const bucket of buckets) {
    checked(await client.storage.emptyBucket(bucket.id), 'Empty Storage bucket');
    checked(await client.storage.deleteBucket(bucket.id), 'Delete Storage bucket');
    log('Deleted a Storage bucket and its files.');
  }

  let removedUsers = 0;
  while (true) {
    // Always use page 1: deleting users shifts later users into this page.
    const { users } = checked(await client.auth.admin.listUsers({ page: 1, perPage: 100 }), 'List Auth users');
    if (users.length === 0) break;
    for (const user of users) {
      checked(await client.auth.admin.deleteUser(user.id), 'Delete Auth user');
      removedUsers++;
    }
  }
  log(`Deleted ${buckets.length} Storage buckets and ${removedUsers} Auth users.`);
  log('Next: run all of supabase/reset-demo.sql in Supabase SQL Editor, then npm run setup:demo.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.');
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    console.log(`Deleting all Auth accounts and Storage files from ${new URL(url).host}.`);
    await clearProjectData(client);
  } catch (error) {
    console.error(`Cleanup stopped: ${error.message}`);
    console.error('Earlier deletions may have completed. Fix the error and rerun this command before running the SQL reset.');
    process.exitCode = 1;
  }
}
