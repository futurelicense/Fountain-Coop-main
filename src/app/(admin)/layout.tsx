'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { clearToken, getToken, setToken } from '@/api/session';
import { fetchMe } from '@/api';
import type { AuthUser } from '@/api/types';
import { formatRoleLabel } from '@/lib/roleLabel';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (!cancelled && data.session?.access_token) {
          setToken(data.session.access_token);
        }
      }
      if (cancelled) return;
      const token = getToken();
      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        const { user } = await fetchMe();
        if (cancelled) return;
        if (user.role === 'member') {
          router.replace('/member');
          return;
        }
        setAuthUser(user);
        setReady(true);
      } catch {
        if (!cancelled) {
          clearToken();
          router.replace('/login');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready || !authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fountain-gray-50 text-fountain-gray-600 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <AppLayout
      currentUser={{
        name: authUser.name,
        roleLabel: formatRoleLabel(authUser.role),
        role: authUser.role,
      }}
    >
      {children}
    </AppLayout>
  );
}
