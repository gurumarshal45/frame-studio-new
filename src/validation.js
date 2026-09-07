export const MAX_BYTES = 25 * 1024 * 1024;
export const EXTENSIONS = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm',
};
export function validateFields(input) {
  const result = {};
  for (const [key, max] of Object.entries({ title: 100, category: 40, description: 2000 })) {
    result[key] = String(input[key] || '').trim();
    if (result[key].length > max) throw Error(`${key} must be ${max} characters or fewer.`);
  }
  if (!result.title) throw Error('Please enter a title.');
  return result;
}
export async function validateFile(file) {
  if (!file || !EXTENSIONS[file.type]) throw Error('Choose a JPG, PNG, WebP, GIF, MP4 or WebM file.');
  if (!file.size || file.size > MAX_BYTES) throw Error('File must be between 1 byte and 25 MB.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const text = (start, end) => new TextDecoder().decode(bytes.slice(start, end));
  const valid = {
    'image/jpeg': bytes[0] === 255 && bytes[1] === 216,
    'image/png': [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v),
    'image/gif': text(0,3) === 'GIF',
    'image/webp': text(0,4) === 'RIFF' && text(8,12) === 'WEBP',
    'video/mp4': text(4,8) === 'ftyp',
    'video/webm': [26,69,223,163].every((v,i) => bytes[i] === v),
  }[file.type];
  if (!valid) throw Error('File contents do not match the format. Export the media again.');
  return EXTENSIONS[file.type];
}
