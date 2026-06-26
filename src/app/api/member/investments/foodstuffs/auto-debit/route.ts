import { NextResponse } from 'next/server';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import { loadMemberFoodstuffsSubscription } from '@/lib/server/foodstuffs-subscription';

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
    enabled?: boolean;
  } | null;
  if (typeof body?.enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled_required' }, { status: 400 });
  }

  const sub = await loadMemberFoodstuffsSubscription(ctx.supabase, ctx.user.id);
  if (!sub) {
    return NextResponse.json({ error: 'no_active_subscription' }, { status: 404 });
  }

  const next = {
    ...sub.data,
    autoDebitEnabled: body.enabled,
    autoDebitUpdatedAt: new Date().toISOString(),
  };

  const { error } = await ctx.supabase
    .from('operational_items')
    .update({ data: next })
    .eq('id', sub.id)
    .eq('owner_id', ctx.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, autoDebitEnabled: body.enabled });
}
