import { NextResponse } from 'next/server';
import {
  OPENING_OWING,
  OPENING_SHEET_REF,
  OPENING_THRIFT_DUE,
  OPENING_WITHDRAWAL_DUE,
} from '@/data/legacy-recovery-opening';
import { LEGACY_RECOVERY_SUBTYPES } from '@/lib/legacy-recovery';
import { isStaffRole } from '@/lib/server/operations-constants';
import { resolveRequestAuth } from '@/lib/server/request-auth';

const LEGACY_SUBTYPES = new Set(Object.values(LEGACY_RECOVERY_SUBTYPES));

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

  const body = (await request.json().catch(() => null)) as {
    replace?: boolean;
  } | null;
  const replace = Boolean(body?.replace);

  const { data: existing, error: loadErr } = await ctx.supabase
    .from('operational_items')
    .select('id, subtype')
    .eq('module', 'recovery')
    .in('subtype', [...LEGACY_SUBTYPES]);
  if (loadErr) {
    return NextResponse.json({ error: loadErr.message }, { status: 500 });
  }

  if (existing?.length && !replace) {
    return NextResponse.json(
      {
        error: 'already_imported',
        count: existing.length,
        hint: 'Pass { "replace": true } to replace existing opening balances.',
      },
      { status: 409 }
    );
  }

  if (replace && existing?.length) {
    const { error: delErr } = await ctx.supabase
      .from('operational_items')
      .delete()
      .eq('module', 'recovery')
      .in('subtype', [...LEGACY_SUBTYPES]);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }
  }

  const importBatchId = `OPEN-${Date.now()}`;
  const { buildLegacyDebtData } = await import('@/lib/legacy-recovery');

  const batches: Array<{
    subtype: string;
    rows: typeof OPENING_OWING;
  }> = [
    { subtype: LEGACY_RECOVERY_SUBTYPES.owing, rows: OPENING_OWING },
    { subtype: LEGACY_RECOVERY_SUBTYPES.thrift, rows: OPENING_THRIFT_DUE },
    { subtype: LEGACY_RECOVERY_SUBTYPES.withdrawal, rows: OPENING_WITHDRAWAL_DUE },
  ];

  const inserts = batches.flatMap(({ subtype, rows }) =>
    rows.map((row) => ({
      module: 'recovery',
      subtype,
      data: buildLegacyDebtData({
        personName: row.personName,
        amount: row.amount,
        clearedAmount: 0,
        notes: row.notes ?? '',
        importBatchId,
        sourceSheet: OPENING_SHEET_REF,
      }),
      branch: null,
      owner_id: null,
      is_catalog: true,
      created_by: ctx.user.id,
    }))
  );

  const { data, error } = await ctx.supabase
    .from('operational_items')
    .insert(inserts)
    .select('id, subtype');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bySubtype = (data ?? []).reduce<Record<string, number>>((acc, row) => {
    const key = String(row.subtype);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    ok: true,
    importBatchId,
    sourceSheet: OPENING_SHEET_REF,
    imported: data?.length ?? inserts.length,
    bySubtype,
  });
}

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

  const { data, error } = await ctx.supabase
    .from('operational_items')
    .select('subtype')
    .eq('module', 'recovery')
    .in('subtype', [...LEGACY_SUBTYPES]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts = (data ?? []).reduce<Record<string, number>>((acc, row) => {
    const key = String(row.subtype);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    imported: (data ?? []).length > 0,
    total: data?.length ?? 0,
    counts,
    expected: {
      [LEGACY_RECOVERY_SUBTYPES.owing]: OPENING_OWING.length,
      [LEGACY_RECOVERY_SUBTYPES.thrift]: OPENING_THRIFT_DUE.length,
      [LEGACY_RECOVERY_SUBTYPES.withdrawal]: OPENING_WITHDRAWAL_DUE.length,
    },
    sourceSheet: OPENING_SHEET_REF,
  });
}
