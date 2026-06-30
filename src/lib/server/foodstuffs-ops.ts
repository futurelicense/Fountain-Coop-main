import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FOODSTUFFS_DEFAULTS } from '@/lib/investment-products';
import { pickNum, pickStr } from '@/lib/pickData';
import { todayIsoNg } from '@/lib/server/date-ng';
import { payFoodstuffsDailyContribution } from '@/lib/server/foodstuffs-subscription';

const OPS_SETTINGS_SUBTYPE = 'foodstuffsOpsSettings';
const DEBIT_ATTEMPT_SUBTYPE = 'foodstuffsDebitAttempt';
const ROUTE_SUBTYPE = 'foodstuffsRoute';

type OperationalRow = {
  id: string;
  owner_id: string | null;
  branch: string | null;
  data: Record<string, unknown>;
  created_at?: string;
};

export type FoodstuffsOpsSettings = {
  dailyContribution: number;
  lowBalanceDays: number;
  basketCostPerMember: number;
  logisticsCostPerBasket: number;
  targetMarginPercent: number;
  marginFloorPercent: number;
  autoDebitEnabled: boolean;
  updatedAt: string;
  updatedByName: string;
};

export type FoodstuffsOpsSummary = {
  settings: FoodstuffsOpsSettings;
  kpis: {
    activeSubscriptions: number;
    paidToday: number;
    failedToday: number;
    lowBalanceMembers: number;
    pendingDeliveries: number;
    routedDeliveries: number;
    projectedMonthlyRevenue: number;
    projectedMonthlyCost: number;
    projectedMonthlyProfit: number;
    projectedMarginPercent: number;
    marginAtRisk: boolean;
  };
  atRiskMembers: {
    subscriptionId: string;
    ownerId: string;
    memberName: string;
    memberId: string;
    branch: string | null;
    walletBalance: number;
    requiredBalance: number;
    daysPaidInCycle: number;
    lastPaymentDate: string;
  }[];
  pendingDeliveries: {
    id: string;
    memberName: string;
    memberId: string;
    branch: string | null;
    dropOffLocation: string;
    scheduledDate: string;
    redeemByDate: string;
    status: string;
    routeId: string;
  }[];
  routes: {
    id: string;
    routeDate: string;
    branch: string;
    zone: string;
    driverName: string;
    status: string;
    deliveryCount: number;
    routeCost: number;
    costPerBasket: number;
  }[];
};

function defaultSettings(): FoodstuffsOpsSettings {
  return {
    dailyContribution: FOODSTUFFS_DEFAULTS.dailyContribution,
    lowBalanceDays: 3,
    basketCostPerMember: 36_000,
    logisticsCostPerBasket: 1_500,
    targetMarginPercent: 20,
    marginFloorPercent: 12,
    autoDebitEnabled: true,
    updatedAt: '',
    updatedByName: '',
  };
}

function normalizeSettings(
  data: Record<string, unknown> | null | undefined
): FoodstuffsOpsSettings {
  const defaults = defaultSettings();
  return {
    dailyContribution: pickNum(data ?? {}, 'dailyContribution', defaults.dailyContribution),
    lowBalanceDays: pickNum(data ?? {}, 'lowBalanceDays', defaults.lowBalanceDays),
    basketCostPerMember: pickNum(data ?? {}, 'basketCostPerMember', defaults.basketCostPerMember),
    logisticsCostPerBasket: pickNum(data ?? {}, 'logisticsCostPerBasket', defaults.logisticsCostPerBasket),
    targetMarginPercent: pickNum(data ?? {}, 'targetMarginPercent', defaults.targetMarginPercent),
    marginFloorPercent: pickNum(data ?? {}, 'marginFloorPercent', defaults.marginFloorPercent),
    autoDebitEnabled:
      typeof data?.autoDebitEnabled === 'boolean'
        ? data.autoDebitEnabled
        : defaults.autoDebitEnabled,
    updatedAt: pickStr(data ?? {}, 'updatedAt', defaults.updatedAt),
    updatedByName: pickStr(data ?? {}, 'updatedByName', defaults.updatedByName),
  };
}

async function getRows(
  supabase: SupabaseClient,
  subtype: string
): Promise<OperationalRow[]> {
  const { data, error } = await supabase
    .from('operational_items')
    .select('id, owner_id, branch, data, created_at')
    .eq('module', 'investments')
    .eq('subtype', subtype);
  if (error) throw new Error(error.message);
  return (data ?? []) as OperationalRow[];
}

export async function getFoodstuffsOpsSettings(
  supabase: SupabaseClient
): Promise<{ rowId: string | null; settings: FoodstuffsOpsSettings }> {
  const { data, error } = await supabase
    .from('operational_items')
    .select('id, data')
    .eq('module', 'investments')
    .eq('subtype', OPS_SETTINGS_SUBTYPE)
    .eq('is_catalog', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    rowId: (data?.id as string | undefined) ?? null,
    settings: normalizeSettings((data?.data as Record<string, unknown> | null) ?? null),
  };
}

export async function saveFoodstuffsOpsSettings(
  supabase: SupabaseClient,
  staffUserId: string,
  staffName: string,
  patch: Partial<FoodstuffsOpsSettings>
): Promise<FoodstuffsOpsSettings> {
  const current = await getFoodstuffsOpsSettings(supabase);
  const next = normalizeSettings({
    ...current.settings,
    ...patch,
    dailyContribution: Math.max(100, Number(patch.dailyContribution ?? current.settings.dailyContribution)),
    lowBalanceDays: Math.max(1, Number(patch.lowBalanceDays ?? current.settings.lowBalanceDays)),
    basketCostPerMember: Math.max(0, Number(patch.basketCostPerMember ?? current.settings.basketCostPerMember)),
    logisticsCostPerBasket: Math.max(0, Number(patch.logisticsCostPerBasket ?? current.settings.logisticsCostPerBasket)),
    targetMarginPercent: Math.max(0, Number(patch.targetMarginPercent ?? current.settings.targetMarginPercent)),
    marginFloorPercent: Math.max(0, Number(patch.marginFloorPercent ?? current.settings.marginFloorPercent)),
    autoDebitEnabled:
      typeof patch.autoDebitEnabled === 'boolean'
        ? patch.autoDebitEnabled
        : current.settings.autoDebitEnabled,
    updatedAt: new Date().toISOString(),
    updatedByName: staffName,
  });

  if (current.rowId) {
    const { error } = await supabase
      .from('operational_items')
      .update({ data: next })
      .eq('id', current.rowId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('operational_items').insert({
      module: 'investments',
      subtype: OPS_SETTINGS_SUBTYPE,
      is_catalog: true,
      owner_id: null,
      created_by: staffUserId,
      data: next,
    });
    if (error) throw new Error(error.message);
  }

  return (await getFoodstuffsOpsSettings(supabase)).settings;
}

async function walletMapForSubscriptions(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, number>> {
  if (!userIds.length) return new Map();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, savings_balance')
    .in('id', userIds);
  if (error) throw new Error(error.message);
  return new Map(
    (data ?? []).map((row) => [
      String(row.id),
      Number(row.savings_balance ?? 0),
    ])
  );
}

export async function getFoodstuffsOpsSummary(
  supabase: SupabaseClient
): Promise<FoodstuffsOpsSummary> {
  const [{ settings }, subscriptions, payments, attempts, deliveries, routes] =
    await Promise.all([
      getFoodstuffsOpsSettings(supabase),
      getRows(supabase, 'foodstuffsSubscription'),
      getRows(supabase, 'foodstuffsDailyPayment'),
      getRows(supabase, DEBIT_ATTEMPT_SUBTYPE),
      getRows(supabase, 'foodstuffsDelivery'),
      getRows(supabase, ROUTE_SUBTYPE),
    ]);

  const activeSubs = subscriptions.filter((s) => pickStr(s.data, 'status') === 'Active');
  const userIds = activeSubs.map((s) => s.owner_id).filter(Boolean) as string[];
  const wallets = await walletMapForSubscriptions(supabase, userIds);
  const today = todayIsoNg();
  const requiredBalance = settings.dailyContribution * settings.lowBalanceDays;

  const paidToday = payments.filter((p) => pickStr(p.data, 'date') === today).length;
  const failedToday = attempts.filter(
    (a) => pickStr(a.data, 'date') === today && pickStr(a.data, 'status') !== 'success'
  ).length;

  const atRiskMembers = activeSubs
    .map((s) => {
      const walletBalance = wallets.get(s.owner_id ?? '') ?? 0;
      return {
        subscriptionId: s.id,
        ownerId: s.owner_id ?? '',
        memberName: pickStr(s.data, 'memberName', 'Member'),
        memberId: pickStr(s.data, 'memberId'),
        branch: s.branch,
        walletBalance,
        requiredBalance,
        daysPaidInCycle: pickNum(s.data, 'daysPaidInCycle'),
        lastPaymentDate: pickStr(s.data, 'lastPaymentDate'),
      };
    })
    .filter((m) => m.ownerId && m.walletBalance < requiredBalance);

  const pendingDeliveries = deliveries
    .filter((d) => ['Scheduled', 'Out for delivery'].includes(pickStr(d.data, 'status')))
    .map((d) => ({
      id: d.id,
      memberName: pickStr(d.data, 'memberName', 'Member'),
      memberId: pickStr(d.data, 'memberId'),
      branch: d.branch,
      dropOffLocation: pickStr(d.data, 'dropOffLocation'),
      scheduledDate: pickStr(d.data, 'scheduledDate'),
      redeemByDate: pickStr(d.data, 'redeemByDate'),
      status: pickStr(d.data, 'status', 'Scheduled'),
      routeId: pickStr(d.data, 'routeId'),
    }));

  const routeSummaries = routes.map((r) => {
    const deliveryIds = Array.isArray(r.data.deliveryIds)
      ? (r.data.deliveryIds as unknown[])
      : [];
    const routeCost =
      pickNum(r.data, 'fuelCost') +
      pickNum(r.data, 'staffCost') +
      pickNum(r.data, 'otherCost');
    return {
      id: r.id,
      routeDate: pickStr(r.data, 'routeDate'),
      branch: pickStr(r.data, 'branch'),
      zone: pickStr(r.data, 'zone'),
      driverName: pickStr(r.data, 'driverName'),
      status: pickStr(r.data, 'status', 'Planned'),
      deliveryCount: deliveryIds.length,
      routeCost,
      costPerBasket: deliveryIds.length ? Math.round(routeCost / deliveryIds.length) : 0,
    };
  });

  const monthlyRevenue = activeSubs.length * settings.dailyContribution * 30;
  const unitCost = settings.basketCostPerMember + settings.logisticsCostPerBasket;
  const monthlyCost = activeSubs.length * unitCost;
  const monthlyProfit = monthlyRevenue - monthlyCost;
  const margin = monthlyRevenue > 0 ? Math.round((monthlyProfit / monthlyRevenue) * 100) : 0;

  return {
    settings,
    kpis: {
      activeSubscriptions: activeSubs.length,
      paidToday,
      failedToday,
      lowBalanceMembers: atRiskMembers.length,
      pendingDeliveries: pendingDeliveries.filter((d) => !d.routeId).length,
      routedDeliveries: pendingDeliveries.filter((d) => d.routeId).length,
      projectedMonthlyRevenue: monthlyRevenue,
      projectedMonthlyCost: monthlyCost,
      projectedMonthlyProfit: monthlyProfit,
      projectedMarginPercent: margin,
      marginAtRisk: margin < settings.marginFloorPercent,
    },
    atRiskMembers,
    pendingDeliveries,
    routes: routeSummaries,
  };
}

async function recordDebitAttempt(
  supabase: SupabaseClient,
  input: {
    subscription: OperationalRow;
    amount: number;
    status: 'success' | 'already_paid' | 'low_balance' | 'failed' | 'skipped';
    reason?: string;
    walletBalance?: number;
  }
) {
  await supabase.from('operational_items').insert({
    module: 'investments',
    subtype: DEBIT_ATTEMPT_SUBTYPE,
    is_catalog: false,
    owner_id: input.subscription.owner_id,
    branch: input.subscription.branch,
    created_by: input.subscription.owner_id,
    data: {
      subscriptionId: input.subscription.id,
      memberName: pickStr(input.subscription.data, 'memberName'),
      memberId: pickStr(input.subscription.data, 'memberId'),
      amount: input.amount,
      date: todayIsoNg(),
      status: input.status,
      reason: input.reason ?? '',
      walletBalance: input.walletBalance ?? 0,
    },
  });
}

export async function runFoodstuffsAutoDebit(
  supabase: SupabaseClient
): Promise<{
  ok: true;
  processed: number;
  success: number;
  alreadyPaid: number;
  lowBalance: number;
  failed: number;
  skipped: number;
}> {
  const { settings } = await getFoodstuffsOpsSettings(supabase);
  if (!settings.autoDebitEnabled) {
    return { ok: true, processed: 0, success: 0, alreadyPaid: 0, lowBalance: 0, failed: 0, skipped: 0 };
  }

  const subscriptions = (await getRows(supabase, 'foodstuffsSubscription')).filter(
    (s) => pickStr(s.data, 'status') === 'Active' && s.owner_id
  );
  const wallets = await walletMapForSubscriptions(
    supabase,
    subscriptions.map((s) => s.owner_id as string)
  );
  const today = todayIsoNg();
  const out = { ok: true as const, processed: subscriptions.length, success: 0, alreadyPaid: 0, lowBalance: 0, failed: 0, skipped: 0 };

  for (const sub of subscriptions) {
    const amount = pickNum(sub.data, 'dailyContribution', settings.dailyContribution);
    const walletBalance = wallets.get(sub.owner_id ?? '') ?? 0;
    if (sub.data.autoDebitEnabled === false) {
      out.skipped += 1;
      await recordDebitAttempt(supabase, {
        subscription: sub,
        amount,
        status: 'skipped',
        reason: 'member_auto_debit_disabled',
        walletBalance,
      });
      continue;
    }
    if (pickStr(sub.data, 'lastPaymentDate') === today) {
      out.alreadyPaid += 1;
      await recordDebitAttempt(supabase, { subscription: sub, amount, status: 'already_paid', walletBalance });
      continue;
    }
    if (walletBalance < amount) {
      out.lowBalance += 1;
      await recordDebitAttempt(supabase, { subscription: sub, amount, status: 'low_balance', reason: 'insufficient_balance', walletBalance });
      continue;
    }

    try {
      const result = await payFoodstuffsDailyContribution(supabase, {
        userId: sub.owner_id as string,
        branch: sub.branch,
      });
      if (result instanceof NextResponse) {
        const body = await result.json().catch(() => ({ error: 'failed' }));
        const reason = String((body as { error?: string }).error ?? 'failed');
        if (reason === 'already_paid_today') out.alreadyPaid += 1;
        else out.failed += 1;
        await recordDebitAttempt(supabase, { subscription: sub, amount, status: 'failed', reason, walletBalance });
      } else {
        out.success += 1;
        await recordDebitAttempt(supabase, { subscription: sub, amount, status: 'success', walletBalance });
      }
    } catch (e) {
      out.failed += 1;
      await recordDebitAttempt(supabase, {
        subscription: sub,
        amount,
        status: 'failed',
        reason: e instanceof Error ? e.message : 'failed',
        walletBalance,
      });
    }
  }

  return out;
}

export async function createFoodstuffsRoute(
  supabase: SupabaseClient,
  staffUserId: string,
  body: Record<string, unknown>
): Promise<{ ok: true; routeId: string }> {
  const deliveryIds = Array.isArray(body.deliveryIds)
    ? body.deliveryIds.map(String).filter(Boolean)
    : [];
  if (!deliveryIds.length) throw new Error('delivery_ids_required');

  const payload = {
    routeDate: String(body.routeDate ?? todayIsoNg()),
    branch: String(body.branch ?? '').trim(),
    zone: String(body.zone ?? '').trim(),
    driverName: String(body.driverName ?? '').trim(),
    status: 'Planned',
    deliveryIds,
    fuelCost: Number(body.fuelCost ?? 0) || 0,
    staffCost: Number(body.staffCost ?? 0) || 0,
    otherCost: Number(body.otherCost ?? 0) || 0,
    createdAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('operational_items')
    .insert({
      module: 'investments',
      subtype: ROUTE_SUBTYPE,
      is_catalog: false,
      owner_id: null,
      branch: payload.branch || null,
      created_by: staffUserId,
      data: payload,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  for (const id of deliveryIds) {
    const { data: row } = await supabase
      .from('operational_items')
      .select('data')
      .eq('id', id)
      .eq('module', 'investments')
      .eq('subtype', 'foodstuffsDelivery')
      .maybeSingle();
    const prev = (row?.data as Record<string, unknown> | undefined) ?? {};
    await supabase
      .from('operational_items')
      .update({
        data: {
          ...prev,
          routeId: data.id,
          routeDate: payload.routeDate,
          routeZone: payload.zone,
          status: 'Out for delivery',
        },
      })
      .eq('id', id);
  }

  return { ok: true, routeId: data.id as string };
}

export async function updateFoodstuffsRoute(
  supabase: SupabaseClient,
  routeId: string,
  patch: Record<string, unknown>
): Promise<{ ok: true }> {
  const { data: row, error } = await supabase
    .from('operational_items')
    .select('data')
    .eq('id', routeId)
    .eq('module', 'investments')
    .eq('subtype', ROUTE_SUBTYPE)
    .maybeSingle();
  if (error || !row) throw new Error('route_not_found');
  const prev = (row.data as Record<string, unknown>) ?? {};
  const next = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  const { error: upErr } = await supabase
    .from('operational_items')
    .update({ data: next })
    .eq('id', routeId);
  if (upErr) throw new Error(upErr.message);
  return { ok: true };
}
