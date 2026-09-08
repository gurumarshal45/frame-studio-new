-- Run this once in Supabase Dashboard -> SQL Editor -> New query.
begin;

create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  email text not null check (char_length(email) between 3 and 254),
  phone text not null default '' check (char_length(phone) <= 30),
  event_date date,
  event_location text not null default '' check (char_length(event_location) <= 150),
  message text not null check (char_length(btrim(message)) between 5 and 2000),
  status text not null default 'new' check (status in ('new','contacted','booked','closed')),
  created_at timestamptz not null default now()
);

create index if not exists contact_enquiries_newest_first
  on public.contact_enquiries (created_at desc, id desc);

alter table public.contact_enquiries enable row level security;
revoke all on public.contact_enquiries from anon, authenticated;
grant insert (name,email,phone,event_date,event_location,message)
  on public.contact_enquiries to anon, authenticated;
grant select, update, delete on public.contact_enquiries to authenticated;

drop policy if exists public_submit_enquiry on public.contact_enquiries;
create policy public_submit_enquiry on public.contact_enquiries
  for insert to anon, authenticated with check (true);

drop policy if exists studio_admin_read_enquiries on public.contact_enquiries;
create policy studio_admin_read_enquiries on public.contact_enquiries
  for select to authenticated using ((select public.is_studio_admin()));

drop policy if exists studio_admin_update_enquiries on public.contact_enquiries;
create policy studio_admin_update_enquiries on public.contact_enquiries
  for update to authenticated using ((select public.is_studio_admin()))
  with check ((select public.is_studio_admin()));

drop policy if exists studio_admin_delete_enquiries on public.contact_enquiries;
create policy studio_admin_delete_enquiries on public.contact_enquiries
  for delete to authenticated using ((select public.is_studio_admin()));

commit;
