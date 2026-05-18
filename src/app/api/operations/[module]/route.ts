import { NextResponse } from 'next/server';
import {
  isAllowedOperationsModule,
  isStaffRole,
} from '@/lib/server/operations-constants';
import { resolveRequestAuth } from '@/lib/server/request-auth';

async function resolveModuleParam(
  params: { module: string } | Promise<{ module: string }>
): Promise<string> {
  const resolved = params instanceof Promise ? await params : params;
  return decodeURIComponent(resolved.module ?? '');
}

export async function GET(
  request: Request,
  context: { params: { module: string } | Promise<{ module: string }> }
) {
  const module = await resolveModuleParam(context.params);
  if (!isAllowedOperationsModule(module)) {
    return NextResponse.json({ error: 'invalid_module' }, { status: 400 });
  }
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  if (ctx.kind !== 'supabase') {
    return NextResponse.json([]);
  }
  const { searchParams } = new URL(request.url);
  const subtype = searchParams.get('subtype')?.trim();

  const role = ctx.profile?.role ?? 'member';
  let q = ctx.supabase
    .from('operational_items')
    .select('*')
    .eq('module', module)
    .order('created_at', { ascending: false });
  if (subtype) {
    q = q.eq('subtype', subtype);
  }
  if (role === 'member') {
    q = q.eq('owner_id', ctx.user.id);
  }
  const { data, error } = await q;
  if (error) {
    const hint = /infinite recursion/i.test(error.message)
      ? 'Run supabase/migrations/009_fix_rls_recursion.sql in Supabase SQL Editor.'
      : /operational_items|relation.*does not exist/i.test(error.message)
        ? 'Run supabase/migrations/003_operational_items.sql in Supabase SQL Editor.'
        : /profiles|policy/i.test(error.message)
          ? 'Ensure your member profile exists (sign in as demo-member@fountain.coop) or run migration 007_backfill_profiles.sql.'
          : undefined;
    return NextResponse.json(
      { error: error.message, ...(hint ? { hint } : {}) },
      { status: 500 }
    );
  }
  return NextResponse.json(data ?? []);
}

export async function POST(
  request: Request,
  context: { params: { module: string } | Promise<{ module: string }> }
) {
  const module = await resolveModuleParam(context.params);
  if (!isAllowedOperationsModule(module)) {
    return NextResponse.json({ error: 'invalid_module' }, { status: 400 });
  }
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  if (ctx.kind !== 'supabase') {
    return NextResponse.json(
      { error: 'supabase_session_required' },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    subtype?: string;
    data?: Record<string, unknown>;
    is_catalog?: boolean;
    owner_id?: string | null;
    branch?: string | null;
  } | null;
  const subtype = String(body?.subtype ?? '').trim();
  if (!subtype) {
    return NextResponse.json({ error: 'subtype_required' }, { status: 400 });
  }
  const data = body?.data ?? {};
  const role = ctx.profile?.role ?? 'member';
  const isStaff = isStaffRole(role);

  const isCatalog = Boolean(body?.is_catalog) && isStaff;
  let ownerId: string | null = null;
  if (isStaff) {
    ownerId =
      body?.owner_id === undefined || body?.owner_id === null
        ? null
        : String(body.owner_id);
  } else {
    ownerId = ctx.user.id;
  }

  const row = {
    module,
    subtype,
    is_catalog: isCatalog,
    owner_id: ownerId,
    data,
    branch: body?.branch ?? ctx.profile?.branch ?? null,
    created_by: ctx.user.id,
  };

  const { data: inserted, error } = await ctx.supabase
    .from('operational_items')
    .insert(row)
    .select('*')
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(inserted);
}
