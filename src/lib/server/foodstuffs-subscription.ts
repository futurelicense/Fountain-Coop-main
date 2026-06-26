import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { pickNum, pickStr } from '@/lib/pickData';
import { FOODSTUFFS_DEFAULTS } from '@/lib/investment-products';
import { addDays } from '@/lib/server/investment-approval';
import { runWalletForUser } from '@/lib/server/member-wallet';

type SubRow = {
  id: string;
  owner_id: string | null;
  data: Record<string, unknown>;
  branch: string | null;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function hasScheduledDelivery(
  supabase: SupabaseClient,
  userId: string,
  subscriptionId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('operational_items')
    .select('id')
    .eq('module', 'investments')
    .eq('subtype', 'foodstuffsDelivery')
    .eq('owner_id', userId)
    .contains('data', { subscriptionId, status: 'Scheduled' });
  return (data ?? []).length > 0;
}

async function loadProductBasketItems(
  supabase: SupabaseClient,
  productId: string
): Promise<string[]> {
  if (!productId) return [];
  const { data } = await supabase
    .from('operational_items')
    .select('data')
    .eq('id', productId)
    .maybeSingle();
  if (!data?.data || typeof data.data !== 'object') return [];
  const d = data.data as Record<string, unknown>;
  return Array.isArray(d.dailyDeliverables)
    ? (d.dailyDeliverables as string[])
    : [];
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 14;
}

export async function loadMemberFoodstuffsSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<SubRow | null> {
  const { data } = await supabase
    .from('operational_items')
    .select('id, owner_id, data, branch')
    .eq('module', 'investments')
    .eq('subtype', 'foodstuffsSubscription')
    .eq('owner_id', userId)
    .maybeSingle();
  return data ? (data as SubRow) : null;
}

export async function processMissedFoodstuffsDeliveries(
  supabase: SupabaseClient,
  userId: string,
  user?: import('@supabase/supabase-js').User
): Promise<{ penaltiesApplied: number }> {
  const today = todayIso();
  const { data: deliveries } = await supabase
    .from('operational_items')
    .select('id, data')
    .eq('module', 'investments')
    .eq('subtype', 'foodstuffsDelivery')
    .eq('owner_id', userId);

  let penaltiesApplied = 0;
  const sub = await loadMemberFoodstuffsSubscription(supabase, userId);
  if (!sub) return { penaltiesApplied: 0 };

  const penalty = pickNum(sub.data, 'missedDeliveryPenalty', FOODSTUFFS_DEFAULTS.missedDeliveryPenalty);

  for (const row of deliveries ?? []) {
    const d = row.data as Record<string, unknown>;
    if (pickStr(d, 'status') !== 'Scheduled') continue;
    const redeemBy = pickStr(d, 'redeemByDate');
    if (!redeemBy || redeemBy >= today) continue;

    const penaltyRes = await runWalletForUser(supabase, {
      userId,
      user,
      branch: sub.branch,
      kind: 'withdraw',
      amount: penalty,
      label: 'Ajo-for-Foodstuffs missed delivery penalty',
      meta: { deliveryId: row.id, type: 'foodstuffs_penalty' },
    });

    const charged = penaltyRes.status === 200;
    const subData = sub.data;
    await supabase
      .from('operational_items')
      .update({
        data: {
          ...subData,
          missedDeliveries: pickNum(subData, 'missedDeliveries') + 1,
          penaltyFeesAccrued:
            pickNum(subData, 'penaltyFeesAccrued') + (charged ? penalty : 0),
        },
      })
      .eq('id', sub.id);

    await supabase
      .from('operational_items')
      .update({
        data: {
          ...d,
          status: 'Missed',
          missedAt: today,
          penaltyCharged: charged ? penalty : 0,
          penaltyChargeFailed: !charged,
        },
      })
      .eq('id', row.id);

    if (charged) penaltiesApplied += 1;
  }

  return { penaltiesApplied };
}

export async function payFoodstuffsDailyContribution(
  supabase: SupabaseClient,
  opts: {
    userId: string;
    user?: import('@supabase/supabase-js').User;
    branch: string | null;
  }
): Promise<
  | NextResponse
  | {
      ok: true;
      savings_balance: number;
      daysPaidInCycle: number;
      deliveryScheduled?: boolean;
    }
> {
  const { userId, user, branch } = opts;
  await processMissedFoodstuffsDeliveries(supabase, userId, user);

  const sub = await loadMemberFoodstuffsSubscription(supabase, userId);
  if (!sub || pickStr(sub.data, 'status') !== 'Active') {
    return NextResponse.json({ error: 'no_active_subscription' }, { status: 404 });
  }

  const subData = sub.data;
  const today = todayIso();
  if (pickStr(subData, 'lastPaymentDate') === today) {
    return NextResponse.json({ error: 'already_paid_today' }, { status: 409 });
  }

  const daysPerCycle = pickNum(
    subData,
    'daysPerDeliveryCycle',
    FOODSTUFFS_DEFAULTS.daysPerDeliveryCycle
  );
  if (
    pickNum(subData, 'daysPaidInCycle') >= daysPerCycle &&
    !subData.profileComplete
  ) {
    return NextResponse.json({ error: 'delivery_profile_required' }, { status: 409 });
  }

  const amount = pickNum(subData, 'dailyContribution', FOODSTUFFS_DEFAULTS.dailyContribution);
  const walletRes = await runWalletForUser(supabase, {
    userId,
    user,
    branch,
    kind: 'withdraw',
    amount,
    label: 'Ajo-for-Foodstuffs daily contribution',
    meta: { subscriptionId: sub.id, type: 'foodstuffs_daily' },
  });

  if (walletRes.status !== 200) {
    return walletRes;
  }

  const walletBody = (await walletRes.json()) as { savings_balance: number };
  const nextDays = pickNum(subData, 'daysPaidInCycle') + 1;
  const totalDays = pickNum(subData, 'totalDaysPaid') + 1;
  const totalContributed = pickNum(subData, 'totalContributed') + amount;

  let deliveryScheduled = false;
  let patchSub: Record<string, unknown> = {
    ...subData,
    daysPaidInCycle: nextDays,
    totalDaysPaid: totalDays,
    totalContributed,
    lastPaymentDate: today,
  };

  if (nextDays >= daysPerCycle) {
    const alreadyScheduled = await hasScheduledDelivery(supabase, userId, sub.id);
    if (!alreadyScheduled) {
      const basketItems = await loadProductBasketItems(
        supabase,
        pickStr(subData, 'productId')
      );
      const windowDays = pickNum(
        subData,
        'redemptionWindowDays',
        FOODSTUFFS_DEFAULTS.redemptionWindowDays
      );
      const scheduledDate = addDays(today, 3);
      const redeemByDate = addDays(scheduledDate, windowDays);

      await supabase.from('operational_items').insert({
        module: 'investments',
        subtype: 'foodstuffsDelivery',
        is_catalog: false,
        owner_id: userId,
        branch,
        created_by: userId,
        data: {
          subscriptionId: sub.id,
          memberId: pickStr(subData, 'memberId'),
          memberName: pickStr(subData, 'memberName'),
          scheduledDate,
          redeemByDate,
          status: 'Scheduled',
          dropOffLocation: pickStr(subData, 'dropOffLocation'),
          redeemContactName: pickStr(subData, 'redeemContactName'),
          redeemContactPhone: pickStr(subData, 'redeemContactPhone'),
          cycleNumber: pickNum(subData, 'completedDeliveries') + 1,
          basketItems,
        },
      });

      patchSub = {
        ...patchSub,
        daysPaidInCycle: 0,
        pendingDeliveryBlocked: false,
        pendingDeliveryReason: '',
        nextDeliveryDate: scheduledDate,
        completedDeliveries: pickNum(subData, 'completedDeliveries') + 1,
      };
      deliveryScheduled = true;
    }
  }

  await supabase
    .from('operational_items')
    .update({ data: patchSub })
    .eq('id', sub.id);

  await supabase.from('operational_items').insert({
    module: 'investments',
    subtype: 'foodstuffsDailyPayment',
    is_catalog: false,
    owner_id: userId,
    branch,
    created_by: userId,
    data: {
      subscriptionId: sub.id,
      date: today,
      amount,
      daysPaidInCycleAfter: pickNum(patchSub, 'daysPaidInCycle'),
    },
  });

  return {
    ok: true,
    savings_balance: walletBody.savings_balance,
    daysPaidInCycle: pickNum(patchSub, 'daysPaidInCycle'),
    deliveryScheduled,
  };
}

export async function updateFoodstuffsDeliveryProfile(
  supabase: SupabaseClient,
  userId: string,
  body: {
    dropOffLocation?: string;
    redeemContactName?: string;
    redeemContactPhone?: string;
  }
): Promise<{ ok: true } | NextResponse> {
  const sub = await loadMemberFoodstuffsSubscription(supabase, userId);
  if (!sub) {
    return NextResponse.json({ error: 'no_active_subscription' }, { status: 404 });
  }

  const location = String(body.dropOffLocation ?? '').trim();
  const name = String(body.redeemContactName ?? '').trim();
  const phone = String(body.redeemContactPhone ?? '').trim();

  if (location.length < 5) {
    return NextResponse.json({ error: 'invalid_drop_off_location' }, { status: 400 });
  }
  if (name.length < 2) {
    return NextResponse.json({ error: 'invalid_contact_name' }, { status: 400 });
  }
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: 'invalid_contact_phone' }, { status: 400 });
  }

  const subData = sub.data;
  const daysPerCycle = pickNum(
    subData,
    'daysPerDeliveryCycle',
    FOODSTUFFS_DEFAULTS.daysPerDeliveryCycle
  );

  let nextPatch: Record<string, unknown> = {
    ...subData,
    dropOffLocation: location,
    redeemContactName: name,
    redeemContactPhone: phone,
    profileComplete: true,
    profileUpdatedAt: new Date().toISOString(),
  };

  if (pickNum(subData, 'daysPaidInCycle') >= daysPerCycle) {
    const alreadyScheduled = await hasScheduledDelivery(supabase, userId, sub.id);
    if (!alreadyScheduled) {
      const today = todayIso();
      const windowDays = pickNum(
        subData,
        'redemptionWindowDays',
        FOODSTUFFS_DEFAULTS.redemptionWindowDays
      );
      const scheduledDate = addDays(today, 3);
      const redeemByDate = addDays(scheduledDate, windowDays);
      const basketItems = await loadProductBasketItems(
        supabase,
        pickStr(subData, 'productId')
      );

      await supabase.from('operational_items').insert({
        module: 'investments',
        subtype: 'foodstuffsDelivery',
        is_catalog: false,
        owner_id: userId,
        branch: sub.branch,
        created_by: userId,
        data: {
          subscriptionId: sub.id,
          memberId: pickStr(subData, 'memberId'),
          memberName: pickStr(subData, 'memberName'),
          scheduledDate,
          redeemByDate,
          status: 'Scheduled',
          dropOffLocation: location,
          redeemContactName: name,
          redeemContactPhone: phone,
          cycleNumber: pickNum(subData, 'completedDeliveries') + 1,
          basketItems,
        },
      });

      nextPatch = {
        ...nextPatch,
        daysPaidInCycle: 0,
        pendingDeliveryBlocked: false,
        pendingDeliveryReason: '',
        nextDeliveryDate: scheduledDate,
        completedDeliveries: pickNum(subData, 'completedDeliveries') + 1,
      };
    }
  }

  await supabase
    .from('operational_items')
    .update({ data: nextPatch })
    .eq('id', sub.id);

  return { ok: true };
}

export async function redeemFoodstuffsDelivery(
  supabase: SupabaseClient,
  userId: string,
  deliveryId: string
): Promise<{ ok: true } | NextResponse> {
  const today = todayIso();
  const { data: row } = await supabase
    .from('operational_items')
    .select('id, owner_id, data')
    .eq('module', 'investments')
    .eq('subtype', 'foodstuffsDelivery')
    .eq('id', deliveryId)
    .maybeSingle();

  if (!row || row.owner_id !== userId) {
    return NextResponse.json({ error: 'delivery_not_found' }, { status: 404 });
  }

  const d = row.data as Record<string, unknown>;
  if (pickStr(d, 'status') !== 'Scheduled') {
    return NextResponse.json({ error: 'delivery_not_scheduled' }, { status: 409 });
  }

  const scheduledDate = pickStr(d, 'scheduledDate');
  const redeemBy = pickStr(d, 'redeemByDate');
  if (today < scheduledDate) {
    return NextResponse.json({ error: 'delivery_not_open_yet' }, { status: 409 });
  }
  if (today > redeemBy) {
    return NextResponse.json({ error: 'delivery_window_closed' }, { status: 409 });
  }

  await supabase
    .from('operational_items')
    .update({
      data: {
        ...d,
        status: 'Redeemed',
        redeemedAt: new Date().toISOString(),
      },
    })
    .eq('id', deliveryId);

  void supabase.from('activities').insert({
    type: 'investment',
    actor_name: pickStr(d, 'memberName', 'Member'),
    action_text: `Food basket redeemed — ${pickStr(d, 'dropOffLocation')}`,
  });

  return { ok: true };
}
