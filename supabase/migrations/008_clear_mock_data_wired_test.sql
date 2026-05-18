-- Reset database for Paystack wired testing (run in Supabase SQL Editor).
-- Clears mock ledger/ops data and zeroes member wallet balances.

delete from public.operational_items;

delete from public.activities
where actor_name = 'System';

update public.profiles
set
  savings_balance = 0,
  loan_balance = 0
where role = 'member';

-- Optional: remove seeded dashboard metrics (re-seed from admin UI or migrations later)
-- delete from public.metrics_monthly;
-- delete from public.compliance_alerts;
