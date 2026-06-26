'use client';

import { useEffect } from 'react';
import { setToken } from '@/api/session';

/** Keeps sessionStorage JWT in sync with Supabase auth (refresh, sign-in, sign-out). */
export function AuthSessionSync() {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/browser');
      const client = getSupabaseBrowserClient();
      if (!client) return;

      const { data: initial } = await client.auth.getSession();
      if (initial.session?.access_token) {
        setToken(initial.session.access_token);
      }

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, session) => {
        if (session?.access_token) {
          setToken(session.access_token);
        }
      });
      unsubscribe = () => subscription.unsubscribe();
    })();

    return () => {
      unsubscribe?.();
    };
  }, []);

  return null;
}
