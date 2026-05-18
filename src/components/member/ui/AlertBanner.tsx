'use client';

import { AlertCircleIcon, XIcon } from 'lucide-react';

export function AlertBanner({
  tone = 'error',
  message,
  onDismiss,
}: {
  tone?: 'error' | 'warning' | 'info' | 'success';
  message: string;
  onDismiss?: () => void;
}) {
  const styles = {
    error: 'bg-fountain-red/5 border-fountain-red/20 text-fountain-red',
    warning: 'bg-fountain-amber/5 border-fountain-amber/20 text-amber-800',
    info: 'bg-fountain-blue/5 border-fountain-blue/20 text-fountain-blue',
    success: 'bg-fountain-green/5 border-fountain-green/20 text-fountain-green',
  }[tone];

  return (
    <div
      className={`flex gap-2 items-start border rounded-xl px-3 py-2.5 text-sm ${styles}`}
      role="alert"
    >
      <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="flex-1 leading-snug">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-md opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          <XIcon className="w-4 h-4" />
        </button>
      ) : null}
    </div>
  );
}
