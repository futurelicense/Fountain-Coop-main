'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMe } from '@/api';
import { clearToken } from '@/api/session';

function routeForRole(role: string): string {
  if (role === 'super_admin') return '/dashboard/super-admin';
  if (role === 'tenant_admin') return '/dashboard/tenant-admin';
  if (role === 'group_admin') return '/dashboard/group-admin';
  if (role === 'member') return '/member';
  return '/login';
}

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { user } = await fetchMe();
        if (cancelled) return;
        router.replace(routeForRole(user.role));
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

  return (
    <div className="min-h-[40vh] flex items-center justify-center text-sm text-fountain-gray-600">
      Redirecting to your dashboard…
    </div>
  );
}
