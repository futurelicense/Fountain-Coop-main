'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  LayoutGridIcon,
  HandCoinsIcon,
  ClockIcon,
  UserIcon,
} from 'lucide-react';
import { memberPaths } from '@/lib/memberPaths';

function tabFromPath(pathname: string): string {
  if (pathname === '/member' || pathname === '/member/') return 'home';
  if (pathname.startsWith('/member/savings')) return 'savings';
  if (pathname.startsWith('/member/loans')) return 'loans';
  if (pathname.startsWith('/member/investments')) return 'investments';
  if (pathname.startsWith('/member/support')) return 'support';
  if (pathname.startsWith('/member/activity')) return 'activity';
  if (pathname.startsWith('/member/profile')) return 'profile';
  return 'home';
}

export function MemberBottomNav() {
  const pathname = usePathname();
  const currentTab = tabFromPath(pathname ?? '');

  const tabs = [
    { id: 'home', href: memberPaths.home, label: 'Home', icon: HomeIcon },
    {
      id: 'savings',
      href: memberPaths.savings,
      label: 'Products',
      icon: LayoutGridIcon,
    },
    { id: 'loans', href: memberPaths.loans, label: 'Loans', icon: HandCoinsIcon },
    {
      id: 'activity',
      href: memberPaths.activity,
      label: 'Activity',
      icon: ClockIcon,
    },
    {
      id: 'profile',
      href: memberPaths.profile,
      label: 'Profile',
      icon: UserIcon,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-fountain-gray-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-fountain-blue' : 'text-fountain-gray-400'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? 'text-fountain-blue' : 'text-fountain-gray-400'}`}
              />
              <span
                className={`text-[10px] mt-1 font-medium ${isActive ? 'text-fountain-blue' : 'text-fountain-gray-400'}`}
              >
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-fountain-blue rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
