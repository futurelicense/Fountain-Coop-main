'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TrendingUpIcon,
  ZapIcon,
  ShoppingBasketIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  LockIcon,
  Loader2Icon,
} from 'lucide-react';
import { ApiError, fetchMe } from '@/api';
import {
  fetchInvestmentAccess,
  payInvestmentEntryFee,
  type InvestmentAccess,
} from '@/api/investments';
import type { MeProfile } from '@/api/types';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickNum, pickStr } from '@/lib/pickData';
import { formatNaira } from '@/lib/formatNaira';
import { chargingSlotsFilled, productKindLabel } from '@/lib/investment-products';
import { AlertBanner } from '@/components/member/ui/AlertBanner';
import { MemberFoodstuffsPanel } from '@/components/member/MemberFoodstuffsPanel';

export default function MemberInvestmentsPage() {
  const products = useOperationalRecords('investments', 'investmentProduct');
  const applications = useOperationalRecords('investments', 'investmentApplication');
  const holdings = useOperationalRecords('investments', 'memberInvestment');
  const subscriptions = useOperationalRecords('investments', 'foodstuffsSubscription');
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [access, setAccess] = useState<InvestmentAccess | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [payingEntry, setPayingEntry] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);

  const loadAccess = useCallback(async () => {
    try {
      const data = await fetchInvestmentAccess();
      setAccess(data);
      setEntryError(null);
    } catch {
      setAccess(null);
    } finally {
      setAccessLoading(false);
    }
  }, []);

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
    void loadAccess();
  }, [loadProfile, loadAccess]);

  const memberId = profile?.member_code ?? '';
  const memberName = profile?.full_name ?? 'Member';

  const myHoldings = useMemo(
    () =>
      holdings.items.filter(
        (h) => memberId && pickStr(h.data, 'memberId') === memberId
      ),
    [holdings.items, memberId]
  );
  const myApplications = useMemo(
    () =>
      applications.items.filter(
        (a) => memberId && pickStr(a.data, 'memberId') === memberId
      ),
    [applications.items, memberId]
  );
  const hasFoodstuffsSub = subscriptions.items.length > 0;

  const totalInvested = myHoldings
    .filter((h) => pickStr(h.data, 'status') === 'Active')
    .reduce((s, h) => s + pickNum(h.data, 'principal'), 0);
  const totalExpectedReturn = myHoldings
    .filter((h) => pickStr(h.data, 'status') === 'Active')
    .reduce((s, h) => s + pickNum(h.data, 'expectedReturn'), 0);

  const canViewOptions = access?.canViewOptions ?? false;
  const entryFee = access?.entryFee ?? 0;

  const handlePayEntryFee = async () => {
    setPayingEntry(true);
    setEntryError(null);
    try {
      const res = await payInvestmentEntryFee();
      setProfile((p) =>
        p ? { ...p, savings_balance: res.savings_balance } : p
      );
      await loadAccess();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? (e.body as { error?: string })?.error === 'insufficient_balance'
            ? 'Insufficient wallet balance for the entry fee.'
            : String((e.body as { error?: string })?.error ?? 'Payment failed')
          : 'Payment failed';
      setEntryError(msg);
    } finally {
      setPayingEntry(false);
    }
  };

  const applyForProduct = async (
    productRowId: string,
    kind: string,
    name: string,
    amount: number
  ) => {
    if (!memberId) return;
    setApplying(productRowId);
    setApplySuccess(null);
    try {
      await applications.createRow('investmentApplication', {
        memberName,
        memberId,
        productId: productRowId,
        productKind: kind,
        productName: name,
        amount,
        appliedDate: new Date().toISOString().slice(0, 10),
        status: 'Pending',
      });
      setApplySuccess(name);
    } finally {
      setApplying(null);
    }
  };

  const ProductIcon = ({ kind }: { kind: string }) => {
    if (kind === 'phone_charging_units') {
      return <ZapIcon className="w-6 h-6 text-fountain-amber" />;
    }
    return <ShoppingBasketIcon className="w-6 h-6 text-fountain-green" />;
  };

  const loadError =
    products.error || applications.error || holdings.error || subscriptions.error;

  return (
    <div className="space-y-5 pt-4">
      <h2 className="text-lg font-bold text-fountain-gray-900">Investments</h2>

      <div className="bg-white rounded-2xl border border-fountain-gray-200 shadow-sm p-5">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <TrendingUpIcon className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-fountain-gray-500">Your investment portfolio</p>
            {profileLoading ? (
              <p className="text-lg text-fountain-gray-400 flex items-center gap-2">
                <Loader2Icon className="w-4 h-4 animate-spin" /> Loading…
              </p>
            ) : (
              <>
                <p className="text-2xl font-bold text-fountain-gray-900">
                  {formatNaira(totalInvested)}
                </p>
                {totalExpectedReturn > 0 ? (
                  <p className="text-xs text-fountain-green mt-0.5">
                    +{formatNaira(totalExpectedReturn)} expected return
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
        {myHoldings.length === 0 && !hasFoodstuffsSub && !holdings.loading ? (
          <div className="bg-fountain-blue/5 border border-fountain-blue/20 rounded-xl p-4 flex items-center space-x-3">
            <CheckCircleIcon className="w-5 h-5 text-fountain-blue flex-shrink-0" />
            <p className="text-xs text-fountain-gray-600">
              Browse return options below — fund a phone charging unit pool or join
              Ajo-for-Foodstuffs (daily wallet collection, monthly basket delivery).
            </p>
          </div>
        ) : null}
      </div>

      {loadError ? <AlertBanner tone="warning" message={loadError} /> : null}
      {entryError ? <AlertBanner tone="warning" message={entryError} /> : null}
      {applySuccess ? (
        <AlertBanner
          tone="success"
          message={`Application submitted for ${applySuccess}. Admin approval creates your active holding or subscription.`}
        />
      ) : null}

      {hasFoodstuffsSub ? <MemberFoodstuffsPanel /> : null}

      {myHoldings.length > 0 ? (
        <section>
          <h3 className="text-sm font-semibold text-fountain-gray-900 mb-3">
            Your holdings
          </h3>
          <div className="space-y-3">
            {myHoldings.map((row) => {
              const h = row.data;
              const isCharging = pickStr(h, 'productKind') === 'phone_charging_units';
              return (
                <div
                  key={row.id}
                  className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-fountain-gray-900">
                        {pickStr(h, 'productName') ||
                          productKindLabel(pickStr(h, 'productKind'))}
                      </p>
                      <p className="text-xs text-fountain-gray-500 mt-0.5">
                        {isCharging ? (
                          <>
                            {formatNaira(pickNum(h, 'principal'))} · slot{' '}
                            {pickNum(h, 'poolSlot')}/{pickNum(h, 'poolSize', 4)} · matures{' '}
                            {pickStr(h, 'maturityDate')}
                          </>
                        ) : (
                          <>Active subscription · started {pickStr(h, 'startDate')}</>
                        )}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-fountain-green">
                      {pickStr(h, 'status')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {myApplications.some((a) => pickStr(a.data, 'status') === 'Pending') ? (
        <section>
          <h3 className="text-sm font-semibold text-fountain-gray-900 mb-3">
            Pending applications
          </h3>
          <div className="space-y-2">
            {myApplications
              .filter((a) => pickStr(a.data, 'status') === 'Pending')
              .map((row) => (
                <div
                  key={row.id}
                  className="text-sm bg-fountain-amber/5 border border-fountain-amber/20 rounded-xl px-4 py-3"
                >
                  {pickStr(row.data, 'productName')} —{' '}
                  {formatNaira(pickNum(row.data, 'amount'))} · awaiting approval
                </div>
              ))}
          </div>
        </section>
      ) : null}

      {!hasFoodstuffsSub && !canViewOptions && entryFee > 0 ? (
        <section className="bg-white rounded-2xl border border-fountain-amber/30 shadow-sm p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-fountain-amber/10 shrink-0">
              <LockIcon className="w-6 h-6 text-fountain-amber" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-fountain-gray-900">
                Investment programme entry fee
              </h3>
              <p className="text-xs text-fountain-gray-600 mt-1">
                Pay {formatNaira(entryFee)} from your cooperative wallet to unlock
                investment return options. Your member ID ({memberId || '—'}) and
                name are recorded with your payment.
              </p>
              {access?.note ? (
                <p className="text-xs text-fountain-gray-500 mt-2 italic">{access.note}</p>
              ) : null}
            </div>
          </div>
          {profile && !profileLoading ? (
            <p className="text-xs text-fountain-gray-600">
              Wallet balance: {formatNaira(profile.savings_balance)}
            </p>
          ) : null}
          <button
            type="button"
            disabled={payingEntry || accessLoading || profileLoading}
            onClick={() => void handlePayEntryFee()}
            className="w-full py-3 bg-fountain-blue text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {payingEntry ? (
              <>
                <Loader2Icon className="w-4 h-4 animate-spin" /> Processing…
              </>
            ) : (
              <>Pay {formatNaira(entryFee)} entry fee</>
            )}
          </button>
        </section>
      ) : null}

      {canViewOptions ? (
        <section>
          <h3 className="text-sm font-semibold text-fountain-gray-900 mb-3">
            Investment return options
          </h3>
          {products.loading ? (
            <p className="text-sm text-fountain-gray-500 flex items-center gap-2">
              <Loader2Icon className="w-4 h-4 animate-spin" /> Loading products…
            </p>
          ) : null}
          <div className="space-y-4">
            {products.items
              .filter((row) => {
                const kind = pickStr(row.data, 'kind');
                return !(hasFoodstuffsSub && kind === 'ajo_for_foodstuffs');
              })
              .map((row) => {
              const p = row.data;
              const kind = pickStr(p, 'kind');
              const isCharging = kind === 'phone_charging_units';
              const minAmount = pickNum(
                p,
                isCharging ? 'investmentPerInvestor' : 'dailyMemberContribution',
                pickNum(p, 'minInvestment')
              );
              const pending = applying === row.id;
              const required = pickNum(p, 'investorsRequired', 4);
              const filled = isCharging ? chargingSlotsFilled(row.id, holdings.items) : 0;
              const poolFull = isCharging && filled >= required;

              return (
                <div
                  key={row.id}
                  className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="p-4 border-b border-fountain-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-fountain-gray-50 shrink-0">
                        <ProductIcon kind={kind} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-fountain-gray-900">
                          {pickStr(p, 'name')}
                        </h4>
                        <p className="text-xs text-fountain-gray-500 mt-0.5">
                          {pickStr(p, 'tagline')}
                        </p>
                        {isCharging ? (
                          <p className="text-xs font-semibold text-fountain-amber mt-1">
                            {filled}/{required} investor slots filled
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 text-xs text-fountain-gray-600">
                    {isCharging ? (
                      <>
                        <p>
                          <span className="font-semibold text-fountain-gray-700">Setup:</span>{' '}
                          {(p.setupItems as string[] | undefined)?.join(', ') ||
                            'Booth, generator, sockets, POS stand'}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-fountain-gray-50 rounded-lg p-2">
                            <p className="text-fountain-gray-500">Daily revenue/booth</p>
                            <p className="font-bold text-fountain-gray-900">
                              {formatNaira(pickNum(p, 'dailyRevenuePerUnit'))}
                            </p>
                          </div>
                          <div className="bg-fountain-gray-50 rounded-lg p-2">
                            <p className="text-fountain-gray-500">Your stake</p>
                            <p className="font-bold text-fountain-gray-900">
                              {formatNaira(pickNum(p, 'investmentPerInvestor'))}
                            </p>
                          </div>
                          <div className="bg-fountain-green/5 rounded-lg p-2">
                            <p className="text-fountain-gray-500">12-mo interest</p>
                            <p className="font-bold text-fountain-green">
                              {formatNaira(pickNum(p, 'investorInterestTotal'))}
                            </p>
                          </div>
                          <div className="bg-fountain-gray-50 rounded-lg p-2">
                            <p className="text-fountain-gray-500">Payback</p>
                            <p className="font-bold">~{pickNum(p, 'paybackMonths')} months</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <p>
                          <span className="font-semibold text-fountain-gray-700">
                            Daily wallet collection:
                          </span>{' '}
                          {formatNaira(pickNum(p, 'dailyMemberContribution'))}
                        </p>
                        <p>
                          <span className="font-semibold text-fountain-gray-700">
                            Monthly food basket
                          </span>{' '}
                          (after {pickNum(p, 'daysPerDeliveryCycle', 30)} daily payments). Provide
                          drop-off location, name &amp; phone to redeem. Missed delivery window:{' '}
                          {formatNaira(pickNum(p, 'missedDeliveryPenalty', 5000))} penalty.
                        </p>
                        <p className="font-semibold text-fountain-gray-700">Basket includes:</p>
                        <ul className="space-y-0.5 pl-1 max-h-32 overflow-y-auto">
                          {((p.dailyDeliverables as string[] | undefined) ?? []).map(
                            (item, i) => (
                              <li key={i}>• {item}</li>
                            )
                          )}
                        </ul>
                      </>
                    )}
                  </div>

                  <div className="px-4 pb-4">
                    <button
                      type="button"
                      disabled={!memberId || pending || profileLoading || poolFull}
                      onClick={() =>
                        void applyForProduct(row.id, kind, pickStr(p, 'name'), minAmount)
                      }
                      className="w-full py-3 bg-fountain-blue text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {pending ? (
                        <>
                          <Loader2Icon className="w-4 h-4 animate-spin" /> Submitting…
                        </>
                      ) : poolFull ? (
                        'Pool full — check back for new unit'
                      ) : isCharging ? (
                        <>Invest {formatNaira(minAmount)}</>
                      ) : (
                        <>Join at {formatNaira(minAmount)}/day</>
                      )}
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {!products.loading &&
          !products.items.filter((row) => {
            const kind = pickStr(row.data, 'kind');
            return !(hasFoodstuffsSub && kind === 'ajo_for_foodstuffs');
          }).length ? (
            <p className="text-sm text-fountain-gray-500 mt-2">
              Investment products are being set up. Check back soon or contact your branch admin.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
