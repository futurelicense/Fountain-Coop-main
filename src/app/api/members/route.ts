import { NextResponse } from 'next/server';
import type { MemberRow, MembersListResponse } from '@/api/types';
import { isLegacyAuthEnabled } from '@/lib/config/app-mode';
import { MEMBERS, MEMBERS_PLATFORM_SUMMARY, MEMBERS_TOTAL_PLATFORM } from '@/lib/server/seed-data';
import type { ProfileRow } from '@/lib/server/request-auth';
import { resolveRequestAuth } from '@/lib/server/request-auth';

function profileToMemberRow(p: ProfileRow): MemberRow {
  return {
    id: p.member_code ?? p.id,
    name: p.full_name ?? 'Member',
    phone: p.phone ?? '',
    branch: p.branch ?? '',
    status: p.status ?? '',
    products: p.products ?? [],
    savingsBalance: Number(p.savings_balance ?? 0),
    loanBalance: Number(p.loan_balance ?? 0),
  };
}

function summarize(rows: MemberRow[]) {
  const active = rows.filter((m) => m.status === 'Active').length;
  const owing = rows.filter((m) => m.status === 'Owing').length;
  const inactive = rows.filter(
    (m) => m.status === 'Inactive' || m.status === 'Suspended'
  ).length;
  return { total: rows.length, active, owing, inactive };
}

export async function GET(request: Request) {
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }

  if (ctx.kind === 'supabase') {
    const { supabase, user, profile } = ctx;
    const role = profile?.role ?? 'member';

    if (role === 'member') {
      const { count: platformTotal } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member');
      const { data: self } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      const row = self as ProfileRow | null;
      const m = row ? profileToMemberRow(row) : null;
      const list = m ? [m] : [];
      const s = summarize(list);
      const body: MembersListResponse = {
        members: list,
        total: platformTotal ?? list.length,
        pageTotal: list.length,
        summary: {
          total: s.total,
          active: s.active,
          owing: s.owing,
          inactive: s.inactive,
        },
      };
      return NextResponse.json(body);
    }

    const { data: rows, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'member');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const members = (rows ?? []).map((r) => profileToMemberRow(r as ProfileRow));
    const summary = summarize(members);
    return NextResponse.json({
      members,
      total: members.length,
      pageTotal: members.length,
      summary,
    } satisfies MembersListResponse);
  }

  if (!isLegacyAuthEnabled()) {
    return NextResponse.json(
      {
        error: 'supabase_session_required',
        hint: 'Wired test mode requires Supabase sign-in (no mock member list).',
      },
      { status: 503 }
    );
  }

  const auth = ctx.auth;
  if (auth.role === 'member') {
    const m = MEMBERS.find((x) => x.id === auth.memberId);
    return NextResponse.json({
      members: m ? [m] : [],
      total: MEMBERS_TOTAL_PLATFORM,
      pageTotal: m ? 1 : 0,
      summary: m
        ? {
            total: 1,
            active: m.status === 'Active' ? 1 : 0,
            owing: m.status === 'Owing' ? 1 : 0,
            inactive:
              m.status === 'Inactive' || m.status === 'Suspended' ? 1 : 0,
          }
        : { total: 0, active: 0, owing: 0, inactive: 0 },
    });
  }
  return NextResponse.json({
    members: MEMBERS,
    total: MEMBERS_TOTAL_PLATFORM,
    pageTotal: MEMBERS.length,
    summary: MEMBERS_PLATFORM_SUMMARY,
  });
}
