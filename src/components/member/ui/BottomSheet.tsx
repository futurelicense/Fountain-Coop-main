'use client';

import React from 'react';
import { XIcon } from 'lucide-react';

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-fountain-dark/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white z-10 pt-3 pb-2 px-6 border-b border-fountain-gray-100">
          <div className="w-10 h-1 bg-fountain-gray-200 rounded-full mx-auto mb-3" />
          {title ? (
            <div className="flex items-center justify-between gap-3">
              <h2
                id="sheet-title"
                className="text-lg font-bold text-fountain-gray-900"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 rounded-full text-fountain-gray-400 hover:bg-fountain-gray-100 hover:text-fountain-gray-700"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          ) : null}
        </div>
        <div className="px-6 py-5 pb-8">{children}</div>
      </div>
    </div>
  );
}
