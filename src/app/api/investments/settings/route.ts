import { NextResponse } from 'next/server';
import { isStaffRole } from '@/lib/server/operations-constants';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import {
  getInvestmentSettings,
  listEntryFeePayments,
  saveInvestmentSettings,
} from '@/lib/server/investment-entry-fee';

export async function GET(request: Request) {
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  if (ctx.kind !== 'supabase') {
    return NextResponse.json({ error: 'supabase_session_required' }, { status: 503 });
  }
  if (!isStaffRole(ctx.profile?.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const { settings } = await getInvestmentSettings(ctx.supabase);
    const payments = await listEntryFeePayments(ctx.supabase);
    return NextResponse.json({ settings, payments });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'settings_load_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  if (ctx.kind !== 'supabase') {
    return NextResponse.json({ error: 'supabase_session_required' }, { status: 503 });
  }
  if (!isStaffRole(ctx.profile?.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    entryFee?: number;
    note?: string;
  } | null;

  const staffName =
    ctx.profile?.full_name ??
    ctx.user.user_metadata?.full_name ??
    ctx.user.email?.split('@')[0] ??
    'Admin';

  try {
    const settings = await saveInvestmentSettings(
      ctx.supabase,
      ctx.user.id,
      staffName,
      Number(body?.entryFee ?? 0),
      body?.note
    );
    return NextResponse.json({ settings });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'save_failed';
    const status = msg === 'invalid_entry_fee' ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
