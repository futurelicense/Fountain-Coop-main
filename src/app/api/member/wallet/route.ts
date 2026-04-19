import { NextResponse } from 'next/server';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { runWalletForUser } from '@/lib/server/member-wallet';

/**
 * Member-only: adjust savings_balance (and optional loan_balance) safely.
 * Body: { kind: 'deposit' | 'withdraw', amount: number, label?: string }
 *
 * Requires a Supabase JWT (email / mapped member sign-in). Legacy demo tokens
 * only work if `SUPABASE_SERVICE_ROLE_KEY` is set (dev convenience).
 */
export async function POST(request: Request) {
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    kind?: string;
    amount?: number;
    label?: string | null;
  } | null;
  const kind = body?.kind === 'withdraw' ? 'withdraw' : 'deposit';
  const amount = Number(body?.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 50_000_000) {
    return NextResponse.json({ error: 'invalid_amount' }, { status: 400 });
  }

  const labelRaw = body?.label;
  const label =
    typeof labelRaw === 'string' && labelRaw.trim()
      ? labelRaw.trim().slice(0, 120)
      : undefined;

  if (ctx.kind === 'supabase') {
    const role = ctx.profile?.role ?? 'member';
    if (role !== 'member') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return runWalletForUser(ctx.supabase, {
      userId: ctx.user.id,
      branch: ctx.profile?.branch ?? null,
      label,
      kind,
      amount,
    });
  }

  if (ctx.kind === 'legacy') {
    if (ctx.auth.role !== 'member' || !ctx.auth.memberId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        {
          error: 'supabase_session_required',
          hint:
            'Sign in with your demo email (demo-member@fountain.coop) or member ID FC-1001 / matching phone so the app uses Supabase. Legacy-only tokens need SUPABASE_SERVICE_ROLE_KEY on the server for wallet calls.',
        },
        { status: 503 }
      );
    }
    const { data: profile, error: pErr } = await admin
      .from('profiles')
      .select('id, savings_balance, branch')
      .eq('member_code', ctx.auth.memberId)
      .maybeSingle();
    if (pErr || !profile?.id) {
      return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
    }
    return runWalletForUser(admin, {
      userId: profile.id,
      branch: profile.branch ?? null,
      label,
      kind,
      amount,
    });
  }

  return NextResponse.json(
    { error: 'supabase_session_required' },
    { status: 503 }
  );
}

