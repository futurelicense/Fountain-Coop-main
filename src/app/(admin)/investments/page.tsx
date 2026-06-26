'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
  ClockIcon,
  PlusIcon,
  Trash2,
  ZapIcon,
  ShoppingBasketIcon,
  SettingsIcon,
} from 'lucide-react';
import {
  approveInvestmentApplication as approveInvestmentApplicationApi,
  fetchInvestmentSettings,
  saveInvestmentSettings,
} from '@/api/investments';
import { ApiError } from '@/api';
import { KPICard } from '@/components/ui/KPICard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FoodstuffsOpsPanel } from '@/components/investments/FoodstuffsOpsPanel';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickNum, pickStr } from '@/lib/pickData';
import {
  INVESTMENT_PRODUCT_TEMPLATES,
  chargingSlotsFilled,
  productKindLabel,
  templateToProductData,
} from '@/lib/investment-products';

export default function InvestmentsPage() {
  const products = useOperationalRecords('investments', 'investmentProduct');
  const applications = useOperationalRecords('investments', 'investmentApplication');
  const holdings = useOperationalRecords('investments', 'memberInvestment');
  const subscriptions = useOperationalRecords('investments', 'foodstuffsSubscription');
  const deliveries = useOperationalRecords('investments', 'foodstuffsDelivery');
  const [actionError, setActionError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [entryFeeDraft, setEntryFeeDraft] = useState('0');
  const [entryFeeNote, setEntryFeeNote] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [entryFeePayments, setEntryFeePayments] = useState<
    { id: string; memberId: string; memberName: string; amount: number; paidAt: string }[]
  >([]);
  const [settingsMeta, setSettingsMeta] = useState({ updatedAt: '', updatedByName: '' });

  useEffect(() => {
    void fetchInvestmentSettings()
      .then(({ settings, payments }) => {
        setEntryFeeDraft(String(settings.entryFee));
        setEntryFeeNote(settings.note);
        setSettingsMeta({
          updatedAt: settings.updatedAt,
          updatedByName: settings.updatedByName,
        });
        setEntryFeePayments(payments);
      })
      .catch(() => undefined);
  }, []);

  const saveEntryFeeSettings = async () => {
    setSettingsSaving(true);
    setActionError(null);
    try {
      const fee = Number(entryFeeDraft.replace(/,/g, ''));
      const { settings } = await saveInvestmentSettings({
        entryFee: fee,
        note: entryFeeNote,
      });
      setEntryFeeDraft(String(settings.entryFee));
      setEntryFeeNote(settings.note);
      setSettingsMeta({
        updatedAt: settings.updatedAt,
        updatedByName: settings.updatedByName,
      });
      const refreshed = await fetchInvestmentSettings();
      setEntryFeePayments(refreshed.payments);
    } catch (e) {
      setActionError(e instanceof ApiError ? String((e.body as { error?: string })?.error ?? 'Save failed') : 'Save failed');
    } finally {
      setSettingsSaving(false);
    }
  };

  const formatNaira = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Approved':
      case 'Matured':
        return <Badge variant="success" size="sm">{status}</Badge>;
      case 'Pending':
      case 'Funding':
        return <Badge variant="warning" size="sm">{status}</Badge>;
      case 'Rejected':
      case 'Closed':
        return <Badge variant="danger" size="sm">{status}</Badge>;
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  const totalInvested = useMemo(
    () =>
      holdings.items
        .filter((h) => pickStr(h.data, 'status') === 'Active')
        .reduce((s, r) => s + pickNum(r.data, 'principal'), 0),
    [holdings.items]
  );
  const pendingApps = applications.items.filter(
    (a) => pickStr(a.data, 'status') === 'Pending'
  ).length;
  const activeInvestors = useMemo(() => {
    const ids = new Set(
      holdings.items
        .filter((h) => pickStr(h.data, 'status') === 'Active')
        .map((h) => pickStr(h.data, 'memberId'))
        .filter(Boolean)
    );
    return ids.size;
  }, [holdings.items]);
  const loadError = products.error || applications.error || holdings.error || subscriptions.error || deliveries.error;

  const refreshAll = async () => {
    await Promise.all([
      products.reload(),
      applications.reload(),
      holdings.reload(),
      subscriptions.reload(),
      deliveries.reload(),
    ]);
  };

  const handleApprove = async (applicationId: string) => {
    setActionError(null);
    setApprovingId(applicationId);
    try {
      await approveInvestmentApplicationApi(applicationId);
      await refreshAll();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? String((e.body as { error?: string })?.error ?? e.message)
          : e instanceof Error
            ? e.message
            : 'Approval failed';
      setActionError(msg);
    } finally {
      setApprovingId(null);
    }
  };

  const seedStandardProducts = async () => {
    const existingKinds = new Set(products.items.map((p) => pickStr(p.data, 'kind')));
    for (const template of INVESTMENT_PRODUCT_TEMPLATES) {
      if (existingKinds.has(template.kind)) continue;
      await products.createRow('investmentProduct', templateToProductData(template), {
        is_catalog: true,
      });
    }
  };

  const ProductIcon = ({ kind }: { kind: string }) => {
    if (kind === 'phone_charging_units') {
      return <ZapIcon className="w-5 h-5 text-fountain-amber" />;
    }
    return <ShoppingBasketIcon className="w-5 h-5 text-fountain-green" />;
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fountain-gray-900">
            Investment Products
          </h2>
          <p className="text-fountain-gray-600 mt-1">
            Manage cooperative investment returns — phone charging units and
            Ajo-for-Foodstuffs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={products.loading}
            onClick={() => void seedStandardProducts()}
            className="px-4 py-2 bg-fountain-green text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Seed standard products
          </button>
          <button
            type="button"
            disabled={applications.loading}
            onClick={() =>
              void applications.createRow('investmentApplication', {
                memberName: 'Applicant',
                memberId: 'FC-NEW',
                productKind: 'phone_charging_units',
                productName: 'Phone Charging Units',
                amount: 250_000,
                appliedDate: new Date().toISOString().slice(0, 10),
                status: 'Pending',
              })
            }
            className="px-4 py-2 border border-fountain-gray-300 rounded-lg text-sm font-medium text-fountain-gray-700 hover:bg-fountain-gray-50"
          >
            <PlusIcon className="w-4 h-4 inline mr-1" />
            Application
          </button>
          <button
            type="button"
            disabled={holdings.loading}
            onClick={() =>
              void holdings.createRow('memberInvestment', {
                memberName: 'Investor',
                memberId: 'FC-NEW',
                productKind: 'phone_charging_units',
                productName: 'Phone Charging Units',
                principal: 250_000,
                expectedReturn: 110_000,
                startDate: new Date().toISOString().slice(0, 10),
                maturityDate: new Date(Date.now() + 365 * 86400000)
                  .toISOString()
                  .slice(0, 10),
                status: 'Active',
              })
            }
            className="px-4 py-2 border border-fountain-gray-300 rounded-lg text-sm font-medium text-fountain-gray-700 hover:bg-fountain-gray-50"
          >
            Active holding
          </button>
        </div>
      </div>

      {loadError ? (
        <p className="text-sm text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-4 py-3">
          {loadError}
        </p>
      ) : null}
      {actionError ? (
        <p className="text-sm text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-4 py-3">
          {actionError === 'charging_pool_full'
            ? 'Charging unit pool is full (all investor slots taken).'
            : actionError === 'foodstuffs_subscription_exists'
              ? 'Member already has an active foodstuffs subscription.'
              : actionError}
        </p>
      ) : null}

      <FoodstuffsOpsPanel />

      <Card title="Programme entry fee" icon={<SettingsIcon className="w-5 h-5 text-fountain-blue" />}>
        <p className="text-sm text-fountain-gray-600 mb-4">
          Members must pay this one-time fee from their wallet before they can view
          investment return options or submit applications. Set to ₦0 to allow free access.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <label className="block text-sm">
            <span className="font-medium text-fountain-gray-700">Entry fee (NGN)</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={entryFeeDraft}
              onChange={(e) => setEntryFeeDraft(e.target.value)}
              className="mt-1 w-full border border-fountain-gray-200 rounded-lg px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-1">
            <span className="font-medium text-fountain-gray-700">Note for members (optional)</span>
            <input
              type="text"
              value={entryFeeNote}
              onChange={(e) => setEntryFeeNote(e.target.value)}
              placeholder="e.g. Covers onboarding and programme access"
              className="mt-1 w-full border border-fountain-gray-200 rounded-lg px-3 py-2"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={settingsSaving}
            onClick={() => void saveEntryFeeSettings()}
            className="px-4 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {settingsSaving ? 'Saving…' : 'Save entry fee'}
          </button>
          {settingsMeta.updatedAt ? (
            <p className="text-xs text-fountain-gray-500">
              Last updated by {settingsMeta.updatedByName || 'admin'}{' '}
              {new Date(settingsMeta.updatedAt).toLocaleString('en-NG')}
            </p>
          ) : null}
        </div>
        {entryFeePayments.length > 0 ? (
          <div className="mt-6 border-t border-fountain-gray-100 pt-4">
            <p className="text-xs font-semibold text-fountain-gray-500 uppercase mb-2">
              Recent entry fee payments ({entryFeePayments.length})
            </p>
            <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
              {entryFeePayments.slice(0, 8).map((p) => (
                <li key={p.id} className="flex justify-between text-fountain-gray-700">
                  <span>
                    {p.memberName} · {p.memberId}
                  </span>
                  <span>{formatNaira(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total invested (active)"
          value={formatNaira(totalInvested)}
          icon={<WalletIcon className="w-6 h-6" />}
          iconBgColor="bg-fountain-green/10"
          iconColor="text-fountain-green"
        />
        <KPICard
          title="Active products"
          value={String(products.items.length)}
          icon={<TrendingUpIcon className="w-6 h-6" />}
          iconBgColor="bg-emerald-500/10"
          iconColor="text-emerald-600"
        />
        <KPICard
          title="Active investors"
          value={String(activeInvestors)}
          icon={<UsersIcon className="w-6 h-6" />}
          iconBgColor="bg-fountain-blue/10"
          iconColor="text-fountain-blue"
        />
        <KPICard
          title="Pending applications"
          value={String(pendingApps)}
          icon={<ClockIcon className="w-6 h-6" />}
          iconBgColor="bg-fountain-amber/10"
          iconColor="text-fountain-amber"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-fountain-gray-900 mb-4">
          Investment return options
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {products.items.map((row) => {
            const p = row.data;
            const kind = pickStr(p, 'kind');
            const isCharging = kind === 'phone_charging_units';
            const required = pickNum(p, 'investorsRequired', 4);
            const filled = isCharging
              ? chargingSlotsFilled(row.id, holdings.items)
              : pickNum(p, 'slotsFilled');
            return (
              <Card key={row.id} className="flex flex-col h-full">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-fountain-gray-50">
                      <ProductIcon kind={kind} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-fountain-gray-900">
                        {pickStr(p, 'name', 'Product')}
                      </h4>
                      <p className="text-xs text-fountain-gray-500">
                        {pickStr(p, 'tagline')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void products.removeRow(row.id)}
                    className="text-fountain-gray-400 hover:text-fountain-red p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-fountain-gray-600 mb-4">
                  {pickStr(p, 'description')}
                </p>

                {isCharging ? (
                  <div className="space-y-2 text-sm border-t border-fountain-gray-100 pt-3">
                    <p className="text-xs font-semibold text-fountain-gray-500 uppercase">
                      Booth setup
                    </p>
                    <p className="text-fountain-gray-700">
                      {(p.setupItems as string[] | undefined)?.join(' · ') ||
                        'Booth · Generator · Sockets · POS stand'}
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <span className="text-fountain-gray-500">Daily revenue/booth</span>
                        <p className="font-medium">
                          {formatNaira(pickNum(p, 'dailyRevenuePerUnit'))}
                        </p>
                      </div>
                      <div>
                        <span className="text-fountain-gray-500">Investor slots</span>
                        <p className="font-medium">
                          {filled}/{required} filled
                        </p>
                      </div>
                      <div>
                        <span className="text-fountain-gray-500">Per investor</span>
                        <p className="font-medium">
                          {formatNaira(pickNum(p, 'investmentPerInvestor'))}
                        </p>
                      </div>
                      <div>
                        <span className="text-fountain-gray-500">Investors required</span>
                        <p className="font-medium">{required}</p>
                      </div>
                      <div>
                        <span className="text-fountain-gray-500">12-mo interest</span>
                        <p className="font-medium text-fountain-green">
                          {formatNaira(pickNum(p, 'investorInterestTotal'))}
                        </p>
                      </div>
                      <div>
                        <span className="text-fountain-gray-500">Coop weekly profit</span>
                        <p className="font-medium">
                          {formatNaira(pickNum(p, 'weeklyCoopProfit'))}
                        </p>
                      </div>
                      <div>
                        <span className="text-fountain-gray-500">Payback</span>
                        <p className="font-medium">~{pickNum(p, 'paybackMonths')} months</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm border-t border-fountain-gray-100 pt-3">
                    <div className="flex justify-between">
                      <span className="text-fountain-gray-500">Daily contribution</span>
                      <span className="font-medium">
                        {formatNaira(pickNum(p, 'dailyMemberContribution'))}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-fountain-gray-500 uppercase mt-2">
                      Daily basket
                    </p>
                    <ul className="text-xs text-fountain-gray-600 space-y-0.5 max-h-28 overflow-y-auto">
                      {((p.dailyDeliverables as string[] | undefined) ?? []).map(
                        (item, i) => (
                          <li key={i}>• {item}</li>
                        )
                      )}
                    </ul>
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-fountain-gray-100">
                      <div>
                        <span className="text-fountain-gray-500">Daily profit</span>
                        <p className="font-medium text-fountain-green">
                          {formatNaira(pickNum(p, 'dailyProfit'))}
                        </p>
                      </div>
                      <div>
                        <span className="text-fountain-gray-500">Weekly</span>
                        <p className="font-medium">
                          {formatNaira(pickNum(p, 'weeklyProfit'))}
                        </p>
                      </div>
                      <div>
                        <span className="text-fountain-gray-500">Monthly</span>
                        <p className="font-medium">
                          {formatNaira(pickNum(p, 'monthlyProfit'))}
                        </p>
                      </div>
                      <div>
                        <span className="text-fountain-gray-500">Annual</span>
                        <p className="font-medium">
                          {formatNaira(pickNum(p, 'annualProfit'))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-fountain-gray-100 flex justify-between items-center">
                  {getStatusBadge(pickStr(p, 'status', 'Active'))}
                  <span className="text-xs text-fountain-gray-500">
                    {pickNum(p, 'tenureMonths')} month tenure
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
        {!products.loading && !products.items.length ? (
          <p className="text-sm text-fountain-gray-500 mt-2">
            No products yet. Click &quot;Seed standard products&quot; to add Phone
            Charging Units and Ajo-for-Foodstuffs.
          </p>
        ) : null}
      </div>

      <Card
        title="Applications"
        headerAction={
          <button
            type="button"
            disabled={applications.loading}
            onClick={() =>
              void applications.createRow('investmentApplication', {
                memberName: 'Applicant',
                memberId: 'FC-NEW',
                productKind: 'ajo_for_foodstuffs',
                productName: 'Ajo-for-Foodstuffs',
                amount: 1_500,
                appliedDate: new Date().toISOString().slice(0, 10),
                status: 'Pending',
              })
            }
            className="text-xs font-medium text-fountain-blue hover:text-fountain-dark"
          >
            + Add
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Applied</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fountain-gray-100">
              {applications.items.map((row) => {
                const app = row.data;
                return (
                  <tr key={row.id} className="hover:bg-fountain-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-fountain-gray-900">
                        {pickStr(app, 'memberName')}
                      </p>
                      <p className="text-xs text-fountain-gray-500">
                        {pickStr(app, 'memberId')}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-fountain-gray-600">
                      {pickStr(app, 'productName') ||
                        productKindLabel(pickStr(app, 'productKind'))}
                    </td>
                    <td className="px-4 py-3 font-medium text-fountain-gray-900">
                      {formatNaira(pickNum(app, 'amount'))}
                    </td>
                    <td className="px-4 py-3 text-fountain-gray-600">
                      {pickStr(app, 'appliedDate')}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(pickStr(app, 'status', 'Pending'))}
                    </td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        type="button"
                        disabled={
                          approvingId === row.id ||
                          pickStr(app, 'status') !== 'Pending'
                        }
                        className="text-fountain-blue hover:text-fountain-dark text-xs font-medium disabled:opacity-40"
                        onClick={() => void handleApprove(row.id)}
                      >
                        {approvingId === row.id ? 'Approving…' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="text-xs text-fountain-red hover:underline"
                        onClick={() =>
                          void applications.patchRow(row.id, { status: 'Rejected' })
                        }
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="text-fountain-gray-400 hover:text-fountain-red p-1"
                        onClick={() => void applications.removeRow(row.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!applications.loading && !applications.items.length ? (
            <p className="text-sm text-fountain-gray-500 p-4">No applications.</p>
          ) : null}
        </div>
      </Card>

      <div>
        <h3 className="text-lg font-semibold text-fountain-gray-900 mb-4">
          Active holdings
        </h3>
        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Investor</th>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium text-right">Principal</th>
                  <th className="px-6 py-4 font-medium text-right">Expected return</th>
                  <th className="px-6 py-4 font-medium">Maturity</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fountain-gray-100">
                {holdings.items.map((row) => {
                  const inv = row.data;
                  return (
                    <tr key={row.id} className="hover:bg-fountain-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-fountain-gray-900">
                          {pickStr(inv, 'memberName')}
                        </p>
                        <p className="text-xs text-fountain-gray-500">
                          {pickStr(inv, 'memberId')}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-fountain-gray-600">
                        {pickStr(inv, 'productName') ||
                          productKindLabel(pickStr(inv, 'productKind'))}
                        {pickStr(inv, 'productKind') === 'phone_charging_units' &&
                        pickNum(inv, 'poolSlot') > 0 ? (
                          <p className="text-xs text-fountain-gray-400 mt-0.5">
                            Slot {pickNum(inv, 'poolSlot')}/{pickNum(inv, 'poolSize', 4)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {formatNaira(pickNum(inv, 'principal'))}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-fountain-green">
                        {formatNaira(pickNum(inv, 'expectedReturn'))}
                      </td>
                      <td className="px-6 py-4 text-fountain-gray-600">
                        {pickStr(inv, 'maturityDate')}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(pickStr(inv, 'status', 'Active'))}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          className="text-fountain-gray-400 hover:text-fountain-red p-1"
                          onClick={() => void holdings.removeRow(row.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!holdings.loading && !holdings.items.length ? (
              <p className="text-sm text-fountain-gray-500 p-6 text-center">
                No active holdings yet.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <Card title="Foodstuffs subscriptions">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Cycle progress</th>
                <th className="px-4 py-3 font-medium">Delivery profile</th>
                <th className="px-4 py-3 font-medium">Penalties</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fountain-gray-100">
              {subscriptions.items.map((row) => {
                const s = row.data;
                return (
                  <tr key={row.id} className="hover:bg-fountain-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{pickStr(s, 'memberName')}</p>
                      <p className="text-xs text-fountain-gray-500">{pickStr(s, 'memberId')}</p>
                    </td>
                    <td className="px-4 py-3">
                      {pickNum(s, 'daysPaidInCycle')}/
                      {pickNum(s, 'daysPerDeliveryCycle', 30)} days ·{' '}
                      {formatNaira(pickNum(s, 'totalContributed'))} total
                    </td>
                    <td className="px-4 py-3 text-xs text-fountain-gray-600">
                      {s.profileComplete ? (
                        <>
                          {pickStr(s, 'dropOffLocation')}
                          <br />
                          {pickStr(s, 'redeemContactName')} · {pickStr(s, 'redeemContactPhone')}
                        </>
                      ) : (
                        <span className="text-fountain-amber">Incomplete</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {formatNaira(pickNum(s, 'penaltyFeesAccrued'))} (
                      {pickNum(s, 'missedDeliveries')} missed)
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(pickStr(s, 'status', 'Active'))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!subscriptions.loading && !subscriptions.items.length ? (
            <p className="text-sm text-fountain-gray-500 p-4">No foodstuffs subscriptions yet.</p>
          ) : null}
        </div>
      </Card>

      <Card title="Monthly food basket deliveries">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Window</th>
                <th className="px-4 py-3 font-medium">Drop-off</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fountain-gray-100">
              {deliveries.items.map((row) => {
                const d = row.data;
                return (
                  <tr key={row.id} className="hover:bg-fountain-gray-50">
                    <td className="px-4 py-3">{pickStr(d, 'memberName')}</td>
                    <td className="px-4 py-3 text-xs">
                      {pickStr(d, 'scheduledDate')} → {pickStr(d, 'redeemByDate')}
                    </td>
                    <td className="px-4 py-3 text-xs text-fountain-gray-600">
                      {pickStr(d, 'dropOffLocation')}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(pickStr(d, 'status', 'Scheduled'))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!deliveries.loading && !deliveries.items.length ? (
            <p className="text-sm text-fountain-gray-500 p-4">No deliveries scheduled yet.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
