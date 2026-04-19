'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PiggyBankIcon,
  CoinsIcon,
  TrendingUpIcon,
  CalendarIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  ClockIcon,
  PhoneIcon,
  InfoIcon,
  XIcon } from
'lucide-react';
import {
  ApiError,
  fetchMe,
  initializeMemberPaystackDeposit,
  postMemberWallet,
  verifyMemberPaystackDeposit,
} from '@/api';
import type { MeProfile } from '@/api/types';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickNum, pickStr } from '@/lib/pickData';
interface MemberSavingsProps {
  defaultTab?: string;
}
export function MemberSavingsView({ defaultTab = 'coop' }: MemberSavingsProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(defaultTab);
  useEffect(() => {
    setActiveTab('coop');
  }, [defaultTab]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showThriftPayModal, setShowThriftPayModal] = useState(false);
  const [depositConfirmed, setDepositConfirmed] = useState(false);
  const [withdrawConfirmed, setWithdrawConfirmed] = useState(false);
  const [thriftPayConfirmed, setThriftPayConfirmed] = useState(false);
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [depositAmount, setDepositAmount] = useState(50000);
  const [withdrawAmount, setWithdrawAmount] = useState(10000);
  const [thriftPayAmount, setThriftPayAmount] = useState(500);
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const ledger = useOperationalRecords('member', 'walletLedger');

  const loadProfile = useCallback(async () => {
    try {
      const me = await fetchMe();
      setProfile(me.profile ?? null);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const reference =
      searchParams.get('reference') ?? searchParams.get('trxref') ?? '';
    if (!reference) return;
    setWalletError(null);
    setWalletBusy(true);
    void verifyMemberPaystackDeposit({ reference })
      .then(async (res) => {
        if (typeof res.savings_balance === 'number') {
          setProfile((p) =>
            p ? { ...p, savings_balance: res.savings_balance ?? p.savings_balance } : p
          );
        }
        await ledger.reload();
        setDepositAmount(Math.max(depositAmount, 1));
        setDepositConfirmed(true);
        setShowDepositModal(true);
      })
      .catch((e) => {
        const msg =
          e instanceof ApiError
            ? JSON.stringify(e.body)
            : 'Could not verify Paystack payment';
        setWalletError(String(msg));
      })
      .finally(() => {
        setWalletBusy(false);
        const clean = new URL(window.location.href);
        clean.searchParams.delete('reference');
        clean.searchParams.delete('trxref');
        window.history.replaceState({}, '', clean.toString());
      });
  }, [searchParams, ledger, depositAmount]);

  const savingsBalance = profile?.savings_balance ?? 0;

  const coopLedgerEntries = useMemo(() => {
    return [...ledger.items]
      .filter((row) => {
        const lbl = pickStr(row.data, 'label').toLowerCase();
        return !lbl || !lbl.includes('thrift');
      })
      .sort(
        (a, b) =>
          new Date(pickStr(b.data, 'at')).getTime() -
          new Date(pickStr(a.data, 'at')).getTime()
      );
  }, [ledger.items]);

  const thriftLedgerEntries = useMemo(() => {
    return [...ledger.items]
      .filter((row) => pickStr(row.data, 'label').toLowerCase().includes('thrift'))
      .sort(
        (a, b) =>
          new Date(pickStr(b.data, 'at')).getTime() -
          new Date(pickStr(a.data, 'at')).getTime()
      );
  }, [ledger.items]);

  const thriftPaidTotal = useMemo(
    () =>
      thriftLedgerEntries
        .filter((r) => pickStr(r.data, 'kind') === 'deposit')
        .reduce((s, r) => s + pickNum(r.data, 'amount'), 0),
    [thriftLedgerEntries]
  );

  const thriftDayStates = useMemo(() => {
    const n = 31;
    const paidCount = thriftLedgerEntries.filter(
      (e) => pickStr(e.data, 'kind') === 'deposit'
    ).length;
    return Array.from({ length: n }, (_, i): string => {
      if (i < paidCount) return 'paid';
      if (i === paidCount) return 'today';
      return 'upcoming';
    });
  }, [thriftLedgerEntries]);

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount);
  };
  // Simple modal component
  const Modal = ({
    show,
    onClose,
    children




  }: {show: boolean;onClose: () => void;children: React.ReactNode;}) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div
          className="absolute inset-0 bg-fountain-dark/30 backdrop-blur-sm"
          onClick={onClose} />
        
        <div className="relative bg-white w-full max-w-lg rounded-t-2xl p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
          {children}
        </div>
      </div>);

  };
  return (
    <div className="space-y-5 pt-2">
      {walletError ? (
        <p className="text-xs text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-3 py-2">
          {walletError}
        </p>
      ) : null}
      {ledger.error ? (
        <p className="text-xs text-fountain-amber bg-fountain-amber/5 border border-fountain-amber/20 rounded-lg px-3 py-2">
          {ledger.error}
        </p>
      ) : null}
      {/* Product Tabs */}
      <div className="flex space-x-1 bg-fountain-gray-200/50 p-1 rounded-xl overflow-x-auto">
        {[{ id: 'coop', label: 'Wallet' }].
        map((tab) =>
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 min-w-[80px] py-2 px-3 text-xs font-semibold rounded-lg transition-all ${activeTab === tab.id ? 'bg-white text-fountain-dark shadow-sm' : 'text-fountain-gray-500 hover:text-fountain-gray-900'}`}>
          
            {tab.label}
          </button>
        )}
      </div>

      {/* ═══════════════ COOPERATIVE TAB ═══════════════ */}
      {activeTab === 'coop' &&
      <div className="space-y-5">
          {/* Balance Card */}
          <div className="bg-white rounded-2xl border border-fountain-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-fountain-green/10 to-fountain-teal/10 p-5">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-fountain-green rounded-lg">
                  <PiggyBankIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-fountain-gray-600">
                    Cooperative Savings
                  </p>
                  <p className="text-xs text-fountain-gray-400">
                    Premium Monthly Plan
                  </p>
                </div>
              </div>
              <p className="text-3xl font-bold text-fountain-gray-900">
                {formatNaira(savingsBalance)}
              </p>
              <div className="flex items-center space-x-4 mt-3 text-xs">
                <div className="flex items-center text-fountain-green">
                  <TrendingUpIcon className="w-3 h-3 mr-1" />
                  <span className="font-medium">On Track</span>
                </div>
                <span className="text-fountain-gray-400">9 months active</span>
                <span className="text-fountain-gray-400">
                  {formatNaira(50000)}/month
                </span>
              </div>
            </div>

            {/* Progress */}
            <div className="p-5 border-t border-fountain-gray-100">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-fountain-gray-500">
                  Annual Target Progress
                </span>
                <span className="font-medium text-fountain-gray-900">
                  {formatNaira(savingsBalance)} / {formatNaira(600000)}
                </span>
              </div>
              <div className="w-full bg-fountain-gray-100 rounded-full h-2.5">
                <div
                className="bg-fountain-green h-2.5 rounded-full"
                style={{
                  width: '75%'
                }}>
              </div>
              </div>
              <p className="text-[10px] text-fountain-gray-400 mt-1">
                75% complete • 3 months remaining
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
            onClick={() => {
              setDepositConfirmed(false);
              setShowDepositModal(true);
            }}
            className="flex items-center justify-center space-x-2 py-3.5 bg-fountain-green text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors shadow-lg shadow-fountain-green/25">
            
              <ArrowDownLeftIcon className="w-4 h-4" />
              <span>Deposit</span>
            </button>
            <button
            onClick={() => {
              setWithdrawConfirmed(false);
              setShowWithdrawModal(true);
            }}
            className="flex items-center justify-center space-x-2 py-3.5 bg-white border-2 border-fountain-gray-200 text-fountain-gray-700 rounded-xl font-semibold text-sm hover:bg-fountain-gray-50 transition-colors">
            
              <ArrowUpRightIcon className="w-4 h-4" />
              <span>Withdraw</span>
            </button>
          </div>

          {/* Plan Details */}
          <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4">
            <h4 className="text-sm font-semibold text-fountain-gray-900 mb-3 flex items-center">
              <InfoIcon className="w-4 h-4 mr-1.5 text-fountain-blue" /> Plan
              Details
            </h4>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <p className="text-[10px] text-fountain-gray-400">Plan Type</p>
                <p className="font-medium text-fountain-gray-900">
                  Premium Monthly
                </p>
              </div>
              <div>
                <p className="text-[10px] text-fountain-gray-400">
                  Monthly Target
                </p>
                <p className="font-medium text-fountain-gray-900">
                  {formatNaira(50000)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-fountain-gray-400">
                  Annual Target
                </p>
                <p className="font-medium text-fountain-gray-900">
                  {formatNaira(600000)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-fountain-gray-400">
                  Interest Rate
                </p>
                <p className="font-medium text-fountain-green">5% p.a.</p>
              </div>
              <div>
                <p className="text-[10px] text-fountain-gray-400">
                  Interest Earned
                </p>
                <p className="font-medium text-fountain-green">
                  {formatNaira(11250)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-fountain-gray-400">
                  Withdrawal Rule
                </p>
                <p className="font-medium text-fountain-gray-900">
                  30-day notice
                </p>
              </div>
            </div>
          </div>

          {/* Contribution History */}
          <div>
            <h3 className="text-sm font-semibold text-fountain-gray-900 mb-3">
              Contribution History
            </h3>
            <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm divide-y divide-fountain-gray-100">
              {coopLedgerEntries.length === 0 ? (
                <p className="p-4 text-sm text-fountain-gray-500 text-center">
                  No wallet movements yet. Make a deposit to see history here.
                </p>
              ) : null}
              {coopLedgerEntries.map((row) => {
                const e = row.data;
                const kind = pickStr(e, 'kind', 'deposit');
                const at = pickStr(e, 'at');
                const d = at ? new Date(at) : new Date();
                const label = pickStr(e, 'label') || (kind === 'withdraw' ? 'Withdrawal' : 'Deposit');
                return (
                  <div
                    key={row.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 bg-fountain-green/10 rounded-lg">
                        <CalendarIcon className="w-4 h-4 text-fountain-green" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-fountain-gray-900">
                          {label}
                        </p>
                        <p className="text-[10px] text-fountain-gray-400">
                          {d.toLocaleString('en-NG', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}{' '}
                          • {kind}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          kind === 'withdraw'
                            ? 'text-fountain-red'
                            : 'text-fountain-green'
                        }`}
                      >
                        {kind === 'withdraw' ? '-' : '+'}
                        {formatNaira(pickNum(e, 'amount'))}
                      </p>
                      <CheckCircleIcon className="w-3 h-3 text-fountain-green ml-auto mt-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      }

      {/* ═══════════════ THRIFT TAB ═══════════════ */}
      {false &&
      <div className="space-y-5">
          {/* Balance Card */}
          <div className="bg-white rounded-2xl border border-fountain-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-fountain-teal/10 to-fountain-blue/10 p-5">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-fountain-teal rounded-lg">
                  <CoinsIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-fountain-gray-600">
                    Thrift Savings
                  </p>
                  <p className="text-xs text-fountain-gray-400">
                    Daily Saver Plan
                  </p>
                </div>
              </div>
              <p className="text-3xl font-bold text-fountain-gray-900">
                {formatNaira(thriftPaidTotal)}
              </p>
              <div className="flex items-center space-x-4 mt-3 text-xs">
                <div className="flex items-center text-fountain-teal">
                  <span className="font-medium">
                    {thriftLedgerEntries.length} thrift payments logged
                  </span>
                </div>
                <span className="text-fountain-gray-400">
                  {formatNaira(thriftPayAmount)}/pay
                </span>
              </div>
            </div>

            {/* Maturity Info */}
            <div className="p-4 border-t border-fountain-gray-100 bg-fountain-teal/5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-fountain-gray-600 font-medium">
                  Cycle Progress
                </span>
                <span className="font-bold text-fountain-gray-900">
                  Day{' '}
                  {Math.min(
                    31,
                    thriftLedgerEntries.filter(
                      (e) => pickStr(e.data, 'kind') === 'deposit'
                    ).length
                  )}{' '}
                  of 31
                </span>
              </div>
              <div className="w-full bg-fountain-gray-100 rounded-full h-2">
                <div
                className="bg-fountain-teal h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    (thriftLedgerEntries.filter(
                      (e) => pickStr(e.data, 'kind') === 'deposit'
                    ).length /
                      31) *
                      100
                  )}%`,
                }}
              />
              </div>
              <p className="text-[10px] text-fountain-gray-400 mt-1">
                Tracked from wallet entries labeled “Thrift”.
              </p>
            </div>
          </div>

          {/* Pay Button */}
          <button
          onClick={() => {
            setThriftPayConfirmed(false);
            setShowThriftPayModal(true);
          }}
          className="w-full py-3.5 bg-fountain-teal text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors shadow-lg shadow-fountain-teal/25">
          
            {`Pay Today's Thrift (${formatNaira(thriftPayAmount)})`}
          </button>

          {/* Daily Calendar */}
          <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4">
            <h4 className="text-xs font-semibold text-fountain-gray-900 mb-3">
              March 2026 — Daily Activity
            </h4>
            <div className="grid grid-cols-7 gap-1.5">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) =>
            <div
              key={i}
              className="text-[9px] text-center text-fountain-gray-400 font-medium pb-1">
              
                  {d}
                </div>
            )}
              {/* Empty cells for March 2026 starting on Sunday */}
              {Array.from(
              {
                length: 0
              },
              (_, i) =>
              <div key={`empty-${i}`} />

            )}
              {thriftDayStates.map((status, idx) => (
                <div key={idx} className="relative">
                  <div
                    className={`w-full aspect-square rounded-md flex items-center justify-center text-[9px] font-bold ${
                      status === 'paid'
                        ? 'bg-fountain-green text-white'
                        : status === 'missed'
                          ? 'bg-fountain-red/20 text-fountain-red'
                          : status === 'today'
                            ? 'bg-fountain-blue text-white ring-2 ring-fountain-blue/30'
                            : 'bg-fountain-gray-100 text-fountain-gray-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-4 mt-3 text-[10px] text-fountain-gray-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-fountain-green rounded-sm mr-1"></div>{' '}
                Paid (
                {
                  thriftLedgerEntries.filter(
                    (e) => pickStr(e.data, 'kind') === 'deposit'
                  ).length
                }
                )
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-fountain-red/50 rounded-sm mr-1"></div>{' '}
                Missed (0)
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-fountain-blue rounded-sm mr-1"></div>{' '}
                Today
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-fountain-gray-100 rounded-sm mr-1"></div>{' '}
                Upcoming
              </div>
            </div>
          </div>

          {/* Collector Info */}
          <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4">
            <h4 className="text-xs font-semibold text-fountain-gray-900 mb-3">
              Your Collector
            </h4>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-fountain-teal/10 text-fountain-teal flex items-center justify-center font-bold text-sm">
                TA
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-fountain-gray-900">
                  Tolu Adegoke
                </p>
                <p className="text-xs text-fountain-gray-500">
                  Lagos Main Branch
                </p>
              </div>
              <a
              href="tel:+2348011234567"
              className="p-2 bg-fountain-teal/10 text-fountain-teal rounded-lg">
              
                <PhoneIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Plan Details */}
          <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4">
            <h4 className="text-xs font-semibold text-fountain-gray-900 mb-3 flex items-center">
              <InfoIcon className="w-4 h-4 mr-1.5 text-fountain-teal" /> Plan
              Details
            </h4>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <p className="text-[10px] text-fountain-gray-400">Plan Type</p>
                <p className="font-medium text-fountain-gray-900">
                  Daily Saver
                </p>
              </div>
              <div>
                <p className="text-[10px] text-fountain-gray-400">
                  Daily Amount
                </p>
                <p className="font-medium text-fountain-gray-900">
                  {formatNaira(thriftPayAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-fountain-gray-400">
                  Cycle Length
                </p>
                <p className="font-medium text-fountain-gray-900">31 days</p>
              </div>
              <div>
                <p className="text-[10px] text-fountain-gray-400">
                  Expected Payout
                </p>
                <p className="font-medium text-fountain-teal">
                  {formatNaira(thriftPaidTotal + thriftPayAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-fountain-gray-400">
                  Missed Days
                </p>
                <p className="font-medium text-fountain-red">—</p>
              </div>
              <div>
                <p className="text-[10px] text-fountain-gray-400">Withdrawal</p>
                <p className="font-medium text-fountain-gray-900">
                  At maturity
                </p>
              </div>
            </div>
          </div>

          {/* Recent Contributions */}
          <div>
            <h3 className="text-sm font-semibold text-fountain-gray-900 mb-3">
              Recent Contributions
            </h3>
            <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm divide-y divide-fountain-gray-100">
              {thriftLedgerEntries.length === 0 ? (
                <p className="p-4 text-sm text-fountain-gray-500 text-center">
                  No labeled thrift payments yet. Pay today&apos;s thrift to log
                  one.
                </p>
              ) : null}
              {thriftLedgerEntries.map((row) => {
                const e = row.data;
                const at = pickStr(e, 'at');
                const d = at ? new Date(at) : new Date();
                return (
                  <div
                    key={row.id}
                    className="flex items-center justify-between p-3.5"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 bg-fountain-teal/10 rounded-lg">
                        <ClockIcon className="w-3.5 h-3.5 text-fountain-teal" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-fountain-gray-900">
                          {d.toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-[10px] text-fountain-gray-400">
                          {d.toLocaleTimeString('en-NG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          • {pickStr(e, 'kind')}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-fountain-green">
                      {pickStr(e, 'kind') === 'withdraw' ? '-' : '+'}
                      {formatNaira(pickNum(e, 'amount'))}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      }

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Deposit Modal */}
      <Modal show={showDepositModal} onClose={() => setShowDepositModal(false)}>
        {!depositConfirmed ?
        <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-fountain-gray-900">
                Make a Deposit
              </h3>
              <button
              onClick={() => setShowDepositModal(false)}
              className="p-1 text-fountain-gray-400">
              
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fountain-gray-700 mb-1">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fountain-gray-500 font-medium">
                    ₦
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-3 bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl text-lg font-bold text-fountain-gray-900 outline-none focus:border-fountain-green focus:ring-2 focus:ring-fountain-green/20"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[10000, 25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className="px-3 py-1.5 bg-fountain-gray-100 text-fountain-gray-700 rounded-lg text-xs font-medium hover:bg-fountain-green/10 hover:text-fountain-green transition-colors"
                  >
                    {formatNaira(amt)}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-xs text-fountain-gray-500">
                  Deposits are securely processed with Paystack.
                </p>
              </div>
              <button
                type="button"
                disabled={walletBusy || depositAmount <= 0}
                onClick={() => {
                  setWalletError(null);
                  setWalletBusy(true);
                  void initializeMemberPaystackDeposit({ amount: depositAmount })
                    .then((res) => {
                      window.location.href = res.authorization_url;
                    })
                    .catch((e) => {
                      let msg = 'Could not start Paystack checkout';
                      if (e instanceof ApiError) {
                        const body = e.body as
                          | { error?: string; hint?: string }
                          | null;
                        if (e.status === 503 && body?.error === 'supabase_session_required') {
                          msg =
                            'Please sign in with your member Supabase account again, then retry deposit.';
                        } else if (e.status === 503 && body?.error === 'paystack_not_configured') {
                          msg =
                            'Paystack is not configured on the server. Add PAYSTACK_SECRET_KEY and restart dev.';
                        } else {
                          msg = JSON.stringify(e.body);
                        }
                      }
                      setWalletError(String(msg));
                    })
                    .finally(() => setWalletBusy(false));
                }}
                className="w-full py-3.5 bg-fountain-green text-white rounded-xl font-semibold text-sm shadow-lg shadow-fountain-green/25 disabled:opacity-50"
              >
                {walletBusy ? 'Opening checkout…' : 'Continue to Paystack'}
              </button>
            </div>
          </> :

        <div className="text-center py-4">
            <div className="w-16 h-16 bg-fountain-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-fountain-green" />
            </div>
            <h3 className="text-lg font-bold text-fountain-gray-900 mb-1">
              Deposit Successful!
            </h3>
            <p className="text-sm text-fountain-gray-500 mb-1">
              {formatNaira(depositAmount)} added to your savings balance
            </p>
            <p className="text-xs text-fountain-gray-400 mb-6">
              Recorded in your wallet ledger.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowDepositModal(false);
                setDepositConfirmed(false);
              }}
              className="w-full py-3 bg-fountain-gray-100 text-fountain-gray-700 rounded-xl font-medium text-sm"
            >
              Done
            </button>
          </div>
        }
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        show={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}>
        
        {!withdrawConfirmed ?
        <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-fountain-gray-900">
                Request Withdrawal
              </h3>
              <button
              onClick={() => setShowWithdrawModal(false)}
              className="p-1 text-fountain-gray-400">
              
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-fountain-amber/10 border border-fountain-amber/20 rounded-xl p-3 mb-4 flex items-start space-x-2">
              <InfoIcon className="w-4 h-4 text-fountain-amber flex-shrink-0 mt-0.5" />
              <p className="text-xs text-fountain-amber font-medium">
                Withdrawals require 30-day notice and admin approval. Amounts
                above ₦500,000 require dual authorization.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fountain-gray-700 mb-1">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fountain-gray-500 font-medium">
                    ₦
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={withdrawAmount}
                    onChange={(e) =>
                      setWithdrawAmount(Number(e.target.value) || 0)
                    }
                    className="w-full pl-8 pr-4 py-3 bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl text-lg font-bold text-fountain-gray-900 outline-none focus:border-fountain-blue focus:ring-2 focus:ring-fountain-blue/20"
                  />
                </div>
                <p className="text-[10px] text-fountain-gray-400 mt-1">
                  Available: {formatNaira(savingsBalance)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-fountain-gray-700 mb-1">
                  Reason
                </label>
                <select className="w-full p-3 bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl text-sm outline-none">
                  <option>Personal Needs</option>
                  <option>Medical Emergency</option>
                  <option>School Fees</option>
                  <option>Business</option>
                  <option>Other</option>
                </select>
              </div>
              <button
                type="button"
                disabled={walletBusy || withdrawAmount <= 0}
                onClick={() => {
                  setWalletError(null);
                  setWalletBusy(true);
                  void postMemberWallet({
                    kind: 'withdraw',
                    amount: withdrawAmount,
                    label: 'Member withdrawal',
                  })
                    .then(async (res) => {
                      setProfile((p) =>
                        p
                          ? { ...p, savings_balance: res.savings_balance }
                          : p
                      );
                      await ledger.reload();
                      setWithdrawConfirmed(true);
                    })
                    .catch((e) => {
                      const msg =
                        e instanceof ApiError
                          ? JSON.stringify(e.body)
                          : 'Withdrawal failed';
                      setWalletError(String(msg));
                    })
                    .finally(() => setWalletBusy(false));
                }}
                className="w-full py-3.5 bg-fountain-blue text-white rounded-xl font-semibold text-sm shadow-lg shadow-fountain-blue/25 disabled:opacity-50"
              >
                {walletBusy ? 'Processing…' : 'Submit withdrawal'}
              </button>
            </div>
          </> :

        <div className="text-center py-4">
            <div className="w-16 h-16 bg-fountain-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-8 h-8 text-fountain-blue" />
            </div>
            <h3 className="text-lg font-bold text-fountain-gray-900 mb-1">
              Request Submitted
            </h3>
            <p className="text-sm text-fountain-gray-500 mb-1">
              {formatNaira(withdrawAmount)} debited from your savings balance
            </p>
            <p className="text-xs text-fountain-gray-400 mb-6">
              Recorded in your wallet ledger.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowWithdrawModal(false);
                setWithdrawConfirmed(false);
              }}
              className="w-full py-3 bg-fountain-gray-100 text-fountain-gray-700 rounded-xl font-medium text-sm"
            >
              Done
            </button>
          </div>
        }
      </Modal>

      {/* Thrift Pay Modal */}
      <Modal
        show={showThriftPayModal}
        onClose={() => setShowThriftPayModal(false)}>
        
        {!thriftPayConfirmed ?
        <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-fountain-gray-900">
                Pay Today's Thrift
              </h3>
              <button
              onClick={() => setShowThriftPayModal(false)}
              className="p-1 text-fountain-gray-400">
              
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-fountain-teal/5 border border-fountain-teal/20 rounded-xl p-4 mb-4 text-center">
              <p className="text-xs text-fountain-gray-500 mb-1">Amount Due</p>
              <p className="text-3xl font-bold text-fountain-gray-900">
                {formatNaira(thriftPayAmount)}
              </p>
              <p className="text-xs text-fountain-gray-400 mt-1">
                This credits your main savings and labels the entry as thrift.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fountain-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  min={1}
                  value={thriftPayAmount}
                  onChange={(e) =>
                    setThriftPayAmount(Number(e.target.value) || 0)
                  }
                  className="w-full p-3 bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fountain-gray-700 mb-1">
                  Payment Method
                </label>
                <select className="w-full p-3 bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl text-sm outline-none">
                  <option>Cash to Collector</option>
                  <option>Bank Transfer</option>
                  <option>Card Payment</option>
                </select>
              </div>
              <button
                type="button"
                disabled={walletBusy || thriftPayAmount <= 0}
                onClick={() => {
                  setWalletError(null);
                  setWalletBusy(true);
                  void postMemberWallet({
                    kind: 'deposit',
                    amount: thriftPayAmount,
                    label: 'Thrift contribution',
                  })
                    .then(async (res) => {
                      setProfile((p) =>
                        p
                          ? { ...p, savings_balance: res.savings_balance }
                          : p
                      );
                      await ledger.reload();
                      setThriftPayConfirmed(true);
                    })
                    .catch((e) => {
                      const msg =
                        e instanceof ApiError
                          ? JSON.stringify(e.body)
                          : 'Payment failed';
                      setWalletError(String(msg));
                    })
                    .finally(() => setWalletBusy(false));
                }}
                className="w-full py-3.5 bg-fountain-teal text-white rounded-xl font-semibold text-sm shadow-lg shadow-fountain-teal/25 disabled:opacity-50"
              >
                {walletBusy ? 'Processing…' : 'Confirm Payment'}
              </button>
            </div>
          </> :

        <div className="text-center py-4">
            <div className="w-16 h-16 bg-fountain-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-fountain-green" />
            </div>
            <h3 className="text-lg font-bold text-fountain-gray-900 mb-1">
              Payment Confirmed!
            </h3>
            <p className="text-sm text-fountain-gray-500 mb-1">
              {formatNaira(thriftPayAmount)} thrift contribution recorded
            </p>
            <p className="text-xs text-fountain-teal font-medium mb-6">
              Check “Recent contributions” for the ledger entry.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowThriftPayModal(false);
                setThriftPayConfirmed(false);
              }}
              className="w-full py-3 bg-fountain-gray-100 text-fountain-gray-700 rounded-xl font-medium text-sm"
            >
              Done
            </button>
          </div>
        }
      </Modal>
    </div>);

}