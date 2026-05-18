-- Apply on hosted projects that already ran 001 (prevents profile duplicate errors on Admin createUser).
-- Safe to run multiple times.

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
