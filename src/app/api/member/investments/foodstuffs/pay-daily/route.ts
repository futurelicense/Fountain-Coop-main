import { NextResponse } from 'next/server';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import {
  payFoodstuffsDailyContribution,
  processMissedFoodstuffsDeliveries,
} from '@/lib/server/foodstuffs-subscription';

export async function POST(request: Request) {
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  if (ctx.kind !== 'supabase') {
    return NextResponse.json({ error: 'supabase_session_required' }, { status: 503 });
  }

  const role = ctx.profile?.role ?? 'member';
  if (role !== 'member') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const result = await payFoodstuffsDailyContribution(ctx.supabase, {
    userId: ctx.user.id,
    user: ctx.user,
    branch: ctx.profile?.branch ?? null,
  });

  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json(result);
}

/** Check overdue deliveries and apply penalties when member opens investments. */
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

  const sync = await processMissedFoodstuffsDeliveries(
    ctx.supabase,
    ctx.user.id,
    ctx.user
  );
  return NextResponse.json({ ok: true, ...sync });
}
