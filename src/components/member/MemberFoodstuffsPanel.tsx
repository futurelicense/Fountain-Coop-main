'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShoppingBasketIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  Loader2Icon,
  CalendarIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import {
  payFoodstuffsDaily,
  redeemFoodstuffsDelivery,
  syncFoodstuffsDeliveries,
  updateFoodstuffsAutoDebit,
  updateFoodstuffsProfile,
} from '@/api/investments';
import { ApiError, fetchMe } from '@/api';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickNum, pickStr } from '@/lib/pickData';
import { formatNaira } from '@/lib/formatNaira';
import { FOODSTUFFS_DEFAULTS } from '@/lib/investment-products';
import { AlertBanner } from '@/components/member/ui/AlertBanner';

function apiErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof ApiError) {
    const code = (e.body as { error?: string })?.error;
    if (code === 'insufficient_balance') return 'Insufficient wallet balance.';
    if (code === 'already_paid_today') return 'You already paid today.';
    if (code === 'delivery_profile_required') {
      return 'Complete delivery details before your next daily payment.';
    }
    if (code === 'invalid_drop_off_location') return 'Enter a valid drop-off location.';
    if (code === 'invalid_contact_name') return 'Enter a valid contact name.';
    if (code === 'invalid_contact_phone') return 'Enter a valid phone number (10+ digits).';
    if (code === 'delivery_not_open_yet') return 'Redemption is not open yet.';
    if (code === 'delivery_window_closed') return 'Redemption window has closed.';
    return code ?? fallback;
  }
  return e instanceof Error ? e.message : fallback;
}

export function MemberFoodstuffsPanel() {
  const subscriptions = useOperationalRecords('investments', 'foodstuffsSubscription');
  const deliveries = useOperationalRecords('investments', 'foodstuffsDelivery');
  const payments = useOperationalRecords('investments', 'foodstuffsDailyPayment');

  const [dropOffLocation, setDropOffLocation] = useState('');
  const [redeemContactName, setRedeemContactName] = useState('');
  const [redeemContactPhone, setRedeemContactPhone] = useState('');
  const [busy, setBusy] = useState<'pay' | 'profile' | 'redeem' | 'autoDebit' | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [deliveryDetailsOpen, setDeliveryDetailsOpen] = useState(false);

  const subscription = subscriptions.items[0] ?? null;
  const sub = subscription?.data;

  const loadMe = useCallback(async () => {
    try {
      const { profile } = await fetchMe();
      setBalance(profile?.savings_balance ?? null);
    } catch {
      setBalance(null);
    }
  }, []);

  useEffect(() => {
    void syncFoodstuffsDeliveries()
      .then(() => {
        void subscriptions.reload();
        void deliveries.reload();
      })
      .catch(() => undefined);
    void loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    if (!sub) return;
    setDropOffLocation(pickStr(sub, 'dropOffLocation'));
    setRedeemContactName(pickStr(sub, 'redeemContactName'));
    setRedeemContactPhone(pickStr(sub, 'redeemContactPhone'));
    setDeliveryDetailsOpen(!Boolean(sub.profileComplete));
  }, [sub, subscription?.id]);

  const myDeliveries = useMemo(
    () =>
      [...deliveries.items].sort(
        (a, b) =>
          new Date(pickStr(b.data, 'scheduledDate')).getTime() -
          new Date(pickStr(a.data, 'scheduledDate')).getTime()
      ),
    [deliveries.items]
  );

  const scheduledDelivery = myDeliveries.find(
    (d) => pickStr(d.data, 'status') === 'Scheduled'
  );

  const today = new Date().toISOString().slice(0, 10);
  const paidToday = pickStr(sub ?? {}, 'lastPaymentDate') === today;
  const dailyAmount = pickNum(sub ?? {}, 'dailyContribution', FOODSTUFFS_DEFAULTS.dailyContribution);
  const daysInCycle = pickNum(sub ?? {}, 'daysPaidInCycle');
  const daysPerCycle = pickNum(sub ?? {}, 'daysPerDeliveryCycle', FOODSTUFFS_DEFAULTS.daysPerDeliveryCycle);
  const profileComplete = Boolean(sub?.profileComplete);
  const autoDebitEnabled = sub?.autoDebitEnabled !== false;

  if (!subscription) return null;

  const saveProfile = async () => {
    setBusy('profile');
    setMessage(null);
    try {
      await updateFoodstuffsProfile({
        dropOffLocation,
        redeemContactName,
        redeemContactPhone,
      });
      setMessage({ tone: 'success', text: 'Delivery details saved.' });
      setDeliveryDetailsOpen(false);
      await subscriptions.reload();
      await deliveries.reload();
    } catch (e) {
      setMessage({
        tone: 'error',
        text: apiErrorMessage(e, 'Could not save profile'),
      });
    } finally {
      setBusy(null);
    }
  };

  const payDaily = async () => {
    setBusy('pay');
    setMessage(null);
    try {
      const res = await payFoodstuffsDaily();
      setBalance(res.savings_balance);
      setMessage({
        tone: 'success',
        text: res.deliveryScheduled
          ? `Paid ${formatNaira(dailyAmount)}. Monthly basket scheduled for delivery!`
          : `Paid ${formatNaira(dailyAmount)}. ${res.daysPaidInCycle}/${daysPerCycle} days toward next basket.`,
      });
      await subscriptions.reload();
      await payments.reload();
      await deliveries.reload();
      await loadMe();
    } catch (e) {
      setMessage({
        tone: 'error',
        text: apiErrorMessage(e, 'Payment failed'),
      });
    } finally {
      setBusy(null);
    }
  };

  const redeem = async (deliveryId: string) => {
    setBusy('redeem');
    setMessage(null);
    try {
      await redeemFoodstuffsDelivery(deliveryId);
      setMessage({ tone: 'success', text: 'Basket marked as redeemed. Enjoy!' });
      await deliveries.reload();
    } catch (e) {
      setMessage({
        tone: 'error',
        text: apiErrorMessage(e, 'Redemption failed'),
      });
    } finally {
      setBusy(null);
    }
  };

  const toggleAutoDebit = async (enabled: boolean) => {
    setBusy('autoDebit');
    setMessage(null);
    try {
      await updateFoodstuffsAutoDebit(enabled);
      setMessage({
        tone: 'success',
        text: enabled
          ? 'Auto wallet debit has been turned on.'
          : 'Auto wallet debit has been turned off. You can still pay manually each day.',
      });
      await subscriptions.reload();
    } catch (e) {
      setMessage({
        tone: 'error',
        text: apiErrorMessage(e, 'Could not update auto-debit setting'),
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <ShoppingBasketIcon className="w-5 h-5 text-fountain-green" />
        <h3 className="text-sm font-semibold text-fountain-gray-900">
          Ajo-for-Foodstuffs subscription
        </h3>
      </div>

      {message ? <AlertBanner tone={message.tone} message={message.text} /> : null}

      <div className="bg-white rounded-xl border border-fountain-green/20 shadow-sm p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div>
            <p className="text-xs text-fountain-gray-500">Daily collection (wallet)</p>
            <p className="text-lg font-bold text-fountain-gray-900">
              {formatNaira(dailyAmount)}/day
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-fountain-gray-500">Next basket progress</p>
            <p className="text-sm font-bold text-fountain-green">
              {daysInCycle}/{daysPerCycle} days
            </p>
          </div>
        </div>

        <p className="text-xs text-fountain-gray-500">
          Food basket is delivered monthly after {daysPerCycle} daily payments. Missing
          your redemption window incurs a{' '}
          {formatNaira(
            pickNum(sub ?? {}, 'missedDeliveryPenalty', FOODSTUFFS_DEFAULTS.missedDeliveryPenalty)
          )}{' '}
          penalty.
        </p>

        {balance !== null ? (
          <p className="text-xs text-fountain-gray-600">
            Wallet balance: {formatNaira(balance)}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3 bg-fountain-gray-50 border border-fountain-gray-100 rounded-xl px-3 py-3">
          <div>
            <p className="text-sm font-semibold text-fountain-gray-900">
              Auto wallet debit
            </p>
            <p className="text-xs text-fountain-gray-500 mt-0.5">
              {autoDebitEnabled
                ? 'Your wallet is debited automatically each day when you have enough balance.'
                : 'Auto debit is off. Use Pay today to keep your basket cycle moving.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoDebitEnabled}
            disabled={busy === 'autoDebit'}
            onClick={() => void toggleAutoDebit(!autoDebitEnabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
              autoDebitEnabled ? 'bg-fountain-green' : 'bg-fountain-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                autoDebitEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <button
          type="button"
          disabled={
            paidToday ||
            busy === 'pay' ||
            (daysInCycle >= daysPerCycle && !profileComplete)
          }
          onClick={() => void payDaily()}
          className="w-full py-3 bg-fountain-green text-white rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {busy === 'pay' ? (
            <Loader2Icon className="w-4 h-4 animate-spin" />
          ) : paidToday ? (
            'Paid today ✓'
          ) : (
            `Pay today's ${formatNaira(dailyAmount)}`
          )}
        </button>

        {sub && pickNum(sub, 'daysPaidInCycle') >= daysPerCycle && !profileComplete ? (
          <div className="flex gap-2 items-start text-xs text-fountain-amber bg-fountain-amber/5 border border-fountain-amber/20 rounded-lg p-3">
            <AlertTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              You reached {daysPerCycle} daily payments. Save delivery details below to
              schedule your monthly basket.
            </p>
          </div>
        ) : null}
      </div>

      <div className="bg-gradient-to-br from-white to-fountain-blue/5 rounded-2xl border border-fountain-blue/15 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setDeliveryDetailsOpen((v) => !v)}
          className="w-full p-4 text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-fountain-blue/10 shrink-0">
                <MapPinIcon className="w-5 h-5 text-fountain-blue" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-fountain-gray-900">
                    Delivery profile
                  </h4>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      profileComplete
                        ? 'bg-fountain-green/10 text-fountain-green'
                        : 'bg-fountain-amber/10 text-fountain-amber'
                    }`}
                  >
                    {profileComplete ? 'Ready for basket delivery' : 'Setup needed'}
                  </span>
                </div>
                <p className="text-xs text-fountain-gray-500 mt-1">
                  {profileComplete
                    ? `${dropOffLocation || 'No address'} · ${redeemContactName || 'No contact'}`
                    : 'Add location and pickup contact before your first monthly basket.'}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-fountain-blue shrink-0">
              {deliveryDetailsOpen ? 'Close' : profileComplete ? 'Edit' : 'Setup'}
            </span>
          </div>
        </button>

        {deliveryDetailsOpen ? (
          <div className="px-4 pb-4 space-y-3 border-t border-fountain-blue/10">
            <p className="text-xs text-fountain-gray-500 pt-3">
              These details are used only when your 30-day basket cycle is ready
              for monthly delivery or redemption.
            </p>
            <label className="block text-xs font-medium text-fountain-gray-700">
              Drop-off location
              <input
                value={dropOffLocation}
                onChange={(e) => setDropOffLocation(e.target.value)}
                placeholder="e.g. 12 Ademola Street, Ikeja"
                className="mt-1 w-full border border-fountain-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-fountain-gray-700">
                <UserIcon className="w-3 h-3 inline mr-1" />
                Contact name
                <input
                  value={redeemContactName}
                  onChange={(e) => setRedeemContactName(e.target.value)}
                  placeholder="Full name"
                  className="mt-1 w-full border border-fountain-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                />
              </label>
              <label className="block text-xs font-medium text-fountain-gray-700">
                <PhoneIcon className="w-3 h-3 inline mr-1" />
                Contact phone
                <input
                  value={redeemContactPhone}
                  onChange={(e) => setRedeemContactPhone(e.target.value)}
                  placeholder="+234 803 000 0000"
                  className="mt-1 w-full border border-fountain-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={busy === 'profile'}
              onClick={() => void saveProfile()}
              className="w-full py-2.5 bg-fountain-blue text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {busy === 'profile'
                ? 'Saving…'
                : profileComplete
                  ? 'Save delivery profile'
                  : 'Complete delivery profile'}
            </button>
          </div>
        ) : null}
      </div>

      {scheduledDelivery ? (
        <div className="bg-gradient-to-br from-fountain-green/5 to-fountain-teal/5 border border-fountain-green/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-fountain-green" />
            <p className="text-sm font-semibold text-fountain-gray-900">
              Upcoming monthly basket
            </p>
          </div>
          <p className="text-xs text-fountain-gray-600">
            Delivery window: {pickStr(scheduledDelivery.data, 'scheduledDate')} –{' '}
            {pickStr(scheduledDelivery.data, 'redeemByDate')}
          </p>
          <p className="text-xs text-fountain-gray-600">
            {pickStr(scheduledDelivery.data, 'dropOffLocation')} ·{' '}
            {pickStr(scheduledDelivery.data, 'redeemContactName')} ·{' '}
            {pickStr(scheduledDelivery.data, 'redeemContactPhone')}
          </p>
          <button
            type="button"
            disabled={
              busy === 'redeem' ||
              today < pickStr(scheduledDelivery.data, 'scheduledDate') ||
              today > pickStr(scheduledDelivery.data, 'redeemByDate')
            }
            onClick={() => void redeem(scheduledDelivery.id)}
            className="w-full py-2.5 bg-fountain-green text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {today < pickStr(scheduledDelivery.data, 'scheduledDate')
              ? 'Redemption opens on delivery date'
              : today > pickStr(scheduledDelivery.data, 'redeemByDate')
                ? 'Redemption window closed'
                : 'Confirm basket redeemed'}
          </button>
        </div>
      ) : null}

      {pickNum(sub ?? {}, 'penaltyFeesAccrued') > 0 ? (
        <AlertBanner
          tone="warning"
          message={`Missed delivery penalties: ${formatNaira(pickNum(sub ?? {}, 'penaltyFeesAccrued'))} charged to wallet.`}
        />
      ) : null}
    </section>
  );
}
