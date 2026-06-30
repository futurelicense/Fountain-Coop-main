'use client';

import type { ReactNode } from 'react';
import { XIcon } from 'lucide-react';

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  placement = 'center',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  placement?: 'bottom' | 'center';
}) {
  if (!open) return null;

  const isCenter = placement === 'center';

  return (
    <div
      className={`fixed inset-0 z-[100] flex justify-center ${
        isCenter ? 'items-center p-4' : 'items-end'
      }`}
    >
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
        className={`relative w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden ${
          isCenter
            ? 'max-h-[min(85vh,calc(100dvh-2rem))] rounded-2xl'
            : 'max-h-[92dvh] rounded-t-3xl mb-16'
        }`}
      >
        <div className="shrink-0 bg-white z-10 pt-3 pb-2 px-6 border-b border-fountain-gray-100">
          <div
            className={`w-10 h-1 bg-fountain-gray-200 rounded-full mx-auto mb-3 ${
              isCenter ? 'hidden' : ''
            }`}
          />
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

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5">
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 px-6 py-4 border-t border-fountain-gray-100 bg-white safe-area-bottom">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
