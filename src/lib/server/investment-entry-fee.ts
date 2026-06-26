import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { pickNum, pickStr } from '@/lib/pickData';
import { runWalletForUser } from '@/lib/server/member-wallet';

export type InvestmentSettings = {
  entryFee: number;
  note: string;
  updatedAt: string;
  updatedByName: string;
};

const SETTINGS_SUBTYPE = 'investmentSettings';
const ENTRY_FEE_SUBTYPE = 'investmentEntryFee';

export async function getInvestmentSettings(
  supabase: SupabaseClient
): Promise<{ rowId: string | null; settings: InvestmentSettings }> {
  const { data } = await supabase
    .from('operational_items')
    .select('id, data')
    .eq('module', 'investments')
    .eq('subtype', SETTINGS_SUBTYPE)
    .eq('is_catalog', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return {
      rowId: null,
      settings: {
        entryFee: 0,
        note: '',
        updatedAt: '',
        updatedByName: '',
      },
    };
  }

  const d = data.data as Record<string, unknown>;
  return {
    rowId: data.id as string,
    settings: {
      entryFee: pickNum(d, 'entryFee'),
      note: pickStr(d, 'note'),
      updatedAt: pickStr(d, 'updatedAt'),
      updatedByName: pickStr(d, 'updatedByName'),
    },
  };
}

export async function saveInvestmentSettings(
  supabase: SupabaseClient,
  staffUserId: string,
  staffName: string,
  entryFee: number,
  note?: string
): Promise<InvestmentSettings> {
  if (!Number.isFinite(entryFee) || entryFee < 0 || entryFee > 10_000_000) {
    throw new Error('invalid_entry_fee');
  }

  const payload = {
    entryFee: Math.round(entryFee),
    note: String(note ?? '').trim().slice(0, 240),
    updatedAt: new Date().toISOString(),
    updatedByName: staffName,
  };

  const { rowId } = await getInvestmentSettings(supabase);

  if (rowId) {
    const { data: existing } = await supabase
      .from('operational_items')
      .select('data')
      .eq('id', rowId)
      .single();
    const prev = (existing?.data as Record<string, unknown>) ?? {};
    await supabase
      .from('operational_items')
      .update({ data: { ...prev, ...payload } })
      .eq('id', rowId);
  } else {
    await supabase.from('operational_items').insert({
      module: 'investments',
      subtype: SETTINGS_SUBTYPE,
      is_catalog: true,
      owner_id: null,
      created_by: staffUserId,
      data: payload,
    });
  }

  const { settings } = await getInvestmentSettings(supabase);
  return settings;
}

export async function memberHasPaidEntryFee(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('operational_items')
    .select('id')
    .eq('module', 'investments')
    .eq('subtype', ENTRY_FEE_SUBTYPE)
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function getMemberInvestmentAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  entryFee: number;
  note: string;
  hasPaid: boolean;
  canViewOptions: boolean;
}> {
  const { settings } = await getInvestmentSettings(supabase);
  const hasPaid = await memberHasPaidEntryFee(supabase, userId);
  const entryFee = settings.entryFee;
  const canViewOptions = entryFee <= 0 || hasPaid;

  return {
    entryFee,
    note: settings.note,
    hasPaid,
    canViewOptions,
  };
}

export async function payInvestmentEntryFee(
  supabase: SupabaseClient,
  userId: string,
  profile: {
    member_code: string | null;
    full_name: string | null;
    branch: string | null;
  },
  user?: import('@supabase/supabase-js').User
): Promise<
  | NextResponse
  | { ok: true; savings_balance: number; entryFee: number; paidAt: string }
> {
  const access = await getMemberInvestmentAccess(supabase, userId);
  if (access.entryFee <= 0) {
    return NextResponse.json({ error: 'entry_fee_not_required' }, { status: 409 });
  }
  if (access.hasPaid) {
    return NextResponse.json({ error: 'entry_fee_already_paid' }, { status: 409 });
  }

  const amount = access.entryFee;
  const walletRes = await runWalletForUser(supabase, {
    userId,
    user,
    branch: profile.branch,
    kind: 'withdraw',
    amount,
    label: 'Investment programme entry fee',
    meta: { type: 'investment_entry_fee', amount },
  });

  if (walletRes.status !== 200) {
    return walletRes;
  }

  const walletBody = (await walletRes.json()) as { savings_balance: number };
  const paidAt = new Date().toISOString();
  const memberName = profile.full_name ?? 'Member';

  const { error: insErr } = await supabase.from('operational_items').insert({
    module: 'investments',
    subtype: ENTRY_FEE_SUBTYPE,
    is_catalog: false,
    owner_id: userId,
    branch: profile.branch,
    created_by: userId,
    data: {
      memberId: profile.member_code ?? '',
      memberName,
      amount,
      paidAt,
      status: 'paid',
    },
  });

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  void supabase.from('activities').insert({
    type: 'investment',
    actor_name: memberName,
    action_text: `Investment entry fee paid — ${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount)} (${profile.member_code ?? userId})`,
  });

  return {
    ok: true,
    savings_balance: walletBody.savings_balance,
    entryFee: amount,
    paidAt,
  };
}

export async function assertMemberCanApplyForInvestment(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const access = await getMemberInvestmentAccess(supabase, userId);
  if (!access.canViewOptions) {
    throw new Error('investment_entry_fee_required');
  }
}

export async function listEntryFeePayments(
  supabase: SupabaseClient
): Promise<
  {
    id: string;
    memberId: string;
    memberName: string;
    amount: number;
    paidAt: string;
  }[]
> {
  const { data } = await supabase
    .from('operational_items')
    .select('id, data, created_at')
    .eq('module', 'investments')
    .eq('subtype', ENTRY_FEE_SUBTYPE)
    .order('created_at', { ascending: false })
    .limit(100);

  return (data ?? []).map((row) => {
    const d = row.data as Record<string, unknown>;
    return {
      id: row.id as string,
      memberId: pickStr(d, 'memberId'),
      memberName: pickStr(d, 'memberName'),
      amount: pickNum(d, 'amount'),
      paidAt: pickStr(d, 'paidAt') || (row.created_at as string),
    };
  });
}
