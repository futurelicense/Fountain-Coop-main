'use client';

import { BellIcon, ArrowLeftRightIcon } from 'lucide-react';

interface MemberHeaderProps {
  onSwitchToAdmin?: () => void;
  greetingName?: string;
  memberCode?: string | null;
  branch?: string | null;
}

export function MemberHeader({
  onSwitchToAdmin,
  greetingName = 'Member',
  memberCode,
  branch,
}: MemberHeaderProps) {
  return (
    <header className="bg-fountain-dark text-white px-4 pt-10 pb-6 safe-area-top">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src="/712c64ce-2884-4e65-9cac-33dd260726c9.png"
            alt="Fountain Coop"
            className="h-8 w-8 object-contain bg-white rounded-full p-0.5" />
          
          <span className="font-bold text-sm tracking-tight">
            Fountain Coop
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button className="relative p-2 text-white/70 hover:text-white transition-colors">
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-fountain-red rounded-full"></span>
          </button>
          {onSwitchToAdmin &&
          <button
            onClick={onSwitchToAdmin}
            className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded-lg text-xs text-white/80 hover:bg-white/20 transition-colors"
            title="Switch to Admin View">
            
              <ArrowLeftRightIcon className="w-3 h-3" />
              <span>Admin</span>
            </button>
          }
        </div>
      </div>
      <div>
        <p className="text-white/60 text-sm">
          {(() => {
            const h = new Date().getHours();
            if (h < 12) return 'Good morning,';
            if (h < 17) return 'Good afternoon,';
            return 'Good evening,';
          })()}
        </p>
        <h1 className="text-xl font-bold">{greetingName}</h1>
        <p className="text-white/50 text-xs mt-0.5">
          {[memberCode, branch].filter(Boolean).join(' • ') || 'Member portal'}
        </p>
      </div>
    </header>);

}