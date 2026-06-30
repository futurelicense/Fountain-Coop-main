import { NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/server/cron-auth';
import { runFoodstuffsAutoDebit } from '@/lib/server/foodstuffs-ops';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function runScheduledAutoDebit(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      {
        error: 'server_misconfigured',
        hint: 'Add SUPABASE_SERVICE_ROLE_KEY for scheduled auto-debit.',
      },
      { status: 503 }
    );
  }

  try {
    const result = await runFoodstuffsAutoDebit(admin);
    return NextResponse.json({
      ...result,
      triggeredAt: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'auto_debit_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Vercel Cron invokes this path with GET. */
export async function GET(request: Request) {
  return runScheduledAutoDebit(request);
}

/** Manual trigger with the same CRON_SECRET (e.g. external scheduler). */
export async function POST(request: Request) {
  return runScheduledAutoDebit(request);
}
