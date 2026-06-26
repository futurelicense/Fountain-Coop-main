import { NextResponse } from 'next/server';
import { isStaffRole } from '@/lib/server/operations-constants';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import {
  getSupportConversation,
  markSupportReadForAdmin,
} from '@/lib/server/support-messages';

async function resolveThreadId(
  params: { threadId: string } | Promise<{ threadId: string }>
): Promise<string> {
  const r = params instanceof Promise ? await params : params;
  return decodeURIComponent(r.threadId ?? '');
}

export async function GET(
  request: Request,
  context: { params: { threadId: string } | Promise<{ threadId: string }> }
) {
  const threadId = await resolveThreadId(context.params);
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  if (ctx.kind !== 'supabase') {
    return NextResponse.json({ error: 'supabase_session_required' }, { status: 503 });
  }

  const role = ctx.profile?.role ?? 'member';
  const isStaff = isStaffRole(role);

  try {
    const conversation = await getSupportConversation(ctx.supabase, threadId);
    if (!conversation) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (!isStaff && conversation.thread.id) {
      const { data: owned } = await ctx.supabase
        .from('operational_items')
        .select('id')
        .eq('id', threadId)
        .eq('owner_id', ctx.user.id)
        .maybeSingle();
      if (!owned) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
    }

    if (isStaff) {
      await markSupportReadForAdmin(ctx.supabase, threadId);
      const refreshed = await getSupportConversation(ctx.supabase, threadId);
      return NextResponse.json(refreshed ?? conversation);
    }

    return NextResponse.json(conversation);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'load_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: { threadId: string } | Promise<{ threadId: string }> }
) {
  const threadId = await resolveThreadId(context.params);
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  if (ctx.kind !== 'supabase') {
    return NextResponse.json({ error: 'supabase_session_required' }, { status: 503 });
  }
  if (!isStaffRole(ctx.profile?.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { message?: string } | null;
  const message = String(body?.message ?? '');
  const adminName =
    ctx.profile?.full_name ??
    ctx.user.user_metadata?.full_name ??
    ctx.user.email?.split('@')[0] ??
    'Admin';

  try {
    const { sendAdminSupportReply } = await import('@/lib/server/support-messages');
    const result = await sendAdminSupportReply(
      ctx.supabase,
      threadId,
      ctx.user.id,
      adminName,
      message
    );
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'reply_failed';
    const status =
      msg === 'invalid_message' ? 400 : msg === 'thread_not_found' ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
