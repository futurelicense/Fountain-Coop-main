import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { initializePaystackTransaction, isPaystackConfigured } from '@/lib/paystack';
import { fetchMembershipApplicationById } from '@/lib/server/membership-applications';

function getOrigin(request: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, '');
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  const host = request.headers.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

/** Public endpoint: starts the ₦ registration-fee checkout for a submitted application. */
export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 503 });
  }
  if (!isPaystackConfigured()) {
    return NextResponse.json({ error: 'paystack_not_configured' }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as {
    applicationId?: string;
  } | null;
  const applicationId = String(body?.applicationId ?? '').trim();
  if (!applicationId) {
    return NextResponse.json({ error: 'application_id_required' }, { status: 400 });
  }

  const application = await fetchMembershipApplicationById(admin, applicationId);
  if (!application) {
    return NextResponse.json({ error: 'application_not_found' }, { status: 404 });
  }
  if (application.status === 'account_created') {
    return NextResponse.json(
      { error: 'account_already_created', hint: 'Sign in on the login page instead.' },
      { status: 409 }
    );
  }

  const amountKobo = Math.round(Number(application.registration_fee || 0) * 100);
  const reference = `fc_apply_${applicationId.replace(/-/g, '').slice(0, 12)}_${Date.now()}`;
  const callbackUrl = `${getOrigin(request)}/apply/complete`;

  try {
    const data = await initializePaystackTransaction({
      email: application.email,
      amountKobo,
      reference,
      callbackUrl,
      metadata: {
        applicationId,
        purpose: 'membership_registration_fee',
      },
    });

    await admin
      .from('membership_applications')
      .update({ payment_reference: data.reference })
      .eq('id', applicationId);

    return NextResponse.json({
      ok: true,
      authorization_url: data.authorization_url,
      reference: data.reference,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'paystack_initialize_failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
