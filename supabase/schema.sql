-- Run once in a NEW Supabase project's SQL Editor, as the project owner.
begin;
create table public.studio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.studio_admins enable row level security;
revoke all on public.studio_admins from anon, authenticated;

create function public.is_studio_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.studio_admins where user_id = (select auth.uid())); $$;
revoke all on function public.is_studio_admin() from public;
grant execute on function public.is_studio_admin() to authenticated;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  category text not null default '' check (char_length(category) <= 40),
  storage_path text not null unique check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp|gif|mp4|webm)$'),
  media_type text not null check (media_type in ('image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_newest_first on public.posts (created_at desc, id desc);
alter table public.posts enable row level security;
revoke all on public.posts from anon, authenticated;
grant select on public.posts to anon, authenticated;
grant insert (title,description,category,storage_path,media_type) on public.posts to authenticated;
grant update (title,description,category,storage_path,media_type) on public.posts to authenticated;
grant delete on public.posts to authenticated;
create policy portfolio_read on public.posts for select to anon, authenticated using (true);
create policy studio_create on public.posts for insert to authenticated
with check ((select public.is_studio_admin()) and split_part(storage_path,'/',1) = (select auth.uid())::text);
create policy studio_edit on public.posts for update to authenticated
using ((select public.is_studio_admin()))
with check ((select public.is_studio_admin()));
create policy studio_delete on public.posts for delete to authenticated using ((select public.is_studio_admin()));
create function public.touch_post() returns trigger language plpgsql set search_path = '' as $$
begin
  new.id := old.id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.touch_post() from public;
create trigger posts_timestamp before update on public.posts for each row execute function public.touch_post();

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('portfolio','portfolio',true,26214400,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']);
-- Public media URLs are readable by everyone. Never upload private files.
-- No anonymous write policies. Users cannot grant themselves admin rights.
create policy studio_upload on storage.objects for insert to authenticated
with check (bucket_id='portfolio' and (select public.is_studio_admin()) and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy studio_storage_read on storage.objects for select to authenticated
using (bucket_id='portfolio' and (select public.is_studio_admin()));
create policy studio_storage_delete on storage.objects for delete to authenticated
using (bucket_id='portfolio' and (select public.is_studio_admin()));
commit;
