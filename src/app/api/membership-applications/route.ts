import { NextResponse } from 'next/server';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import { isStaffRole } from '@/lib/server/operations-constants';
import type { MembershipApplicationRow } from '@/api/types';

const LIST_COLUMNS =
  'id, full_name, email, phone, occupation, status, registration_fee, monthly_contribution, wants_fountain_basket, created_at';

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

  const { data, error } = await ctx.supabase
    .from('membership_applications')
    .select(LIST_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    const hint = /relation.*does not exist/i.test(error.message)
      ? 'Run supabase/migrations/010_membership_applications.sql in Supabase SQL Editor.'
      : undefined;
    return NextResponse.json({ error: error.message, ...(hint ? { hint } : {}) }, { status: 500 });
  }

  const applications = (data ?? []) as unknown as MembershipApplicationRow[];
  const summary = {
    total: applications.length,
    pendingPayment: applications.filter((a) => a.status === 'pending_payment').length,
    paid: applications.filter((a) => a.status === 'paid').length,
    accountCreated: applications.filter((a) => a.status === 'account_created').length,
  };

  return NextResponse.json({ applications, summary });
}
