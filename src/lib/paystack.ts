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
