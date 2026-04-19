import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const DEMO_USERS = [
  {
    id: 'a1111111-1111-1111-1111-111111111101',
    email: 'demo-super-admin@fountain.coop',
  },
  {
    id: 'a1111111-1111-1111-1111-111111111102',
    email: 'demo-tenant-admin@fountain.coop',
  },
  {
    id: 'a1111111-1111-1111-1111-111111111103',
    email: 'demo-group-admin@fountain.coop',
  },
  {
    id: 'a1111111-1111-1111-1111-111111111104',
    email: 'demo-member@fountain.coop',
  },
] as const;

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'missing_service_role_key' },
      { status: 503 }
    );
  }

  const results: Array<{
    id: string;
    email: string;
    ok: boolean;
    error?: string;
  }> = [];

  for (const user of DEMO_USERS) {
    try {
      const { error } = await admin.auth.admin.updateUserById(user.id, {
        password: 'demo',
        email_confirm: true,
      });
      if (error) {
        results.push({
          id: user.id,
          email: user.email,
          ok: false,
          error: error.message,
        });
      } else {
        results.push({ id: user.id, email: user.email, ok: true });
      }
    } catch (e) {
      results.push({
        id: user.id,
        email: user.email,
        ok: false,
        error: e instanceof Error ? e.message : 'unknown_error',
      });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  return NextResponse.json({
    ok: okCount === results.length,
    resetTo: 'demo',
    results,
  });
}
