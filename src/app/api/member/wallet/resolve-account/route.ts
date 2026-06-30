import { NextResponse } from 'next/server';
import { isPaystackConfigured, resolvePaystackBankAccount } from '@/lib/paystack';
import { resolveRequestAuth } from '@/lib/server/request-auth';

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
  if (!isPaystackConfigured()) {
    return NextResponse.json(
      {
        error: 'paystack_not_configured',
        hint: 'Add PAYSTACK_SECRET_KEY to resolve bank accounts.',
      },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    account_number?: string;
    bank_code?: string;
  } | null;

  const accountNumber = String(body?.account_number ?? '').trim();
  const bankCode = String(body?.bank_code ?? '').trim();

  try {
    const resolved = await resolvePaystackBankAccount({
      accountNumber,
      bankCode,
    });
    return NextResponse.json({ ok: true, ...resolved });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'account_resolve_failed';
    const status =
      message === 'invalid_account_number' || message === 'bank_required'
        ? 400
        : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
