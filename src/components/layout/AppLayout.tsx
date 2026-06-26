'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { signOutSession } from '@/api/session';

interface AppLayoutProps {
  children: React.ReactNode;
  currentUser?: {
    name: string;
    roleLabel: string;
    role?: string;
  };
}

export function AppLayout({ children, currentUser }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const safePathname = pathname ?? '';
  const currentPage =
    safePathname.replace(/^\//, '').split('/').filter(Boolean)[0] || 'dashboard';

  const getPageTitle = (page: string) => {
    if (page === 'dashboard') {
      if (safePathname.startsWith('/dashboard/super-admin')) {
        return 'Super Admin Dashboard';
      }
      if (safePathname.startsWith('/dashboard/tenant-admin')) {
        return 'Tenant Admin Dashboard';
      }
      if (safePathname.startsWith('/dashboard/group-admin')) {
        return 'Group Admin Dashboard';
      }
    }
    const titles: Record<string, string> = {
      dashboard: 'Executive Dashboard',
      members: 'Member Management',
      cooperative: 'Cooperative Savings',
      thrift: 'Thrift Module',
      ajo: 'Ajo/Osusu Cycles',
      packs: 'Contribution Packs',
      investments: 'Investment Products',
      loans: 'Loan Management',
      recovery: 'Recovery & Collections',
      branches: 'Branch Operations',
      transactions: 'Transactions Ledger',
      support: 'Member Support',
      reports: 'Reports & Analytics',
      compliance: 'Compliance & Audit',
      notifications: 'Notifications',
      settings: 'System Settings',
    };
    return titles[page] || 'Fountain Coop';
  };

  return (
    <div className="flex h-screen bg-fountain-gray-50 overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        currentRole={currentUser?.role}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          onMenuClick={() => setIsSidebarOpen(true)}
          pageTitle={getPageTitle(currentPage)}
          onSwitchToMember={() => router.push('/member')}
          onLogout={() => {
            void signOutSession().finally(() => router.push('/'));
          }}
          currentUser={currentUser}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
