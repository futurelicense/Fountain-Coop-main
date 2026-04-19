'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

let browserClient: SupabaseClient | null = null;

/** Singleton browser Supabase client (uses public anon key). */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(cfg.url, cfg.anonKey);
  }
  return browserClient;
}
