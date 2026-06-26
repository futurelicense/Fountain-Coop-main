import { NextResponse } from 'next/server';
import { isStaffRole } from '@/lib/server/operations-constants';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import { listSupportInbox } from '@/lib/server/support-messages';

export async function GET(request: Request) {
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

  try {
    const threads = await listSupportInbox(ctx.supabase);
    return NextResponse.json({ threads });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'inbox_load_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
