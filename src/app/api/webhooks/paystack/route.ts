import { NextResponse } from 'next/server';
import { verifyPaystackWebhookSignature } from '@/lib/paystack-webhook';
import {
  creditPaystackDeposit,
  paystackMetadataUserId,
} from '@/lib/server/paystack-wallet';

/**
 * Paystack webhook backup when the browser never calls /paystack/verify after checkout.
 * Configure in Paystack Dashboard → Webhooks → https://YOUR_HOST/api/webhooks/paystack
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  if (!verifyPaystackWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let payload: {
    event?: string;
    data?: {
      status?: string;
      reference?: string;
      amount?: number;
      paid_at?: string;
      channel?: string;
      metadata?: Record<string, unknown> | null;
    };
  };
  try {
    payload = JSON.parse(raw) as typeof payload;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (payload.event !== 'charge.success') {
    return NextResponse.json({ ok: true, ignored: payload.event ?? 'unknown' });
  }

  const data = payload.data;
  const reference = String(data?.reference ?? '').trim();
  const userId = paystackMetadataUserId(data?.metadata ?? null);
  if (!reference || !userId) {
    return NextResponse.json({ error: 'missing_reference_or_user' }, { status: 400 });
  }
  if (data?.status !== 'success') {
    return NextResponse.json({ error: 'payment_not_successful' }, { status: 400 });
  }

  const amountNaira = Math.round(Number(data?.amount ?? 0)) / 100;
  if (!amountNaira || amountNaira <= 0) {
    return NextResponse.json({ error: 'invalid_amount' }, { status: 400 });
  }

  return creditPaystackDeposit({
    userId,
    reference,
    amountNaira,
    channel: data?.channel ?? null,
    paidAt: data?.paid_at ?? null,
  });
}
