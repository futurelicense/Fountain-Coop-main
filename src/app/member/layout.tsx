'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MemberLayout } from '@/components/member/MemberLayout';
import { clearToken, getToken, setToken } from '@/api/session';
import { fetchMe } from '@/api';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function MemberSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [canSwitchToAdmin, setCanSwitchToAdmin] = useState(false);

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
        setCanSwitchToAdmin(user.role !== 'member');
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

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fountain-gray-50 text-fountain-gray-600 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <MemberLayout
      onSwitchToAdmin={
        canSwitchToAdmin ? () => router.push('/dashboard') : undefined
      }
    >
      {children}
    </MemberLayout>
  );
}
