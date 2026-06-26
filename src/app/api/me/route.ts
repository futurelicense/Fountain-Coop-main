import { NextResponse } from 'next/server';
import {
  profileToAuthUser,
  resolveRequestAuth,
  type ProfileRow,
} from '@/lib/server/request-auth';

export async function GET(request: Request) {
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  if (ctx.kind === 'supabase') {
    const pr = ctx.profile;
    return NextResponse.json({
      user: profileToAuthUser(ctx.user, pr),
      profile: pr
        ? {
            savings_balance: Number(pr.savings_balance ?? 0),
            loan_balance: Number(pr.loan_balance ?? 0),
            branch: pr.branch,
            full_name: pr.full_name,
            phone: pr.phone,
            member_code: pr.member_code,
            status: pr.status,
            products: pr.products ?? [],
            member_since: (pr as ProfileRow & { created_at?: string }).created_at ?? null,
          }
        : null,
    });
  }
  return NextResponse.json({
    user: {
      id: ctx.auth.sub,
      name: ctx.auth.name,
      role: ctx.auth.role,
      memberId: ctx.auth.memberId,
    },
    profile: null,
  });
}
