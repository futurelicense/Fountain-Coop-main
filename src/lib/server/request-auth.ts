import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAuthContext, type TokenPayload } from '@/lib/server/auth-helpers';
import type { UserRole } from '@/api/types';
import { getSupabaseConfig } from '@/lib/supabase/config';

function bearerFromRequest(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const jwt = header.slice(7).trim();
  return jwt || null;
}

/** Supabase access tokens are JWTs (3 segments). Demo legacy tokens are not. */
function looksLikeJwt(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

export type ResolvedAuth =
  | {
      kind: 'supabase';
      supabase: SupabaseClient;
      user: User;
      profile: ProfileRow | null;
    }
  | { kind: 'legacy'; auth: TokenPayload }
  | { kind: 'unauthorized' };

export type ProfileRow = {
  id: string;
  role: UserRole;
  member_code: string | null;
  full_name: string | null;
  phone: string | null;
  branch: string | null;
  status: string | null;
  products: string[] | null;
  savings_balance: number | null;
  loan_balance: number | null;
};

export async function getUserFromBearerOrCookies(
  supabase: SupabaseClient,
  request: Request
): Promise<User | null> {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) {
    const jwt = header.slice(7);
    const { data, error } = await supabase.auth.getUser(jwt);
    if (!error && data.user) return data.user;
  }
  const { data, error } = await supabase.auth.getUser();
  if (!error && data.user) return data.user;
  return null;
}

export async function resolveRequestAuth(
  request: Request
): Promise<ResolvedAuth> {
  const cfg = getSupabaseConfig();
  const bearer = bearerFromRequest(request);

  /**
   * SPA stores Supabase `access_token` in sessionStorage and sends it as
   * `Authorization: Bearer …`. Cookie-based `createServerClient` often has no
   * session on API routes; use a user-scoped anon client so RLS applies.
   */
  if (cfg && bearer && looksLikeJwt(bearer)) {
    const verify = createClient(cfg.url, cfg.anonKey);
    const { data: userData, error: userErr } = await verify.auth.getUser(bearer);
    if (!userErr && userData.user) {
      const supabase = createClient(cfg.url, cfg.anonKey, {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
      });
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .maybeSingle();
      return {
        kind: 'supabase',
        supabase,
        user: userData.user,
        profile: profile as ProfileRow | null,
      };
    }
  }

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const user = await getUserFromBearerOrCookies(supabase, request);
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      return {
        kind: 'supabase',
        supabase,
        user,
        profile: profile as ProfileRow | null,
      };
    }
  }

  const legacy = getAuthContext(request);
  if (legacy.ok) {
    return { kind: 'legacy', auth: legacy.auth };
  }
  return { kind: 'unauthorized' };
}

export function profileToAuthUser(
  user: User,
  profile: ProfileRow | null
): {
  id: string;
  name: string;
  role: UserRole;
  memberId: string | null;
} {
  const role = (profile?.role ?? 'member') as UserRole;
  const name =
    profile?.full_name ??
    user.user_metadata?.full_name ??
    user.email?.split('@')[0] ??
    'User';
  return {
    id: user.id,
    name,
    role,
    memberId: profile?.member_code ?? null,
  };
}
