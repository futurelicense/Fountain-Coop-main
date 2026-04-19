'use client';

import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { fetchMe } from '@/api';
import type { MeProfile } from '@/api/types';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickNum, pickStr } from '@/lib/pickData';

export default function MemberHomePage() {
  const router = useRouter();
  const [showBalance, setShowBalance] = useState(true);
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const ledger = useOperationalRecords('member', 'walletLedger');

  useEffect(() => {
    void fetchMe().then(({ profile: p }) => setProfile(p ?? null));
  }, []);

  const formatNaira = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

  const savingsBalance = profile?.savings_balance ?? 0;
  const loanBalance = profile?.loan_balance ?? 0;

  const thriftPaid = useMemo(() => {
    return ledger.items
      .filter((row) => pickStr(row.data, 'label').toLowerCase().includes('thrift') && pickStr(row.data, 'kind') === 'deposit')
      .reduce((s, row) => s + pickNum(row.data, 'amount'), 0);
  }, [ledger.items]);

  const recent = useMemo(() => {
    return [...ledger.items]
      .sort((a, b) => new Date(pickStr(b.data, 'at')).getTime() - new Date(pickStr(a.data, 'at')).getTime())
      .slice(0, 5);
  }, [ledger.items]);

  const statusLabel = profile?.status && profile.status !== 'Active' ? profile.status : 'On Track';

  return (
    <div className="space-y-5 -mt-3">
      <div className="bg-gradient-to-br from-fountain-dark to-fountain-blue rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <p className="text-white/70 text-sm">Total Balance</p>
          <button type="button" onClick={() => setShowBalance(!showBalance)} className="text-white/60 hover:text-white">
            {showBalance ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
        </div>
        <h2 className="text-3xl font-bold mb-4">{showBalance ? formatNaira(savingsBalance) : '₦ ••••••'}</h2>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => router.push(memberPaths.savings)} className="flex flex-col items-center p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            <ArrowDownLeftIcon className="w-5 h-5 mb-1" /><span className="text-[10px] font-medium">Deposit</span>
          </button>
          <button type="button" onClick={() => router.push(memberPaths.savings)} className="flex flex-col items-center p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            <ArrowUpRightIcon className="w-5 h-5 mb-1" /><span className="text-[10px] font-medium">Withdraw</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-fountain-gray-900 mb-3">My Products</h3>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => router.push(memberPaths.savings)} className="bg-white rounded-xl p-4 border border-fountain-gray-200 shadow-sm text-left hover:shadow-md transition-shadow">
            <div className="p-2 bg-fountain-green/10 rounded-lg w-fit mb-2"><PiggyBankIcon className="w-5 h-5 text-fountain-green" /></div>
            <p className="text-xs text-fountain-gray-500">Cooperative</p>
            <p className="text-lg font-bold text-fountain-gray-900">{showBalance ? formatNaira(savingsBalance) : '•••'}</p>
            <p className="text-[10px] text-fountain-green font-medium mt-1">{statusLabel}</p>
          </button>
          <button type="button" onClick={() => router.push(memberPaths.savingsThrift)} className="bg-white rounded-xl p-4 border border-fountain-gray-200 shadow-sm text-left hover:shadow-md transition-shadow">
            <div className="p-2 bg-fountain-teal/10 rounded-lg w-fit mb-2"><CoinsIcon className="w-5 h-5 text-fountain-teal" /></div>
            <p className="text-xs text-fountain-gray-500">Thrift (paid-in)</p>
            <p className="text-lg font-bold text-fountain-gray-900">{showBalance ? formatNaira(thriftPaid) : '•••'}</p>
            <p className="text-[10px] text-fountain-teal font-medium mt-1">From labeled wallet credits</p>
          </button>
          <button type="button" onClick={() => router.push(memberPaths.loans)} className="bg-white rounded-xl p-4 border border-fountain-gray-200 shadow-sm text-left hover:shadow-md transition-shadow">
            <div className="p-2 bg-fountain-blue/10 rounded-lg w-fit mb-2"><HandCoinsIcon className="w-5 h-5 text-fountain-blue" /></div>
            <p className="text-xs text-fountain-gray-500">Loans</p>
            <p className="text-lg font-bold text-fountain-gray-900">{showBalance ? formatNaira(loanBalance) : '•••'}</p>
            <p className="text-[10px] text-fountain-gray-400 font-medium mt-1">{loanBalance > 0 ? 'Outstanding' : 'No active loan'}</p>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-fountain-gray-900 mb-3">Upcoming</h3>
        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm divide-y divide-fountain-gray-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-fountain-green/10 rounded-lg"><PiggyBankIcon className="w-4 h-4 text-fountain-green" /></div>
              <div><p className="text-sm font-medium text-fountain-gray-900">Cooperative savings</p><p className="text-xs text-fountain-gray-500">Use Savings to deposit or withdraw</p></div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-fountain-gray-900">{formatNaira(savingsBalance)}</p>
              <button type="button" onClick={() => router.push(memberPaths.savings)} className="text-[10px] text-fountain-blue font-medium">Open</button>
            </div>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-fountain-teal/10 rounded-lg"><CoinsIcon className="w-4 h-4 text-fountain-teal" /></div>
              <div><p className="text-sm font-medium text-fountain-gray-900">Daily Thrift</p><p className="text-xs text-fountain-gray-500">Log payments from Savings → Thrift tab</p></div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-fountain-gray-900">{formatNaira(thriftPaid)}</p>
              <button type="button" onClick={() => router.push(memberPaths.savingsThrift)} className="text-[10px] text-fountain-blue font-medium">Pay</button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-fountain-gray-900">Recent Activity</h3>
          <button type="button" onClick={() => router.push(memberPaths.activity)} className="text-xs text-fountain-blue font-medium flex items-center">
            See All <ChevronRightIcon className="w-3 h-3 ml-0.5" />
          </button>
        </div>
        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm divide-y divide-fountain-gray-100">
          {ledger.error ? <p className="p-4 text-xs text-fountain-amber">{ledger.error}</p> : null}
          {!recent.length && !ledger.loading ? <p className="p-4 text-sm text-fountain-gray-500">No wallet movements yet.</p> : null}
          {recent.map((row) => {
            const e = row.data;
            const kind = pickStr(e, 'kind', 'deposit');
            const at = pickStr(e, 'at');
            const d = at ? new Date(at) : new Date();
            const label = pickStr(e, 'label') || (kind === 'withdraw' ? 'Withdrawal' : 'Deposit');
            const color = kind === 'withdraw' ? 'text-fountain-red' : 'text-fountain-green';
            return (
              <div key={row.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-fountain-gray-900">{label}</p>
                  <p className="text-xs text-fountain-gray-400">{d.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                <span className={`text-sm font-bold ${color}`}>{kind === 'withdraw' ? '-' : '+'}{formatNaira(pickNum(e, 'amount'))}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
