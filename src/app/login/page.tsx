'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { clearToken, getToken, setToken } from '@/api/session';
import { fetchMe } from '@/api';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(
    () => typeof window !== 'undefined' && !!getToken()
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        setChecking(true);
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session?.access_token) {
          setToken(data.session.access_token);
        }
      }
      const token = getToken();
      if (!token) {
        setChecking(false);
        return;
      }
      try {
        const { user } = await fetchMe();
        if (cancelled) return;
        router.replace(user.role === 'member' ? '/member' : '/dashboard');
      } catch {
        clearToken();
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fountain-gray-50 text-fountain-gray-600 text-sm">
        Checking session…
      </div>
    );
  }

  return (
    <LoginForm
      onLoginSuccess={(session) => {
        router.replace(
          session.user.role === 'member' ? '/member' : '/dashboard'
        );
      }}
    />
  );
}

