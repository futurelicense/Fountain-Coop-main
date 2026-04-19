-- Demo login accounts for Supabase Auth (all roles).
-- Apply after 001_fountain_coop.sql (e.g. supabase db push, or paste in SQL Editor).
--
-- Password for every account below: demo
--
-- | Role          | Email (sign in with Email + password in the app) |
-- |---------------|-----------------------------------------------------|
-- | super_admin   | demo-super-admin@fountain.coop                    |
-- | tenant_admin  | demo-tenant-admin@fountain.coop                   |
-- | group_admin   | demo-group-admin@fountain.coop                    |
-- | member        | demo-member@fountain.coop                           |
--
-- The app treats identifiers with "@" as Supabase email sign-in.
-- Profiles are created by trigger public.handle_new_user() from raw_user_meta_data.
--
-- WARNING: Dev/demo only. Remove or change passwords before production.

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  v_instance uuid;
begin
  select id into v_instance from auth.instances limit 1;
  if v_instance is null then
    v_instance := '00000000-0000-0000-0000-000000000000'::uuid;
  end if;

  -- super_admin
  if not exists (select 1 from auth.users where email = 'demo-super-admin@fountain.coop') then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) values (
      v_instance,
      'a1111111-1111-1111-1111-111111111101'::uuid,
      'authenticated',
      'authenticated',
      'demo-super-admin@fountain.coop',
      extensions.crypt('demo', extensions.gen_salt('bf', 10)),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Adebayo Ogundimu","role":"super_admin"}'::jsonb,
      now(),
      now(),
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      'a1111111-1111-1111-1111-111111111101'::uuid,
      'a1111111-1111-1111-1111-111111111101'::uuid,
      jsonb_build_object(
        'sub', 'a1111111-1111-1111-1111-111111111101',
        'email', 'demo-super-admin@fountain.coop'
      ),
      'email',
      now(),
      now(),
      now()
    );
  end if;

  -- tenant_admin
  if not exists (select 1 from auth.users where email = 'demo-tenant-admin@fountain.coop') then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) values (
      v_instance,
      'a1111111-1111-1111-1111-111111111102'::uuid,
      'authenticated',
      'authenticated',
      'demo-tenant-admin@fountain.coop',
      extensions.crypt('demo', extensions.gen_salt('bf', 10)),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Tenant Admin","role":"tenant_admin"}'::jsonb,
      now(),
      now(),
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      'a1111111-1111-1111-1111-111111111102'::uuid,
      'a1111111-1111-1111-1111-111111111102'::uuid,
      jsonb_build_object(
        'sub', 'a1111111-1111-1111-1111-111111111102',
        'email', 'demo-tenant-admin@fountain.coop'
      ),
      'email',
      now(),
      now(),
      now()
    );
  end if;

  -- group_admin
  if not exists (select 1 from auth.users where email = 'demo-group-admin@fountain.coop') then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) values (
      v_instance,
      'a1111111-1111-1111-1111-111111111103'::uuid,
      'authenticated',
      'authenticated',
      'demo-group-admin@fountain.coop',
      extensions.crypt('demo', extensions.gen_salt('bf', 10)),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Group Admin","role":"group_admin"}'::jsonb,
      now(),
      now(),
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      'a1111111-1111-1111-1111-111111111103'::uuid,
      'a1111111-1111-1111-1111-111111111103'::uuid,
      jsonb_build_object(
        'sub', 'a1111111-1111-1111-1111-111111111103',
        'email', 'demo-group-admin@fountain.coop'
      ),
      'email',
      now(),
      now(),
      now()
    );
  end if;

  -- member (aligned with seed member FC-1001)
  if not exists (select 1 from auth.users where email = 'demo-member@fountain.coop') then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) values (
      v_instance,
      'a1111111-1111-1111-1111-111111111104'::uuid,
      'authenticated',
      'authenticated',
      'demo-member@fountain.coop',
      extensions.crypt('demo', extensions.gen_salt('bf', 10)),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'full_name', 'Chioma Okafor',
        'role', 'member',
        'member_code', 'FC-1001',
        'phone', '+234 803 123 4567',
        'branch', 'Lagos Main',
        'status', 'Active',
        'products', jsonb_build_array('Cooperative', 'Thrift')
      ),
      now(),
      now(),
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      'a1111111-1111-1111-1111-111111111104'::uuid,
      'a1111111-1111-1111-1111-111111111104'::uuid,
      jsonb_build_object(
        'sub', 'a1111111-1111-1111-1111-111111111104',
        'email', 'demo-member@fountain.coop'
      ),
      'email',
      now(),
      now(),
      now()
    );
  end if;
end $$;

-- Match demo seed balances for the member (trigger defaults to 0)
update public.profiles
set
  savings_balance = 450000,
  loan_balance = 0
where id = 'a1111111-1111-1111-1111-111111111104'::uuid;
