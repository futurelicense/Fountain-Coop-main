import { NextResponse } from 'next/server';
import { isLegacyAuthEnabled } from '@/lib/config/app-mode';
import {
  encodeToken,
  findMemberByIdentifier,
  STAFF_ACCOUNTS,
} from '@/lib/server/auth-helpers';

export async function POST(request: Request) {
  if (!isLegacyAuthEnabled()) {
    return NextResponse.json(
      {
        error: 'legacy_auth_disabled',
        hint:
          'Wired test mode: sign in with Supabase email + password (demo-member@fountain.coop / demo).',
      },
      { status: 403 }
    );
  }
  const body = (await request.json().catch(() => null)) as {
    identifier?: string;
    password?: string;
  } | null;
  const identifier = String(body?.identifier ?? '').trim();
  const password = String(body?.password ?? '');
  if (!identifier || !password) {
    return NextResponse.json(
      { error: 'identifier_and_password_required' },
      { status: 400 }
    );
  }
  const staff = STAFF_ACCOUNTS.find(
    (s) => s.identifier.toLowerCase() === identifier.toLowerCase()
  );
  if (staff && staff.password === password) {
    const user = {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      memberId: null as string | null,
    };
    const token = encodeToken({
      sub: user.id,
      role: user.role,
      name: user.name,
      memberId: null,
      iat: Date.now(),
    });
    return NextResponse.json({ token, user });
  }
  const member = findMemberByIdentifier(identifier);
  if (member && password === 'demo') {
    const user = {
      id: `member-${member.id}`,
      name: member.name,
      role: 'member' as const,
      memberId: member.id,
    };
    const token = encodeToken({
      sub: user.id,
      role: 'member',
      name: user.name,
      memberId: member.id,
      iat: Date.now(),
    });
    return NextResponse.json({ token, user });
  }
  return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
}
