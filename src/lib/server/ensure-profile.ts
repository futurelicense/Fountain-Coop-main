import type { SupabaseClient, User } from '@supabase/supabase-js';
import { defaultMemberSavingsBalance } from '@/lib/config/app-mode';
import type { ProfileRow } from '@/lib/server/request-auth';
import type { UserRole } from '@/api/types';

function metaString(
  meta: Record<string, unknown> | undefined,
  key: string
): string | null {
  const v = meta?.[key];
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function metaProducts(meta: Record<string, unknown> | undefined): string[] {
  const raw = meta?.products;
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x)).filter(Boolean);
  }
  return [];
}

/** Insert missing `profiles` row (RLS: profiles_insert_own). Safe to call repeatedly. */
export async function ensureProfileForUser(
  supabase: SupabaseClient,
  user: User
): Promise<ProfileRow | null> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (existing) return existing as ProfileRow;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const role = (metaString(meta, 'role') ?? 'member') as UserRole;
  const row = {
    id: user.id,
    full_name:
      metaString(meta, 'full_name') ??
      user.email?.split('@')[0] ??
      'User',
    role,
    member_code: metaString(meta, 'member_code'),
    phone: metaString(meta, 'phone'),
    branch: metaString(meta, 'branch') ?? 'Lagos Main',
    status: metaString(meta, 'status') ?? 'Active',
    products: metaProducts(meta),
    savings_balance: role === 'member' ? defaultMemberSavingsBalance() : 0,
    loan_balance: 0,
  };

  const { data: inserted, error } = await supabase
    .from('profiles')
    .insert(row)
    .select('*')
    .single();

  if (error) {
    if (/duplicate key|unique constraint/i.test(error.message)) {
      const { data: retry } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      return (retry as ProfileRow | null) ?? null;
    }
    return null;
  }
  return inserted as ProfileRow;
}
