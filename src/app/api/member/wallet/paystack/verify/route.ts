import { NextResponse } from 'next/server';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import { verifyPaystackTransaction } from '@/lib/paystack';
import {
  creditPaystackDeposit,
  paystackMetadataUserId,
} from '@/lib/server/paystack-wallet';

export async function POST(request: Request) {
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  if (ctx.kind !== 'supabase') {
    return NextResponse.json(
      {
        error: 'supabase_session_required',
        hint:
          'Sign in with demo-member@fountain.coop (password demo). Legacy FC-1001 tokens cannot verify Paystack payments.',
      },
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
    const verified = await verifyPaystackTransaction(reference);
    if (verified.status !== 'success') {
      return NextResponse.json(
        { error: 'payment_not_successful', status: verified.status },
        { status: 400 }
      );
    }

    const metaUserId = paystackMetadataUserId(
      (verified.metadata ?? null) as Record<string, unknown> | null
    );
    if (metaUserId && metaUserId !== ctx.user.id) {
      return NextResponse.json(
        {
          error: 'payment_user_mismatch',
          hint: 'This payment belongs to a different account. Sign in with the account that started checkout.',
        },
        { status: 403 }
      );
    }

    const amount = Math.round(Number(verified.amount ?? 0)) / 100;
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'invalid_verified_amount' }, { status: 400 });
    }

    return creditPaystackDeposit({
      userId: ctx.user.id,
      reference,
      amountNaira: amount,
      channel: verified.channel ?? null,
      paidAt: verified.paid_at ?? null,
      user: ctx.user,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'paystack_verify_failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
