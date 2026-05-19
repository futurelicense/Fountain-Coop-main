'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { memberPaths } from '@/lib/memberPaths';
import {
  PiggyBankIcon,
  HandCoinsIcon,
  CoinsIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  EyeIcon,
  EyeOffIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  Loader2Icon,
  SparklesIcon,
} from 'lucide-react';
import { AlertBanner } from '@/components/member/ui/AlertBanner';
import { HomeProductCard } from '@/components/member/ui/HomeProductCard';
import { LedgerFeed } from '@/components/member/ui/LedgerFeed';
import { formatNaira } from '@/lib/formatNaira';
import { fetchMe } from '@/api';
import type { MeProfile } from '@/api/types';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickNum, pickStr } from '@/lib/pickData';

const THRIFT_DAILY_DEFAULT = 500;

export function MemberHome() {
  const router = useRouter();
  const [showBalance, setShowBalance] = useState(true);
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const ledger = useOperationalRecords('member', 'walletLedger');

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const { profile: p } = await fetchMe();
      setProfile(p ?? null);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const savingsBalance = profile?.savings_balance ?? 0;
  const loanBalance = profile?.loan_balance ?? 0;

  const thriftPaid = useMemo(() => {
    return ledger.items
      .filter(
        (row) =>
          pickStr(row.data, 'label').toLowerCase().includes('thrift') &&
          pickStr(row.data, 'kind') === 'withdraw'
      )
      .reduce((s, row) => s + pickNum(row.data, 'amount'), 0);
  }, [ledger.items]);

  const thriftPaymentsToday = useMemo(() => {
    const today = new Date().toDateString();
    return ledger.items.some((row) => {
      if (!pickStr(row.data, 'label').toLowerCase().includes('thrift')) {
        return false;
      }
      if (pickStr(row.data, 'kind') !== 'withdraw') return false;
      const at = pickStr(row.data, 'at');
      return at && new Date(at).toDateString() === today;
    });
  }, [ledger.items]);

  const recent = useMemo(() => {
    return [...ledger.items]
      .sort(
        (a, b) =>
          new Date(pickStr(b.data, 'at')).getTime() -
          new Date(pickStr(a.data, 'at')).getTime()
      )
      .slice(0, 5);
  }, [ledger.items]);

  const statusLabel =
    profile?.status && profile.status !== 'Active'
      ? profile.status
      : 'On track';

  const masked = (amount: number) =>
    showBalance ? formatNaira(amount) : '₦ ••••••';

  const refreshAll = () => {
    void loadProfile();
    void ledger.reload();
  };

  return (
    <div className="space-y-6 -mt-6 relative z-10">
      <div className="bg-white rounded-2xl shadow-lg border border-fountain-gray-100 overflow-hidden">
        <div className="bg-gradient-to-br from-fountain-dark via-fountain-blue to-fountain-teal p-5 text-white">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-white/75 text-xs font-medium uppercase tracking-wider">
              Wallet balance
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={refreshAll}
                disabled={profileLoading || ledger.loading}
                className="p-2 rounded-lg text-white/70 hover:bg-white/10 disabled:opacity-50"
                aria-label="Refresh"
              >
                <RefreshCwIcon
                  className={`w-4 h-4 ${profileLoading || ledger.loading ? 'animate-spin' : ''}`}
                />
              </button>
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 rounded-lg text-white/70 hover:bg-white/10"
                aria-label={showBalance ? 'Hide balance' : 'Show balance'}
              >
                {showBalance ? (
                  <EyeOffIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight">
            {profileLoading ? (
              <span className="inline-flex items-center gap-2 text-lg font-normal text-white/70">
                <Loader2Icon className="w-5 h-5 animate-spin" /> Loading…
              </span>
            ) : (
              masked(savingsBalance)
            )}
          </p>
          <p className="text-white/60 text-xs mt-2">
            Cooperative savings · {statusLabel}
          </p>
        </div>

        <div className="grid grid-cols-4 divide-x divide-fountain-gray-100 bg-fountain-gray-50/80">
          {[
            {
              label: 'Deposit',
              icon: ArrowDownLeftIcon,
              onClick: () => router.push(memberPaths.savings),
            },
            {
              label: 'Withdraw',
              icon: ArrowUpRightIcon,
              onClick: () => router.push(memberPaths.savings),
            },
            {
              label: 'Thrift',
              icon: CoinsIcon,
              onClick: () => router.push(memberPaths.savingsThrift),
            },
            {
              label: 'Loans',
              icon: HandCoinsIcon,
              onClick: () => router.push(memberPaths.loans),
            },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="flex flex-col items-center gap-1.5 py-3.5 hover:bg-white transition-colors active:bg-fountain-gray-100"
            >
              <action.icon className="w-5 h-5 text-fountain-blue" />
              <span className="text-[10px] font-semibold text-fountain-gray-700">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {!thriftPaymentsToday && !ledger.loading ? (
        <button
          type="button"
          onClick={() => router.push(memberPaths.savingsThrift)}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-fountain-teal/10 to-fountain-blue/10 border border-fountain-teal/20 text-left hover:shadow-md transition-shadow active:scale-[0.99]"
        >
          <div className="p-2.5 rounded-xl bg-fountain-teal text-white shrink-0">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-fountain-gray-900">
              Log today&apos;s thrift
            </p>
            <p className="text-xs text-fountain-gray-500 mt-0.5">
              {formatNaira(THRIFT_DAILY_DEFAULT)} daily · tap to pay from wallet
            </p>
          </div>
          <ChevronRightIcon className="w-5 h-5 text-fountain-teal shrink-0" />
        </button>
      ) : null}

      {ledger.error ? <AlertBanner tone="warning" message={ledger.error} /> : null}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-fountain-gray-900">
            Your accounts
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <HomeProductCard
            icon={PiggyBankIcon}
            label="Cooperative"
            value={showBalance ? formatNaira(savingsBalance) : '••••'}
            hint={statusLabel}
            accent="green"
            onClick={() => router.push(memberPaths.savings)}
          />
          <HomeProductCard
            icon={CoinsIcon}
            label="Daily thrift"
            value={showBalance ? formatNaira(thriftPaid) : '••••'}
            hint={
              thriftPaymentsToday ? 'Paid today' : 'Tap to log payment'
            }
            accent="teal"
            onClick={() => router.push(memberPaths.savingsThrift)}
          />
          <div className="col-span-2">
            <HomeProductCard
              icon={HandCoinsIcon}
              label="Loans"
              value={showBalance ? formatNaira(loanBalance) : '••••'}
              hint={loanBalance > 0 ? 'Outstanding balance' : 'No active loan'}
              accent="blue"
              onClick={() => router.push(memberPaths.loans)}
            />
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-fountain-gray-900">
            Recent activity
          </h2>
          <button
            type="button"
            onClick={() => router.push(memberPaths.activity)}
            className="text-xs font-semibold text-fountain-blue flex items-center gap-0.5 hover:underline"
          >
            See all
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <LedgerFeed
          items={recent}
          loading={ledger.loading}
          emptyTitle="No transactions yet"
          emptyHint="Deposit with Paystack or log thrift to see activity here."
        />
      </section>
    </div>
  );
}
