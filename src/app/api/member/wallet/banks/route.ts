import { NextResponse } from 'next/server';
import { isPaystackConfigured, listPaystackBanks } from '@/lib/paystack';
import { resolveRequestAuth } from '@/lib/server/request-auth';

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
  if (!isPaystackConfigured()) {
    return NextResponse.json(
      {
        error: 'paystack_not_configured',
        hint: 'Add PAYSTACK_SECRET_KEY to resolve bank accounts.',
      },
      { status: 503 }
    );
  }

  try {
    const banks = await listPaystackBanks();
    return NextResponse.json({ ok: true, banks });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'banks_fetch_failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
