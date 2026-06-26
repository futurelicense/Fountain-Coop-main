import { NextResponse } from 'next/server';
import {
  buildLegacyDebtData,
  LEGACY_RECOVERY_SUBTYPES,
  type LegacyRecoveryKind,
} from '@/lib/legacy-recovery';
import { isStaffRole } from '@/lib/server/operations-constants';
import { resolveRequestAuth } from '@/lib/server/request-auth';

const VALID_KINDS = new Set<string>(Object.keys(LEGACY_RECOVERY_SUBTYPES));

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
    kind?: LegacyRecoveryKind;
    rows?: Array<{
      personName?: string;
      amount?: number;
      clearedAmount?: number;
      branch?: string;
      notes?: string;
      transactionDate?: string;
    }>;
    sourceSheet?: string;
  } | null;

  const kind = body?.kind;
  if (!kind || !VALID_KINDS.has(kind)) {
    return NextResponse.json({ error: 'invalid_kind' }, { status: 400 });
  }

  const rows = body?.rows ?? [];
  if (!rows.length) {
    return NextResponse.json({ error: 'rows_required' }, { status: 400 });
  }
  if (rows.length > 2000) {
    return NextResponse.json({ error: 'too_many_rows' }, { status: 400 });
  }

  const subtype = LEGACY_RECOVERY_SUBTYPES[kind];
  const importBatchId = `IMP-${Date.now()}`;
  const sourceSheet = String(body?.sourceSheet ?? '').trim();

  const inserts = rows
    .map((row) => {
      const personName = String(row.personName ?? '').trim();
      const amount = Number(row.amount ?? 0);
      if (!personName || !Number.isFinite(amount) || amount <= 0) return null;
      return {
        module: 'recovery',
        subtype,
        data: buildLegacyDebtData({
          personName,
          amount,
          clearedAmount: Number(row.clearedAmount ?? 0),
          branch: String(row.branch ?? '').trim(),
          notes: String(row.notes ?? '').trim(),
          transactionDate: String(row.transactionDate ?? '').trim(),
          importBatchId,
          sourceSheet,
        }),
        branch: String(row.branch ?? '').trim() || null,
        owner_id: null,
        is_catalog: true,
        created_by: ctx.user.id,
      };
    })
    .filter(Boolean);

  if (!inserts.length) {
    return NextResponse.json({ error: 'no_valid_rows' }, { status: 400 });
  }

  const { data, error } = await ctx.supabase
    .from('operational_items')
    .insert(inserts)
    .select('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    importBatchId,
    imported: data?.length ?? inserts.length,
    kind,
    subtype,
  });
}
