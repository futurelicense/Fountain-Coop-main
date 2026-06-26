'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboardIcon,
  UsersIcon,
  PiggyBankIcon,
  CoinsIcon,
  RepeatIcon,
  PackageIcon,
  HandCoinsIcon,
  TrendingUpIcon,
  HeadphonesIcon,
  ShieldAlertIcon,
  BuildingIcon,
  ArrowLeftRightIcon,
  BarChart3Icon,
  ShieldCheckIcon,
  BellIcon,
  SettingsIcon,
  XIcon,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  currentRole?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}

function dashboardHrefByRole(role?: string): string {
  if (role === 'super_admin') return '/dashboard/super-admin';
  if (role === 'tenant_admin') return '/dashboard/tenant-admin';
  if (role === 'group_admin') return '/dashboard/group-admin';
  return '/dashboard';
}

export function Sidebar({
  currentPage,
  currentRole,
  isOpen,
  onClose,
}: SidebarProps) {
  const dashboardHref = dashboardHrefByRole(currentRole);
  const hiddenByRole: Record<string, string[]> = {
    super_admin: [],
    tenant_admin: ['settings', 'notifications'],
    group_admin: ['reports', 'compliance', 'settings', 'notifications'],
  };
  const hiddenIds = new Set(hiddenByRole[currentRole ?? ''] ?? []);
  const navGroups: { title: string; items: NavItem[] }[] = [
    {
      title: 'OVERVIEW',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboardIcon,
          href: dashboardHref,
        },
      ],
    },
    {
      title: 'MEMBERS',
      items: [{ id: 'members', label: 'Members', icon: UsersIcon }],
    },
    {
      title: 'PRODUCTS',
      items: [
        { id: 'cooperative', label: 'Cooperative', icon: PiggyBankIcon },
        { id: 'thrift', label: 'Thrift', icon: CoinsIcon },
        { id: 'ajo', label: 'Ajo/Osusu', icon: RepeatIcon },
        { id: 'packs', label: 'Contribution Packs', icon: PackageIcon },
        { id: 'investments', label: 'Investments', icon: TrendingUpIcon },
        { id: 'loans', label: 'Loans', icon: HandCoinsIcon },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'recovery', label: 'Recovery', icon: ShieldAlertIcon },
        { id: 'branches', label: 'Branches', icon: BuildingIcon },
        { id: 'transactions', label: 'Transactions', icon: ArrowLeftRightIcon },
        { id: 'support', label: 'Member Support', icon: HeadphonesIcon },
      ],
    },
    {
      title: 'INSIGHTS',
      items: [
        { id: 'reports', label: 'Reports', icon: BarChart3Icon },
        { id: 'compliance', label: 'Compliance', icon: ShieldCheckIcon },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'notifications', label: 'Notifications', icon: BellIcon },
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
      ],
    },
  ];

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !hiddenIds.has(item.id)),
    }))
    .filter((group) => group.items.length > 0);

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 bg-fountain-dark text-white transform transition-transform duration-300 ease-in-out
    md:translate-x-0 md:static md:inset-0
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-fountain-gray-900/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside className={sidebarClasses}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <img
              src="/712c64ce-2884-4e65-9cac-33dd260726c9.png"
              alt="Fountain Coop Logo"
              className="h-10 w-10 object-contain bg-white rounded-full p-0.5"
            />
            <span className="font-bold text-lg tracking-tight">
              Fountain Coop
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="md:hidden text-fountain-gray-400 hover:text-white"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-4rem)] pb-20 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {visibleGroups.map((group, idx) => (
            <div key={idx} className="px-3 py-4">
              <h3 className="px-3 text-xs font-semibold text-fountain-gray-400 tracking-wider mb-2">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href ?? `/${item.id}`}
                        onClick={onClose}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-fountain-blue text-white'
                            : 'text-fountain-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${isActive ? 'text-white' : 'text-fountain-gray-400'}`}
                        />
                        <span className="font-medium text-sm">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
