import type { UserRole } from '@/api/types';
import { MEMBERS } from './seed-data';

export const STAFF_ACCOUNTS = [
  {
    identifier: 'super_admin',
    password: 'demo',
    role: 'super_admin' as const,
    name: 'Adebayo Ogundimu',
    id: 'staff-super',
  },
  {
    identifier: 'tenant_admin',
    password: 'demo',
    role: 'tenant_admin' as const,
    name: 'Tenant Admin',
    id: 'staff-tenant',
  },
  {
    identifier: 'group_admin',
    password: 'demo',
    role: 'group_admin' as const,
    name: 'Group Admin',
    id: 'staff-group',
  },
];

export interface TokenPayload {
  sub: string;
  role: UserRole;
  name: string;
  memberId: string | null;
  iat: number;
}

export function encodeToken(payload: TokenPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeToken(raw: string): TokenPayload | null {
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as TokenPayload;
    if (!parsed?.sub || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

export function getAuthContext(request: Request):
  | { ok: true; auth: TokenPayload }
  | { ok: false; status: number; error: string } {
  const token = getBearerToken(request);
  if (!token) {
    return { ok: false, status: 401, error: 'missing_token' };
  }
  const payload = decodeToken(token);
  if (!payload) {
    return { ok: false, status: 401, error: 'invalid_token' };
  }
  return { ok: true, auth: payload };
}

export function findMemberByIdentifier(identifier: string) {
  const raw = String(identifier ?? '').trim();
  if (!raw) return null;
  const byId = MEMBERS.find((m) => m.id.toUpperCase() === raw.toUpperCase());
  if (byId) return byId;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const tail = digits.slice(-10);
  return (
    MEMBERS.find((m) => {
      const md = m.phone.replace(/\D/g, '');
      return md.endsWith(tail);
    }) ?? null
  );
}
