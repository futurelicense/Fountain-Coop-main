'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangleIcon,
  BikeIcon,
  Loader2Icon,
  PlayIcon,
  SaveIcon,
  ShoppingBasketIcon,
  WalletIcon,
} from 'lucide-react';
import {
  createFoodstuffsRoute,
  fetchFoodstuffsOps,
  runFoodstuffsAutoDebit,
  saveFoodstuffsOpsSettings,
  updateFoodstuffsRoute,
  type FoodstuffsOpsSummary,
} from '@/api/investments';
import { ApiError } from '@/api';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { Badge } from '@/components/ui/Badge';

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

function errorMessage(e: unknown) {
  if (e instanceof ApiError) {
    return String((e.body as { error?: string } | null)?.error ?? e.message);
  }
  return e instanceof Error ? e.message : 'Request failed';
}

export function FoodstuffsOpsPanel() {
  const [summary, setSummary] = useState<FoodstuffsOpsSummary | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<
    Partial<FoodstuffsOpsSummary['settings']>
  >({});
  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);
  const [routeDraft, setRouteDraft] = useState({
    routeDate: new Date().toISOString().slice(0, 10),
    branch: '',
    zone: '',
    driverName: '',
    fuelCost: 0,
    staffCost: 0,
    otherCost: 0,
  });
  const [busy, setBusy] = useState<'load' | 'save' | 'debit' | 'route' | string | null>('load');
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    setBusy((b) => b ?? 'load');
    try {
      const data = await fetchFoodstuffsOps();
      setSummary(data);
      setSettingsDraft(data.settings);
    } catch (e) {
      setMessage({ tone: 'error', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const pendingUnrouted = useMemo(
    () => summary?.pendingDeliveries.filter((d) => !d.routeId) ?? [],
    [summary]
  );

  const saveSettings = async () => {
    setBusy('save');
    setMessage(null);
    try {
      await saveFoodstuffsOpsSettings(settingsDraft);
      await load();
      setMessage({ tone: 'success', text: 'Foodstuffs controls saved.' });
    } catch (e) {
      setMessage({ tone: 'error', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const runDebit = async () => {
    setBusy('debit');
    setMessage(null);
    try {
      const result = await runFoodstuffsAutoDebit();
      await load();
      setMessage({
        tone: 'success',
        text: `Auto-debit complete: ${result.success} paid, ${result.lowBalance} low balance, ${result.failed} failed, ${result.alreadyPaid} already paid, ${result.skipped} opted out.`,
      });
    } catch (e) {
      setMessage({ tone: 'error', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const createRoute = async () => {
    if (!selectedDeliveries.length) {
      setMessage({ tone: 'error', text: 'Select at least one delivery.' });
      return;
    }
    setBusy('route');
    setMessage(null);
    try {
      await createFoodstuffsRoute({
        ...routeDraft,
        deliveryIds: selectedDeliveries,
      });
      setSelectedDeliveries([]);
      await load();
      setMessage({ tone: 'success', text: 'Delivery route created and deliveries marked out for delivery.' });
    } catch (e) {
      setMessage({ tone: 'error', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const markRouteDone = async (routeId: string) => {
    setBusy(routeId);
    setMessage(null);
    try {
      await updateFoodstuffsRoute(routeId, {
        status: 'Completed',
        completedAt: new Date().toISOString(),
      });
      await load();
      setMessage({ tone: 'success', text: 'Route marked completed.' });
    } catch (e) {
      setMessage({ tone: 'error', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  if (busy === 'load' && !summary) {
    return (
      <Card title="Ajo-for-Foodstuffs Operations">
        <div className="flex items-center gap-2 text-sm text-fountain-gray-500">
          <Loader2Icon className="w-4 h-4 animate-spin" />
          Loading foodstuffs operations…
        </div>
      </Card>
    );
  }

  if (!summary) return null;

  const { kpis } = summary;

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-fountain-gray-900">
            Ajo-for-Foodstuffs Operations
          </h3>
          <p className="text-sm text-fountain-gray-600 mt-1">
            Auto-debit, internal low-balance tracking, basket margin controls,
            and delivery route cost logging. No external notification layer is enabled.
          </p>
        </div>
        <button
          type="button"
          disabled={busy === 'debit'}
          onClick={() => void runDebit()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-fountain-green text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {busy === 'debit' ? (
            <Loader2Icon className="w-4 h-4 animate-spin" />
          ) : (
            <PlayIcon className="w-4 h-4" />
          )}
          Run auto-debit now
        </button>
      </div>

      {message ? (
        <p
          className={`text-sm rounded-lg px-4 py-3 border ${
            message.tone === 'success'
              ? 'bg-fountain-green/5 border-fountain-green/20 text-fountain-green'
              : 'bg-fountain-red/5 border-fountain-red/20 text-fountain-red'
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active subscribers"
          value={String(kpis.activeSubscriptions)}
          icon={<ShoppingBasketIcon className="w-6 h-6" />}
          iconBgColor="bg-fountain-green/10"
          iconColor="text-fountain-green"
        />
        <KPICard
          title="Paid today"
          value={String(kpis.paidToday)}
          icon={<WalletIcon className="w-6 h-6" />}
          iconBgColor="bg-fountain-blue/10"
          iconColor="text-fountain-blue"
          subtitle={`${kpis.failedToday} failed attempts`}
        />
        <KPICard
          title="Low balance"
          value={String(kpis.lowBalanceMembers)}
          icon={<AlertTriangleIcon className="w-6 h-6" />}
          iconBgColor="bg-fountain-amber/10"
          iconColor="text-fountain-amber"
          subtitle="internal risk queue"
        />
        <KPICard
          title="Projected monthly profit"
          value={formatNaira(kpis.projectedMonthlyProfit)}
          icon={<WalletIcon className="w-6 h-6" />}
          iconBgColor={kpis.marginAtRisk ? 'bg-fountain-red/10' : 'bg-fountain-green/10'}
          iconColor={kpis.marginAtRisk ? 'text-fountain-red' : 'text-fountain-green'}
          subtitle={`${kpis.projectedMarginPercent}% margin`}
        />
      </div>

      {kpis.marginAtRisk ? (
        <p className="text-sm text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-4 py-3">
          Margin guard is triggered. Projected margin is below the configured floor;
          review basket and logistics costs before scheduling more deliveries.
        </p>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card title="Cost & margin controls">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumberField
              label="Daily contribution"
              value={settingsDraft.dailyContribution ?? 0}
              onChange={(v) => setSettingsDraft({ ...settingsDraft, dailyContribution: v })}
            />
            <NumberField
              label="Low-balance days"
              value={settingsDraft.lowBalanceDays ?? 0}
              onChange={(v) => setSettingsDraft({ ...settingsDraft, lowBalanceDays: v })}
            />
            <NumberField
              label="Basket cost / member"
              value={settingsDraft.basketCostPerMember ?? 0}
              onChange={(v) => setSettingsDraft({ ...settingsDraft, basketCostPerMember: v })}
            />
            <NumberField
              label="Logistics cost / basket"
              value={settingsDraft.logisticsCostPerBasket ?? 0}
              onChange={(v) => setSettingsDraft({ ...settingsDraft, logisticsCostPerBasket: v })}
            />
            <NumberField
              label="Target margin %"
              value={settingsDraft.targetMarginPercent ?? 0}
              onChange={(v) => setSettingsDraft({ ...settingsDraft, targetMarginPercent: v })}
            />
            <NumberField
              label="Margin floor %"
              value={settingsDraft.marginFloorPercent ?? 0}
              onChange={(v) => setSettingsDraft({ ...settingsDraft, marginFloorPercent: v })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-fountain-gray-700 mt-4">
            <input
              type="checkbox"
              checked={Boolean(settingsDraft.autoDebitEnabled)}
              onChange={(e) =>
                setSettingsDraft({
                  ...settingsDraft,
                  autoDebitEnabled: e.target.checked,
                })
              }
            />
            Enable auto-debit runs
          </label>
          <div className="mt-4 flex justify-between items-center gap-3">
            <p className="text-xs text-fountain-gray-500">
              Revenue: {formatNaira(kpis.projectedMonthlyRevenue)} · Cost:{' '}
              {formatNaira(kpis.projectedMonthlyCost)}
            </p>
            <button
              type="button"
              disabled={busy === 'save'}
              onClick={() => void saveSettings()}
              className="inline-flex items-center gap-2 px-3 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {busy === 'save' ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                <SaveIcon className="w-4 h-4" />
              )}
              Save controls
            </button>
          </div>
        </Card>

        <Card title="Low-balance internal queue">
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {!summary.atRiskMembers.length ? (
              <p className="text-sm text-fountain-gray-500">No low-balance members right now.</p>
            ) : null}
            {summary.atRiskMembers.slice(0, 10).map((m) => (
              <div
                key={m.subscriptionId}
                className="flex justify-between gap-3 border border-fountain-gray-100 rounded-lg p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-fountain-gray-900">{m.memberName}</p>
                  <p className="text-xs text-fountain-gray-500">
                    {m.memberId || '—'} · {m.branch || 'No branch'} · day {m.daysPaidInCycle}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-fountain-red">
                    {formatNaira(m.walletBalance)}
                  </p>
                  <p className="text-xs text-fountain-gray-500">
                    needs {formatNaira(m.requiredBalance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Route batching & delivery cost logging" icon={<BikeIcon className="w-5 h-5 text-fountain-blue" />}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
                  <tr>
                    <th className="px-3 py-2"> </th>
                    <th className="px-3 py-2">Member</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fountain-gray-100">
                  {pendingUnrouted.map((d) => (
                    <tr key={d.id}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedDeliveries.includes(d.id)}
                          onChange={(e) => {
                            setSelectedDeliveries((prev) =>
                              e.target.checked
                                ? [...prev, d.id]
                                : prev.filter((x) => x !== d.id)
                            );
                          }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-fountain-gray-900">{d.memberName}</p>
                        <p className="text-xs text-fountain-gray-500">{d.memberId}</p>
                      </td>
                      <td className="px-3 py-2 text-fountain-gray-600">{d.dropOffLocation}</td>
                      <td className="px-3 py-2 text-fountain-gray-600">{d.scheduledDate}</td>
                      <td className="px-3 py-2"><Badge size="sm">{d.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!pendingUnrouted.length ? (
                <p className="text-sm text-fountain-gray-500 p-4 text-center">
                  No unrouted scheduled deliveries.
                </p>
              ) : null}
            </div>
          </div>
          <div className="space-y-3">
            <Field label="Route date" value={routeDraft.routeDate} onChange={(v) => setRouteDraft({ ...routeDraft, routeDate: v })} />
            <Field label="Branch" value={routeDraft.branch} onChange={(v) => setRouteDraft({ ...routeDraft, branch: v })} />
            <Field label="Zone / route area" value={routeDraft.zone} onChange={(v) => setRouteDraft({ ...routeDraft, zone: v })} />
            <Field label="Driver / staff" value={routeDraft.driverName} onChange={(v) => setRouteDraft({ ...routeDraft, driverName: v })} />
            <div className="grid grid-cols-3 gap-2">
              <NumberField label="Fuel" value={routeDraft.fuelCost} onChange={(v) => setRouteDraft({ ...routeDraft, fuelCost: v })} />
              <NumberField label="Staff" value={routeDraft.staffCost} onChange={(v) => setRouteDraft({ ...routeDraft, staffCost: v })} />
              <NumberField label="Other" value={routeDraft.otherCost} onChange={(v) => setRouteDraft({ ...routeDraft, otherCost: v })} />
            </div>
            <button
              type="button"
              disabled={busy === 'route' || !selectedDeliveries.length}
              onClick={() => void createRoute()}
              className="w-full px-3 py-2 bg-fountain-blue text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              Create route ({selectedDeliveries.length})
            </button>
          </div>
        </div>

        <div className="mt-5">
          <h4 className="text-sm font-semibold text-fountain-gray-900 mb-2">Recent routes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {summary.routes.slice(0, 6).map((r) => (
              <div key={r.id} className="border border-fountain-gray-100 rounded-xl p-3">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-fountain-gray-900">
                      {r.zone || 'Route'} · {r.routeDate}
                    </p>
                    <p className="text-xs text-fountain-gray-500">
                      {r.driverName || 'Unassigned'} · {r.deliveryCount} baskets
                    </p>
                  </div>
                  <Badge size="sm">{r.status}</Badge>
                </div>
                <p className="text-xs text-fountain-gray-600 mt-2">
                  Cost: {formatNaira(r.routeCost)} · {formatNaira(r.costPerBasket)} / basket
                </p>
                {r.status !== 'Completed' ? (
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => void markRouteDone(r.id)}
                    className="text-xs text-fountain-blue hover:underline mt-2"
                  >
                    Mark completed
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-fountain-gray-600 mb-1">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-fountain-gray-200 rounded-lg text-sm"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-fountain-gray-600 mb-1">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full px-3 py-2 border border-fountain-gray-200 rounded-lg text-sm"
      />
    </label>
  );
}
