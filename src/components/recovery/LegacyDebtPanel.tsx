'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  UploadIcon,
  DatabaseIcon,
  SearchIcon,
  Loader2Icon,
  PencilIcon,
  Trash2,
  PlusIcon,
  CheckIcon,
  XIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import {
  importLegacyRecoveryRows,
  seedLegacyOpeningBalances,
  fetchLegacyOpeningStatus,
} from '@/api/recovery';
import {
  LEGACY_RECOVERY_SUBTYPES,
  buildLegacyDebtData,
  legacyRecoveryKindLabel,
  parseLegacyDebtCsv,
  type LegacyDebtStatus,
  type LegacyRecoveryKind,
} from '@/lib/legacy-recovery';
import { pickNum, pickStr } from '@/lib/pickData';
import type { OperationalItem } from '@/api/types';

const TABS: { id: LegacyRecoveryKind; subtype: string }[] = [
  { id: 'owing', subtype: LEGACY_RECOVERY_SUBTYPES.owing },
  { id: 'thrift', subtype: LEGACY_RECOVERY_SUBTYPES.thrift },
  { id: 'withdrawal', subtype: LEGACY_RECOVERY_SUBTYPES.withdrawal },
];

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusBadge(status: string) {
  const s = status as LegacyDebtStatus;
  switch (s) {
    case 'cleared':
      return <Badge variant="success" size="sm">Cleared</Badge>;
    case 'partial':
      return <Badge variant="warning" size="sm">Partial</Badge>;
    default:
      return <Badge variant="danger" size="sm">Open</Badge>;
  }
}

export function LegacyDebtPanel() {
  const owing = useOperationalRecords('recovery', LEGACY_RECOVERY_SUBTYPES.owing);
  const thrift = useOperationalRecords('recovery', LEGACY_RECOVERY_SUBTYPES.thrift);
  const withdrawal = useOperationalRecords(
    'recovery',
    LEGACY_RECOVERY_SUBTYPES.withdrawal
  );

  const [tab, setTab] = useState<LegacyRecoveryKind>('owing');
  const [search, setSearch] = useState('');
  const [openingStatus, setOpeningStatus] = useState<{
    imported: boolean;
    total: number;
  } | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCleared, setEditCleared] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const activeHook = tab === 'owing' ? owing : tab === 'thrift' ? thrift : withdrawal;

  const refreshOpeningStatus = useCallback(async () => {
    try {
      const status = await fetchLegacyOpeningStatus();
      setOpeningStatus({ imported: status.imported, total: status.total });
    } catch {
      setOpeningStatus(null);
    }
  }, []);

  useEffect(() => {
    void refreshOpeningStatus();
  }, [refreshOpeningStatus, owing.items.length, thrift.items.length, withdrawal.items.length]);

  const allLegacy = useMemo(
    () => [...owing.items, ...thrift.items, ...withdrawal.items],
    [owing.items, thrift.items, withdrawal.items]
  );

  const totals = useMemo(() => {
    const sum = (rows: OperationalItem[]) =>
      rows.reduce(
        (acc, r) => {
          const d = r.data;
          acc.amount += pickNum(d, 'amount');
          acc.cleared += pickNum(d, 'clearedAmount');
          acc.balance += pickNum(d, 'balanceDue');
          return acc;
        },
        { amount: 0, cleared: 0, balance: 0 }
      );
    return {
      owing: sum(owing.items),
      thrift: sum(thrift.items),
      withdrawal: sum(withdrawal.items),
      all: sum(allLegacy),
    };
  }, [owing.items, thrift.items, withdrawal.items, allLegacy]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeHook.items;
    return activeHook.items.filter((r) =>
      pickStr(r.data, 'personName').toLowerCase().includes(q)
    );
  }, [activeHook.items, search]);

  const tabTotals = totals[tab];

  const loadOpeningSheet = async (replace = false) => {
    setSeeding(true);
    setPanelError(null);
    try {
      const result = await seedLegacyOpeningBalances({ replace });
      await Promise.all([owing.reload(), thrift.reload(), withdrawal.reload()]);
      await refreshOpeningStatus();
      setPanelError(null);
      alert(
        `Imported ${result.imported} records from ${result.sourceSheet} (batch ${result.importBatchId}).`
      );
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setSeeding(false);
    }
  };

  const handleCsvUpload = async (file: File) => {
    setImporting(true);
    setPanelError(null);
    try {
      const text = await file.text();
      const rows = parseLegacyDebtCsv(text);
      if (!rows.length) {
        throw new Error('No valid rows found in CSV.');
      }
      await importLegacyRecoveryRows({
        kind: tab,
        rows,
        sourceSheet: file.name,
      });
      await activeHook.reload();
      await refreshOpeningStatus();
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : 'CSV import failed');
    } finally {
      setImporting(false);
    }
  };

  const startEdit = (row: OperationalItem) => {
    setEditingId(row.id);
    setEditCleared(String(pickNum(row.data, 'clearedAmount')));
    setEditNotes(pickStr(row.data, 'notes'));
  };

  const saveEdit = async (row: OperationalItem) => {
    const amount = pickNum(row.data, 'amount');
    const cleared = Number(editCleared.replace(/,/g, '')) || 0;
    if (cleared > amount) {
      setPanelError('Cleared amount cannot exceed original amount.');
      return;
    }
    const ok = await activeHook.patchRow(row.id, {
      clearedAmount: cleared,
      notes: editNotes.trim(),
    });
    if (ok) {
      setEditingId(null);
      setPanelError(null);
    }
  };

  const addManualRow = async () => {
    const name = window.prompt('Person name');
    if (!name?.trim()) return;
    const amountRaw = window.prompt('Amount owing (NGN)');
    const amount = Number(amountRaw?.replace(/,/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) return;
    await activeHook.createRow(
      LEGACY_RECOVERY_SUBTYPES[tab],
      buildLegacyDebtData({
        personName: name.trim(),
        amount,
        clearedAmount: 0,
        notes: '',
        branch: '',
        transactionDate: '',
        importBatchId: `MAN-${Date.now()}`,
        sourceSheet: 'Manual entry',
      }) as unknown as Record<string, unknown>,
      { is_catalog: true, owner_id: null }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-fountain-gray-900">
            Pre-system legacy debt
          </h3>
          <p className="text-sm text-fountain-gray-600 mt-1 max-w-2xl">
            Opening balances extracted from PDF{' '}
            <span className="font-mono text-xs">DOC-20260519-WA0006</span>. Track
            original amount, cleared payments, and balance due.
          </p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            <a
              href="/legacy-recovery/csv/people-owing.csv"
              download
              className="text-fountain-blue hover:underline"
            >
              Download people owing CSV
            </a>
            <a
              href="/legacy-recovery/csv/thrift-transactions-due.csv"
              download
              className="text-fountain-blue hover:underline"
            >
              Download thrift due CSV
            </a>
            <a
              href="/legacy-recovery/csv/withdrawal-transactions-due.csv"
              download
              className="text-fountain-blue hover:underline"
            >
              Download withdrawal due CSV
            </a>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            disabled={seeding}
            onClick={() =>
              void loadOpeningSheet(openingStatus?.imported ?? false)
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {seeding ? (
              <Loader2Icon className="w-4 h-4 animate-spin" />
            ) : (
              <DatabaseIcon className="w-4 h-4" />
            )}
            {openingStatus?.imported ? 'Re-import sheet' : 'Load opening sheet'}
          </button>
          <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-fountain-gray-300 rounded-lg text-sm font-medium text-fountain-gray-700 hover:bg-fountain-gray-50 cursor-pointer">
            {importing ? (
              <Loader2Icon className="w-4 h-4 animate-spin" />
            ) : (
              <UploadIcon className="w-4 h-4" />
            )}
            Upload CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={importing}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleCsvUpload(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </div>

      {panelError ? (
        <p className="text-sm text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-4 py-3">
          {panelError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-fountain-red/5 border border-fountain-red/15 rounded-xl p-4">
          <p className="text-xs text-fountain-gray-500 uppercase tracking-wide">
            Total outstanding (all)
          </p>
          <p className="text-xl font-bold text-fountain-gray-900 mt-1">
            {formatNaira(totals.all.balance)}
          </p>
          <p className="text-xs text-fountain-gray-500 mt-1">
            of {formatNaira(totals.all.amount)} original
          </p>
        </div>
        <div className="bg-fountain-green/5 border border-fountain-green/15 rounded-xl p-4">
          <p className="text-xs text-fountain-gray-500 uppercase tracking-wide">
            Total cleared
          </p>
          <p className="text-xl font-bold text-fountain-green mt-1">
            {formatNaira(totals.all.cleared)}
          </p>
        </div>
        <div className="bg-fountain-blue/5 border border-fountain-blue/15 rounded-xl p-4">
          <p className="text-xs text-fountain-gray-500 uppercase tracking-wide">
            Records loaded
          </p>
          <p className="text-xl font-bold text-fountain-gray-900 mt-1">
            {allLegacy.length}
          </p>
          {openingStatus?.imported ? (
            <p className="text-xs text-fountain-gray-500 mt-1">Opening sheet in DB</p>
          ) : (
            <p className="text-xs text-fountain-amber mt-1">Not imported yet</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-fountain-gray-200 pb-2">
        {TABS.map(({ id }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setSearch('');
              setEditingId(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-fountain-blue text-white'
                : 'text-fountain-gray-600 hover:bg-fountain-gray-100'
            }`}
          >
            {legacyRecoveryKindLabel(id)}
            <span className="ml-2 opacity-80">
              ({id === 'owing' ? owing.items.length : id === 'thrift' ? thrift.items.length : withdrawal.items.length})
            </span>
          </button>
        ))}
      </div>

      <Card
        title={`${legacyRecoveryKindLabel(tab)} — reconciliation`}
        headerAction={
          <button
            type="button"
            disabled={activeHook.loading}
            onClick={() => void addManualRow()}
            className="inline-flex items-center gap-1 text-xs font-medium text-fountain-blue hover:text-fountain-dark"
          >
            <PlusIcon className="w-3.5 h-3.5" /> Add row
          </button>
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              Original:{' '}
              <strong className="text-fountain-gray-900">
                {formatNaira(tabTotals.amount)}
              </strong>
            </span>
            <span>
              Cleared:{' '}
              <strong className="text-fountain-green">
                {formatNaira(tabTotals.cleared)}
              </strong>
            </span>
            <span>
              Balance:{' '}
              <strong className="text-fountain-red">
                {formatNaira(tabTotals.balance)}
              </strong>
            </span>
          </div>
          <div className="relative max-w-xs w-full">
            <SearchIcon className="w-4 h-4 text-fountain-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name…"
              className="pl-9 pr-3 py-2 w-full border border-fountain-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-y border-fountain-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium w-10">#</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-right">Cleared</th>
                <th className="px-4 py-3 font-medium text-right">Balance</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fountain-gray-100">
              {filteredItems.map((row, idx) => {
                const d = row.data;
                const isEditing = editingId === row.id;
                return (
                  <tr key={row.id} className="hover:bg-fountain-gray-50">
                    <td className="px-4 py-3 text-fountain-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-fountain-gray-900">
                      {pickStr(d, 'personName')}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatNaira(pickNum(d, 'amount'))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          max={pickNum(d, 'amount')}
                          value={editCleared}
                          onChange={(e) => setEditCleared(e.target.value)}
                          className="w-28 px-2 py-1 border border-fountain-blue rounded text-right text-sm"
                        />
                      ) : (
                        <span className="text-fountain-green font-medium">
                          {formatNaira(pickNum(d, 'clearedAmount'))}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-fountain-red">
                      {formatNaira(pickNum(d, 'balanceDue'))}
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(pickStr(d, 'status', 'open'))}
                    </td>
                    <td className="px-4 py-3 text-fountain-gray-600 max-w-[160px]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full px-2 py-1 border border-fountain-gray-200 rounded text-xs"
                        />
                      ) : (
                        <span className="text-xs line-clamp-2">
                          {pickStr(d, 'notes') || '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <div className="flex justify-center gap-1">
                          <button
                            type="button"
                            title="Save"
                            onClick={() => void saveEdit(row)}
                            className="p-1.5 text-fountain-green hover:bg-fountain-green/10 rounded"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Cancel"
                            onClick={() => setEditingId(null)}
                            className="p-1.5 text-fountain-gray-400 hover:bg-fountain-gray-100 rounded"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-1">
                          <button
                            type="button"
                            title="Record payment / reconcile"
                            onClick={() => startEdit(row)}
                            className="p-1.5 text-fountain-blue hover:bg-fountain-blue/10 rounded"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => void activeHook.removeRow(row.id)}
                            className="p-1.5 text-fountain-gray-400 hover:text-fountain-red rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!activeHook.loading && !filteredItems.length ? (
            <p className="text-sm text-fountain-gray-500 p-6 text-center">
              No records in this tab. Load the opening sheet or upload a CSV with Name,
              Amount, and Cleared Amount columns.
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
