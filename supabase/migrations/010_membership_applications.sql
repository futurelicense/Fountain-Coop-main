-- Public "Be a Member" application flow: applicant fills the form + uploads a
-- headshot before any account exists, pays the ₦5,000 registration fee via
-- Paystack, then sets a password to create their Supabase Auth account.
-- Requires 001_fountain_coop.sql (auth_is_staff() helper).

create table if not exists public.membership_applications (
  id uuid primary key default gen_random_uuid(),

  full_name text not null,
  occupation text,
  is_employed boolean not null default false,
  employer text,
  owns_business boolean not null default false,
  business_type text,
  home_address text not null,
  office_address text,
  phone text not null,
  email text not null,
  referral_source text,
  monthly_contribution numeric not null default 0,
  wants_fountain_basket boolean not null default false,
  next_of_kin_name text,
  next_of_kin_address text,
  next_of_kin_phone text,
  emergency_contact text,
  declaration_accepted boolean not null default false,
  photo_path text,

  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'account_created', 'cancelled')),
  registration_fee numeric not null default 5000,
  payment_reference text,
  amount_paid numeric,
  paid_at timestamptz,
  user_id uuid references auth.users (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists membership_applications_status_idx
  on public.membership_applications (status);
create index if not exists membership_applications_email_idx
  on public.membership_applications (email);
create index if not exists membership_applications_payment_ref_idx
  on public.membership_applications (payment_reference);

alter table public.membership_applications enable row level security;

drop policy if exists "membership_applications_staff_select" on public.membership_applications;
drop policy if exists "membership_applications_staff_update" on public.membership_applications;

-- All inserts/updates for this table happen server-side with the service-role
-- key (the applicant is anonymous, pre-account). Staff can read for review.
create policy "membership_applications_staff_select"
  on public.membership_applications for select
  using (public.auth_is_staff());

create policy "membership_applications_staff_update"
  on public.membership_applications for update
  using (public.auth_is_staff())
  with check (public.auth_is_staff());

create or replace function public.touch_membership_applications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists membership_applications_touch_updated on public.membership_applications;
create trigger membership_applications_touch_updated
  before update on public.membership_applications
  for each row execute function public.touch_membership_applications_updated_at();

-- Private bucket for headshot photos. Only the service role (server routes)
-- reads/writes; admins view via short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('membership-photos', 'membership-photos', false)
on conflict (id) do nothing;
