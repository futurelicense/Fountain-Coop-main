'use client';

import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CoinsIcon,
  Loader2Icon,
  ReceiptIcon,
} from 'lucide-react';
import type { OperationalItem } from '@/api/types';
import { formatNaira } from '@/lib/formatNaira';
import { pickNum, pickStr } from '@/lib/pickData';

function entryMeta(row: OperationalItem) {
  const kind = pickStr(row.data, 'kind', 'deposit');
  const label = pickStr(row.data, 'label');
  const lbl = label.toLowerCase();
  const isThrift = lbl.includes('thrift');
  const isPaystack =
    lbl.includes('paystack') || Boolean(pickStr(row.data, 'paystackReference'));
  const isWithdraw = kind === 'withdraw';
  return {
    kind,
    label: label || (isWithdraw ? 'Withdrawal' : 'Deposit'),
    isThrift,
    isPaystack,
    isWithdraw,
  };
}

export function LedgerFeed({
  items,
  loading,
  emptyTitle,
  emptyHint,
}: {
  items: OperationalItem[];
  loading: boolean;
  emptyTitle: string;
  emptyHint: string;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-fountain-gray-200 p-8 flex flex-col items-center gap-2 text-fountain-gray-500">
        <Loader2Icon className="w-6 h-6 animate-spin text-fountain-blue" />
        <p className="text-sm">Loading activity…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-fountain-gray-200 p-8 text-center">
        <ReceiptIcon className="w-10 h-10 text-fountain-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-fountain-gray-800">{emptyTitle}</p>
        <p className="text-xs text-fountain-gray-500 mt-1 max-w-[240px] mx-auto">
          {emptyHint}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-fountain-gray-200 shadow-sm divide-y divide-fountain-gray-100 overflow-hidden">
      {items.map((row) => {
        const { label, isThrift, isPaystack, isWithdraw } = entryMeta(row);
        const at = pickStr(row.data, 'at');
        const d = at ? new Date(at) : new Date();
        const amount = pickNum(row.data, 'amount');
        const Icon = isThrift
          ? CoinsIcon
          : isWithdraw
            ? ArrowUpRightIcon
            : ArrowDownLeftIcon;
        const iconBg = isThrift
          ? 'bg-fountain-teal/10 text-fountain-teal'
          : isWithdraw
            ? 'bg-fountain-red/10 text-fountain-red'
            : 'bg-fountain-green/10 text-fountain-green';

        return (
          <div
            key={row.id}
            className="flex items-center gap-3 p-4 hover:bg-fountain-gray-50/80 transition-colors"
          >
            <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-fountain-gray-900 truncate">
                {label}
              </p>
              <p className="text-xs text-fountain-gray-500 mt-0.5">
                {d.toLocaleString('en-NG', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
                {isPaystack ? ' · Paystack' : ''}
              </p>
            </div>
            <p
              className={`text-sm font-bold tabular-nums shrink-0 ${
                isWithdraw ? 'text-fountain-red' : 'text-fountain-green'
              }`}
            >
              {isWithdraw ? '−' : '+'}
              {formatNaira(amount)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
