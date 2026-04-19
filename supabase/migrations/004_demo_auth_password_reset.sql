-- Repair demo Auth passwords after 002 (GoTrue expects standard bcrypt, cost 10).
-- Run if signInWithPassword returns "Invalid login credentials" for demo accounts.
-- Password remains: demo

create extension if not exists pgcrypto with schema extensions;

update auth.users u
set
  encrypted_password = extensions.crypt('demo', extensions.gen_salt('bf', 10)),
  email_confirmed_at = coalesce(u.email_confirmed_at, now()),
  updated_at = now()
where lower(u.email) in (
  'demo-super-admin@fountain.coop',
  'demo-tenant-admin@fountain.coop',
  'demo-group-admin@fountain.coop',
  'demo-member@fountain.coop'
);
