'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MemberLayout } from '@/components/member/MemberLayout';
import { clearAuthSession, resolveAuthToken } from '@/api/auth-session';
import { fetchMe } from '@/api';

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
      const token = await resolveAuthToken();
      if (cancelled) return;
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
          await clearAuthSession();
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
