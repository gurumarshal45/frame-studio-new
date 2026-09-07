import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Execute the real schema in PostgreSQL/WASM with minimal Supabase schemas.
// This checks RLS/grants, not the live Supabase HTTP/Auth/Storage services.
test('database and storage policies enforce admin-only writes', async () => {
  const db = new PGlite();
  const admin = '11111111-1111-4111-8111-111111111111';
  const visitor = '22222222-2222-4222-8222-222222222222';
  const object = `${admin}/33333333-3333-4333-8333-333333333333.png`;
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth; create schema storage;
      grant usage on schema public,auth,storage to anon,authenticated;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
      $$;
      create table storage.buckets (id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects (id uuid default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      grant select,insert,update,delete on storage.objects to anon,authenticated;
      create function storage.foldername(name text) returns text[] language sql immutable as $$
        select string_to_array(name,'/');
      $$;
      insert into auth.users values ('${admin}'),('${visitor}');
    `);
    await db.exec(await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'));
    await db.query('insert into public.studio_admins values ($1)', [admin]);
    const as = async (role, uid = '') => {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
      await db.exec('set role ' + role);
    };
    const insert = () => db.query("insert into public.posts(title,storage_path,media_type) values ('Test',$1,'image/png') returning *", [object]);
    await as('anon');
    assert.equal((await db.query('select * from public.posts')).rows.length, 0);
    await assert.rejects(insert(), /permission denied/);
    await as('authenticated', visitor);
    assert.equal((await db.query('select public.is_studio_admin() as yes')).rows[0].yes, false);
    await assert.rejects(insert(), /row-level security/);
    await assert.rejects(db.query('insert into public.studio_admins values ($1)', [visitor]), /permission denied/);
    await as('authenticated', admin);
    assert.equal((await db.query('select public.is_studio_admin() as yes')).rows[0].yes, true);
    const post = (await insert()).rows[0];
    await db.query("update public.posts set title='Edited' where id=$1", [post.id]);
    const edited = (await db.query('select * from public.posts')).rows[0];
    assert.equal(String(edited.created_at), String(post.created_at));
    await assert.rejects(db.query("update public.posts set created_at=now()"), /permission denied/);
    await db.query("insert into storage.objects(bucket_id,name) values ('portfolio',$1)", [object]);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('portfolio',$1)", [`${visitor}/wrong.png`]), /row-level security/);
    await as('authenticated', visitor);
    assert.equal((await db.query('delete from public.posts returning id')).rows.length, 0);
    assert.equal((await db.query('delete from storage.objects returning id')).rows.length, 0);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('portfolio',$1)", [object]), /row-level security/);
    await as('anon');
    assert.equal((await db.query('select * from public.posts')).rows.length, 1);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('portfolio',$1)", [object]), /row-level security/);
    await as('authenticated', admin);
    assert.equal((await db.query('delete from public.posts returning id')).rows.length, 1);
    assert.equal((await db.query('delete from storage.objects returning id')).rows.length, 1);
  } finally { await db.close(); }
});
