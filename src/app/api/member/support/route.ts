import { NextResponse } from 'next/server';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import {
  getMemberSupportConversation,
  sendMemberSupportMessage,
} from '@/lib/server/support-messages';

export async function GET(request: Request) {
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  if (ctx.kind !== 'supabase') {
    return NextResponse.json({ error: 'supabase_session_required' }, { status: 503 });
  }
  if ((ctx.profile?.role ?? 'member') !== 'member') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const data = await getMemberSupportConversation(ctx.supabase, ctx.user.id);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'support_load_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  if (ctx.kind !== 'supabase') {
    return NextResponse.json({ error: 'supabase_session_required' }, { status: 503 });
  }
  if ((ctx.profile?.role ?? 'member') !== 'member') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { message?: string } | null;
  const message = String(body?.message ?? '');

  try {
    const result = await sendMemberSupportMessage(
      ctx.supabase,
      ctx.user.id,
      {
        member_code: ctx.profile?.member_code ?? null,
        full_name: ctx.profile?.full_name ?? null,
        branch: ctx.profile?.branch ?? null,
      },
      message
    );
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'send_failed';
    const status = msg === 'invalid_message' ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
