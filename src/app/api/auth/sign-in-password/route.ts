import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/lib/supabase/config';

function isSupabaseConnectionError(err: unknown): boolean {
  const walk = (e: unknown): boolean => {
    if (!e || typeof e !== 'object') return false;
    const o = e as { code?: string; cause?: unknown; errors?: unknown[] };
    if (o.code === 'ECONNREFUSED') return true;
    if (Array.isArray(o.errors)) {
      return o.errors.some((x) => walk(x));
    }
    if (o.cause !== undefined) return walk(o.cause);
    return false;
  };
  if (walk(err)) return true;
  if (err instanceof Error && /fetch failed|ECONNREFUSED/i.test(err.message)) {
    return true;
  }
  return false;
}

/**
 * Password sign-in proxied through Next so the browser never calls Supabase Auth
 * directly (avoids CORS / mixed-host issues between localhost:3000 and 127.0.0.1:54321).
 */
export async function POST(request: Request) {
  const cfg = getSupabaseConfig();
  if (!cfg) {
    return NextResponse.json(
      { error: 'supabase_not_configured' },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;
  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');
  if (!email || !password) {
    return NextResponse.json({ error: 'email_and_password_required' }, { status: 400 });
  }

  const supabase = createClient(cfg.url, cfg.anonKey);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      const body: Record<string, string> = {
        error: error?.message ?? 'invalid_credentials',
      };
      if (error?.code) body.code = error.code;
      if (process.env.NODE_ENV === 'development') {
        if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
          body.hint =
            'Run `npm run seed:demo-auth` (resets demo passwords via Admin API), restart `npm run dev`, then sign in with password demo. Or reset the user in Dashboard → Authentication → Users. Until then, staff can sign in with identifier super_admin (not the email) and password demo.';
        } else {
          body.hint =
            'Cloud: add SUPABASE_SERVICE_ROLE_KEY to .env.local, run `npm run seed:demo-auth`, restart dev. Or create the user in Dashboard → Authentication (password demo). SQL-only auth inserts often fail signInWithPassword until you reset the password this way.';
        }
      }
      return NextResponse.json(body, { status: 401 });
    }

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: data.user,
    });
  } catch (e) {
    if (isSupabaseConnectionError(e)) {
      return NextResponse.json(
        {
          error: 'supabase_unreachable',
          hint:
            `Cannot reach Supabase at ${cfg.url}. For local dev run \`supabase start\` (API on port 54321). For a hosted project, set NEXT_PUBLIC_SUPABASE_URL in .env.local to your Project URL and restart \`npm run dev\`.`,
        },
        { status: 503 }
      );
    }
    throw e;
  }
}
