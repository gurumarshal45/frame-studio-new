import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPortfolio } from '../src/portfolio.js';
import { validateFields, validateFile, MAX_BYTES } from '../src/validation.js';

const png = () => new File([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])], 'photo.png', { type: 'image/png' });
function fixture(options = {}) {
  const calls = [], row = { id: 'post-1', title: 'Moment', description: '', category: '', storage_path: 'user/old.png', media_type: 'image/png', created_at: '2026-01-01T00:00:00Z' };
  let query;
  const client = {
    auth: {
      getUser: async () => ({ data: { user: options.signedOut ? null : { id: 'user' } } }),
      signInWithPassword: async () => ({ error: null }),
      signOut: async () => { calls.push(['signOut']); return { error: null }; },
    },
    rpc: async () => ({ data: options.admin !== false }),
    storage: { from: () => ({
      getPublicUrl: p => ({ data: { publicUrl: 'https://example.supabase.co/' + p } }),
      upload: async (p, file, config) => { calls.push(['upload', p, config]); return { error: options.uploadError ? Error('upload failed') : null }; },
      remove: async paths => { calls.push(['cleanup', paths[0]]); return { error: options.cleanupError ? Error('cleanup failed') : null }; },
    }) },
    from: () => {
      let mode = 'read', values;
      query = {
        insert(v) { mode = 'insert'; values = v; calls.push(['insert', v]); return this; },
        update(v) { mode = 'update'; values = v; calls.push(['update', v]); return this; },
        delete() { mode = 'delete'; calls.push(['delete']); return this; },
        eq() { return this; }, select() { return this; },
        order(field, opts) { calls.push(['order', field, opts]); return this; },
        range: async () => ({ data: [row], error: null }),
        single: async () => options.saveError ? { error: { message: 'write failed' }, status: options.status || 400 }
          : { data: { ...row, ...values }, error: null, status: 200 },
        then(resolve) { resolve({ data: mode === 'delete' ? [{ id: row.id }] : [row], error: null }); },
      };
      return query;
    },
  };
  return { api: createPortfolio(client), calls, row };
}
test('field validation trims content and rejects empty/oversized values', () => {
  assert.equal(validateFields({ title: ' Photo ' }).title, 'Photo');
  assert.throws(() => validateFields({ title: ' ' }));
  assert.throws(() => validateFields({ title: 'Photo', description: 'x'.repeat(2001) }));
});
test('media validation checks signature, type and size', async () => {
  assert.equal(await validateFile(png()), 'png');
  await assert.rejects(validateFile(new File(['fake'], 'bad.png', { type: 'image/png' })));
  await assert.rejects(validateFile({ type: 'video/mp4', size: MAX_BYTES + 1 }));
  await assert.rejects(validateFile(new File(['svg'], 'bad.svg', { type: 'image/svg+xml' })));
});
test('public query orders newest first by server timestamp', async () => {
  const f = fixture(); const list = await f.api.list();
  assert.equal(list.length, 1);
  assert.deepEqual(f.calls[0], ['order', 'created_at', { ascending: false }]);
  assert.match(list[0].url, /^https:/);
});
test('non-admin cannot write and failed admin sign-in clears the session', async () => {
  const f = fixture({ admin: false });
  await assert.rejects(f.api.save({ title: 'Photo' }, png()), /not an approved/);
  assert.equal(f.calls.length, 0);
  await assert.rejects(f.api.signIn('user@example.com', 'password'));
  assert.deepEqual(f.calls, [['signOut']]);
});
test('publish uploads directly and sends only allowed database columns', async () => {
  const f = fixture(); const result = await f.api.save({ title: 'New', created_at: 'bad' }, png());
  assert.equal(result.post.title, 'New');
  assert.equal(f.calls[0][0], 'upload');
  assert.equal(f.calls[0][2].upsert, false);
  assert.equal(f.calls[1][1].created_at, undefined);
});
test('edit without replacement preserves media and original publish date', async () => {
  const f = fixture(); const result = await f.api.save({ title: 'Edit' }, null, f.row);
  assert.equal(result.post.createdAt, f.row.created_at);
  assert.equal(f.calls.some(c => c[0] === 'upload' || c[0] === 'cleanup'), false);
});
test('successful replacement cleans only the previous file', async () => {
  const f = fixture(); await f.api.save({ title: 'Edit' }, png(), f.row);
  assert.deepEqual(f.calls.at(-1), ['cleanup', f.row.storage_path]);
});
test('failed database write cleans the newly uploaded file, not original media', async () => {
  const f = fixture({ saveError: true });
  await assert.rejects(f.api.save({ title: 'Edit' }, png(), f.row), /write failed/);
  assert.equal(f.calls.at(-1)[1], f.calls[0][1]);
  assert.notEqual(f.calls.at(-1)[1], f.row.storage_path);
});
test('uncertain server error preserves media to avoid deleting committed content', async () => {
  const f = fixture({ saveError: true, status: 503 });
  await assert.rejects(f.api.save({ title: 'Edit' }, png(), f.row), /uncertain/);
  assert.equal(f.calls.some(c => c[0] === 'cleanup'), false);
});
test('delete removes metadata first and reports failed media cleanup', async () => {
  const f = fixture({ cleanupError: true }); const result = await f.api.remove(f.row);
  assert.equal(f.calls[0][0], 'delete');
  assert.match(result.warning, /cleanup failed/);
});
