'use client';

import type { LucideIcon } from 'lucide-react';
import { ChevronRightIcon } from 'lucide-react';

export function HomeProductCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  accent: 'green' | 'teal' | 'blue';
  onClick: () => void;
}) {
  const styles = {
    green: {
      icon: 'bg-fountain-green/10 text-fountain-green',
      hint: 'text-fountain-green',
      ring: 'hover:ring-fountain-green/20',
    },
    teal: {
      icon: 'bg-fountain-teal/10 text-fountain-teal',
      hint: 'text-fountain-teal',
      ring: 'hover:ring-fountain-teal/20',
    },
    blue: {
      icon: 'bg-fountain-blue/10 text-fountain-blue',
      hint: 'text-fountain-blue',
      ring: 'hover:ring-fountain-blue/20',
    },
  }[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full text-left bg-white rounded-2xl p-4 border border-fountain-gray-200 shadow-sm hover:shadow-md hover:ring-2 ${styles.ring} transition-all active:scale-[0.98]`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={`p-2.5 rounded-xl ${styles.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        <ChevronRightIcon className="w-4 h-4 text-fountain-gray-300 group-hover:text-fountain-gray-500 group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="text-[11px] font-medium text-fountain-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-xl font-bold text-fountain-gray-900 tabular-nums mt-0.5">
        {value}
      </p>
      <p className={`text-[11px] font-medium mt-1.5 ${styles.hint}`}>{hint}</p>
    </button>
  );
}
