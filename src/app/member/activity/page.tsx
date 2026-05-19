'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  Loader2Icon,
  RefreshCwIcon,
} from 'lucide-react';
import { AlertBanner } from '@/components/member/ui/AlertBanner';
import { LedgerFeed } from '@/components/member/ui/LedgerFeed';
import { formatNaira } from '@/lib/formatNaira';
import { pickNum, pickStr } from '@/lib/pickData';
import type { OperationalItem } from '@/api/types';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';

const FILTERS = ['All', 'Cooperative', 'Thrift', 'Ajo/Osusu', 'Loans'] as const;
type ActivityFilter = (typeof FILTERS)[number];

function activityCategory(row: OperationalItem): ActivityFilter | 'Other' {
  const label = pickStr(row.data, 'label').toLowerCase();
  if (label.includes('thrift')) return 'Thrift';
  if (label.includes('ajo') || label.includes('osusu')) return 'Ajo/Osusu';
  if (label.includes('loan')) return 'Loans';
  return 'Cooperative';
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'Cooperative':
      return 'bg-fountain-green/10 text-fountain-green';
    case 'Thrift':
      return 'bg-fountain-teal/10 text-fountain-teal';
    case 'Ajo/Osusu':
      return 'bg-fountain-amber/10 text-fountain-amber';
    case 'Loans':
      return 'bg-fountain-blue/10 text-fountain-blue';
    default:
      return 'bg-fountain-gray-100 text-fountain-gray-600';
  }
}

export default function MemberActivityPage() {
  const ledger = useOperationalRecords('member', 'walletLedger');
  const [filter, setFilter] = useState<ActivityFilter>('All');

  const sorted = useMemo(() => {
    return [...ledger.items].sort(
      (a, b) =>
        new Date(pickStr(b.data, 'at') || b.created_at).getTime() -
        new Date(pickStr(a.data, 'at') || a.created_at).getTime()
    );
  }, [ledger.items]);

  const filtered = useMemo(() => {
    if (filter === 'All') return sorted;
    return sorted.filter((row) => activityCategory(row) === filter);
  }, [sorted, filter]);

  const { totalIn, totalOut } = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    for (const row of sorted) {
      const kind = pickStr(row.data, 'kind', 'deposit');
      const amount = pickNum(row.data, 'amount');
      if (kind === 'withdraw') totalOut += amount;
      else totalIn += amount;
    }
    return { totalIn, totalOut };
  }, [sorted]);

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-fountain-gray-900">Activity</h2>
          <p className="text-xs text-fountain-gray-500 mt-0.5">
            Live wallet ledger
          </p>
        </div>
        <button
          type="button"
          onClick={() => void ledger.reload()}
          disabled={ledger.loading}
          className="p-2.5 bg-white border border-fountain-gray-200 rounded-xl text-fountain-gray-600 hover:bg-fountain-gray-50 disabled:opacity-50"
          aria-label="Refresh activity"
        >
          <RefreshCwIcon
            className={`w-4 h-4 ${ledger.loading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {ledger.error ? (
        <AlertBanner tone="warning" message={ledger.error} />
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4 text-center">
          <ArrowDownLeftIcon className="w-5 h-5 text-fountain-green mx-auto mb-1" />
          <p className="text-xs text-fountain-gray-500">Total in</p>
          <p className="text-lg font-bold text-fountain-green tabular-nums">
            {ledger.loading ? (
              <Loader2Icon className="w-5 h-5 animate-spin mx-auto text-fountain-gray-400" />
            ) : (
              formatNaira(totalIn)
            )}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4 text-center">
          <ArrowUpRightIcon className="w-5 h-5 text-fountain-red mx-auto mb-1" />
          <p className="text-xs text-fountain-gray-500">Total out</p>
          <p className="text-lg font-bold text-fountain-red tabular-nums">
            {ledger.loading ? (
              <Loader2Icon className="w-5 h-5 animate-spin mx-auto text-fountain-gray-400" />
            ) : (
              formatNaira(totalOut)
            )}
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setFilter(name)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === name
                ? 'bg-fountain-blue text-white'
                : 'bg-white border border-fountain-gray-200 text-fountain-gray-600 hover:bg-fountain-gray-50'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {filter === 'All' ? (
        <LedgerFeed
          items={sorted}
          loading={ledger.loading}
          emptyTitle="No activity yet"
          emptyHint="Deposits, withdrawals, and thrift payments appear here."
        />
      ) : filtered.length === 0 && !ledger.loading ? (
        <div className="bg-white rounded-2xl border border-dashed border-fountain-gray-200 p-8 text-center">
          <p className="text-sm font-medium text-fountain-gray-800">
            No {filter} transactions
          </p>
          <p className="text-xs text-fountain-gray-500 mt-1">
            Try another filter or make a transaction.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm divide-y divide-fountain-gray-100">
          {ledger.loading ? (
            <div className="p-8 flex flex-col items-center gap-2 text-fountain-gray-500">
              <Loader2Icon className="w-6 h-6 animate-spin text-fountain-blue" />
              <p className="text-sm">Loading activity…</p>
            </div>
          ) : null}
          {!ledger.loading &&
            filtered.map((row) => {
              const kind = pickStr(row.data, 'kind', 'deposit');
              const isWithdraw = kind === 'withdraw';
              const label =
                pickStr(row.data, 'label') ||
                (isWithdraw ? 'Withdrawal' : 'Deposit');
              const category = activityCategory(row);
              const amount = pickNum(row.data, 'amount');
              const at = pickStr(row.data, 'at') || row.created_at;
              const d = at ? new Date(at) : new Date();
              const ref =
                pickStr(row.data, 'paystackReference') ||
                row.id.slice(0, 8).toUpperCase();

              return (
                <div key={row.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${getCategoryColor(category)}`}
                      >
                        {isWithdraw ? (
                          <ArrowUpRightIcon className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeftIcon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-fountain-gray-900 truncate">
                          {label}
                        </p>
                        <p className="text-[10px] text-fountain-gray-400">
                          {d.toLocaleString('en-NG', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                        <span
                          className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${getCategoryColor(category)}`}
                        >
                          {category}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-bold tabular-nums ${
                          isWithdraw ? 'text-fountain-red' : 'text-fountain-green'
                        }`}
                      >
                        {isWithdraw ? '−' : '+'}
                        {formatNaira(amount)}
                      </p>
                      <p className="text-[10px] text-fountain-gray-400 font-mono mt-0.5">
                        {ref}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
