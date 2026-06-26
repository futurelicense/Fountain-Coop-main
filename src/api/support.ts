import { apiFetch } from './client';

export type SupportThread = {
  id: string;
  memberId: string;
  memberName: string;
  branch: string | null;
  status: string;
  lastMessageAt: string;
  preview: string;
  unreadByAdmin: number;
  unreadByMember: number;
};

export type SupportMessage = {
  id: string;
  threadId: string;
  sender: 'member' | 'admin';
  senderName: string;
  body: string;
  at: string;
};

export async function fetchMemberSupport(): Promise<{
  thread: SupportThread | null;
  messages: SupportMessage[];
}> {
  return apiFetch('/api/member/support');
}

export async function sendMemberSupportMessage(message: string): Promise<{
  thread: SupportThread;
  messages: SupportMessage[];
}> {
  return apiFetch('/api/member/support', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function fetchSupportInbox(): Promise<{ threads: SupportThread[] }> {
  return apiFetch('/api/support/inbox');
}

export async function fetchSupportThread(threadId: string): Promise<{
  thread: SupportThread;
  messages: SupportMessage[];
}> {
  return apiFetch(`/api/support/threads/${encodeURIComponent(threadId)}`);
}

export async function sendAdminSupportReply(
  threadId: string,
  message: string
): Promise<{ thread: SupportThread; messages: SupportMessage[] }> {
  return apiFetch(`/api/support/threads/${encodeURIComponent(threadId)}`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
