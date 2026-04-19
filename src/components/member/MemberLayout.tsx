'use client';

import { useEffect, useState } from 'react';
import { MemberHeader } from './MemberHeader';
import { MemberBottomNav } from './MemberBottomNav';
import { fetchMe } from '@/api';

interface MemberLayoutProps {
  children: React.ReactNode;
  onSwitchToAdmin?: () => void;
}

export function MemberLayout({ children, onSwitchToAdmin }: MemberLayoutProps) {
  const [greetingName, setGreetingName] = useState('Member');
  const [memberCode, setMemberCode] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);

  useEffect(() => {
    void fetchMe()
      .then(({ user, profile }) => {
        setGreetingName(profile?.full_name ?? user.name);
        setMemberCode(profile?.member_code ?? user.memberId);
        setBranch(profile?.branch ?? null);
      })
      .catch(() => {
        setGreetingName('Member');
        setMemberCode(null);
        setBranch(null);
      });
  }, []);

  return (
    <div className="min-h-screen bg-fountain-gray-50 w-full max-w-xl mx-auto relative md:shadow-2xl">
      <MemberHeader
        onSwitchToAdmin={onSwitchToAdmin}
        greetingName={greetingName}
        memberCode={memberCode}
        branch={branch}
      />
      <main className="pb-20 px-3 sm:px-4">{children}</main>
      <MemberBottomNav />
    </div>
  );
}
