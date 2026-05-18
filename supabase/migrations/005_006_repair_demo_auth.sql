-- Run once in Supabase Dashboard → SQL Editor, then: npm run seed:demo-auth
-- Combines 005 (remove broken SQL-seeded auth) + 006 (profile trigger upsert).

-- === 005: remove broken demo auth rows ===
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

-- === 006: handle_new_user upsert (safe on re-run) ===
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, member_code, phone, branch, status, products, savings_balance, loan_balance)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'member'),
    nullif(new.raw_user_meta_data->>'member_code', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    coalesce(nullif(new.raw_user_meta_data->>'branch', ''), 'Lagos Main'),
    coalesce(nullif(new.raw_user_meta_data->>'status', ''), 'Active'),
    coalesce(
      (
        select coalesce(array_agg(x), '{}')
        from jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'products', '[]'::jsonb)) as t(x)
      ),
      '{}'
    ),
    0,
    0
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    member_code = coalesce(excluded.member_code, public.profiles.member_code),
    phone = coalesce(excluded.phone, public.profiles.phone),
    branch = coalesce(excluded.branch, public.profiles.branch),
    status = coalesce(excluded.status, public.profiles.status),
    products = case
      when cardinality(excluded.products) > 0 then excluded.products
      else public.profiles.products
    end;
  return new;
end;
$$;
