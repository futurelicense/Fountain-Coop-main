import { NextResponse } from 'next/server';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import {
  getMemberInvestmentAccess,
  payInvestmentEntryFee,
} from '@/lib/server/investment-entry-fee';

export async function GET(request: Request) {
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  if (ctx.kind !== 'supabase') {
    return NextResponse.json({ error: 'supabase_session_required' }, { status: 503 });
  }
  if ((ctx.profile?.role ?? 'member') !== 'member') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const access = await getMemberInvestmentAccess(ctx.supabase, ctx.user.id);
    return NextResponse.json({
      ...access,
      savings_balance: ctx.profile?.savings_balance ?? 0,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'access_check_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  if (ctx.kind !== 'supabase') {
    return NextResponse.json({ error: 'supabase_session_required' }, { status: 503 });
  }
  if ((ctx.profile?.role ?? 'member') !== 'member') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const result = await payInvestmentEntryFee(
    ctx.supabase,
    ctx.user.id,
    {
      member_code: ctx.profile?.member_code ?? null,
      full_name: ctx.profile?.full_name ?? null,
      branch: ctx.profile?.branch ?? null,
    },
    ctx.user
  );

  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json(result);
}
