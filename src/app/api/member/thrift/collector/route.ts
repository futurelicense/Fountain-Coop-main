import { NextResponse } from 'next/server';
import { resolveMemberThriftCollector } from '@/lib/server/member-thrift-collector';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  if (ctx.kind !== 'supabase') {
    return NextResponse.json({ error: 'supabase_session_required' }, { status: 503 });
  }

  const admin = getSupabaseAdmin() ?? ctx.supabase;
  const profile = ctx.profile ?? {
    member_code: null,
    full_name: ctx.user.name,
    branch: null,
  };

  try {
    const collector = await resolveMemberThriftCollector(admin, profile);
    return NextResponse.json(collector);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'collector_lookup_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
