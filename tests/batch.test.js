import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBatchItem, publishBatch, MAX_BATCH_FILES } from '../src/batch.js';

const file = n => new File(['fixture'], `Shoot_${n}.jpg`, { type: 'image/jpeg' });

test('ten selected files produce ten separate saves with individual titles', async () => {
  const items = Array.from({ length: 10 }, (_, i) => createBatchItem(file(i + 1)));
  assert.equal(items[0].title, 'Shoot 1');
  items[0].title = 'Wedding ceremony'; items[1].title = 'Reception';
  const calls = [], states = [];
  const result = await publishBatch(items, async (fields, media) => {
    calls.push({ fields, media });
    return { post: { id: `post-${calls.length}` }, warning: '' };
  }, item => states.push(item.status));
  assert.equal(calls.length, 10);
  assert.equal(calls[0].fields.title, 'Wedding ceremony');
  assert.equal(calls[1].fields.title, 'Reception');
  assert.deepEqual(result, { published: 10, failed: 0, uncertain: 0 });
  assert.equal(new Set(items.map(i => i.post.id)).size, 10);
  assert.deepEqual(states.slice(0, 4), ['uploading', 'published', 'uploading', 'published']);
});

test('partial failure keeps successes and retry only saves the failed item', async () => {
  const items = [1, 2, 3].map(n => createBatchItem(file(n)));
  await publishBatch(items, async fields => {
    if (fields.title === 'Shoot 2') throw Error('Storage quota exceeded');
    return { post: { id: fields.title }, warning: '' };
  });
  assert.deepEqual(items.map(i => i.status), ['published', 'failed', 'published']);
  const retryCalls = [];
  const result = await publishBatch(items, async fields => {
    retryCalls.push(fields.title); return { post: { id: fields.title }, warning: '' };
  });
  assert.deepEqual(retryCalls, ['Shoot 2']);
  assert.equal(result.published, 3);
});

test('uncertain saves are excluded from retries to prevent duplicate posts', async () => {
  const items = [createBatchItem(file(1))];
  await publishBatch(items, async () => { throw Object.assign(Error('Check portfolio first'), { code: 'SAVE_UNCERTAIN' }); });
  assert.equal(items[0].status, 'uncertain');
  await publishBatch(items, async () => assert.fail('An uncertain save must not be retried'));
});

test('empty and oversized selections are rejected before any writes', async () => {
  const save = async () => assert.fail('No writes expected');
  await assert.rejects(publishBatch([], save), /at least one/);
  await assert.rejects(publishBatch(Array.from({ length: MAX_BATCH_FILES + 1 }, () => createBatchItem(file(1))), save), /up to 20/);
});
