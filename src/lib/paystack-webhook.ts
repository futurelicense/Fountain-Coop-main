import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret || !signatureHeader) return false;
  const digest = createHmac('sha512', secret).update(rawBody).digest('hex');
  try {
    const a = Buffer.from(digest, 'utf8');
    const b = Buffer.from(signatureHeader, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return digest === signatureHeader;
  }
}
