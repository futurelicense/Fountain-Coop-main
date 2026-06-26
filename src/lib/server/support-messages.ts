import type { SupabaseClient } from '@supabase/supabase-js';
import { pickNum, pickStr } from '@/lib/pickData';

export type SupportMessageDto = {
  id: string;
  threadId: string;
  sender: 'member' | 'admin';
  senderName: string;
  body: string;
  at: string;
};

export type SupportThreadDto = {
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

type ThreadRow = {
  id: string;
  owner_id: string | null;
  data: Record<string, unknown>;
  branch: string | null;
};

function rowToThread(row: ThreadRow): SupportThreadDto {
  const d = row.data;
  return {
    id: row.id,
    memberId: pickStr(d, 'memberId'),
    memberName: pickStr(d, 'memberName'),
    branch: row.branch,
    status: pickStr(d, 'status', 'open'),
    lastMessageAt: pickStr(d, 'lastMessageAt'),
    preview: pickStr(d, 'preview'),
    unreadByAdmin: pickNum(d, 'unreadByAdmin'),
    unreadByMember: pickNum(d, 'unreadByMember'),
  };
}

function rowToMessage(row: {
  id: string;
  data: Record<string, unknown>;
}): SupportMessageDto {
  const d = row.data;
  return {
    id: row.id,
    threadId: pickStr(d, 'threadId'),
    sender: pickStr(d, 'sender') === 'admin' ? 'admin' : 'member',
    senderName: pickStr(d, 'senderName'),
    body: pickStr(d, 'body'),
    at: pickStr(d, 'at'),
  };
}

export async function getOrCreateMemberThread(
  supabase: SupabaseClient,
  userId: string,
  profile: {
    member_code: string | null;
    full_name: string | null;
    branch: string | null;
  }
): Promise<ThreadRow> {
  const { data: existing } = await supabase
    .from('operational_items')
    .select('id, owner_id, data, branch')
    .eq('module', 'support')
    .eq('subtype', 'thread')
    .eq('owner_id', userId)
    .maybeSingle();

  if (existing) return existing as ThreadRow;

  const memberId = profile.member_code ?? '—';
  const memberName = profile.full_name ?? 'Member';
  const now = new Date().toISOString();

  const { data: created, error } = await supabase
    .from('operational_items')
    .insert({
      module: 'support',
      subtype: 'thread',
      is_catalog: false,
      owner_id: userId,
      branch: profile.branch,
      created_by: userId,
      data: {
        memberId,
        memberName,
        status: 'open',
        lastMessageAt: now,
        preview: '',
        unreadByAdmin: 0,
        unreadByMember: 0,
      },
    })
    .select('id, owner_id, data, branch')
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? 'thread_create_failed');
  }
  return created as ThreadRow;
}

export async function listThreadMessages(
  supabase: SupabaseClient,
  threadId: string
): Promise<SupportMessageDto[]> {
  const { data, error } = await supabase
    .from('operational_items')
    .select('id, data, created_at')
    .eq('module', 'support')
    .eq('subtype', 'message')
    .filter('data->>threadId', 'eq', threadId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) =>
    rowToMessage(r as { id: string; data: Record<string, unknown> })
  );
}

export async function sendMemberSupportMessage(
  supabase: SupabaseClient,
  userId: string,
  profile: {
    member_code: string | null;
    full_name: string | null;
    branch: string | null;
  },
  body: string
): Promise<{ thread: SupportThreadDto; messages: SupportMessageDto[] }> {
  const trimmed = body.trim();
  if (trimmed.length < 1 || trimmed.length > 2000) {
    throw new Error('invalid_message');
  }

  const thread = await getOrCreateMemberThread(supabase, userId, profile);
  const at = new Date().toISOString();
  const memberName = profile.full_name ?? 'Member';

  const { error: msgErr } = await supabase.from('operational_items').insert({
    module: 'support',
    subtype: 'message',
    is_catalog: false,
    owner_id: userId,
    branch: profile.branch,
    created_by: userId,
    data: {
      threadId: thread.id,
      sender: 'member',
      senderName: memberName,
      memberId: profile.member_code ?? '',
      body: trimmed,
      at,
    },
  });
  if (msgErr) throw new Error(msgErr.message);

  const threadData = thread.data;
  await supabase
    .from('operational_items')
    .update({
      data: {
        ...threadData,
        memberId: profile.member_code ?? pickStr(threadData, 'memberId'),
        memberName,
        lastMessageAt: at,
        preview: trimmed.slice(0, 120),
        unreadByAdmin: pickNum(threadData, 'unreadByAdmin') + 1,
        status: 'open',
      },
    })
    .eq('id', thread.id);

  void supabase.from('activities').insert({
    type: 'support',
    actor_name: memberName,
    action_text: `Support message — ${profile.member_code ?? userId}: ${trimmed.slice(0, 80)}`,
  });

  const messages = await listThreadMessages(supabase, thread.id);
  const { data: updatedThread } = await supabase
    .from('operational_items')
    .select('id, owner_id, data, branch')
    .eq('id', thread.id)
    .single();

  return {
    thread: rowToThread((updatedThread ?? thread) as ThreadRow),
    messages,
  };
}

export async function listSupportInbox(
  supabase: SupabaseClient
): Promise<SupportThreadDto[]> {
  const { data, error } = await supabase
    .from('operational_items')
    .select('id, owner_id, data, branch, created_at')
    .eq('module', 'support')
    .eq('subtype', 'thread')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((r) => rowToThread(r as ThreadRow))
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt || 0).getTime() -
        new Date(a.lastMessageAt || 0).getTime()
    );
}

export async function getSupportConversation(
  supabase: SupabaseClient,
  threadId: string
): Promise<{ thread: SupportThreadDto; messages: SupportMessageDto[] } | null> {
  const { data: threadRow } = await supabase
    .from('operational_items')
    .select('id, owner_id, data, branch')
    .eq('module', 'support')
    .eq('subtype', 'thread')
    .eq('id', threadId)
    .maybeSingle();

  if (!threadRow) return null;
  const messages = await listThreadMessages(supabase, threadId);
  return {
    thread: rowToThread(threadRow as ThreadRow),
    messages,
  };
}

export async function sendAdminSupportReply(
  supabase: SupabaseClient,
  threadId: string,
  adminUserId: string,
  adminName: string,
  body: string
): Promise<{ thread: SupportThreadDto; messages: SupportMessageDto[] }> {
  const trimmed = body.trim();
  if (trimmed.length < 1 || trimmed.length > 2000) {
    throw new Error('invalid_message');
  }

  const { data: threadRow, error: loadErr } = await supabase
    .from('operational_items')
    .select('id, owner_id, data, branch')
    .eq('module', 'support')
    .eq('subtype', 'thread')
    .eq('id', threadId)
    .maybeSingle();

  if (loadErr || !threadRow) throw new Error('thread_not_found');

  const thread = threadRow as ThreadRow;
  const at = new Date().toISOString();

  const { error: msgErr } = await supabase.from('operational_items').insert({
    module: 'support',
    subtype: 'message',
    is_catalog: false,
    owner_id: thread.owner_id,
    branch: thread.branch,
    created_by: adminUserId,
    data: {
      threadId,
      sender: 'admin',
      senderName: adminName,
      body: trimmed,
      at,
    },
  });
  if (msgErr) throw new Error(msgErr.message);

  const threadData = thread.data;
  await supabase
    .from('operational_items')
    .update({
      data: {
        ...threadData,
        lastMessageAt: at,
        preview: trimmed.slice(0, 120),
        unreadByAdmin: 0,
        unreadByMember: pickNum(threadData, 'unreadByMember') + 1,
        status: 'open',
      },
    })
    .eq('id', threadId);

  const messages = await listThreadMessages(supabase, threadId);
  const { data: updatedThread } = await supabase
    .from('operational_items')
    .select('id, owner_id, data, branch')
    .eq('id', threadId)
    .single();

  return {
    thread: rowToThread((updatedThread ?? thread) as ThreadRow),
    messages,
  };
}

export async function markSupportReadForMember(
  supabase: SupabaseClient,
  userId: string,
  threadId: string
): Promise<void> {
  const { data: threadRow } = await supabase
    .from('operational_items')
    .select('id, owner_id, data')
    .eq('id', threadId)
    .eq('owner_id', userId)
    .maybeSingle();
  if (!threadRow) return;

  await supabase
    .from('operational_items')
    .update({
      data: {
        ...(threadRow.data as Record<string, unknown>),
        unreadByMember: 0,
      },
    })
    .eq('id', threadId);
}

export async function markSupportReadForAdmin(
  supabase: SupabaseClient,
  threadId: string
): Promise<void> {
  const { data: threadRow } = await supabase
    .from('operational_items')
    .select('id, data')
    .eq('id', threadId)
    .maybeSingle();
  if (!threadRow) return;

  await supabase
    .from('operational_items')
    .update({
      data: {
        ...(threadRow.data as Record<string, unknown>),
        unreadByAdmin: 0,
      },
    })
    .eq('id', threadId);
}

export async function getMemberSupportConversation(
  supabase: SupabaseClient,
  userId: string
): Promise<{ thread: SupportThreadDto | null; messages: SupportMessageDto[] }> {
  const { data: threadRow } = await supabase
    .from('operational_items')
    .select('id, owner_id, data, branch')
    .eq('module', 'support')
    .eq('subtype', 'thread')
    .eq('owner_id', userId)
    .maybeSingle();

  if (!threadRow) {
    return { thread: null, messages: [] };
  }

  const thread = rowToThread(threadRow as ThreadRow);
  const messages = await listThreadMessages(supabase, thread.id);
  await markSupportReadForMember(supabase, userId, thread.id);
  return { thread, messages };
}
