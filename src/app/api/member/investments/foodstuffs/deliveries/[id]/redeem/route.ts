import { NextResponse } from 'next/server';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import { redeemFoodstuffsDelivery } from '@/lib/server/foodstuffs-subscription';

export async function POST(
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const params = context.params instanceof Promise ? await context.params : context.params;
  const deliveryId = decodeURIComponent(params.id ?? '');

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

  const result = await redeemFoodstuffsDelivery(ctx.supabase, ctx.user.id, deliveryId);
  if (result instanceof NextResponse) {
    return result;
  }
  return NextResponse.json(result);
}
