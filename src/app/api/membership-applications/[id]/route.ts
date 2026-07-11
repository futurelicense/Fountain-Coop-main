import { NextResponse } from 'next/server';
import { resolveRequestAuth } from '@/lib/server/request-auth';
import { isStaffRole } from '@/lib/server/operations-constants';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { MEMBERSHIP_PHOTOS_BUCKET } from '@/lib/server/membership-applications';

async function resolveIdParam(
  params: { id: string } | Promise<{ id: string }>
): Promise<string> {
  const resolved = params instanceof Promise ? await params : params;
  return decodeURIComponent(resolved.id ?? '');
}

export async function GET(
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const id = await resolveIdParam(context.params);
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
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'application_not_found' }, { status: 404 });
  }

  let photoSignedUrl: string | null = null;
  if (data.photo_path) {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data: signed } = await admin.storage
        .from(MEMBERSHIP_PHOTOS_BUCKET)
        .createSignedUrl(data.photo_path, 60 * 60);
      photoSignedUrl = signed?.signedUrl ?? null;
    }
  }

  return NextResponse.json({ ...data, photo_signed_url: photoSignedUrl });
}
