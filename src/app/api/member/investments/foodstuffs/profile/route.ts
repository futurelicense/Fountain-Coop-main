import { NextResponse } from 'next/server';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import { updateFoodstuffsDeliveryProfile } from '@/lib/server/foodstuffs-subscription';

export async function PATCH(request: Request) {
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

  const body = (await request.json().catch(() => null)) as {
    dropOffLocation?: string;
    redeemContactName?: string;
    redeemContactPhone?: string;
  } | null;

  const result = await updateFoodstuffsDeliveryProfile(ctx.supabase, ctx.user.id, body ?? {});
  if (result instanceof NextResponse) {
    return result;
  }
  return NextResponse.json(result);
}
