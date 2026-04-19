/**
 * Demo: map member ID / phone to a Supabase Auth email (see
 * supabase/migrations/002_demo_auth_users.sql). Keeps wallet + RLS working
 * without legacy base64 tokens.
 */
const DEMO_EMAIL_BY_MEMBER_ID: Record<string, string> = {
  'FC-1001': 'demo-member@fountain.coop',
};

/** Normalized phone tails → demo-member (Chioma in 002_demo_auth_users.sql). */
const DEMO_EMAIL_BY_PHONE_TAIL: Record<string, string> = {
  // +234 803 123 4567 → …8031234567 → last 10: 8031234567
  '8031234567': 'demo-member@fountain.coop',
  '08031234567': 'demo-member@fountain.coop',
};

export function demoSupabaseEmailForIdentifier(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const byId = DEMO_EMAIL_BY_MEMBER_ID[t.toUpperCase()];
  if (byId) return byId;
  const digits = t.replace(/\D/g, '');
  if (digits.length >= 10) {
    const tail10 = digits.slice(-10);
    const mapped10 = DEMO_EMAIL_BY_PHONE_TAIL[tail10];
    if (mapped10) return mapped10;
    const mapped11 = DEMO_EMAIL_BY_PHONE_TAIL[digits];
    if (mapped11) return mapped11;
  }
  return null;
}
