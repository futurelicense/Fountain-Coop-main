-- Fountain Coop: profiles, activity feed, compliance, monthly metrics.
-- Run in Supabase SQL Editor or via CLI: supabase db push

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'member'
    check (role in ('super_admin', 'tenant_admin', 'group_admin', 'member')),
  member_code text unique,
  full_name text,
  phone text,
  branch text default 'Lagos Main',
  status text default 'Active',
  products text[] not null default '{}',
  savings_balance numeric not null default 0,
  loan_balance numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  actor_name text not null,
  action_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.compliance_alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  severity text not null default 'low' check (severity in ('high', 'medium', 'low')),
  created_at timestamptz not null default now()
);

create table if not exists public.metrics_monthly (
  month_key text primary key,
  sort_order int not null,
  total_members int not null default 0,
  new_members int not null default 0,
  disbursed_m numeric not null default 0,
  repaid_m numeric not null default 0
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_branch_idx on public.profiles (branch);
create index if not exists activities_created_idx on public.activities (created_at desc);

alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.compliance_alerts enable row level security;
alter table public.metrics_monthly enable row level security;

-- Role helpers (security definer — avoids RLS recursion on profiles)
create or replace function public.auth_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.auth_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select role in ('super_admin', 'tenant_admin', 'group_admin')
      from public.profiles
      where id = auth.uid()
      limit 1
    ),
    false
  );
$$;

create or replace function public.auth_is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_profile_role() = 'member';
$$;

grant execute on function public.auth_profile_role() to authenticated, service_role;
grant execute on function public.auth_is_staff() to authenticated, service_role;
grant execute on function public.auth_is_member() to authenticated, service_role;

-- Idempotent: safe to re-run in SQL Editor after a partial apply
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "activities_staff_select" on public.activities;
drop policy if exists "compliance_staff_select" on public.compliance_alerts;
drop policy if exists "metrics_staff_select" on public.metrics_monthly;

-- Profiles: own row OR admin/tenant/group can read all member data
create policy "profiles_select"
  on public.profiles for select
  using (auth.uid() = id or public.auth_is_staff());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update"
  on public.profiles for update
  using (auth.uid() = id or public.auth_is_staff())
  with check (auth.uid() = id or public.auth_is_staff());

-- Activities & compliance: staff only
create policy "activities_staff_select"
  on public.activities for select
  using (public.auth_is_staff());

create policy "compliance_staff_select"
  on public.compliance_alerts for select
  using (public.auth_is_staff());

-- Monthly metrics: staff read
create policy "metrics_staff_select"
  on public.metrics_monthly for select
  using (public.auth_is_staff());

-- Auto-create profile on signup (optional metadata: full_name, role, member_code, phone, branch, products)
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed dashboard support rows (idempotent inserts)
insert into public.metrics_monthly (month_key, sort_order, total_members, new_members, disbursed_m, repaid_m)
values
  ('Apr', 1, 2100, 85, 5.2, 4.8),
  ('May', 2, 2190, 90, 6.1, 5.0),
  ('Jun', 3, 2250, 60, 5.8, 5.5),
  ('Jul', 4, 2340, 90, 7.2, 6.0),
  ('Aug', 5, 2450, 110, 8.5, 6.8),
  ('Sep', 6, 2520, 70, 7.9, 7.2),
  ('Oct', 7, 2600, 80, 9.1, 8.0),
  ('Nov', 8, 2680, 80, 10.5, 8.5),
  ('Dec', 9, 2750, 70, 12.0, 9.2),
  ('Jan', 10, 2810, 60, 8.5, 10.5),
  ('Feb', 11, 2847, 37, 9.8, 11.0),
  ('Mar', 12, 2980, 133, 12.4, 11.5)
on conflict (month_key) do nothing;

insert into public.compliance_alerts (title, description, severity)
select v.title, v.description, v.severity::text
from (
  values
    ('KYC review queue', '3 member profiles pending verification.', 'medium'),
    ('Large cash deposit', 'Single deposit above threshold at Ikeja branch.', 'low')
) as v(title, description, severity)
where not exists (select 1 from public.compliance_alerts limit 1);

insert into public.activities (type, actor_name, action_text)
select v.type, v.actor, v.action
from (
  values
    ('join', 'System', 'Connect Supabase and sign in to see live data.'),
    ('contribution', 'System', 'Seed member profiles to populate this feed.')
) as v(type, actor, action)
where not exists (select 1 from public.activities limit 1);
