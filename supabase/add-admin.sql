-- First create your account in Supabase: Authentication > Users > Add user.
-- Replace the value below with THAT user's UUID, not their email.
-- Run this only in the Supabase SQL Editor. Never put a password in SQL.
insert into public.studio_admins (user_id)
values ('REPLACE_WITH_AUTH_USER_UUID'::uuid)
on conflict (user_id) do nothing;
