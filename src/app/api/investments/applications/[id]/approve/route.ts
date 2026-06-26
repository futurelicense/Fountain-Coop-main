import { NextResponse } from 'next/server';
import { isStaffRole } from '@/lib/server/operations-constants';
import { approveInvestmentApplication } from '@/lib/server/investment-approval';
import { resolveRequestAuth } from '@/lib/server/request-auth';

export async function POST(
  _request: Request,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const params = context.params instanceof Promise ? await context.params : context.params;
  const applicationId = decodeURIComponent(params.id ?? '');

  if (!applicationId) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const ctx = await resolveRequestAuth(_request);
  if (ctx.kind === 'unauthorized') {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  if (ctx.kind !== 'supabase') {
    return NextResponse.json({ error: 'supabase_session_required' }, { status: 503 });
  }

  const role = ctx.profile?.role ?? 'member';
  if (!isStaffRole(role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const result = await approveInvestmentApplication(
      ctx.supabase,
      applicationId,
      ctx.user.id
    );
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'approval_failed';
    const status =
      message === 'charging_pool_full' ||
      message === 'foodstuffs_subscription_exists' ||
      message === 'application_rejected'
        ? 409
        : message === 'application_not_found' ||
            message === 'product_not_found' ||
            message === 'member_not_found'
          ? 404
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
