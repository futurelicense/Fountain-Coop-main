import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/lib/supabase/config';

/** Bypasses RLS. Server-only; never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. */
export function getSupabaseAdmin(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!cfg || !key) return null;
  return createClient(cfg.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
