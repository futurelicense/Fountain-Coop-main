-- Generic operational records for live UI (replaces mock JSON per module/subtype).
-- Requires 001_fountain_coop.sql (profiles + RLS patterns).

create table if not exists public.operational_items (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  subtype text not null,
  is_catalog boolean not null default false,
  owner_id uuid references public.profiles (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  branch text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists operational_items_module_subtype_idx
  on public.operational_items (module, subtype);
create index if not exists operational_items_owner_idx
  on public.operational_items (owner_id);

alter table public.operational_items enable row level security;

-- Staff: full CRUD
create policy "operational_items_staff_select"
  on public.operational_items for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin', 'tenant_admin', 'group_admin')
    )
  );

create policy "operational_items_staff_insert"
  on public.operational_items for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin', 'tenant_admin', 'group_admin')
    )
  );

create policy "operational_items_staff_update"
  on public.operational_items for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin', 'tenant_admin', 'group_admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin', 'tenant_admin', 'group_admin')
    )
  );

create policy "operational_items_staff_delete"
  on public.operational_items for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin', 'tenant_admin', 'group_admin')
    )
  );

-- Members: read catalog + own rows; write own non-catalog only
create policy "operational_items_member_select"
  on public.operational_items for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'member'
    )
    and (
      is_catalog = true
      or owner_id = auth.uid()
    )
  );

create policy "operational_items_member_insert"
  on public.operational_items for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'member'
    )
    and is_catalog = false
    and owner_id = auth.uid()
  );

create policy "operational_items_member_update"
  on public.operational_items for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'member'
    )
    and is_catalog = false
    and owner_id = auth.uid()
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'member'
    )
    and is_catalog = false
    and owner_id = auth.uid()
  );

create policy "operational_items_member_delete"
  on public.operational_items for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'member'
    )
    and is_catalog = false
    and owner_id = auth.uid()
  );

create or replace function public.touch_operational_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists operational_items_touch_updated on public.operational_items;
create trigger operational_items_touch_updated
  before update on public.operational_items
  for each row execute function public.touch_operational_items_updated_at();
