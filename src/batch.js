export const MAX_BATCH_FILES = 20;

export function createBatchItem(file) {
  const title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, 100) || 'Untitled';
  return { file, title, category: '', description: '', status: 'pending', message: '', post: null };
}

export function canPublish(item) {
  return item.status === 'pending' || item.status === 'failed';
}

// Sequential writes bound memory/network use. Completed and uncertain items
// are never retried by this queue, so retrying failures won't repeat successes.
export async function publishBatch(items, save, onChange = () => {}) {
  if (!items.length) throw Error('Choose at least one file.');
  if (items.length > MAX_BATCH_FILES) throw Error(`Choose up to ${MAX_BATCH_FILES} files per batch.`);
  for (const item of items) {
    if (!canPublish(item)) continue;
    item.status = 'uploading';
    item.message = 'Uploading and publishing…';
    onChange(item);
    try {
      const result = await save({ title: item.title, category: item.category, description: item.description }, item.file);
      item.status = 'published';
      item.post = result.post;
      item.message = result.warning ? `Published. ${result.warning}` : 'Published';
    } catch (error) {
      item.status = error?.code === 'SAVE_UNCERTAIN' ? 'uncertain' : 'failed';
      item.message = error?.message || 'Upload failed. Please try again.';
    }
    onChange(item);
  }
  return {
    published: items.filter(item => item.status === 'published').length,
    failed: items.filter(item => item.status === 'failed').length,
    uncertain: items.filter(item => item.status === 'uncertain').length,
  };
}
