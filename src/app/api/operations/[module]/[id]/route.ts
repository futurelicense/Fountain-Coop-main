import { NextResponse } from 'next/server';
import { isAllowedOperationsModule } from '@/lib/server/operations-constants';
import { resolveRequestAuth } from '@/lib/server/request-auth';

async function resolveModuleId(
  params:
    | { module: string; id: string }
    | Promise<{ module: string; id: string }>
): Promise<{ module: string; id: string }> {
  const r = params instanceof Promise ? await params : params;
  return {
    module: decodeURIComponent(r.module ?? ''),
    id: decodeURIComponent(r.id ?? ''),
  };
}

export async function PATCH(
  request: Request,
  context: {
    params: { module: string; id: string } | Promise<{ module: string; id: string }>;
  }
) {
  const { module, id } = await resolveModuleId(context.params);
  if (!isAllowedOperationsModule(module) || !id) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
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
    data?: Record<string, unknown>;
  } | null;
  const patch = body?.data;
  if (!patch || typeof patch !== 'object') {
    return NextResponse.json({ error: 'data_required' }, { status: 400 });
  }

  const { data: existing, error: loadErr } = await ctx.supabase
    .from('operational_items')
    .select('id, module, data')
    .eq('id', id)
    .eq('module', module)
    .maybeSingle();
  if (loadErr || !existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const prev =
    existing.data && typeof existing.data === 'object'
      ? (existing.data as Record<string, unknown>)
      : {};
  const merged = { ...prev, ...patch };

  const { data: updated, error } = await ctx.supabase
    .from('operational_items')
    .update({ data: merged })
    .eq('id', id)
    .eq('module', module)
    .select('*')
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  context: {
    params: { module: string; id: string } | Promise<{ module: string; id: string }>;
  }
) {
  const { module, id } = await resolveModuleId(context.params);
  if (!isAllowedOperationsModule(module) || !id) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
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

  const { error } = await ctx.supabase
    .from('operational_items')
    .delete()
    .eq('id', id)
    .eq('module', module);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
