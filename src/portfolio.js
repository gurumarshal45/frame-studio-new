import { validateFields, validateFile } from './validation.js';

function uncertainSave(message) {
  const error = new Error(message);
  error.code = 'SAVE_UNCERTAIN';
  return error;
}

// The browser uses only the publishable key. Supabase RLS enforces permissions.
export function createPortfolio(client) {
  const bucket = client.storage.from('portfolio');
  const map = row => ({ ...row, type: row.media_type, createdAt: row.created_at,
    url: bucket.getPublicUrl(row.storage_path).data.publicUrl });
  async function requireAdmin() {
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) throw Error('Please sign in again.');
    const result = await client.rpc('is_studio_admin');
    if (result.error) throw Error('Admin access could not be checked. Verify the Supabase SQL setup.');
    if (!result.data) throw Error('This account is not an approved studio admin. Complete add-admin.sql.');
    return user;
  }
  async function removeFile(path) {
    try {
      const { error } = await bucket.remove([path]);
      if (error) throw error;
      return '';
    } catch {
      return `Media cleanup failed. Remove this unused file in Supabase Storage → portfolio: ${path}`;
    }
  }
  return {
    requireAdmin,
    async list() {
      // Fetch in pages instead of silently stopping at the default 1000-row cap.
      const rows = [];
      for (let start = 0; ; start += 500) {
        const { data, error } = await client.from('posts').select('*')
          .order('created_at', { ascending: false }).order('id', { ascending: false }).range(start, start + 499);
        if (error) throw error;
        rows.push(...data);
        if (data.length < 500) break;
      }
      return rows.map(map);
    },
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      try { await requireAdmin(); }
      catch (e) { await client.auth.signOut({ scope: 'local' }); throw e; }
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
    },
    async save(input, file, existing = null) {
      const fields = validateFields(input);
      if (!existing && !file) throw Error('Choose a photo or video.');
      const extension = file ? await validateFile(file) : null;
      const user = await requireAdmin();
      let newPath = null;
      if (file) {
        newPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error } = await bucket.upload(newPath, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        fields.storage_path = newPath;
        fields.media_type = file.type;
      }
      let result;
      try {
        result = existing
          ? await client.from('posts').update(fields).eq('id', existing.id).select().single()
          : await client.from('posts').insert(fields).select().single();
      } catch {
        // Outcome unknown: do NOT remove a file that may already be referenced.
        throw uncertainSave('Connection lost while saving. Check the portfolio in another tab before uploading this file again; it may already be published.');
      }
      if (result.error) {
        // A HTTP/network 0/5xx result may occur after a commit. Preserve media.
        if (!result.status || result.status >= 500) throw uncertainSave('Save outcome is uncertain. Check the portfolio in another tab before uploading this file again; it may already be published.');
        const cleanup = newPath ? await removeFile(newPath) : '';
        throw Error(`${result.error.message} ${cleanup}`.trim());
      }
      const warning = existing && newPath ? await removeFile(existing.storage_path) : '';
      return { post: map(result.data), warning };
    },
    async remove(post) {
      await requireAdmin();
      const { data, error } = await client.from('posts').delete().eq('id', post.id).select('id');
      if (error) throw error;
      if (!data?.length) throw Error('Post was already removed. Refresh the page.');
      return { warning: await removeFile(post.storage_path) };
    },
  };
}
