import { NextResponse } from 'next/server';
import { isStaffRole } from '@/lib/server/operations-constants';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import { runFoodstuffsAutoDebit } from '@/lib/server/foodstuffs-ops';

export async function POST(request: Request) {
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
    return NextResponse.json(await runFoodstuffsAutoDebit(ctx.supabase));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'auto_debit_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
