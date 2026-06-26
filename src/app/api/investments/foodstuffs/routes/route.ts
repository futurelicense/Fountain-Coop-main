import { NextResponse } from 'next/server';
import { isStaffRole } from '@/lib/server/operations-constants';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import { createFoodstuffsRoute } from '@/lib/server/foodstuffs-ops';

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

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  try {
    return NextResponse.json(
      await createFoodstuffsRoute(ctx.supabase, ctx.user.id, body ?? {})
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'route_create_failed';
    const status = message === 'delivery_ids_required' ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
