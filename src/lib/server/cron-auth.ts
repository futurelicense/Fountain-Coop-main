import { timingSafeEqual } from 'node:crypto';

export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get('authorization')?.trim() ?? '';
  const expected = `Bearer ${secret}`;

  try {
    const a = Buffer.from(auth, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return auth === expected;
  }
}
