'use client';

import type { ReactNode } from 'react';
import { CopyIcon, PhoneIcon } from 'lucide-react';
import {
  branchPickupInfo,
  COOPERATIVE_BANK,
} from '@/lib/cooperative-payment-info';
import type { MemberThriftCollector } from '@/api/thrift';

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div>
        <p className="text-[10px] uppercase tracking-wide text-fountain-gray-400">
          {label}
        </p>
        <p className="font-medium text-fountain-gray-900 break-all">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => void navigator.clipboard?.writeText(value)}
        className="shrink-0 p-2 rounded-lg text-fountain-gray-400 hover:bg-white hover:text-fountain-blue"
        aria-label={`Copy ${label}`}
      >
        <CopyIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

function InfoPanel({
  tone,
  children,
}: {
  tone: 'teal' | 'blue' | 'amber';
  children: ReactNode;
}) {
  const styles = {
    teal: 'bg-fountain-teal/5 border-fountain-teal/20',
    blue: 'bg-fountain-blue/5 border-fountain-blue/20',
    amber: 'bg-fountain-amber/5 border-fountain-amber/20',
  }[tone];

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${styles}`}>{children}</div>
  );
}

export function PaymentMethodFields({
  label = 'Payment method',
  mode = 'thrift',
  value,
  onChange,
  options,
  collector,
  memberCode,
  branch,
  payoutAccount,
  onPayoutAccountChange,
  payoutBankCode,
  onPayoutBankCodeChange,
  banks = [],
  banksLoading = false,
  payoutAccountName,
  resolveLoading = false,
  resolveError,
}: {
  label?: string;
  mode?: 'thrift' | 'withdraw';
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  collector?: MemberThriftCollector | null;
  memberCode?: string | null;
  branch?: string | null;
  payoutAccount?: string;
  onPayoutAccountChange?: (value: string) => void;
  payoutBankCode?: string;
  onPayoutBankCodeChange?: (value: string) => void;
  banks?: { name: string; code: string }[];
  banksLoading?: boolean;
  payoutAccountName?: string;
  resolveLoading?: boolean;
  resolveError?: string | null;
}) {
  const pickup = branchPickupInfo(branch);
  const reference = memberCode || collector?.memberCode || 'your member ID';

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-fountain-gray-700 mb-1">
          {label}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {value === 'cash_collector' && collector ? (
        <InfoPanel tone="teal">
          <p className="text-xs font-semibold text-fountain-gray-900">
            Your assigned collector
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-fountain-teal/10 text-fountain-teal flex items-center justify-center font-bold text-sm">
              {collector.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-fountain-gray-900">
                {collector.name}
              </p>
              <p className="text-xs text-fountain-gray-500">
                {collector.collectorCode} · {collector.branch}
              </p>
              <p className="text-xs text-fountain-gray-500">{collector.route}</p>
            </div>
            {collector.phone ? (
              <a
                href={`tel:${collector.phone.replace(/\s/g, '')}`}
                className="p-2 bg-white text-fountain-teal rounded-lg border border-fountain-teal/20"
              >
                <PhoneIcon className="w-4 h-4" />
              </a>
            ) : null}
          </div>
          <p className="text-xs text-fountain-gray-600 leading-relaxed">
            Hand cash to this collector and say your member ID{' '}
            <span className="font-semibold text-fountain-gray-900">{reference}</span>.
            Then log the payment here so your thrift cycle updates.
          </p>
          {!collector.assigned ? (
            <p className="text-[11px] text-fountain-amber font-medium">
              No admin assignment found yet — showing your branch default collector.
            </p>
          ) : null}
        </InfoPanel>
      ) : null}

      {value === 'bank_transfer' && mode === 'thrift' ? (
        <InfoPanel tone="blue">
          <p className="text-xs font-semibold text-fountain-gray-900">
            Transfer to cooperative account
          </p>
          <CopyRow label="Bank" value={COOPERATIVE_BANK.bankName} />
          <CopyRow label="Account name" value={COOPERATIVE_BANK.accountName} />
          <CopyRow label="Account number" value={COOPERATIVE_BANK.accountNumber} />
          <p className="text-xs text-fountain-gray-600">
            Use <span className="font-semibold">{reference}</span> as the transfer
            narration, then log this payment after the transfer clears.
          </p>
        </InfoPanel>
      ) : null}

      {value === 'card_payment' && mode === 'thrift' ? (
        <InfoPanel tone="blue">
          <p className="text-xs font-semibold text-fountain-gray-900">
            Card / wallet payment
          </p>
          <p className="text-xs text-fountain-gray-600 leading-relaxed">
            This logs today&apos;s thrift against your cooperative wallet balance.
            If your wallet is low, deposit first from the Cooperative tab, then
            return here to log thrift.
          </p>
        </InfoPanel>
      ) : null}

      {value === 'cash_branch' ? (
        <InfoPanel tone="amber">
          <p className="text-xs font-semibold text-fountain-gray-900">
            Collect cash at branch
          </p>
          <CopyRow label="Branch" value={branch || 'Your branch'} />
          <CopyRow label="Address" value={pickup.address} />
          <CopyRow label="Hours" value={pickup.hours} />
          <CopyRow label="Branch phone" value={pickup.phone} />
          <p className="text-xs text-fountain-gray-600">
            Bring a valid ID and your member ID{' '}
            <span className="font-semibold">{reference}</span>. Admin approval
            still applies before payout.
          </p>
        </InfoPanel>
      ) : null}

      {value === 'mobile_money' ? (
        <InfoPanel tone="blue">
          <p className="text-xs font-semibold text-fountain-gray-900">
            Mobile money payout
          </p>
          <label className="block text-xs font-medium text-fountain-gray-700">
            Mobile money number
          </label>
          <input
            type="tel"
            value={payoutAccount ?? ''}
            onChange={(e) => onPayoutAccountChange?.(e.target.value)}
            placeholder="e.g. 0803 123 4567"
            className="w-full p-3 bg-white border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue"
          />
          <p className="text-xs text-fountain-gray-600">
            Payout is sent to this number after admin approval (usually within
            the 30-day notice window).
          </p>
        </InfoPanel>
      ) : null}

      {value === 'bank_transfer' && mode === 'withdraw' ? (
        <InfoPanel tone="blue">
          <p className="text-xs font-semibold text-fountain-gray-900">
            Your bank account for payout
          </p>
          <div>
            <label className="block text-xs font-medium text-fountain-gray-700 mb-1">
              Bank
            </label>
            <select
              value={payoutBankCode ?? ''}
              onChange={(e) => onPayoutBankCodeChange?.(e.target.value)}
              disabled={banksLoading}
              className="w-full p-3 bg-white border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue disabled:opacity-60"
            >
              <option value="">
                {banksLoading ? 'Loading banks…' : 'Select your bank'}
              </option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-fountain-gray-700 mb-1">
              Account number
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={payoutAccount ?? ''}
              onChange={(e) => onPayoutAccountChange?.(e.target.value)}
              placeholder="10-digit NUBAN"
              className="w-full p-3 bg-white border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue"
            />
          </div>
          {resolveLoading ? (
            <p className="text-xs text-fountain-gray-500">Looking up account name…</p>
          ) : null}
          {resolveError ? (
            <p className="text-xs text-fountain-red">{resolveError}</p>
          ) : null}
          {payoutAccountName ? (
            <div className="rounded-lg bg-white border border-fountain-green/20 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-fountain-gray-400">
                Account name
              </p>
              <p className="text-sm font-semibold text-fountain-gray-900 mt-0.5">
                {payoutAccountName}
              </p>
            </div>
          ) : null}
          <p className="text-xs text-fountain-gray-600">
            Admin pays approved withdrawals to the verified account above.
          </p>
        </InfoPanel>
      ) : null}
    </div>
  );
}
