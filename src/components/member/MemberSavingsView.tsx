'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PiggyBankIcon,
  CoinsIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  ClockIcon,
  PhoneIcon,
  InfoIcon,
  EyeIcon,
  EyeOffIcon,
  RefreshCwIcon,
  Loader2Icon,
} from 'lucide-react';
import { AlertBanner } from '@/components/member/ui/AlertBanner';
import { AmountField } from '@/components/member/ui/AmountField';
import { BottomSheet } from '@/components/member/ui/BottomSheet';
import { LedgerFeed } from '@/components/member/ui/LedgerFeed';
import { SavingsTabBar } from '@/components/member/ui/SavingsTabBar';
import { PaymentMethodFields } from '@/components/member/ui/PaymentMethodFields';
import { formatNaira } from '@/lib/formatNaira';
import {
  ApiError,
  fetchMe,
  fetchMemberBanks,
  fetchMemberThriftCollector,
  initializeMemberPaystackDeposit,
  postMemberWallet,
  resolveMemberBankAccount,
  verifyMemberPaystackDeposit,
} from '@/api';
import type { MemberBankOption } from '@/api/operations';
import type { MeProfile } from '@/api/types';
import type { MemberThriftCollector } from '@/api/thrift';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickNum, pickStr } from '@/lib/pickData';
interface MemberSavingsProps {
  defaultTab?: string;
}
export function MemberSavings({ defaultTab = 'coop' }: MemberSavingsProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    defaultTab === 'thrift' ? 'thrift' : 'coop'
  );
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'thrift' || defaultTab === 'thrift') {
      setActiveTab('thrift');
    } else {
      setActiveTab('coop');
    }
  }, [defaultTab, searchParams]);
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
  const [thriftPaymentMethod, setThriftPaymentMethod] = useState('cash_collector');
  const [withdrawPayoutMethod, setWithdrawPayoutMethod] = useState('bank_transfer');
  const [withdrawReason, setWithdrawReason] = useState('Personal Needs');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [payoutBankCode, setPayoutBankCode] = useState('');
  const [payoutAccountName, setPayoutAccountName] = useState('');
  const [banks, setBanks] = useState<MemberBankOption[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [collector, setCollector] = useState<MemberThriftCollector | null>(null);
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [paystackVerifying, setPaystackVerifying] = useState(false);
  const ledger = useOperationalRecords('member', 'walletLedger');

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const me = await fetchMe();
      setProfile(me.profile ?? null);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    void fetchMemberThriftCollector()
      .then(setCollector)
      .catch(() => setCollector(null));
  }, [profile?.member_code, profile?.branch]);

  useEffect(() => {
    if (!showWithdrawModal) return;
    setBanksLoading(true);
    void fetchMemberBanks()
      .then(setBanks)
      .catch(() => setBanks([]))
      .finally(() => setBanksLoading(false));
  }, [showWithdrawModal]);

  useEffect(() => {
    if (!showWithdrawModal || withdrawPayoutMethod !== 'bank_transfer') {
      return;
    }
    const digits = payoutAccount.replace(/\D/g, '');
    if (!payoutBankCode || digits.length < 10) {
      setPayoutAccountName('');
      setResolveError(null);
      setResolveLoading(false);
      return;
    }

    setResolveLoading(true);
    setResolveError(null);
    const timer = window.setTimeout(() => {
      void resolveMemberBankAccount({
        account_number: digits,
        bank_code: payoutBankCode,
      })
        .then((res) => {
          setPayoutAccountName(res.account_name);
          setResolveError(null);
        })
        .catch((e) => {
          setPayoutAccountName('');
          let msg = 'Could not verify this account. Check bank and number.';
          if (e instanceof ApiError) {
            const body = e.body as { error?: string; hint?: string } | null;
            msg = body?.hint || body?.error || msg;
          }
          setResolveError(msg);
        })
        .finally(() => setResolveLoading(false));
    }, 600);

    return () => window.clearTimeout(timer);
  }, [
    showWithdrawModal,
    withdrawPayoutMethod,
    payoutAccount,
    payoutBankCode,
  ]);

  const payoutBankName = useMemo(
    () => banks.find((b) => b.code === payoutBankCode)?.name ?? '',
    [banks, payoutBankCode]
  );

  const bankTransferReady =
    withdrawPayoutMethod !== 'bank_transfer' ||
    (payoutBankCode &&
      payoutAccount.replace(/\D/g, '').length >= 10 &&
      Boolean(payoutAccountName) &&
      !resolveLoading &&
      !resolveError);

  useEffect(() => {
    const reference =
      searchParams?.get('reference') ?? searchParams?.get('trxref') ?? '';
    if (!reference) return;
    setWalletError(null);
    setPaystackVerifying(true);
    setWalletBusy(true);
    void verifyMemberPaystackDeposit({ reference })
      .then(async (res) => {
        await loadProfile();
        if (typeof res.savings_balance === 'number') {
          setProfile((p) =>
            p ? { ...p, savings_balance: res.savings_balance ?? p.savings_balance } : p
          );
        }
        await ledger.reload();
        setDepositConfirmed(true);
        setShowDepositModal(true);
      })
      .catch((e) => {
        let msg = 'Could not verify Paystack payment.';
        if (e instanceof ApiError) {
          const body = e.body as {
            error?: string;
            hint?: string;
            status?: string;
          } | null;
          msg = [body?.error, body?.hint, body?.status].filter(Boolean).join(' — ') || msg;
        }
        setWalletError(msg);
      })
      .finally(() => {
        setWalletBusy(false);
        setPaystackVerifying(false);
        const clean = new URL(window.location.href);
        clean.searchParams.delete('reference');
        clean.searchParams.delete('trxref');
        window.history.replaceState({}, '', clean.toString());
      });
  }, [searchParams, ledger, loadProfile]);

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

  const thriftPayments = useMemo(
    () =>
      thriftLedgerEntries.filter((r) => pickStr(r.data, 'kind') === 'withdraw'),
    [thriftLedgerEntries]
  );

  const thriftPaidTotal = useMemo(
    () => thriftPayments.reduce((s, r) => s + pickNum(r.data, 'amount'), 0),
    [thriftPayments]
  );

  const thriftMonthLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }),
    []
  );

  const annualTarget = 600_000;
  const savingsProgress = Math.min(
    100,
    Math.round((savingsBalance / annualTarget) * 100) || 0
  );

  const thriftDayStates = useMemo(() => {
    const n = 31;
    const paidCount = thriftPayments.length;
    return Array.from({ length: n }, (_, i) => {
      if (i < paidCount) return 'paid';
      if (i === paidCount) return 'today';
      return 'upcoming';
    });
  }, [thriftPayments]);

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-fountain-gray-900">Savings</h1>
          <p className="text-xs text-fountain-gray-500 mt-0.5">Wallet & daily thrift</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadProfile();
            void ledger.reload();
          }}
          disabled={profileLoading || ledger.loading}
          className="p-2.5 rounded-xl border border-fountain-gray-200 bg-white hover:bg-fountain-gray-50 disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCwIcon
            className={`w-4 h-4 text-fountain-gray-600 ${profileLoading || ledger.loading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>
      {paystackVerifying ? (
        <AlertBanner tone="info" message="Confirming your Paystack payment…" />
      ) : null}
      {walletError ? (
        <AlertBanner tone="error" message={walletError} onDismiss={() => setWalletError(null)} />
      ) : null}
      {ledger.error ? <AlertBanner tone="warning" message={ledger.error} /> : null}
      <SavingsTabBar active={activeTab} onChange={setActiveTab} />

      {/* ═══════════════ COOPERATIVE TAB ═══════════════ */}
      {activeTab === 'coop' && (
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
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="text-3xl font-bold text-fountain-gray-900 tabular-nums">
                  {profileLoading ? (
                    <span className="inline-flex items-center gap-2 text-sm font-normal text-fountain-gray-400">
                      <Loader2Icon className="w-5 h-5 animate-spin" /> Loading…
                    </span>
                  ) : showBalance ? (
                    formatNaira(savingsBalance)
                  ) : (
                    '₦ ••••••'
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 rounded-lg text-fountain-gray-500 hover:bg-white/60"
                  aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                >
                  {showBalance ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="p-5 border-t border-fountain-gray-100">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-fountain-gray-500">
                  Annual Target Progress
                </span>
                <span className="font-medium text-fountain-gray-900">
                  {formatNaira(savingsBalance)} / {formatNaira(annualTarget)}
                </span>
              </div>
              <div className="w-full bg-fountain-gray-100 rounded-full h-2.5">
                <div
                className="bg-fountain-green h-2.5 rounded-full"
                style={{ width: `${savingsProgress}%` }}
              />
              </div>
              <p className="text-[10px] text-fountain-gray-400 mt-1">
                {savingsProgress}% of annual target
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
              setWithdrawPayoutMethod('bank_transfer');
              setPayoutAccount('');
              setPayoutBankCode('');
              setPayoutAccountName('');
              setResolveError(null);
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

          <div>
            <h3 className="text-sm font-semibold text-fountain-gray-900 mb-3">
              Wallet activity
            </h3>
            <LedgerFeed
              items={coopLedgerEntries}
              loading={ledger.loading}
              emptyTitle="No transactions yet"
              emptyHint="Deposit with Paystack or withdraw to see activity here."
            />
          </div>
        </div>
      )}

      {/* ═══════════════ THRIFT TAB ═══════════════ */}
      {activeTab === 'thrift' && (
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
                    thriftPayments.length
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
                    (thriftPayments.length /
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
            setThriftPaymentMethod('cash_collector');
            setShowThriftPayModal(true);
          }}
          className="w-full py-3.5 bg-fountain-teal text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors shadow-lg shadow-fountain-teal/25">
          
            {`Pay Today's Thrift (${formatNaira(thriftPayAmount)})`}
          </button>

          {/* Daily Calendar */}
          <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4">
            <h4 className="text-xs font-semibold text-fountain-gray-900 mb-3">
              {thriftMonthLabel} — Daily Activity
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
                {thriftPayments.length}
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
            {collector ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-fountain-teal/10 text-fountain-teal flex items-center justify-center font-bold text-sm">
                  {collector.initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-fountain-gray-900">
                    {collector.name}
                  </p>
                  <p className="text-xs text-fountain-gray-500">
                    {collector.collectorCode} · {collector.branch}
                  </p>
                  <p className="text-[11px] text-fountain-gray-400 mt-0.5">
                    Member ID {collector.memberCode} — show this when paying cash
                  </p>
                </div>
                {collector.phone ? (
                  <a
                    href={`tel:${collector.phone.replace(/\s/g, '')}`}
                    className="p-2 bg-fountain-teal/10 text-fountain-teal rounded-lg"
                  >
                    <PhoneIcon className="w-4 h-4" />
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-fountain-gray-500">
                Loading collector assignment…
              </p>
            )}
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
              Thrift payments
            </h3>
            <LedgerFeed
              items={thriftLedgerEntries}
              loading={ledger.loading}
              emptyTitle="No thrift payments logged"
              emptyHint="Tap Pay today's thrift after you pay your collector."
            />
          </div>
        </div>
      )}

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Deposit Modal */}
      <BottomSheet
        open={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        title={depositConfirmed ? undefined : 'Deposit'}
        footer={
          !depositConfirmed ? (
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
          ) : (
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
          )
        }
      >
        {!depositConfirmed ? (
          <div className="space-y-4">
            <AmountField
              label="Amount"
              value={depositAmount}
              onChange={setDepositAmount}
              presets={[10000, 25000, 50000, 100000]}
              hint="Deposits are securely processed with Paystack."
              accent="green"
            />
          </div>
        ) : (
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
            <p className="text-xs text-fountain-gray-400">
              Recorded in your wallet ledger.
            </p>
          </div>
        )}
      </BottomSheet>

      {/* Withdraw Modal */}
      <BottomSheet
        open={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title={withdrawConfirmed ? undefined : 'Withdraw'}
        footer={
          !withdrawConfirmed ? (
            <div className="space-y-2">
              {withdrawPayoutMethod === 'bank_transfer' &&
              !bankTransferReady &&
              !resolveLoading ? (
                <p className="text-xs text-fountain-gray-500 text-center">
                  Select your bank, enter a 10-digit account number, and wait
                  for the account name to appear.
                </p>
              ) : null}
              {withdrawPayoutMethod === 'mobile_money' &&
              payoutAccount.replace(/\D/g, '').length < 10 ? (
                <p className="text-xs text-fountain-gray-500 text-center">
                  Enter a valid mobile money number to enable submit.
                </p>
              ) : null}
              <button
                type="button"
                disabled={
                  walletBusy ||
                  withdrawAmount <= 0 ||
                  !bankTransferReady ||
                  (withdrawPayoutMethod === 'mobile_money' &&
                    payoutAccount.replace(/\D/g, '').length < 10)
                }
                onClick={() => {
                  setWalletError(null);
                  setWalletBusy(true);
                  const payoutDigits = payoutAccount.replace(/\D/g, '');
                  const payoutLabel =
                    withdrawPayoutMethod === 'bank_transfer'
                      ? `${payoutBankName} · ${payoutDigits} · ${payoutAccountName}`
                      : withdrawPayoutMethod === 'mobile_money'
                        ? `Mobile ${payoutDigits}`
                        : 'Cash at branch';
                  void postMemberWallet({
                    kind: 'withdraw',
                    amount: withdrawAmount,
                    label: `Member withdrawal (${withdrawReason}; ${payoutLabel})`,
                  })
                    .then(async (res) => {
                      setProfile((p) =>
                        p ? { ...p, savings_balance: res.savings_balance } : p
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
          ) : (
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
          )
        }
      >
        {!withdrawConfirmed ? (
          <>
            <div className="bg-fountain-amber/10 border border-fountain-amber/20 rounded-xl p-3 mb-4 flex items-start space-x-2">
              <InfoIcon className="w-4 h-4 text-fountain-amber flex-shrink-0 mt-0.5" />
              <p className="text-xs text-fountain-amber font-medium">
                Withdrawals require 30-day notice and admin approval. Amounts
                above ₦500,000 require dual authorization.
              </p>
            </div>
            <div className="space-y-4">
              <AmountField
                label="Amount"
                value={withdrawAmount}
                onChange={setWithdrawAmount}
                presets={[5000, 10000, 25000, 50000]}
                hint={`Available: ${formatNaira(savingsBalance)}`}
                accent="blue"
              />
              <div>
                <label className="block text-sm font-medium text-fountain-gray-700 mb-1">
                  Reason
                </label>
                <select
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  className="w-full p-3 bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue"
                >
                  <option>Personal Needs</option>
                  <option>Medical Emergency</option>
                  <option>School Fees</option>
                  <option>Business</option>
                  <option>Other</option>
                </select>
              </div>
              <PaymentMethodFields
                mode="withdraw"
                label="Payout method"
                value={withdrawPayoutMethod}
                onChange={(method) => {
                  setWithdrawPayoutMethod(method);
                  if (method !== 'bank_transfer') {
                    setPayoutAccountName('');
                    setResolveError(null);
                  }
                }}
                options={[
                  { value: 'bank_transfer', label: 'Bank transfer' },
                  { value: 'cash_branch', label: 'Cash at branch' },
                  { value: 'mobile_money', label: 'Mobile money' },
                ]}
                memberCode={profile?.member_code}
                branch={profile?.branch}
                payoutAccount={payoutAccount}
                onPayoutAccountChange={(value) => {
                  setPayoutAccount(value);
                  if (withdrawPayoutMethod === 'bank_transfer') {
                    setPayoutAccountName('');
                    setResolveError(null);
                  }
                }}
                payoutBankCode={payoutBankCode}
                onPayoutBankCodeChange={(code) => {
                  setPayoutBankCode(code);
                  setPayoutAccountName('');
                  setResolveError(null);
                }}
                banks={banks}
                banksLoading={banksLoading}
                payoutAccountName={payoutAccountName}
                resolveLoading={resolveLoading}
                resolveError={resolveError}
              />
            </div>
          </>
        ) : (
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
            <p className="text-xs text-fountain-gray-400">
              Recorded in your wallet ledger.
            </p>
          </div>
        )}
      </BottomSheet>

      {/* Thrift Pay Modal */}
      <BottomSheet
        open={showThriftPayModal}
        onClose={() => setShowThriftPayModal(false)}
        title={thriftPayConfirmed ? undefined : "Log today's thrift"}
        footer={
          !thriftPayConfirmed ? (
            <button
              type="button"
              disabled={walletBusy || thriftPayAmount <= 0}
              onClick={() => {
                setWalletError(null);
                setWalletBusy(true);
                void postMemberWallet({
                  kind: 'withdraw',
                  amount: thriftPayAmount,
                  label: `Thrift contribution (${thriftPaymentMethod.replace(/_/g, ' ')})`,
                })
                  .then(async (res) => {
                    setProfile((p) =>
                      p ? { ...p, savings_balance: res.savings_balance } : p
                    );
                    await ledger.reload();
                    setThriftPayConfirmed(true);
                  })
                  .catch((e) => {
                    let msg = 'Payment failed';
                    if (e instanceof ApiError) {
                      const body = e.body as
                        | { error?: string; hint?: string }
                        | null;
                      msg = [body?.error, body?.hint].filter(Boolean).join(' — ') || msg;
                      if (body?.error === 'insufficient_balance') {
                        msg =
                          'Insufficient wallet balance. Deposit to your wallet first, then log thrift.';
                      }
                    }
                    setWalletError(msg);
                  })
                  .finally(() => setWalletBusy(false));
              }}
              className="w-full py-3.5 bg-fountain-teal text-white rounded-xl font-semibold text-sm shadow-lg shadow-fountain-teal/25 disabled:opacity-50"
            >
              {walletBusy ? 'Processing…' : 'Log thrift payment'}
            </button>
          ) : (
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
          )
        }
      >
        {!thriftPayConfirmed ? (
          <>
            <div className="bg-fountain-teal/5 border border-fountain-teal/20 rounded-xl p-4 mb-4 text-center">
              <p className="text-xs text-fountain-gray-500 mb-1">Amount Due</p>
              <p className="text-3xl font-bold text-fountain-gray-900">
                {formatNaira(thriftPayAmount)}
              </p>
              <p className="text-xs text-fountain-gray-400 mt-1">
                Deducted from your wallet and logged to your thrift cycle.
              </p>
            </div>
            <div className="space-y-4">
              <AmountField
                label="Amount"
                value={thriftPayAmount}
                onChange={setThriftPayAmount}
                presets={[500, 1000, 2000]}
                accent="teal"
              />
              <PaymentMethodFields
                mode="thrift"
                value={thriftPaymentMethod}
                onChange={setThriftPaymentMethod}
                options={[
                  { value: 'cash_collector', label: 'Cash to Collector' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'card_payment', label: 'Card Payment' },
                ]}
                collector={collector}
                memberCode={profile?.member_code}
                branch={profile?.branch}
              />
            </div>
          </>
        ) : (
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
            <p className="text-xs text-fountain-teal font-medium">
              See Thrift payments for the ledger entry.
            </p>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

/** @deprecated Use `MemberSavings` — kept for older imports */
export { MemberSavings as MemberSavingsView };