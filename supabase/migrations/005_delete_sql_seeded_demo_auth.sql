-- Remove SQL-seeded demo Auth rows so Admin API can recreate them (npm run seed:demo-auth).
-- Run in Supabase Dashboard → SQL Editor when seed:demo-auth fails with
-- "Database error finding users" or "Database error checking email".
--
-- Then locally: npm run seed:demo-auth  (password: demo)

-- Profiles reference auth.users; remove first so nothing blocks auth cleanup.
delete from public.profiles
where id in (
  select id from auth.users
  where lower(email) in (
    'demo-super-admin@fountain.coop',
    'demo-tenant-admin@fountain.coop',
    'demo-group-admin@fountain.coop',
    'demo-member@fountain.coop'
  )
);

delete from auth.identities
where user_id in (
  select id from auth.users
  where lower(email) in (
    'demo-super-admin@fountain.coop',
    'demo-tenant-admin@fountain.coop',
    'demo-group-admin@fountain.coop',
    'demo-member@fountain.coop'
  )
);

delete from auth.users
where lower(email) in (
  'demo-super-admin@fountain.coop',
  'demo-tenant-admin@fountain.coop',
  'demo-group-admin@fountain.coop',
  'demo-member@fountain.coop'
);
