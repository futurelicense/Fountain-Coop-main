/** Wired/live testing: Supabase + Paystack only; no legacy tokens or seed fallbacks. */
export function isWiredTestMode(): boolean {
  return process.env.NEXT_PUBLIC_WIRED_TEST_MODE === 'true';
}

/** Legacy base64 demo login (`/api/auth/login`). Off by default when wired test is on. */
export function isLegacyAuthEnabled(): boolean {
  if (isWiredTestMode()) return false;
  return process.env.NEXT_PUBLIC_LEGACY_AUTH_ENABLED === 'true';
}

/** Starting savings for new member profiles (wired test starts at ₦0). */
export function defaultMemberSavingsBalance(): number {
  return isWiredTestMode() ? 0 : 450000;
}
