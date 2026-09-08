import './style.css';
import './batch.css';
import { createClient } from '@supabase/supabase-js';
import { createPortfolio } from './portfolio.js';
import { MAX_BATCH_FILES, createBatchItem, canPublish, publishBatch } from './batch.js';
import { listLeads } from './leads.js';

const $ = selector => document.querySelector(selector);
const isAdmin = location.pathname.replace(/\/$/, '') === '/admin';
const isPortfolio = location.pathname.replace(/\/$/, '') === '/portfolio';
let client, portfolio, posts = [], logged = false, filter = 'all';
let editing = null, deleting = null, previewURL = null, busy = false;
let batchItems = [], batchBusy = false;
const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
function errorMessage(error) {
  if (error?.message?.includes('Failed to fetch')) return 'Could not connect. Check your internet and Supabase project settings.';
  return error?.message || 'Something went wrong. Please try again.';
}
function connectionError(message = '') {
  $('#connection-error').textContent = message;
  $('#connection-error').hidden = !message;
}
function asset(p, controls = false) {
  const n = el(p.type.startsWith('video/') ? 'video' : 'img');
  n.src = p.url;
  if (n.tagName === 'IMG') { n.alt = p.title; n.loading = 'lazy'; }
  else { n.controls = controls; n.preload = 'metadata'; n.playsInline = true; n.muted = !controls; }
  return n;
}
function view() {
  $('#intro').hidden = isAdmin || isPortfolio;
  $('#story').hidden = isAdmin || isPortfolio;
  $('.editorial-media').hidden = isAdmin || isPortfolio;
  $('#services').hidden = isAdmin || isPortfolio;
  $('#contact').hidden = isAdmin || isPortfolio;
  $('#login-section').hidden = !isAdmin || logged;
  $('#work').hidden = isAdmin && !logged;
  $('#logout').hidden = !logged;
  $('#admin-link').textContent = logged ? 'Manage portfolio ↗' : 'Admin sign in ↗';
  $('#add').hidden = $('#empty-add').hidden = !(logged && isAdmin);
  $('#view-leads').hidden = !(logged && isAdmin);
  $('#work-title').firstChild.textContent = isAdmin ? 'Your work' : 'Love, in every frame';
  $('#work-kicker').textContent = isAdmin ? 'STUDIO DASHBOARD' : '02 / SELECTED STORIES';
  render();
}
function render() {
  const list = posts.filter(p => filter === 'all' || p.type.startsWith(filter + '/'));
  $('#grid').replaceChildren();
  $('#count').textContent = posts.length;
  $('#empty').hidden = list.length > 0;
  $('#empty-copy').textContent = posts.length ? 'No matching work in this collection yet.' : logged && isAdmin
    ? 'Upload a photo or film to start your public portfolio.' : 'New photographs and films will appear here soon.';
  for (const p of list) {
    const card = el('article', null, 'card'), button = el('button', null, 'media-button');
    button.setAttribute('aria-label', 'View ' + p.title);
    button.append(asset(p), el('span', p.type.startsWith('video/') ? '▶ FILM' : 'PHOTOGRAPHY', 'badge'));
    button.onclick = () => {
      $('#detail-content').replaceChildren(asset(p, true), el('h2', p.title), el('p', p.category), el('p', p.description));
      $('#detail').showModal();
    };
    card.append(button, el('h3', p.title));
    const meta = el('div', null, 'meta');
    meta.append(el('span', p.category || 'Personal work'), el('span', new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })));
    card.append(meta);
    if (logged && isAdmin) {
      const actions = el('div', null, 'card-actions'), edit = el('button', 'Edit post'), del = el('button', 'Delete');
      edit.onclick = () => editor(p);
      del.onclick = () => { deleting = p; $('#delete-error').textContent = ''; $('#delete-dialog').showModal(); };
      actions.append(edit, del); card.append(actions);
    }
    $('#grid').append(card);
  }
}
async function refresh() {
  posts = await portfolio.list();
  connectionError();
  render();
}
function editor(p = null) {
  editing = p;
  $('#post-form').reset(); $('#preview').replaceChildren(); $('#post-error').textContent = '';
  $('#editor-title').textContent = p ? 'Edit post' : 'New post';
  $('#save').textContent = p ? 'Save changes →' : 'Publish post →';
  $('#file').required = !p;
  if (p) {
    for (const key of ['title', 'category', 'description']) $('#post-form').elements[key].value = p[key] || '';
    $('#preview').append(asset(p, true));
  }
  $('#editor').showModal();
}
function setBusy(value) {
  busy = value;
  $('#post-form').querySelectorAll('input, textarea, button').forEach(n => n.disabled = value);
  document.querySelectorAll('.close-editor').forEach(n => n.disabled = value);
}
$('#close-detail').onclick = () => $('#detail').close();
$('#detail').addEventListener('close', () => $('#detail-content').replaceChildren());
$('#close-leads').onclick = () => $('#leads-dialog').close();
$('#view-leads').onclick = async () => {
  const dialog = $('#leads-dialog');
  const status = $('#leads-status');
  const list = $('#leads-list');
  list.replaceChildren();
  status.textContent = 'Loading leads…';
  dialog.showModal();
  try {
    const leads = await listLeads(client, portfolio.requireAdmin);
    status.textContent = leads.length ? `${leads.length} ${leads.length === 1 ? 'lead' : 'leads'} · newest first` : 'No enquiries have been received yet.';
    for (const lead of leads) {
      const card = el('article', null, 'lead-card');
      const head = el('div', null, 'lead-head');
      head.append(el('h3', lead.name), el('span', lead.status || 'new', 'lead-status'));
      const details = el('div', null, 'lead-details');
      const email = el('a', lead.email); email.href = `mailto:${lead.email}`;
      const phone = el('a', lead.phone || 'No phone');
      if (lead.phone) phone.href = `tel:${lead.phone.replace(/[^+\d]/g, '')}`;
      details.append(email, phone, el('span', lead.event_date ? new Date(`${lead.event_date}T00:00:00`).toLocaleDateString() : 'Date not provided'), el('span', lead.event_location || 'Location not provided'));
      card.append(head, details, el('p', lead.message, 'lead-message'), el('time', `Received ${new Date(lead.created_at).toLocaleString()}`, 'lead-time'));
      list.append(card);
    }
  } catch (error) {
    status.textContent = errorMessage(error);
  }
};
$('#add').onclick = $('#empty-add').onclick = () => {
  batchItems = [];
  $('#batch-files').value = '';
  $('#batch-error').textContent = '';
  renderBatch();
  $('#batch-dialog').showModal();
};

function renderBatch() {
  $('#batch-items').replaceChildren();
  for (const [index, item] of batchItems.entries()) {
    const row = el('section', null, 'batch-item');
    row.dataset.state = item.status;
    const thumbnail = el('div', null, 'batch-thumbnail');
    thumbnail.append(asset({ url: item.previewURL, type: item.file.type, title: item.file.name }));
    const content = el('div', null, 'batch-content');
    const heading = el('div', null, 'batch-heading');
    heading.append(el('h3', `${index + 1}. ${item.file.name}`), el('span', `${(item.file.size / 1024 / 1024).toFixed(1)} MB`, 'batch-size'));
    content.append(heading);
    const locked = batchBusy || !canPublish(item);
    for (const [field, labelText, max] of [['title', 'Title', 100], ['category', 'Category (optional)', 40], ['description', 'Description (optional)', 2000]]) {
      const label = el('label', labelText);
      const input = el(field === 'description' ? 'textarea' : 'input');
      input.value = item[field]; input.maxLength = max; input.disabled = locked;
      input.setAttribute('aria-label', `${labelText} for ${item.file.name}`);
      if (field === 'title') input.required = true;
      if (field === 'description') input.rows = 2;
      input.oninput = () => { item[field] = input.value; };
      label.append(input); content.append(label);
    }
    const state = el('p', item.message || 'Ready to publish', 'batch-state');
    content.append(state);
    if (canPublish(item)) {
      const remove = el('button', 'Remove from batch');
      remove.disabled = batchBusy;
      remove.onclick = () => {
        URL.revokeObjectURL(item.previewURL);
        batchItems.splice(index, 1);
        renderBatch();
      };
      content.append(remove);
    }
    row.append(thumbnail, content); $('#batch-items').append(row);
  }
  const pending = batchItems.filter(canPublish).length;
  const done = batchItems.filter(item => item.status === 'published').length;
  const failed = batchItems.filter(item => item.status === 'failed').length;
  const uncertain = batchItems.filter(item => item.status === 'uncertain').length;
  const uploading = batchItems.find(item => item.status === 'uploading');
  const publishButton = $('#batch-publish');
  publishButton.disabled = batchBusy || !pending;
  publishButton.textContent = batchBusy ? 'Publishing…' : pending ? `${done || failed ? 'Publish remaining' : 'Publish'} ${pending} ${pending === 1 ? 'post' : 'posts'}` : 'Publish posts';
  $('#batch-files').disabled = batchBusy;
  document.querySelectorAll('.close-batch').forEach(b => b.disabled = batchBusy);
  $('#batch-close').textContent = done || uncertain ? 'Done' : 'Cancel';
  $('#batch-progress-wrap').hidden = !batchItems.length;
  $('#batch-progress').max = batchItems.length || 1;
  $('#batch-progress').value = done + failed + uncertain;
  $('#batch-summary').textContent = `${done} of ${batchItems.length} published${failed ? ` · ${failed} failed` : ''}${uncertain ? ` · ${uncertain} to check` : ''}${uploading ? ` · Uploading ${uploading.file.name}` : ''}`;
  $('#batch-uncertain').hidden = !uncertain;
}
$('#batch-files').onchange = () => {
  const selected = Array.from($('#batch-files').files);
  if (selected.length + batchItems.length > MAX_BATCH_FILES) {
    $('#batch-error').textContent = `Choose up to ${MAX_BATCH_FILES} files per batch. Your existing selection is unchanged.`;
  } else {
    $('#batch-error').textContent = '';
    for (const file of selected) {
      // Avoid adding the exact same file twice accidentally in this batch.
      if (batchItems.some(item => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified)) continue;
      batchItems.push({ ...createBatchItem(file), previewURL: URL.createObjectURL(file) });
    }
    renderBatch();
  }
  $('#batch-files').value = '';
};
function closeBatch() {
  if (batchBusy) return;
  const unfinished = batchItems.some(item => item.status !== 'published');
  if (unfinished && !window.confirm('Close this batch? Unpublished selections will be cleared. Published posts will stay. Check any uncertain result before uploading it again.')) return;
  $('#batch-dialog').close();
}
document.querySelectorAll('.close-batch').forEach(b => b.onclick = closeBatch);
$('#batch-dialog').addEventListener('cancel', e => { e.preventDefault(); closeBatch(); });
$('#batch-dialog').addEventListener('close', () => {
  for (const item of batchItems) URL.revokeObjectURL(item.previewURL);
  batchItems = []; $('#batch-items').replaceChildren();
});
window.addEventListener('beforeunload', e => {
  if (batchBusy) { e.preventDefault(); e.returnValue = ''; }
});
$('#batch-publish').onclick = async () => {
  if (batchBusy || !batchItems.some(canPublish)) return;
  batchBusy = true; $('#batch-error').textContent = ''; renderBatch();
  try {
    const result = await publishBatch(batchItems, (fields, file) => portfolio.save(fields, file), renderBatch);
    $('#status').textContent = `${result.published} posts published.${result.failed ? ` ${result.failed} failed; retry them in the upload window.` : ''}${result.uncertain ? ` ${result.uncertain} results need checking before you retry.` : ''}`;
    try { await refresh(); } catch (error) { connectionError('Upload results are shown in the upload window, but the portfolio could not refresh. ' + errorMessage(error)); }
  } catch (error) { $('#batch-error').textContent = errorMessage(error); }
  finally { batchBusy = false; renderBatch(); }
};
document.querySelectorAll('.close-editor').forEach(b => b.onclick = () => { if (!busy) $('#editor').close(); });
$('#editor').addEventListener('cancel', e => { if (busy) e.preventDefault(); });
$('#editor').addEventListener('close', () => {
  if (previewURL) URL.revokeObjectURL(previewURL);
  previewURL = null; $('#preview').replaceChildren();
});
$('#file').onchange = () => {
  if (previewURL) URL.revokeObjectURL(previewURL);
  $('#preview').replaceChildren();
  const f = $('#file').files[0];
  if (f) { previewURL = URL.createObjectURL(f); $('#preview').append(asset({ url: previewURL, type: f.type, title: f.name }, true)); }
};
$('#post-form').onsubmit = async e => {
  e.preventDefault(); if (busy) return;
  $('#post-error').textContent = '';
  const fields = Object.fromEntries(new FormData(e.target));
  const file = $('#file').files[0];
  setBusy(true); $('#save').textContent = 'Saving…';
  try {
    const result = await portfolio.save(fields, file, editing);
    $('#editor').close();
    $('#status').textContent = (editing ? 'Changes saved. ' : 'Your new post is published. ') + result.warning;
    try { await refresh(); } catch (error) { connectionError('Saved, but the list could not refresh. ' + errorMessage(error)); }
  } catch (error) { $('#post-error').textContent = errorMessage(error); }
  finally { setBusy(false); $('#save').textContent = editing ? 'Save changes →' : 'Publish post →'; }
};
$('#login').onsubmit = async e => {
  e.preventDefault(); const b = e.target.querySelector('button'); b.disabled = true;
  $('#login-error').textContent = '';
  try {
    if (!portfolio) throw Error('Connect Supabase first. See README.md.');
    await portfolio.signIn(e.target.elements.email.value, e.target.elements.password.value);
    e.target.reset(); logged = true; view();
    try { await refresh(); } catch (error) { connectionError(errorMessage(error)); }
  } catch (error) { $('#login-error').textContent = errorMessage(error); }
  finally { b.disabled = false; }
};
$('#logout').onclick = async () => {
  try { await portfolio.signOut(); logged = false; view(); }
  catch (error) { connectionError(errorMessage(error)); }
};
$('#cancel-delete').onclick = () => $('#delete-dialog').close();
$('#confirm-delete').onclick = async () => {
  const b = $('#confirm-delete'); b.disabled = true; $('#cancel-delete').disabled = true;
  try {
    const result = await portfolio.remove(deleting);
    $('#delete-dialog').close(); $('#status').textContent = 'Post deleted. ' + result.warning;
    try { await refresh(); } catch (error) { connectionError('Deleted, but the list could not refresh. ' + errorMessage(error)); }
  } catch (error) { $('#delete-error').textContent = errorMessage(error); }
  finally { b.disabled = false; $('#cancel-delete').disabled = false; }
};
$('#delete-dialog').addEventListener('cancel', e => { if ($('#confirm-delete').disabled) e.preventDefault(); });
document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => {
  filter = b.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(n => { n.classList.toggle('active', n === b); n.setAttribute('aria-pressed', String(n === b)); });
  render();
});
$('#year').textContent = '© ' + new Date().getFullYear() + ' Frame Studio';
$('.menu-toggle').onclick = () => {
  const open = document.querySelector('header').classList.toggle('menu-open');
  $('.menu-toggle').setAttribute('aria-expanded', String(open));
};
document.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => {
  document.querySelector('header').classList.remove('menu-open');
  $('.menu-toggle').setAttribute('aria-expanded', 'false');
}));
view();
$('#status').textContent = 'Loading collection…';
(async () => {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key || url.includes('YOUR_PROJECT') || key.includes('REPLACE_ME')) throw Error('Supabase is not connected yet. Follow README.md: add the project URL and publishable key, then restart or redeploy.');
    if (key.startsWith('sb_secret_')) throw Error('Do not use a Supabase secret key in this app. Replace it with the publishable key and rotate any exposed secret.');
    client = createClient(url, key);
    portfolio = createPortfolio(client);
    const { data: { session } } = await client.auth.getSession();
    if (session) {
      try { await portfolio.requireAdmin(); logged = true; }
      catch (error) { if (isAdmin) $('#login-error').textContent = errorMessage(error); }
    }
    client.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') { logged = false; view(); }
    });
    view(); await refresh(); $('#status').textContent = '';
  } catch (error) { $('#status').textContent = ''; connectionError(errorMessage(error)); }
})();
