import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  MEMBERSHIP_PHOTOS_BUCKET,
  MEMBERSHIP_REGISTRATION_FEE_NAIRA,
} from '@/lib/server/membership-applications';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

function bool(form: FormData, key: string): boolean {
  return str(form, key) === 'true';
}

/** Public endpoint: anyone can submit a membership application (no auth yet). */
export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      {
        error: 'server_misconfigured',
        hint: 'Add SUPABASE_SERVICE_ROLE_KEY to .env.local.',
      },
      { status: 503 }
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: 'invalid_form_data' }, { status: 400 });
  }

  const fullName = str(form, 'fullName');
  const homeAddress = str(form, 'homeAddress');
  const phone = str(form, 'phone');
  const email = str(form, 'email').toLowerCase();
  const declarationAccepted = bool(form, 'declarationAccepted');
  const isEmployed = bool(form, 'isEmployed');
  const ownsBusiness = bool(form, 'ownsBusiness');
  const wantsFountainBasket = bool(form, 'wantsFountainBasket');
  const monthlyContribution = Number(str(form, 'monthlyContribution')) || 0;

  if (!fullName || !homeAddress || !phone || !email) {
    return NextResponse.json({ error: 'missing_required_fields' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }
  if (!declarationAccepted) {
    return NextResponse.json({ error: 'declaration_required' }, { status: 400 });
  }

  const photo = form.get('photo');
  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: 'photo_required' }, { status: 400 });
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: 'photo_too_large' }, { status: 400 });
  }
  if (!ALLOWED_PHOTO_TYPES.has(photo.type)) {
    return NextResponse.json({ error: 'photo_invalid_type' }, { status: 400 });
  }

  const ext = photo.type === 'image/png' ? 'png' : photo.type === 'image/webp' ? 'webp' : 'jpg';
  const photoPath = `${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await photo.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(MEMBERSHIP_PHOTOS_BUCKET)
    .upload(photoPath, bytes, { contentType: photo.type, upsert: false });
  if (uploadError) {
    return NextResponse.json(
      {
        error: 'photo_upload_failed',
        hint: `${uploadError.message} — ensure the "${MEMBERSHIP_PHOTOS_BUCKET}" storage bucket exists (run migration 010_membership_applications.sql).`,
      },
      { status: 500 }
    );
  }

  const row = {
    full_name: fullName,
    occupation: str(form, 'occupation') || null,
    is_employed: isEmployed,
    employer: isEmployed ? str(form, 'employer') || null : null,
    owns_business: ownsBusiness,
    business_type: ownsBusiness ? str(form, 'businessType') || null : null,
    home_address: homeAddress,
    office_address: str(form, 'officeAddress') || null,
    phone,
    email,
    referral_source: str(form, 'referralSource') || null,
    monthly_contribution: monthlyContribution,
    wants_fountain_basket: wantsFountainBasket,
    next_of_kin_name: str(form, 'nextOfKinName') || null,
    next_of_kin_address: str(form, 'nextOfKinAddress') || null,
    next_of_kin_phone: str(form, 'nextOfKinPhone') || null,
    emergency_contact: str(form, 'emergencyContact') || null,
    declaration_accepted: declarationAccepted,
    photo_path: photoPath,
    status: 'pending_payment' as const,
    registration_fee: MEMBERSHIP_REGISTRATION_FEE_NAIRA,
  };

  const { data: inserted, error: insertError } = await admin
    .from('membership_applications')
    .insert(row)
    .select('id')
    .single();

  if (insertError || !inserted) {
    await admin.storage.from(MEMBERSHIP_PHOTOS_BUCKET).remove([photoPath]);
    return NextResponse.json(
      {
        error: insertError?.message ?? 'application_save_failed',
        hint: /relation.*does not exist/i.test(insertError?.message ?? '')
          ? 'Run supabase/migrations/010_membership_applications.sql in Supabase SQL Editor.'
          : undefined,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, applicationId: inserted.id as string });
}
