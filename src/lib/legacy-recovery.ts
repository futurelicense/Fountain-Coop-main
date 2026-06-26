/** Pre-system legacy debt records for Recovery reconciliation. */

export const LEGACY_RECOVERY_SUBTYPES = {
  thrift: 'legacyThriftTransaction',
  withdrawal: 'legacyWithdrawalTransaction',
  owing: 'legacyOwingRecord',
} as const;

export type LegacyRecoveryKind = keyof typeof LEGACY_RECOVERY_SUBTYPES;

export type LegacyDebtStatus = 'open' | 'partial' | 'cleared';

export type LegacyDebtFields = {
  personName: string;
  amount: number;
  clearedAmount: number;
  balanceDue: number;
  branch: string;
  notes: string;
  transactionDate: string;
  status: LegacyDebtStatus;
  importBatchId: string;
  sourceSheet: string;
};

export function legacyBalanceDue(amount: number, clearedAmount: number): number {
  const amt = Math.max(0, Number(amount) || 0);
  const cleared = Math.max(0, Number(clearedAmount) || 0);
  return Math.max(0, amt - cleared);
}

export function legacyDebtStatus(
  amount: number,
  clearedAmount: number
): LegacyDebtStatus {
  const balance = legacyBalanceDue(amount, clearedAmount);
  if (balance <= 0) return 'cleared';
  const cleared = Math.max(0, Number(clearedAmount) || 0);
  if (cleared > 0) return 'partial';
  return 'open';
}

export function buildLegacyDebtData(
  input: Partial<LegacyDebtFields> & { personName: string; amount: number }
): LegacyDebtFields {
  const amount = Math.max(0, Number(input.amount) || 0);
  const clearedAmount = Math.max(0, Number(input.clearedAmount) || 0);
  return {
    personName: String(input.personName ?? '').trim(),
    amount,
    clearedAmount,
    balanceDue: legacyBalanceDue(amount, clearedAmount),
    branch: String(input.branch ?? '').trim(),
    notes: String(input.notes ?? '').trim(),
    transactionDate: String(input.transactionDate ?? '').trim(),
    status: legacyDebtStatus(amount, clearedAmount),
    importBatchId: String(input.importBatchId ?? '').trim(),
    sourceSheet: String(input.sourceSheet ?? '').trim(),
  };
}

export function mergeLegacyDebtPatch(
  current: Record<string, unknown>,
  patch: Record<string, unknown>
): LegacyDebtFields {
  const amount = pickPatchNum(patch, 'amount', pickPatchNum(current, 'amount'));
  const clearedAmount = pickPatchNum(
    patch,
    'clearedAmount',
    pickPatchNum(current, 'clearedAmount')
  );
  return buildLegacyDebtData({
    personName: pickPatchStr(patch, 'personName', pickPatchStr(current, 'personName')),
    amount,
    clearedAmount,
    branch: pickPatchStr(patch, 'branch', pickPatchStr(current, 'branch')),
    notes: pickPatchStr(patch, 'notes', pickPatchStr(current, 'notes')),
    transactionDate: pickPatchStr(
      patch,
      'transactionDate',
      pickPatchStr(current, 'transactionDate')
    ),
    importBatchId: pickPatchStr(
      patch,
      'importBatchId',
      pickPatchStr(current, 'importBatchId')
    ),
    sourceSheet: pickPatchStr(
      patch,
      'sourceSheet',
      pickPatchStr(current, 'sourceSheet')
    ),
  });
}

function pickPatchStr(
  d: Record<string, unknown>,
  key: string,
  fallback = ''
): string {
  if (!(key in d)) return fallback;
  const v = d[key];
  return typeof v === 'string' ? v : fallback;
}

function pickPatchNum(
  d: Record<string, unknown>,
  key: string,
  fallback = 0
): number {
  if (!(key in d)) return fallback;
  const v = d[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/,/g, '').trim());
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

function matchHeader(header: string, aliases: string[]): boolean {
  const h = normalizeHeader(header);
  return aliases.some((a) => h === a || h.includes(a));
}

export type ParsedLegacyRow = {
  personName: string;
  amount: number;
  clearedAmount: number;
  branch: string;
  notes: string;
  transactionDate: string;
};

/** Parse CSV text into legacy rows (flexible column names). */
export function parseLegacyDebtCsv(text: string): ParsedLegacyRow[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  const nameIdx = headers.findIndex((h) =>
    matchHeader(h, ['name', 'person', 'member', 'debtor', 'customer'])
  );
  const amountIdx = headers.findIndex(
    (h) =>
      matchHeader(h, ['amount']) &&
      !matchHeader(h, ['cleared', 'paid', 'received'])
  );
  const clearedIdx = headers.findIndex((h) =>
    matchHeader(h, [
      'cleared amount',
      'cleared',
      'amount cleared',
      'paid',
      'received',
      'payment',
    ])
  );
  const branchIdx = headers.findIndex((h) => matchHeader(h, ['branch']));
  const notesIdx = headers.findIndex((h) =>
    matchHeader(h, ['notes', 'remark', 'description', 'comment'])
  );
  const dateIdx = headers.findIndex((h) =>
    matchHeader(h, ['date', 'transaction date', 'txn date'])
  );

  if (nameIdx < 0 || amountIdx < 0) {
    throw new Error(
      'CSV must include Name and Amount columns (optional: Cleared Amount, Branch, Date, Notes).'
    );
  }

  const rows: ParsedLegacyRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const personName = (cols[nameIdx] ?? '').trim();
    if (!personName) continue;
    const amount = parseMoney(cols[amountIdx]);
    if (amount <= 0) continue;
    rows.push({
      personName,
      amount,
      clearedAmount: clearedIdx >= 0 ? parseMoney(cols[clearedIdx]) : 0,
      branch: branchIdx >= 0 ? (cols[branchIdx] ?? '').trim() : '',
      notes: notesIdx >= 0 ? (cols[notesIdx] ?? '').trim() : '',
      transactionDate: dateIdx >= 0 ? (cols[dateIdx] ?? '').trim() : '',
    });
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function parseMoney(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[₦,\s]/g, '').replace(/[^\d.-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function legacyRecoveryKindLabel(kind: LegacyRecoveryKind): string {
  switch (kind) {
    case 'thrift':
      return 'Thrift transactions';
    case 'withdrawal':
      return 'Withdrawal transactions';
    case 'owing':
      return 'People owing';
  }
}
