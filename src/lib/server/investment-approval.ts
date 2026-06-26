import type { SupabaseClient } from '@supabase/supabase-js';
import { pickNum, pickStr } from '@/lib/pickData';
import {
  FOODSTUFFS_DEFAULTS,
  chargingSlotsFilled,
} from '@/lib/investment-products';

type OpRow = {
  id: string;
  subtype: string;
  owner_id: string | null;
  data: Record<string, unknown>;
  branch: string | null;
};

function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function loadCatalogProduct(
  supabase: SupabaseClient,
  productKind: string,
  productId?: string
): Promise<OpRow | null> {
  if (productId) {
    const { data } = await supabase
      .from('operational_items')
      .select('id, subtype, owner_id, data, branch')
      .eq('module', 'investments')
      .eq('id', productId)
      .maybeSingle();
    if (data) return data as OpRow;
  }
  const { data: rows } = await supabase
    .from('operational_items')
    .select('id, subtype, owner_id, data, branch')
    .eq('module', 'investments')
    .eq('subtype', 'investmentProduct')
    .eq('is_catalog', true);
  const match = (rows ?? []).find(
    (r) => pickStr((r.data as Record<string, unknown>) ?? {}, 'kind') === productKind
  );
  return match ? (match as OpRow) : null;
}

async function loadAllHoldings(supabase: SupabaseClient): Promise<OpRow[]> {
  const { data } = await supabase
    .from('operational_items')
    .select('id, subtype, owner_id, data, branch')
    .eq('module', 'investments')
    .eq('subtype', 'memberInvestment');
  return (data ?? []) as OpRow[];
}

export async function approveInvestmentApplication(
  supabase: SupabaseClient,
  applicationId: string,
  staffUserId: string
): Promise<{ ok: true; holdingId: string; subscriptionId?: string }> {
  const { data: appRow, error: appErr } = await supabase
    .from('operational_items')
    .select('id, subtype, owner_id, data, branch')
    .eq('module', 'investments')
    .eq('id', applicationId)
    .maybeSingle();

  if (appErr || !appRow) {
    throw new Error('application_not_found');
  }
  if (appRow.subtype !== 'investmentApplication') {
    throw new Error('invalid_application');
  }

  const app = appRow.data as Record<string, unknown>;
  const prevStatus = pickStr(app, 'status');
  if (prevStatus === 'Approved' && pickStr(app, 'holdingId')) {
    return {
      ok: true,
      holdingId: pickStr(app, 'holdingId'),
      subscriptionId: pickStr(app, 'subscriptionId') || undefined,
    };
  }
  if (prevStatus === 'Rejected') {
    throw new Error('application_rejected');
  }

  const productKind = pickStr(app, 'productKind');
  const productId = pickStr(app, 'productId');
  const memberId = pickStr(app, 'memberId');
  const memberName = pickStr(app, 'memberName');
  let ownerId = appRow.owner_id;
  if (!ownerId && memberId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('member_code', memberId)
      .maybeSingle();
    ownerId = profile?.id ?? null;
  }
  if (!ownerId) {
    throw new Error('member_not_found');
  }
  const product = await loadCatalogProduct(supabase, productKind, productId || undefined);
  if (!product) {
    throw new Error('product_not_found');
  }

  const productData = product.data;
  const resolvedProductId = product.id;
  let holdingPayload: Record<string, unknown>;
  let subscriptionId: string | undefined;

  if (productKind === 'phone_charging_units') {
    const holdings = await loadAllHoldings(supabase);
    const required = pickNum(productData, 'investorsRequired', 4);
    const filled = chargingSlotsFilled(resolvedProductId, holdings);
    if (filled >= required) {
      throw new Error('charging_pool_full');
    }

    const principal = pickNum(app, 'amount', pickNum(productData, 'investmentPerInvestor', 250_000));
    const expectedReturn = pickNum(productData, 'investorInterestTotal', 110_000);
    const tenureMonths = pickNum(productData, 'tenureMonths', 12);
    const startDate = new Date().toISOString().slice(0, 10);

    holdingPayload = {
      memberName,
      memberId,
      productId: resolvedProductId,
      productKind,
      productName: pickStr(app, 'productName') || pickStr(productData, 'name'),
      applicationId,
      principal,
      expectedReturn,
      startDate,
      maturityDate: addMonths(startDate, tenureMonths),
      status: 'Active',
      poolSlot: filled + 1,
      poolSize: required,
    };

    const newFilled = filled + 1;
    await supabase
      .from('operational_items')
      .update({
        data: {
          ...productData,
          slotsFilled: newFilled,
          status: newFilled >= required ? 'Fully Funded' : pickStr(productData, 'status', 'Active'),
        },
      })
      .eq('id', resolvedProductId);
  } else if (productKind === 'ajo_for_foodstuffs') {
    const { data: existingSub } = await supabase
      .from('operational_items')
      .select('id')
      .eq('module', 'investments')
      .eq('subtype', 'foodstuffsSubscription')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (existingSub?.id) {
      throw new Error('foodstuffs_subscription_exists');
    }

    const dailyContribution = pickNum(
      productData,
      'dailyMemberContribution',
      FOODSTUFFS_DEFAULTS.dailyContribution
    );

    const { data: subRow, error: subErr } = await supabase
      .from('operational_items')
      .insert({
        module: 'investments',
        subtype: 'foodstuffsSubscription',
        is_catalog: false,
        owner_id: ownerId,
        branch: appRow.branch,
        created_by: staffUserId,
        data: {
          memberId,
          memberName,
          productId: resolvedProductId,
          productKind,
          productName: pickStr(app, 'productName') || pickStr(productData, 'name'),
          applicationId,
          status: 'Active',
          autoDebitEnabled: true,
          dailyContribution,
          daysPerDeliveryCycle: pickNum(
            productData,
            'daysPerDeliveryCycle',
            FOODSTUFFS_DEFAULTS.daysPerDeliveryCycle
          ),
          redemptionWindowDays: pickNum(
            productData,
            'redemptionWindowDays',
            FOODSTUFFS_DEFAULTS.redemptionWindowDays
          ),
          missedDeliveryPenalty: pickNum(
            productData,
            'missedDeliveryPenalty',
            FOODSTUFFS_DEFAULTS.missedDeliveryPenalty
          ),
          daysPaidInCycle: 0,
          totalDaysPaid: 0,
          totalContributed: 0,
          lastPaymentDate: '',
          dropOffLocation: '',
          redeemContactName: '',
          redeemContactPhone: '',
          profileComplete: false,
          penaltyFeesAccrued: 0,
          missedDeliveries: 0,
          startedAt: new Date().toISOString().slice(0, 10),
        },
      })
      .select('id')
      .single();

    if (subErr || !subRow) {
      throw new Error(subErr?.message ?? 'subscription_create_failed');
    }
    subscriptionId = subRow.id as string;

    holdingPayload = {
      memberName,
      memberId,
      productId: resolvedProductId,
      productKind,
      productName: pickStr(app, 'productName') || pickStr(productData, 'name'),
      applicationId,
      subscriptionId,
      principal: 0,
      expectedReturn: 0,
      startDate: new Date().toISOString().slice(0, 10),
      maturityDate: addMonths(new Date().toISOString().slice(0, 10), pickNum(productData, 'tenureMonths', 12)),
      status: 'Active',
    };
  } else {
    throw new Error('unsupported_product_kind');
  }

  const { data: holdingRow, error: holdErr } = await supabase
    .from('operational_items')
    .insert({
      module: 'investments',
      subtype: 'memberInvestment',
      is_catalog: false,
      owner_id: ownerId,
      branch: appRow.branch,
      created_by: staffUserId,
      data: holdingPayload,
    })
    .select('id')
    .single();

  if (holdErr || !holdingRow) {
    throw new Error(holdErr?.message ?? 'holding_create_failed');
  }

  const holdingId = holdingRow.id as string;

  await supabase
    .from('operational_items')
    .update({
      data: {
        ...app,
        status: 'Approved',
        approvedDate: new Date().toISOString().slice(0, 10),
        holdingId,
        ...(subscriptionId ? { subscriptionId } : {}),
      },
    })
    .eq('id', applicationId);

  void supabase.from('activities').insert({
    type: 'investment',
    actor_name: memberName,
    action_text: `Investment approved — ${pickStr(holdingPayload, 'productName')} (${memberId})`,
  });

  return { ok: true, holdingId, subscriptionId };
}

export { addDays, addMonths };
