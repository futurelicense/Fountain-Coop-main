-- Fix "infinite recursion detected in policy for relation profiles"
-- when querying operational_items (e.g. walletLedger).
-- Run in Supabase SQL Editor.

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

-- profiles
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select
  using (auth.uid() = id or public.auth_is_staff());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update"
  on public.profiles for update
  using (auth.uid() = id or public.auth_is_staff())
  with check (auth.uid() = id or public.auth_is_staff());

-- activities, compliance, metrics
drop policy if exists "activities_staff_select" on public.activities;
create policy "activities_staff_select"
  on public.activities for select
  using (public.auth_is_staff());

drop policy if exists "compliance_staff_select" on public.compliance_alerts;
create policy "compliance_staff_select"
  on public.compliance_alerts for select
  using (public.auth_is_staff());

drop policy if exists "metrics_staff_select" on public.metrics_monthly;
create policy "metrics_staff_select"
  on public.metrics_monthly for select
  using (public.auth_is_staff());

-- operational_items (requires 003 applied)
drop policy if exists "operational_items_staff_select" on public.operational_items;
create policy "operational_items_staff_select"
  on public.operational_items for select
  using (public.auth_is_staff());

drop policy if exists "operational_items_staff_insert" on public.operational_items;
create policy "operational_items_staff_insert"
  on public.operational_items for insert
  with check (public.auth_is_staff());

drop policy if exists "operational_items_staff_update" on public.operational_items;
create policy "operational_items_staff_update"
  on public.operational_items for update
  using (public.auth_is_staff())
  with check (public.auth_is_staff());

drop policy if exists "operational_items_staff_delete" on public.operational_items;
create policy "operational_items_staff_delete"
  on public.operational_items for delete
  using (public.auth_is_staff());

drop policy if exists "operational_items_member_select" on public.operational_items;
create policy "operational_items_member_select"
  on public.operational_items for select
  using (
    public.auth_is_member()
    and (is_catalog = true or owner_id = auth.uid())
  );

drop policy if exists "operational_items_member_insert" on public.operational_items;
create policy "operational_items_member_insert"
  on public.operational_items for insert
  with check (
    public.auth_is_member()
    and is_catalog = false
    and owner_id = auth.uid()
  );

drop policy if exists "operational_items_member_update" on public.operational_items;
create policy "operational_items_member_update"
  on public.operational_items for update
  using (
    public.auth_is_member()
    and is_catalog = false
    and owner_id = auth.uid()
  )
  with check (
    public.auth_is_member()
    and is_catalog = false
    and owner_id = auth.uid()
  );

drop policy if exists "operational_items_member_delete" on public.operational_items;
create policy "operational_items_member_delete"
  on public.operational_items for delete
  using (
    public.auth_is_member()
    and is_catalog = false
    and owner_id = auth.uid()
  );
