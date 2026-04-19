import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function runWalletForUser(
  db: SupabaseClient,
  opts: {
    userId: string;
    branch: string | null;
    label?: string;
    kind: 'deposit' | 'withdraw';
    amount: number;
    meta?: Record<string, unknown>;
  }
) {
  const { userId, branch, label, kind, amount, meta } = opts;

  const { data: row, error: readErr } = await db
    .from('profiles')
    .select('savings_balance')
    .eq('id', userId)
    .single();
  if (readErr || !row) {
    return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
  }

  const cur = Number(row.savings_balance ?? 0);
  const delta = kind === 'deposit' ? amount : -amount;
  const next = cur + delta;
  if (next < 0) {
    return NextResponse.json({ error: 'insufficient_balance' }, { status: 400 });
  }

  const { error: upErr } = await db
    .from('profiles')
    .update({ savings_balance: next })
    .eq('id', userId);
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 400 });
  }

  const { error: insErr } = await db.from('operational_items').insert({
    module: 'member',
    subtype: 'walletLedger',
    is_catalog: false,
    owner_id: userId,
    data: {
      kind,
      amount,
      balanceAfter: next,
      at: new Date().toISOString(),
      ...(label ? { label } : {}),
      ...(meta ?? {}),
    },
    branch,
    created_by: userId,
  });
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 400 });
  }

  // Log to activities feed (best-effort — never blocks the response)
  const { data: profile } = await db
    .from('profiles')
    .select('full_name, member_code')
    .eq('id', userId)
    .single();

  const actorName = (profile?.full_name as string | null) ?? 'Member';
  const memberCode = (profile?.member_code as string | null) ?? '';
  const displayLabel =
    label ?? (kind === 'deposit' ? 'Savings deposit' : 'Withdrawal');
  const amountStr = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);

  void db.from('activities').insert({
    type: kind === 'deposit' ? 'contribution' : 'withdrawal',
    actor_name: actorName,
    action_text: `${displayLabel} – ${amountStr}${memberCode ? ` (${memberCode})` : ''}`,
  });

  return NextResponse.json({ ok: true, savings_balance: next });
}
