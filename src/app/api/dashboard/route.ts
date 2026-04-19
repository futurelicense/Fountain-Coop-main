import { NextResponse } from 'next/server';
import {
  DASHBOARD_KPIS,
  LOAN_PORTFOLIO,
  MEMBER_GROWTH,
} from '@/lib/server/seed-data';
import { buildDashboardFromSupabase } from '@/lib/server/dashboard-supabase';
import { resolveRequestAuth } from '@/lib/server/request-auth';

const emptyProductsSummary = {
  thrift: { activePlans: 0, collected: 0 },
  ajo: { activeCycles: 0, participants: 0 },
  packs: { activePacks: 0, slotsFilled: 0 },
};

export async function GET(request: Request) {
  const ctx = await resolveRequestAuth(request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }

  const adminRoles = ['super_admin', 'tenant_admin', 'group_admin'];
  let role: string;
  let greetingName: string;

  if (ctx.kind === 'supabase') {
    role = ctx.profile?.role ?? 'member';
    greetingName =
      ctx.profile?.full_name ??
      ctx.user.user_metadata?.full_name ??
      ctx.user.email?.split('@')[0] ??
      'there';
  } else {
    role = ctx.auth.role;
    greetingName = ctx.auth.name || 'there';
  }

  if (!adminRoles.includes(role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  if (ctx.kind === 'supabase') {
    try {
      const data = await buildDashboardFromSupabase(
        ctx.supabase,
        greetingName
      );
      return NextResponse.json(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'dashboard_error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const first = greetingName.split(' ')[0] || greetingName;
  return NextResponse.json({
    kpis: DASHBOARD_KPIS,
    memberGrowth: MEMBER_GROWTH,
    loanPortfolio: LOAN_PORTFOLIO,
    welcome: {
      greetingName: first,
      dateLabel: new Date().toLocaleDateString('en-NG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    },
    productsSummary: emptyProductsSummary,
    branchPerformance: [],
    recentActivities: [],
    complianceAlerts: [],
  });
}
