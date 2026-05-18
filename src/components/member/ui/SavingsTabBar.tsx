'use client';

import { CoinsIcon, PiggyBankIcon } from 'lucide-react';

const TABS = [
  { id: 'coop', label: 'Wallet', sub: 'Save & withdraw', icon: PiggyBankIcon },
  { id: 'thrift', label: 'Daily Thrift', sub: 'Log daily pay', icon: CoinsIcon },
] as const;

export function SavingsTabBar({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 p-1 bg-fountain-gray-100 rounded-2xl">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const on = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-start gap-1 rounded-xl px-3 py-2.5 text-left transition-all ${
              on
                ? 'bg-white shadow-sm ring-1 ring-fountain-gray-200'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon
                className={`w-4 h-4 ${on ? (tab.id === 'thrift' ? 'text-fountain-teal' : 'text-fountain-green') : 'text-fountain-gray-400'}`}
              />
              <span
                className={`text-xs font-bold ${on ? 'text-fountain-gray-900' : 'text-fountain-gray-600'}`}
              >
                {tab.label}
              </span>
            </div>
            <span className="text-[10px] text-fountain-gray-500 pl-6">
              {tab.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}
