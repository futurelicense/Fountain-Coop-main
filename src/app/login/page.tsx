'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { clearAuthSession, resolveAuthToken } from '@/api/auth-session';
import { getToken } from '@/api/session';
import { fetchMe } from '@/api';

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(
    () => typeof window !== 'undefined' && !!getToken()
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await resolveAuthToken();
      if (cancelled) return;
      if (!token) {
        setChecking(false);
        return;
      }
      try {
        const { user } = await fetchMe();
        if (cancelled) return;
        router.replace(user.role === 'member' ? '/member' : '/dashboard');
      } catch {
        await clearAuthSession();
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

