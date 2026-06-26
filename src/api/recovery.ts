import { apiFetch } from './client';
import type { LegacyRecoveryKind } from '@/lib/legacy-recovery';

export type LegacyImportRow = {
  personName: string;
  amount: number;
  clearedAmount?: number;
  branch?: string;
  notes?: string;
  transactionDate?: string;
};

export async function importLegacyRecoveryRows(input: {
  kind: LegacyRecoveryKind;
  rows: LegacyImportRow[];
  sourceSheet?: string;
}): Promise<{ ok: true; importBatchId: string; imported: number }> {
  return apiFetch('/api/admin/recovery/import', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export type LegacyOpeningStatus = {
  imported: boolean;
  total: number;
  counts: Record<string, number>;
  expected: Record<string, number>;
  sourceSheet: string;
};

export async function fetchLegacyOpeningStatus(): Promise<LegacyOpeningStatus> {
  return apiFetch('/api/admin/recovery/opening');
}

export async function seedLegacyOpeningBalances(input?: {
  replace?: boolean;
}): Promise<{
  ok: true;
  importBatchId: string;
  imported: number;
  bySubtype: Record<string, number>;
  sourceSheet: string;
}> {
  return apiFetch('/api/admin/recovery/opening', {
    method: 'POST',
    body: JSON.stringify(input ?? {}),
  });
}
