import { NextResponse } from 'next/server';
import { isStaffRole } from '@/lib/server/operations-constants';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import {
  getFoodstuffsOpsSummary,
  saveFoodstuffsOpsSettings,
} from '@/lib/server/foodstuffs-ops';

export async function GET(request: Request) {
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
    return NextResponse.json(await getFoodstuffsOpsSummary(ctx.supabase));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'foodstuffs_ops_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
  const staffName =
    ctx.profile?.full_name ??
    ctx.user.user_metadata?.full_name ??
    ctx.user.email?.split('@')[0] ??
    'Admin';

  try {
    const settings = await saveFoodstuffsOpsSettings(
      ctx.supabase,
      ctx.user.id,
      staffName,
      body ?? {}
    );
    return NextResponse.json({ settings });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'settings_save_failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
