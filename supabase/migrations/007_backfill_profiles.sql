-- Backfill profiles for Auth users missing a row (e.g. after 005 delete or Admin API signup).
-- Run in Supabase SQL Editor if wallet/Paystack returns profile_not_found.

insert into public.profiles (
  id,
  full_name,
  role,
  member_code,
  phone,
  branch,
  status,
  products,
  savings_balance,
  loan_balance
)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  coalesce(nullif(u.raw_user_meta_data->>'role', ''), 'member'),
  nullif(u.raw_user_meta_data->>'member_code', ''),
  nullif(u.raw_user_meta_data->>'phone', ''),
  coalesce(nullif(u.raw_user_meta_data->>'branch', ''), 'Lagos Main'),
  coalesce(nullif(u.raw_user_meta_data->>'status', ''), 'Active'),
  coalesce(
    (
      select coalesce(array_agg(x), '{}')
      from jsonb_array_elements_text(coalesce(u.raw_user_meta_data->'products', '[]'::jsonb)) as t(x)
    ),
    '{}'
  ),
  0,
  0
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
