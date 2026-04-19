-- Migration 005: Seed demo member profiles + richer activity feed.
-- Depends on: 001_fountain_coop.sql, 002_demo_auth_users.sql
-- Safe to re-run (idempotent inserts).

create extension if not exists pgcrypto with schema extensions;

-- ─── Demo member Supabase auth users ─────────────────────────────────────────
-- FC-1002 through FC-1010 (FC-1001 / Chioma Okafor already in 002).
-- All have password: demo

do $$
declare
  v_instance uuid;
  members jsonb[];
  m jsonb;
  uid uuid;
begin
  select id into v_instance from auth.instances limit 1;
  if v_instance is null then
    v_instance := '00000000-0000-0000-0000-000000000000'::uuid;
  end if;

  members := array[
    jsonb_build_object(
      'uid', 'b1111111-2222-3333-4444-000000001002',
      'email', 'emeka.nwosu@fountain.coop',
      'meta', jsonb_build_object('full_name','Emeka Nwosu','role','member','member_code','FC-1002','phone','+234 805 234 5678','branch','Ikeja','status','Active','products',jsonb_build_array('Cooperative','Loan'))
    ),
    jsonb_build_object(
      'uid', 'b1111111-2222-3333-4444-000000001003',
      'email', 'fatima.abdullahi@fountain.coop',
      'meta', jsonb_build_object('full_name','Fatima Abdullahi','role','member','member_code','FC-1003','phone','+234 809 345 6789','branch','Abuja','status','Owing','products',jsonb_build_array('Cooperative','Ajo/Osusu','Loan'))
    ),
    jsonb_build_object(
      'uid', 'b1111111-2222-3333-4444-000000001004',
      'email', 'oluwaseun.adeyemi@fountain.coop',
      'meta', jsonb_build_object('full_name','Oluwaseun Adeyemi','role','member','member_code','FC-1004','phone','+234 812 456 7890','branch','Lekki','status','Active','products',jsonb_build_array('Thrift','Packs'))
    ),
    jsonb_build_object(
      'uid', 'b1111111-2222-3333-4444-000000001005',
      'email', 'amina.bello@fountain.coop',
      'meta', jsonb_build_object('full_name','Amina Bello','role','member','member_code','FC-1005','phone','+234 802 567 8901','branch','Kano','status','Inactive','products',jsonb_build_array('Cooperative'))
    ),
    jsonb_build_object(
      'uid', 'b1111111-2222-3333-4444-000000001006',
      'email', 'chinedu.eze@fountain.coop',
      'meta', jsonb_build_object('full_name','Chinedu Eze','role','member','member_code','FC-1006','phone','+234 806 678 9012','branch','Port Harcourt','status','Active','products',jsonb_build_array('Cooperative','Thrift','Packs'))
    ),
    jsonb_build_object(
      'uid', 'b1111111-2222-3333-4444-000000001007',
      'email', 'ngozi.chukwu@fountain.coop',
      'meta', jsonb_build_object('full_name','Ngozi Chukwu','role','member','member_code','FC-1007','phone','+234 813 789 0123','branch','Lagos Main','status','Suspended','products',jsonb_build_array('Cooperative','Loan'))
    ),
    jsonb_build_object(
      'uid', 'b1111111-2222-3333-4444-000000001008',
      'email', 'babajide.sanwo@fountain.coop',
      'meta', jsonb_build_object('full_name','Babajide Sanwo','role','member','member_code','FC-1008','phone','+234 808 890 1234','branch','Ikeja','status','Active','products',jsonb_build_array('Thrift'))
    ),
    jsonb_build_object(
      'uid', 'b1111111-2222-3333-4444-000000001009',
      'email', 'aisha.ibrahim@fountain.coop',
      'meta', jsonb_build_object('full_name','Aisha Ibrahim','role','member','member_code','FC-1009','phone','+234 810 901 2345','branch','Abuja','status','Active','products',jsonb_build_array('Cooperative','Ajo/Osusu'))
    ),
    jsonb_build_object(
      'uid', 'b1111111-2222-3333-4444-000000001010',
      'email', 'tunde.olatunji@fountain.coop',
      'meta', jsonb_build_object('full_name','Tunde Olatunji','role','member','member_code','FC-1010','phone','+234 807 012 3456','branch','Lagos Main','status','Owing','products',jsonb_build_array('Cooperative','Thrift','Loan'))
    )
  ];

  foreach m in array members loop
    uid := (m->>'uid')::uuid;
    if not exists (select 1 from auth.users where id = uid) then
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, recovery_token
      ) values (
        v_instance, uid, 'authenticated', 'authenticated',
        m->>'email',
        extensions.crypt('demo', extensions.gen_salt('bf', 10)),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        m->'meta',
        now(), now(), '', ''
      );
      insert into auth.identities (
        id, user_id, provider_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), uid, uid,
        jsonb_build_object('sub', uid::text, 'email', m->>'email'),
        'email', now(), now(), now()
      );
    end if;
  end loop;
end $$;

-- ─── Seed realistic balances (idempotent by member_code) ─────────────────────
update public.profiles set savings_balance = 120000, loan_balance = 500000
  where member_code = 'FC-1002' and savings_balance = 0;
update public.profiles set savings_balance = 340000, loan_balance = 150000
  where member_code = 'FC-1003' and savings_balance = 0;
update public.profiles set savings_balance = 85000,  loan_balance = 0
  where member_code = 'FC-1004' and savings_balance = 0;
update public.profiles set savings_balance = 25000,  loan_balance = 0
  where member_code = 'FC-1005' and savings_balance = 0;
update public.profiles set savings_balance = 670000, loan_balance = 0
  where member_code = 'FC-1006' and savings_balance = 0;
update public.profiles set savings_balance = 50000,  loan_balance = 1200000
  where member_code = 'FC-1007' and savings_balance = 0;
update public.profiles set savings_balance = 15000,  loan_balance = 0
  where member_code = 'FC-1008' and savings_balance = 0;
update public.profiles set savings_balance = 290000, loan_balance = 0
  where member_code = 'FC-1009' and savings_balance = 0;
update public.profiles set savings_balance = 180000, loan_balance = 750000
  where member_code = 'FC-1010' and savings_balance = 0;

-- ─── Richer activities feed ──────────────────────────────────────────────────
-- Only inserts if the table has the two placeholder rows from 001.

insert into public.activities (type, actor_name, action_text, created_at)
select v.type, v.actor, v.action, now() - v.ago
from (values
  ('join',         'Chioma Okafor',     'New member registered – FC-1001',              '2 hours'::interval),
  ('contribution', 'Emeka Nwosu',       'Made cooperative savings deposit – ₦50,000',   '4 hours'::interval),
  ('loan',         'Fatima Abdullahi',  'Loan application submitted – ₦150,000',        '5 hours'::interval),
  ('join',         'Oluwaseun Adeyemi', 'New member registered – FC-1004',              '1 day'::interval),
  ('payout',       'Tunde Olatunji',    'Ajo payout disbursed – ₦600,000',             '1 day 2 hours'::interval),
  ('contribution', 'Chinedu Eze',       'Thrift contribution collected – ₦500',         '1 day 4 hours'::interval),
  ('loan',         'Ngozi Chukwu',      'Loan repayment received – ₦100,000',          '2 days'::interval),
  ('join',         'Aisha Ibrahim',     'New member registered – FC-1009',              '3 days'::interval),
  ('contribution', 'Babajide Sanwo',    'Daily thrift contribution – ₦500',             '3 days 1 hour'::interval),
  ('alert',        'System',            'KYC documents pending review for 3 members',   '4 days'::interval),
  ('loan',         'Emeka Nwosu',       'Loan approved and disbursed – ₦500,000',      '5 days'::interval),
  ('contribution', 'Chioma Okafor',     'Monthly cooperative savings – ₦50,000',        '6 days'::interval)
) as v(type, actor, action, ago)
where (select count(*) from public.activities) <= 2;

-- ─── Richer compliance alerts ────────────────────────────────────────────────
insert into public.compliance_alerts (title, description, severity, created_at)
select v.title, v.description, v.severity, now() - v.ago
from (values
  ('Overdue loan – Ngozi Chukwu',    'FC-1007 has ₦1.2M loan outstanding. 62 days past due.', 'high',   '1 day'::interval),
  ('KYC review queue',               '3 member profiles pending identity verification.',         'medium', '2 days'::interval),
  ('Large cash deposit',             'Single deposit above ₦500k threshold at Ikeja branch.',   'medium', '3 days'::interval),
  ('Inactive member threshold',      '12 members have had no activity in 90+ days.',            'low',    '4 days'::interval),
  ('Dual-auth pending',              '2 loan approvals awaiting secondary authorization.',       'medium', '5 days'::interval)
) as v(title, description, severity, ago)
where (select count(*) from public.compliance_alerts) <= 2;
