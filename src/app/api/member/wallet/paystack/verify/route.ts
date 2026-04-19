import { NextResponse } from 'next/server';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import { verifyPaystackTransaction } from '@/lib/paystack';
import { runWalletForUser } from '@/lib/server/member-wallet';

export async function POST(request: Request) {
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  if (ctx.kind !== 'supabase') {
    return NextResponse.json(
      { error: 'supabase_session_required' },
      { status: 503 }
    );
  }
  const role = ctx.profile?.role ?? 'member';
  if (role !== 'member') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    reference?: string;
  } | null;
  const reference = String(body?.reference ?? '').trim();
  if (!reference) {
    return NextResponse.json({ error: 'reference_required' }, { status: 400 });
  }

  try {
    const existing = await ctx.supabase
      .from('operational_items')
      .select('id')
      .eq('module', 'member')
      .eq('subtype', 'walletLedger')
      .eq('owner_id', ctx.user.id)
      .contains('data', { paystackReference: reference })
      .maybeSingle();
    if (existing.data?.id) {
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }

    const verified = await verifyPaystackTransaction(reference);
    if (verified.status !== 'success') {
      return NextResponse.json(
        { error: 'payment_not_successful', status: verified.status },
        { status: 400 }
      );
    }
    const amount = Math.round(Number(verified.amount ?? 0)) / 100;
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'invalid_verified_amount' }, { status: 400 });
    }

    return runWalletForUser(ctx.supabase, {
      userId: ctx.user.id,
      branch: ctx.profile?.branch ?? null,
      kind: 'deposit',
      amount,
      label: 'Paystack deposit',
      meta: {
        paystackReference: reference,
        paystackChannel: verified.channel ?? null,
        paystackPaidAt: verified.paid_at ?? null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'paystack_verify_failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
