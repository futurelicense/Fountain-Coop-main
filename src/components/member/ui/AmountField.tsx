'use client';

import { formatNaira } from '@/lib/formatNaira';

export function AmountField({
  label,
  value,
  onChange,
  presets,
  hint,
  accent = 'green',
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  presets?: number[];
  hint?: string;
  accent?: 'green' | 'blue' | 'teal';
}) {
  const ring =
    accent === 'blue'
      ? 'focus:border-fountain-blue focus:ring-fountain-blue/20'
      : accent === 'teal'
        ? 'focus:border-fountain-teal focus:ring-fountain-teal/20'
        : 'focus:border-fountain-green focus:ring-fountain-green/20';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-fountain-gray-700">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fountain-gray-500 font-semibold">
          ₦
        </span>
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={`w-full pl-9 pr-4 py-3.5 bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl text-xl font-bold text-fountain-gray-900 outline-none focus:ring-2 ${ring}`}
        />
      </div>
      {presets && presets.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {presets.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => onChange(amt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                value === amt
                  ? 'bg-fountain-dark text-white'
                  : 'bg-fountain-gray-100 text-fountain-gray-600 hover:bg-fountain-gray-200'
              }`}
            >
              {formatNaira(amt)}
            </button>
          ))}
        </div>
      ) : null}
      {hint ? (
        <p className="text-xs text-fountain-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}
