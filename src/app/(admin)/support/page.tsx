'use client';

import { useCallback, useEffect, useState } from 'react';
import { HeadphonesIcon, MessageSquareIcon } from 'lucide-react';
import { ApiError } from '@/api';
import {
  fetchSupportInbox,
  fetchSupportThread,
  sendAdminSupportReply,
  type SupportMessage,
  type SupportThread,
} from '@/api/support';
import { SupportChatPanel, useSupportPolling } from '@/components/support/SupportChatPanel';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

function formatRelative(iso: string): string {
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

export default function AdminSupportPage() {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [activeThread, setActiveThread] = useState<SupportThread | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInbox = useCallback(async () => {
    try {
      const { threads: list } = await fetchSupportInbox();
      setThreads(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load inbox');
    } finally {
      setLoadingInbox(false);
    }
  }, []);

  const loadThread = useCallback(async (threadId: string, silent = false) => {
    if (!silent) setLoadingChat(true);
    try {
      const data = await fetchSupportThread(threadId);
      setActiveThread(data.thread);
      setMessages(data.messages);
      setError(null);
      if (silent) {
        const { threads: list } = await fetchSupportInbox();
        setThreads(list);
      } else {
        await loadInbox();
      }
    } catch (e) {
      if (!silent) {
        setError(e instanceof Error ? e.message : 'Could not load conversation');
      }
    } finally {
      if (!silent) setLoadingChat(false);
    }
  }, [loadInbox]);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    if (selectedId) void loadThread(selectedId);
  }, [selectedId, loadThread]);

  useSupportPolling(() => {
    if (selectedId) return loadThread(selectedId, true);
    return loadInbox();
  }, true);

  const handleReply = async (text: string) => {
    if (!selectedId) return;
    setSending(true);
    try {
      const res = await sendAdminSupportReply(selectedId, text);
      setActiveThread(res.thread);
      setMessages(res.messages);
      await loadInbox();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? String((e.body as { error?: string })?.error ?? 'Reply failed')
          : 'Reply failed'
      );
    } finally {
      setSending(false);
    }
  };

  const unreadTotal = threads.reduce((s, t) => s + t.unreadByAdmin, 0);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fountain-gray-900 flex items-center gap-2">
            <HeadphonesIcon className="w-7 h-7 text-fountain-blue" />
            Member Support
          </h2>
          <p className="text-fountain-gray-600 mt-1">
            Real-time messages from members — member ID and name on every thread.
          </p>
        </div>
        {unreadTotal > 0 ? (
          <Badge variant="warning" size="sm">
            {unreadTotal} unread
          </Badge>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-4 py-3">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[520px]">
        <Card title="Inbox" className="lg:col-span-1 flex flex-col">
          {loadingInbox ? (
            <p className="text-sm text-fountain-gray-500 p-4">Loading…</p>
          ) : !threads.length ? (
            <p className="text-sm text-fountain-gray-500 p-4">No member messages yet.</p>
          ) : (
            <ul className="divide-y divide-fountain-gray-100 max-h-[480px] overflow-y-auto -mx-4 sm:-mx-6">
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left px-4 sm:px-6 py-3 hover:bg-fountain-gray-50 transition-colors ${
                      selectedId === t.id ? 'bg-fountain-blue/5 border-l-2 border-fountain-blue' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-fountain-gray-900 truncate">
                          {t.memberName}
                        </p>
                        <p className="text-xs text-fountain-gray-500">{t.memberId}</p>
                        <p className="text-xs text-fountain-gray-600 mt-1 line-clamp-2">
                          {t.preview || '—'}
                        </p>
                      </div>
                      {t.unreadByAdmin > 0 ? (
                        <span className="shrink-0 w-5 h-5 rounded-full bg-fountain-red text-white text-[10px] font-bold flex items-center justify-center">
                          {t.unreadByAdmin}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[10px] text-fountain-gray-400 mt-1">
                      {formatRelative(t.lastMessageAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="lg:col-span-2 bg-white rounded-xl border border-fountain-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[480px]">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-fountain-gray-400 p-8">
              <MessageSquareIcon className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">Select a member conversation to reply</p>
            </div>
          ) : (
            <>
              {activeThread ? (
                <SupportChatPanel
                  messages={messages}
                  loading={loadingChat}
                  sending={sending}
                  onSend={handleReply}
                  memberMeta={{
                    memberId: activeThread.memberId,
                    memberName: activeThread.memberName,
                  }}
                  emptyHint="No messages in this thread."
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
