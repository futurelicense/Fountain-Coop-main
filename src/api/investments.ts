import { apiFetch } from './client';
import type { FoodstuffsOpsSummary } from '@/lib/server/foodstuffs-ops';

export type InvestmentAccess = {
  entryFee: number;
  note: string;
  hasPaid: boolean;
  canViewOptions: boolean;
  savings_balance?: number;
};

export async function fetchInvestmentAccess(): Promise<InvestmentAccess> {
  return apiFetch('/api/member/investments/access');
}

export async function payInvestmentEntryFee(): Promise<{
  ok: true;
  savings_balance: number;
  entryFee: number;
  paidAt: string;
}> {
  return apiFetch('/api/member/investments/access', { method: 'POST' });
}

export async function fetchInvestmentSettings(): Promise<{
  settings: {
    entryFee: number;
    note: string;
    updatedAt: string;
    updatedByName: string;
  };
  payments: {
    id: string;
    memberId: string;
    memberName: string;
    amount: number;
    paidAt: string;
  }[];
}> {
  return apiFetch('/api/investments/settings');
}

export async function saveInvestmentSettings(body: {
  entryFee: number;
  note?: string;
}): Promise<{
  settings: {
    entryFee: number;
    note: string;
    updatedAt: string;
    updatedByName: string;
  };
}> {
  return apiFetch('/api/investments/settings', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function approveInvestmentApplication(applicationId: string): Promise<{
  ok: true;
  holdingId: string;
  subscriptionId?: string;
}> {
  return apiFetch(`/api/investments/applications/${encodeURIComponent(applicationId)}/approve`, {
    method: 'POST',
  });
}

export async function syncFoodstuffsDeliveries(): Promise<{
  ok: true;
  penaltiesApplied: number;
}> {
  return apiFetch('/api/member/investments/foodstuffs/pay-daily');
}

export async function payFoodstuffsDaily(): Promise<{
  ok: true;
  savings_balance: number;
  daysPaidInCycle: number;
  deliveryScheduled?: boolean;
}> {
  return apiFetch('/api/member/investments/foodstuffs/pay-daily', {
    method: 'POST',
  });
}

export async function updateFoodstuffsAutoDebit(
  enabled: boolean
): Promise<{ ok: true; autoDebitEnabled: boolean }> {
  return apiFetch('/api/member/investments/foodstuffs/auto-debit', {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}

export async function updateFoodstuffsProfile(body: {
  dropOffLocation: string;
  redeemContactName: string;
  redeemContactPhone: string;
}): Promise<{ ok: true }> {
  return apiFetch('/api/member/investments/foodstuffs/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function redeemFoodstuffsDelivery(deliveryId: string): Promise<{ ok: true }> {
  return apiFetch(
    `/api/member/investments/foodstuffs/deliveries/${encodeURIComponent(deliveryId)}/redeem`,
    { method: 'POST' }
  );
}

export type { FoodstuffsOpsSummary };

export async function fetchFoodstuffsOps(): Promise<FoodstuffsOpsSummary> {
  return apiFetch('/api/investments/foodstuffs/ops');
}

export async function saveFoodstuffsOpsSettings(
  body: Partial<FoodstuffsOpsSummary['settings']>
): Promise<{ settings: FoodstuffsOpsSummary['settings'] }> {
  return apiFetch('/api/investments/foodstuffs/ops', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function runFoodstuffsAutoDebit(): Promise<{
  ok: true;
  processed: number;
  success: number;
  alreadyPaid: number;
  lowBalance: number;
  failed: number;
  skipped: number;
}> {
  return apiFetch('/api/investments/foodstuffs/auto-debit', {
    method: 'POST',
  });
}

export async function createFoodstuffsRoute(body: {
  routeDate: string;
  branch?: string;
  zone?: string;
  driverName?: string;
  deliveryIds: string[];
  fuelCost?: number;
  staffCost?: number;
  otherCost?: number;
}): Promise<{ ok: true; routeId: string }> {
  return apiFetch('/api/investments/foodstuffs/routes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateFoodstuffsRoute(
  routeId: string,
  body: Record<string, unknown>
): Promise<{ ok: true }> {
  return apiFetch(
    `/api/investments/foodstuffs/routes/${encodeURIComponent(routeId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    }
  );
}
