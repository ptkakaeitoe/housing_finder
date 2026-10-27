import assert from 'node:assert/strict';
import test from 'node:test';
import { clearProjectData } from './clear-demo-project.mjs';

const ok = data => ({ data, error: null });
const failed = message => ({ data: null, error: { message } });

test('clears all bucket pages before deleting users without skipping shifted user pages', async () => {
  const users = Array.from({ length: 205 }, (_, id) => ({ id: String(id) }));
  const buckets = Array.from({ length: 101 }, (_, id) => ({ id: String(id) }));
  const emptied = new Set();
  const removedBuckets = new Set();
  const removedUsers = new Set();
  await clearProjectData({
    storage: {
      listBuckets: async ({ limit, offset }) => {
        assert.equal(removedBuckets.size, 0, 'Collect all pages before deletions shift bucket offsets');
        return ok(buckets.slice(offset, offset + limit));
      },
      emptyBucket: async id => { emptied.add(id); return ok({}); },
      deleteBucket: async id => {
        assert.ok(emptied.has(id));
        removedBuckets.add(id);
        return ok({});
      },
    },
    auth: { admin: {
      listUsers: async ({ page, perPage }) => {
        assert.equal(page, 1);
        return ok({ users: users.slice(0, perPage) });
      },
      deleteUser: async id => {
        assert.equal(removedBuckets.size, 101, 'Remove Storage objects before their owners');
        users.splice(users.findIndex(user => user.id === id), 1);
        removedUsers.add(id);
        return ok({});
      },
    } },
  }, () => {});
  assert.equal(removedUsers.size, 205);
  assert.equal(removedBuckets.size, 101);
});

test('an Auth permission failure prevents any Storage deletion', async () => {
  await assert.rejects(clearProjectData({
    auth: { admin: { listUsers: async () => failed('Unauthorized') } },
    storage: { listBuckets: async () => assert.fail('Must stop before touching Storage') },
  }, () => {}), /Check Auth admin access: Unauthorized/);
});

test('a Storage cleanup failure stops before deleting any accounts', async () => {
  await assert.rejects(clearProjectData({
    auth: { admin: {
      listUsers: async () => ok({ users: [{ id: 'retained' }] }),
      deleteUser: async () => assert.fail('Must retain accounts when Storage cleanup fails'),
    } },
    storage: {
      listBuckets: async () => ok([{ id: 'listing-images' }]),
      emptyBucket: async () => failed('Storage unavailable'),
      deleteBucket: async () => assert.fail('Must stop on emptyBucket failure'),
    },
  }, () => {}), /Empty Storage bucket: Storage unavailable/);
});
