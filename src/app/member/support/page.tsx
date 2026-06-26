'use client';

import { useCallback, useEffect, useState } from 'react';
import { HeadphonesIcon } from 'lucide-react';
import { ApiError } from '@/api';
import {
  fetchMemberSupport,
  sendMemberSupportMessage,
  type SupportMessage,
} from '@/api/support';
import { SupportChatPanel, useSupportPolling } from '@/components/support/SupportChatPanel';
import { AlertBanner } from '@/components/member/ui/AlertBanner';
import { fetchMe } from '@/api';

export default function MemberSupportPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [memberLabel, setMemberLabel] = useState({ id: '', name: '' });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [data, me] = await Promise.all([fetchMemberSupport(), fetchMe()]);
      setMessages(data.messages);
      setMemberLabel({
        id: me.profile?.member_code ?? me.user.memberId ?? '',
        name: me.profile?.full_name ?? me.user.name,
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useSupportPolling(load, true);

  const handleSend = async (text: string) => {
    setSending(true);
    setError(null);
    try {
      const res = await sendMemberSupportMessage(text);
      setMessages(res.messages);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? String((e.body as { error?: string })?.error ?? 'Send failed')
          : 'Send failed'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 pt-4 -mt-2">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-fountain-blue/10">
          <HeadphonesIcon className="w-5 h-5 text-fountain-blue" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-fountain-gray-900">Contact Admin</h2>
          <p className="text-xs text-fountain-gray-500">
            Your messages are sent as{' '}
            <span className="font-semibold">{memberLabel.name || 'Member'}</span>
            {memberLabel.id ? ` (${memberLabel.id})` : ''}. Admin replies refresh
            automatically.
          </p>
        </div>
      </div>

      {error ? <AlertBanner tone="warning" message={error} /> : null}

      <div className="bg-white rounded-2xl border border-fountain-gray-200 shadow-sm overflow-hidden min-h-[420px] flex flex-col">
        <SupportChatPanel
          messages={messages}
          loading={loading}
          sending={sending}
          onSend={handleSend}
          emptyHint="Send a message to cooperative admin. Include your question or issue — we typically reply during business hours."
        />
      </div>
    </div>
  );
}
