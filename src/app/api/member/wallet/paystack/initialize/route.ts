import { NextResponse } from 'next/server';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import { initializePaystackTransaction, isPaystackConfigured } from '@/lib/paystack';

function getOrigin(request: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, '');
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  const host = request.headers.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

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
  if (!isPaystackConfigured()) {
    return NextResponse.json(
      { error: 'paystack_not_configured' },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    amount?: number;
  } | null;
  const amount = Number(body?.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 50_000_000) {
    return NextResponse.json({ error: 'invalid_amount' }, { status: 400 });
  }

  const email = ctx.user.email?.trim();
  if (!email) {
    return NextResponse.json({ error: 'member_email_required' }, { status: 400 });
  }
  const amountKobo = Math.round(amount * 100);
  const reference = `fc_${ctx.user.id.replace(/-/g, '').slice(0, 10)}_${Date.now()}`;
  const callbackUrl = `${getOrigin(request)}/member/savings`;

  try {
    const data = await initializePaystackTransaction({
      email,
      amountKobo,
      reference,
      callbackUrl,
      metadata: {
        userId: ctx.user.id,
        purpose: 'member_wallet_deposit',
      },
    });
    return NextResponse.json({
      ok: true,
      authorization_url: data.authorization_url,
      reference: data.reference,
      access_code: data.access_code,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'paystack_initialize_failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
