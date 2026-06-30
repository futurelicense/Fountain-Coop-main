type PaystackInitializeInput = {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
};

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    amount: number;
    reference: string;
    paid_at?: string;
    metadata?: Record<string, unknown> | null;
    channel?: string | null;
  };
};

function getPaystackSecret(): string | null {
  return process.env.PAYSTACK_SECRET_KEY?.trim() || null;
}

export function isPaystackConfigured(): boolean {
  return Boolean(getPaystackSecret());
}

export async function initializePaystackTransaction(
  input: PaystackInitializeInput
) {
  const key = getPaystackSecret();
  if (!key) {
    throw new Error('paystack_not_configured');
  }
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata ?? {},
    }),
  });
  const body = (await res.json()) as PaystackInitializeResponse;
  if (!res.ok || !body.status || !body.data?.authorization_url) {
    throw new Error(body.message || 'paystack_initialize_failed');
  }
  return body.data;
}

export async function verifyPaystackTransaction(reference: string) {
  const key = getPaystackSecret();
  if (!key) {
    throw new Error('paystack_not_configured');
  }
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
      },
    }
  );
  const body = (await res.json()) as PaystackVerifyResponse;
  if (!res.ok || !body.status || !body.data) {
    throw new Error(body.message || 'paystack_verify_failed');
  }
  return body.data;
}

export type PaystackBank = {
  name: string;
  code: string;
};

type PaystackBankListResponse = {
  status: boolean;
  message: string;
  data?: PaystackBank[];
};

type PaystackResolveResponse = {
  status: boolean;
  message: string;
  data?: {
    account_number: string;
    account_name: string;
    bank_id: number;
  };
};

export async function listPaystackBanks(): Promise<PaystackBank[]> {
  const key = getPaystackSecret();
  if (!key) {
    throw new Error('paystack_not_configured');
  }
  const res = await fetch(
    'https://api.paystack.co/bank?country=nigeria&perPage=100',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${key}` },
    }
  );
  const body = (await res.json()) as PaystackBankListResponse;
  if (!res.ok || !body.status || !body.data) {
    throw new Error(body.message || 'paystack_banks_failed');
  }
  const seen = new Set<string>();
  return body.data
    .filter((b) => b.code && b.name)
    .filter((b) => {
      if (seen.has(b.code)) return false;
      seen.add(b.code);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function resolvePaystackBankAccount(input: {
  accountNumber: string;
  bankCode: string;
}) {
  const key = getPaystackSecret();
  if (!key) {
    throw new Error('paystack_not_configured');
  }
  const accountNumber = input.accountNumber.replace(/\D/g, '');
  const bankCode = input.bankCode.trim();
  if (accountNumber.length < 10) {
    throw new Error('invalid_account_number');
  }
  if (!bankCode) {
    throw new Error('bank_required');
  }

  const url = new URL('https://api.paystack.co/bank/resolve');
  url.searchParams.set('account_number', accountNumber);
  url.searchParams.set('bank_code', bankCode);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = (await res.json()) as PaystackResolveResponse;
  if (!res.ok || !body.status || !body.data?.account_name) {
    throw new Error(body.message || 'account_resolve_failed');
  }
  return {
    account_number: body.data.account_number,
    account_name: body.data.account_name,
    bank_id: body.data.bank_id,
  };
}
