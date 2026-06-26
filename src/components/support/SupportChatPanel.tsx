'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2Icon, SendIcon } from 'lucide-react';
import type { SupportMessage } from '@/api/support';

function formatTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-NG', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SupportChatPanel({
  messages,
  loading,
  sending,
  onSend,
  emptyHint,
  memberMeta,
}: {
  messages: SupportMessage[];
  loading?: boolean;
  sending?: boolean;
  onSend: (text: string) => Promise<void>;
  emptyHint?: string;
  memberMeta?: { memberId: string; memberName: string };
}) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    await onSend(text);
  };

  return (
    <div className="flex flex-col h-full min-h-[320px]">
      {memberMeta ? (
        <div className="px-4 py-3 border-b border-fountain-gray-100 bg-fountain-gray-50/80">
          <p className="text-sm font-semibold text-fountain-gray-900">
            {memberMeta.memberName}
          </p>
          <p className="text-xs text-fountain-gray-500">
            Member ID: {memberMeta.memberId || '—'}
          </p>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-sm text-fountain-gray-500 flex items-center gap-2 justify-center py-8">
            <Loader2Icon className="w-4 h-4 animate-spin" /> Loading messages…
          </p>
        ) : null}
        {!loading && !messages.length ? (
          <p className="text-sm text-fountain-gray-500 text-center py-8">
            {emptyHint ?? 'No messages yet. Send a message to start.'}
          </p>
        ) : null}
        {messages.map((msg) => {
          const isMember = msg.sender === 'member';
          return (
            <div
              key={msg.id}
              className={`flex ${isMember ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  isMember
                    ? 'bg-fountain-blue text-white rounded-br-md'
                    : 'bg-fountain-gray-100 text-fountain-gray-900 rounded-bl-md'
                }`}
              >
                {!isMember ? (
                  <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                    {msg.senderName} · Admin
                  </p>
                ) : null}
                <p className="text-sm leading-snug whitespace-pre-wrap">{msg.body}</p>
                <p
                  className={`text-[10px] mt-1 ${isMember ? 'text-white/70' : 'text-fountain-gray-500'}`}
                >
                  {formatTime(msg.at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => void submit(e)}
        className="border-t border-fountain-gray-100 p-3 flex gap-2 bg-white"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type your message…"
          maxLength={2000}
          className="flex-1 px-3 py-2.5 border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue focus:ring-2 focus:ring-fountain-blue/20"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="px-4 py-2.5 bg-fountain-blue text-white rounded-xl disabled:opacity-50 flex items-center justify-center"
          aria-label="Send message"
        >
          {sending ? (
            <Loader2Icon className="w-4 h-4 animate-spin" />
          ) : (
            <SendIcon className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}

export function useSupportPolling(load: () => Promise<void>, enabled: boolean) {
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!enabled) return;
    const tick = () => void loadRef.current().catch(() => undefined);
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [enabled]);
}
