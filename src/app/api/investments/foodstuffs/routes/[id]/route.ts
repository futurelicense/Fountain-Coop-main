import { NextResponse } from 'next/server';
import { isStaffRole } from '@/lib/server/operations-constants';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import { updateFoodstuffsRoute } from '@/lib/server/foodstuffs-ops';

async function resolveId(
  params: { id: string } | Promise<{ id: string }>
): Promise<string> {
  const r = params instanceof Promise ? await params : params;
  return decodeURIComponent(r.id ?? '');
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const id = await resolveId(context.params);
  if (!id) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

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

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  try {
    return NextResponse.json(await updateFoodstuffsRoute(ctx.supabase, id, body ?? {}));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'route_update_failed';
    const status = message === 'route_not_found' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
