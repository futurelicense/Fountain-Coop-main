import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { fetchMembershipApplicationById } from '@/lib/server/membership-applications';

/** Public endpoint: turns a paid application into a real Supabase Auth member account. */
export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as {
    applicationId?: string;
    password?: string;
  } | null;
  const applicationId = String(body?.applicationId ?? '').trim();
  const password = String(body?.password ?? '');
  if (!applicationId || !password) {
    return NextResponse.json(
      { error: 'application_id_and_password_required' },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'password_too_short' }, { status: 400 });
  }

  const application = await fetchMembershipApplicationById(admin, applicationId);
  if (!application) {
    return NextResponse.json({ error: 'application_not_found' }, { status: 404 });
  }

  if (application.status === 'account_created' && application.user_id) {
    return NextResponse.json({ ok: true, email: application.email, alreadyCreated: true });
  }
  if (application.status !== 'paid') {
    return NextResponse.json({ error: 'payment_required' }, { status: 403 });
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: application.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: application.full_name,
      role: 'member',
      phone: application.phone,
    },
  });

  if (createError || !created?.user) {
    const msg = createError?.message ?? 'account_creation_failed';
    const alreadyRegistered = /already registered|already exists/i.test(msg);
    return NextResponse.json(
      {
        error: alreadyRegistered ? 'email_already_registered' : 'account_creation_failed',
        hint: alreadyRegistered
          ? 'An account with this email already exists. Sign in on the login page instead.'
          : msg,
      },
      { status: alreadyRegistered ? 409 : 500 }
    );
  }

  const userId = created.user.id;

  await admin
    .from('profiles')
    .upsert(
      {
        id: userId,
        full_name: application.full_name,
        role: 'member',
        phone: application.phone,
        branch: 'Lagos Main',
        status: 'Active',
        products: ['Cooperative'],
        savings_balance: 0,
        loan_balance: 0,
      },
      { onConflict: 'id' }
    );

  await admin
    .from('membership_applications')
    .update({ status: 'account_created', user_id: userId })
    .eq('id', applicationId);

  return NextResponse.json({ ok: true, email: application.email });
}
