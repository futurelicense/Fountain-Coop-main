import { NextResponse } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function projectRefFromUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const host = new URL(rawUrl).hostname;
    return host.split('.')[0] || null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const email = new URL(request.url).searchParams.get('email')?.trim().toLowerCase();
  const cfg = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? null;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? null;
  const admin = getSupabaseAdmin();

  const urlRef = projectRefFromUrl(cfg?.url ?? null);
  const anonRef = projectRefFromUrl(
    (decodeJwtPayload(anonKey ?? '')?.ref as string | undefined) ?? null
  );
  const servicePayload = decodeJwtPayload(serviceRoleKey ?? '');
  const serviceRef = (servicePayload?.ref as string | undefined) ?? null;
  const serviceRole = (servicePayload?.role as string | undefined) ?? null;

  let userCheck:
    | { found: boolean; id?: string; email_confirmed?: boolean; provider_count?: number }
    | { error: string }
    | null = null;

  if (admin && email) {
    try {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) {
        userCheck = { error: error.message };
      } else {
        const u = data.users.find((x) => x.email?.toLowerCase() === email);
        userCheck = u
          ? {
              found: true,
              id: u.id,
              email_confirmed: Boolean(u.email_confirmed_at),
              provider_count: Array.isArray(u.identities) ? u.identities.length : 0,
            }
          : { found: false };
      }
    } catch (e) {
      userCheck = { error: e instanceof Error ? e.message : 'list_users_failed' };
    }
  }

  return NextResponse.json({
    env: process.env.NODE_ENV,
    supabase_url: cfg?.url ?? null,
    url_ref: urlRef,
    anon_ref: anonRef,
    service_ref: serviceRef,
    service_role: serviceRole,
    service_key_present: Boolean(serviceRoleKey),
    refs_match: Boolean(
      urlRef && anonRef && serviceRef && urlRef === anonRef && urlRef === serviceRef
    ),
    user_check: userCheck,
  });
}
