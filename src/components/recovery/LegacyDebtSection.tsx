'use client';

import { useMemo, useRef, useState } from 'react';
import {
  UploadIcon,
  PlusIcon,
  Trash2,
  PencilIcon,
  Loader2Icon,
  FileSpreadsheetIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { importLegacyRecoveryRows } from '@/api/recovery';
import { pickNum, pickStr } from '@/lib/pickData';
import {
  LEGACY_RECOVERY_SUBTYPES,
  buildLegacyDebtData,
  legacyRecoveryKindLabel,
  mergeLegacyDebtPatch,
  parseLegacyDebtCsv,
  type LegacyRecoveryKind,
} from '@/lib/legacy-recovery';

const TABS: LegacyRecoveryKind[] = ['thrift', 'withdrawal', 'owing'];

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusBadge(status: string) {
  switch (status) {
    case 'cleared':
      return <Badge variant="success" size="sm">Cleared</Badge>;
    case 'partial':
      return <Badge variant="warning" size="sm">Partial</Badge>;
    default:
      return <Badge variant="danger" size="sm">Open</Badge>;
  }
}

export function LegacyDebtSection() {
  const [tab, setTab] = useState<LegacyRecoveryKind>('thrift');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<{
    id: string;
    data: Record<string, unknown>;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const thrift = useOperationalRecords('recovery', LEGACY_RECOVERY_SUBTYPES.thrift);
  const withdrawal = useOperationalRecords(
    'recovery',
    LEGACY_RECOVERY_SUBTYPES.withdrawal
  );
  const owing = useOperationalRecords('recovery', LEGACY_RECOVERY_SUBTYPES.owing);

  const active =
    tab === 'thrift' ? thrift : tab === 'withdrawal' ? withdrawal : owing;

  const totals = useMemo(() => {
    let amount = 0;
    let cleared = 0;
    let balance = 0;
    for (const row of active.items) {
      amount += pickNum(row.data, 'amount');
      cleared += pickNum(row.data, 'clearedAmount');
      balance += pickNum(row.data, 'balanceDue');
    }
    return { amount, cleared, balance, count: active.items.length };
  }, [active.items]);

  const handleImportFile = async (file: File) => {
    setImporting(true);
    setImportMsg(null);
    try {
      const text = await file.text();
      const rows = parseLegacyDebtCsv(text);
      if (!rows.length) {
        setImportMsg('No valid rows found. Need Name + Amount columns.');
        return;
      }
      const result = await importLegacyRecoveryRows({
        kind: tab,
        rows,
        sourceSheet: file.name,
      });
      await active.reload();
      setImportMsg(
        `Imported ${result.imported} row(s) — batch ${result.importBatchId}`
      );
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const saveClearedAmount = async (rowId: string, data: Record<string, unknown>, value: number) => {
    const merged = mergeLegacyDebtPatch(data, { clearedAmount: value });
    await active.patchRow(rowId, merged);
  };

  const addBlankRow = () => {
    void active.createRow(
      LEGACY_RECOVERY_SUBTYPES[tab],
      buildLegacyDebtData({
        personName: 'New person',
        amount: 0,
        clearedAmount: 0,
      }),
      { is_catalog: true }
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
            Track thrift and withdrawal transactions plus names of people owing from
            before this platform. Each row has <strong>Amount</strong> and{' '}
            <strong>Cleared amount</strong> so payments on either side can be
            reconciled. Balance due = Amount − Cleared.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImportFile(f);
            }}
          />
          <button
            type="button"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-fountain-teal text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {importing ? (
              <Loader2Icon className="w-4 h-4 animate-spin" />
            ) : (
              <UploadIcon className="w-4 h-4" />
            )}
            Import CSV
          </button>
          <button
            type="button"
            disabled={active.loading}
            onClick={addBlankRow}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-fountain-gray-300 rounded-lg text-sm font-medium text-fountain-gray-700 hover:bg-fountain-gray-50"
          >
            <PlusIcon className="w-4 h-4" /> Add row
          </button>
        </div>
      </div>

      {importMsg ? (
        <p
          className={`text-sm rounded-lg px-4 py-3 border ${
            importMsg.startsWith('Imported')
              ? 'text-fountain-green bg-fountain-green/5 border-fountain-green/20'
              : 'text-fountain-red bg-fountain-red/5 border-fountain-red/20'
          }`}
        >
          {importMsg}
        </p>
      ) : null}

      <div className="flex items-center gap-2 text-xs text-fountain-gray-500 bg-fountain-gray-50 border border-fountain-gray-200 rounded-lg px-3 py-2">
        <FileSpreadsheetIcon className="w-4 h-4 shrink-0" />
        CSV columns: Name, Amount, Cleared Amount (optional: Branch, Date, Notes).
        Upload one sheet per tab (thrift / withdrawal / owing).
      </div>

      <div className="flex flex-wrap gap-2 border-b border-fountain-gray-200 pb-2">
        {TABS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => {
              setTab(kind);
              setImportMsg(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === kind
                ? 'bg-fountain-blue text-white'
                : 'text-fountain-gray-600 hover:bg-fountain-gray-100'
            }`}
          >
            {legacyRecoveryKindLabel(kind)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <p className="text-xs text-fountain-gray-500">Records</p>
          <p className="text-xl font-bold text-fountain-gray-900">{totals.count}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-fountain-gray-500">Total amount</p>
          <p className="text-xl font-bold text-fountain-gray-900">
            {formatNaira(totals.amount)}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-fountain-gray-500">Total cleared</p>
          <p className="text-xl font-bold text-fountain-green">
            {formatNaira(totals.cleared)}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-fountain-gray-500">Balance due</p>
          <p className="text-xl font-bold text-fountain-red">
            {formatNaira(totals.balance)}
          </p>
        </Card>
      </div>

      <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-right">Cleared</th>
                <th className="px-4 py-3 font-medium text-right">Balance due</th>
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fountain-gray-100">
              {active.items.map((row) => {
                const d = row.data;
                const amount = pickNum(d, 'amount');
                const cleared = pickNum(d, 'clearedAmount');
                const balance = pickNum(d, 'balanceDue');
                return (
                  <tr key={row.id} className="hover:bg-fountain-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-fountain-gray-900">
                        {pickStr(d, 'personName', '—')}
                      </p>
                      {pickStr(d, 'transactionDate') ? (
                        <p className="text-xs text-fountain-gray-500">
                          {pickStr(d, 'transactionDate')}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatNaira(amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        max={amount}
                        step={1000}
                        defaultValue={cleared}
                        key={`${row.id}-${cleared}`}
                        onBlur={(e) => {
                          const val = Math.min(
                            amount,
                            Math.max(0, Number(e.target.value) || 0)
                          );
                          if (val !== cleared) {
                            void saveClearedAmount(row.id, d, val);
                          }
                        }}
                        className="w-28 text-right px-2 py-1 border border-fountain-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-fountain-blue/40 outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-fountain-red">
                      {formatNaira(balance)}
                    </td>
                    <td className="px-4 py-3 text-fountain-gray-600">
                      {pickStr(d, 'branch', '—')}
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(pickStr(d, 'status', 'open'))}
                    </td>
                    <td className="px-4 py-3 text-center space-x-1">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => setEditRow({ id: row.id, data: { ...d } })}
                        className="p-1.5 text-fountain-gray-400 hover:text-fountain-blue"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => void active.removeRow(row.id)}
                        className="p-1.5 text-fountain-gray-400 hover:text-fountain-red"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!active.loading && !active.items.length ? (
            <p className="text-sm text-fountain-gray-500 p-6 text-center">
              No {legacyRecoveryKindLabel(tab).toLowerCase()} yet. Import a CSV or add
              rows manually.
            </p>
          ) : null}
        </div>
      </div>

      {editRow ? (
        <LegacyRowEditModal
          data={editRow.data}
          onClose={() => setEditRow(null)}
          onSave={async (patch) => {
            const merged = mergeLegacyDebtPatch(editRow.data, patch);
            await active.patchRow(editRow.id, merged);
            setEditRow(null);
          }}
        />
      ) : null}
    </div>
  );
}

function LegacyRowEditModal({
  data,
  onClose,
  onSave,
}: {
  data: Record<string, unknown>;
  onClose: () => void;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const [personName, setPersonName] = useState(pickStr(data, 'personName'));
  const [amount, setAmount] = useState(String(pickNum(data, 'amount')));
  const [clearedAmount, setClearedAmount] = useState(
    String(pickNum(data, 'clearedAmount'))
  );
  const [branch, setBranch] = useState(pickStr(data, 'branch'));
  const [transactionDate, setTransactionDate] = useState(
    pickStr(data, 'transactionDate')
  );
  const [notes, setNotes] = useState(pickStr(data, 'notes'));
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h4 className="text-lg font-bold text-fountain-gray-900">Edit record</h4>
        <label className="block text-sm">
          <span className="text-fountain-gray-600">Name</span>
          <input
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            className="mt-1 w-full p-2.5 border border-fountain-gray-200 rounded-lg"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-fountain-gray-600">Amount</span>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full p-2.5 border border-fountain-gray-200 rounded-lg"
            />
          </label>
          <label className="block text-sm">
            <span className="text-fountain-gray-600">Cleared amount</span>
            <input
              type="number"
              min={0}
              value={clearedAmount}
              onChange={(e) => setClearedAmount(e.target.value)}
              className="mt-1 w-full p-2.5 border border-fountain-gray-200 rounded-lg"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-fountain-gray-600">Branch</span>
          <input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="mt-1 w-full p-2.5 border border-fountain-gray-200 rounded-lg"
          />
        </label>
        <label className="block text-sm">
          <span className="text-fountain-gray-600">Date</span>
          <input
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="mt-1 w-full p-2.5 border border-fountain-gray-200 rounded-lg"
          />
        </label>
        <label className="block text-sm">
          <span className="text-fountain-gray-600">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full p-2.5 border border-fountain-gray-200 rounded-lg"
          />
        </label>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-fountain-gray-200 rounded-lg text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !personName.trim()}
            onClick={async () => {
              setSaving(true);
              await onSave({
                personName: personName.trim(),
                amount: Number(amount) || 0,
                clearedAmount: Number(clearedAmount) || 0,
                branch: branch.trim(),
                transactionDate: transactionDate.trim(),
                notes: notes.trim(),
              });
              setSaving(false);
            }}
            className="flex-1 py-2.5 bg-fountain-blue text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
