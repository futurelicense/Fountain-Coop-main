import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { runWalletForUser } from '@/lib/server/member-wallet';

export function paystackMetadataUserId(
  metadata: Record<string, unknown> | null | undefined
): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const raw = metadata.userId ?? metadata.user_id;
  if (raw == null) return null;
  const id = String(raw).trim();
  return id || null;
}

export async function findLedgerByPaystackReference(
  userId: string,
  reference: string
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const { data } = await admin
    .from('operational_items')
    .select('id')
    .eq('module', 'member')
    .eq('subtype', 'walletLedger')
    .eq('owner_id', userId)
    .filter('data->>paystackReference', 'eq', reference)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function readMemberSavingsBalance(
  userId: string
): Promise<number | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from('profiles')
    .select('savings_balance')
    .eq('id', userId)
    .maybeSingle();
  if (!data) return null;
  return Number(data.savings_balance ?? 0);
}

/** Credit wallet after Paystack success (service role — reliable for wired tests). */
export async function creditPaystackDeposit(opts: {
  userId: string;
  reference: string;
  amountNaira: number;
  channel?: string | null;
  paidAt?: string | null;
  user?: User;
}) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      {
        error: 'server_misconfigured',
        hint: 'Add SUPABASE_SERVICE_ROLE_KEY to .env.local for wallet crediting.',
      },
      { status: 503 }
    );
  }

  const already = await findLedgerByPaystackReference(opts.userId, opts.reference);
  if (already) {
    const balance = await readMemberSavingsBalance(opts.userId);
    return NextResponse.json({
      ok: true,
      alreadyProcessed: true,
      savings_balance: balance ?? undefined,
    });
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('branch')
    .eq('id', opts.userId)
    .maybeSingle();

  return runWalletForUser(admin, {
    userId: opts.userId,
    user: opts.user,
    branch: profile?.branch ?? null,
    kind: 'deposit',
    amount: opts.amountNaira,
    label: 'Paystack deposit',
    meta: {
      paystackReference: opts.reference,
      paystackChannel: opts.channel ?? null,
      paystackPaidAt: opts.paidAt ?? null,
    },
  });
}
