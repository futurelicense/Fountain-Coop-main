import { NextResponse } from 'next/server';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import { getMemberLoanEligibility } from '@/lib/server/loan-eligibility-server';

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
    const result = await getMemberLoanEligibility(ctx.supabase, ctx.user.id);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'eligibility_error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
