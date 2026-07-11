import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { verifyPaystackTransaction } from '@/lib/paystack';

/** Public endpoint: confirms the registration-fee payment for an application. */
export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as {
    reference?: string;
  } | null;
  const reference = String(body?.reference ?? '').trim();
  if (!reference) {
    return NextResponse.json({ error: 'reference_required' }, { status: 400 });
  }

  const { data: application } = await admin
    .from('membership_applications')
    .select('id, email, full_name, status')
    .eq('payment_reference', reference)
    .maybeSingle();

  if (!application) {
    return NextResponse.json({ error: 'application_not_found' }, { status: 404 });
  }

  if (application.status === 'paid' || application.status === 'account_created') {
    return NextResponse.json({
      ok: true,
      applicationId: application.id,
      email: application.email,
      fullName: application.full_name,
      status: application.status,
    });
  }

  try {
    const verified = await verifyPaystackTransaction(reference);
    if (verified.status !== 'success') {
      return NextResponse.json(
        { error: 'payment_not_successful', status: verified.status },
        { status: 400 }
      );
    }

    const amountPaid = Math.round(Number(verified.amount ?? 0)) / 100;
    await admin
      .from('membership_applications')
      .update({
        status: 'paid',
        amount_paid: amountPaid,
        paid_at: verified.paid_at ?? new Date().toISOString(),
      })
      .eq('id', application.id);

    return NextResponse.json({
      ok: true,
      applicationId: application.id,
      email: application.email,
      fullName: application.full_name,
      status: 'paid',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'paystack_verify_failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
