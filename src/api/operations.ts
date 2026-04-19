import { apiFetch } from './client';
import type { OperationalItem } from './types';

export type { OperationalItem } from './types';

export async function listOperational(
  module: string,
  subtype?: string
): Promise<OperationalItem[]> {
  const q = subtype
    ? `?subtype=${encodeURIComponent(subtype)}`
    : '';
  return apiFetch<OperationalItem[]>(
    `/api/operations/${encodeURIComponent(module)}${q}`
  );
}

export async function createOperational(
  module: string,
  body: {
    subtype: string;
    data: Record<string, unknown>;
    is_catalog?: boolean;
    owner_id?: string | null;
    branch?: string | null;
  }
): Promise<OperationalItem> {
  return apiFetch<OperationalItem>(
    `/api/operations/${encodeURIComponent(module)}`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
}

export async function updateOperational(
  module: string,
  id: string,
  data: Record<string, unknown>
): Promise<OperationalItem> {
  return apiFetch<OperationalItem>(
    `/api/operations/${encodeURIComponent(module)}/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ data }),
    }
  );
}

export async function deleteOperational(
  module: string,
  id: string
): Promise<void> {
  return apiFetch<void>(
    `/api/operations/${encodeURIComponent(module)}/${encodeURIComponent(id)}`,
    { method: 'DELETE' }
  );
}

export async function postMemberWallet(body: {
  kind: 'deposit' | 'withdraw';
  amount: number;
  label?: string | null;
}): Promise<{ ok: boolean; savings_balance: number }> {
  return apiFetch('/api/member/wallet', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function initializeMemberPaystackDeposit(body: {
  amount: number;
}): Promise<{ ok: true; authorization_url: string; reference: string; access_code: string }> {
  return apiFetch('/api/member/wallet/paystack/initialize', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function verifyMemberPaystackDeposit(body: {
  reference: string;
}): Promise<{ ok: boolean; alreadyProcessed?: boolean; savings_balance?: number }> {
  return apiFetch('/api/member/wallet/paystack/verify', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
