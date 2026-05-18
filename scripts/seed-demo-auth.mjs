/**
 * Creates or updates Fountain Coop demo Auth users with password `demo` using the
 * Admin API (correct bcrypt for signInWithPassword). SQL-only seeds often fail login on Cloud.
 *
 * Prerequisites in .env.local (or .env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (Dashboard → Settings → API → service_role — never expose to client)
 *
 * If you see "Database error checking email", run first in SQL Editor:
 *   supabase/migrations/005_delete_sql_seeded_demo_auth.sql
 *
 * Run: npm run seed:demo-auth
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    if (!key || process.env[key]) continue;
    const value = t.slice(eq + 1).trim();
    process.env[key] = value;
  }
}

loadEnvFile(join(process.cwd(), '.env.local'));
loadEnvFile(join(process.cwd(), '.env'));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const SQL_REPAIR_HINT =
  'Run supabase/migrations/005_delete_sql_seeded_demo_auth.sql in Supabase Dashboard → SQL Editor, then run `npm run seed:demo-auth` again.';

if (!url || !serviceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Add the service_role key to .env.local from Supabase Dashboard → Settings → API.'
  );
  process.exit(1);
}

function parseJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function projectRefFromUrl(rawUrl) {
  try {
    const host = new URL(rawUrl).hostname;
    return host.split('.')[0] || null;
  } catch {
    return null;
  }
}

const jwt = parseJwtPayload(serviceKey);
const keyRole = jwt?.role ?? null;
const keyRef = jwt?.ref ?? null;
const urlRef = projectRefFromUrl(url);
if (keyRole !== 'service_role') {
  console.error(
    `SUPABASE_SERVICE_ROLE_KEY is not a service_role key (role=${String(keyRole)}).`
  );
  process.exit(1);
}
if (keyRef && urlRef && keyRef !== urlRef) {
  console.error(
    `Key/project mismatch: service key is for ref=${keyRef}, but NEXT_PUBLIC_SUPABASE_URL is ref=${urlRef}.`
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Fixed ids from 002_demo_auth_users.sql — used when listUsers is broken on Cloud. */
const LEGACY_SQL_USER_ID_BY_EMAIL = {
  'demo-super-admin@fountain.coop': 'a1111111-1111-1111-1111-111111111101',
  'demo-tenant-admin@fountain.coop': 'a1111111-1111-1111-1111-111111111102',
  'demo-group-admin@fountain.coop': 'a1111111-1111-1111-1111-111111111103',
  'demo-member@fountain.coop': 'a1111111-1111-1111-1111-111111111104',
};

const demos = [
  {
    email: 'demo-super-admin@fountain.coop',
    meta: { full_name: 'Adebayo Ogundimu', role: 'super_admin' },
  },
  {
    email: 'demo-tenant-admin@fountain.coop',
    meta: { full_name: 'Tenant Admin', role: 'tenant_admin' },
  },
  {
    email: 'demo-group-admin@fountain.coop',
    meta: { full_name: 'Group Admin', role: 'group_admin' },
  },
  {
    email: 'demo-member@fountain.coop',
    meta: {
      full_name: 'Chioma Okafor',
      role: 'member',
      member_code: 'FC-1001',
      phone: '+234 803 123 4567',
      branch: 'Lagos Main',
      status: 'Active',
      products: ['Cooperative', 'Thrift'],
    },
  },
];

function isDatabaseAuthError(message) {
  return /database error/i.test(String(message || ''));
}

function isAlreadyRegistered(message) {
  return /already registered|already been registered|already exists|user already registered/i.test(
    String(message || '')
  );
}

async function upsertProfile(userId, meta) {
  if (!userId) return;
  const role = meta.role ?? 'member';
  const products = Array.isArray(meta.products) ? meta.products : [];
  const { error } = await admin.from('profiles').upsert(
    {
      id: userId,
      full_name: meta.full_name ?? 'User',
      role,
      member_code: meta.member_code ?? null,
      phone: meta.phone ?? null,
      branch: meta.branch ?? 'Lagos Main',
      status: meta.status ?? 'Active',
      products,
      savings_balance: 0,
      loan_balance: 0,
    },
    { onConflict: 'id' }
  );
  if (error) {
    console.warn('profile upsert:', userId, error.message);
  }
}

async function updateById(id, email, meta) {
  const { error } = await admin.auth.admin.updateUserById(id, {
    password: 'demo',
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) {
    return { ok: false, message: error.message };
  }
  console.log('updated password:', email);
  await upsertProfile(id, meta);
  return { ok: true };
}

async function resolveExistingUserId(email) {
  const { data, error } = await admin.auth.signInWithPassword({
    email,
    password: 'demo',
  });
  if (!error && data.user?.id) {
    return data.user.id;
  }
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (!linkErr && linkData?.user?.id) {
    return linkData.user.id;
  }
  return null;
}

async function upsert({ email, meta }) {
  const normalized = email.toLowerCase();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: normalized,
    password: 'demo',
    email_confirm: true,
    user_metadata: meta,
  });

  if (!createError) {
    console.log('created:', normalized);
    await upsertProfile(created?.user?.id, meta);
    return true;
  }

  const msg = String(createError.message || '');

  if (isAlreadyRegistered(msg)) {
    const legacyId = LEGACY_SQL_USER_ID_BY_EMAIL[normalized];
    if (legacyId) {
      const legacy = await updateById(legacyId, normalized, meta);
      if (legacy.ok) return true;
      if (!/not found/i.test(String(legacy.message || ''))) {
        console.error('update failed:', normalized, legacy.message);
        if (isDatabaseAuthError(legacy.message)) console.error(SQL_REPAIR_HINT);
        return false;
      }
    }

    const userId = await resolveExistingUserId(normalized);
    if (userId) {
      const fixed = await updateById(userId, normalized, meta);
      if (fixed.ok) return true;
      console.error('update failed:', normalized, fixed.message);
      return false;
    }

    console.log('ok (exists):', normalized, '— password should already be demo');
    return true;
  }

  if (isDatabaseAuthError(msg)) {
    console.error('create failed:', normalized, msg);
    console.error(SQL_REPAIR_HINT);
    return false;
  }

  console.error('create failed:', normalized, msg);
  return false;
}

let allOk = true;
for (const d of demos) {
  const ok = await upsert(d);
  if (!ok) allOk = false;
}

if (!allOk) {
  console.error(
    'One or more demo users failed to seed. If errors mention "Database error", run migration 005 in the SQL Editor first.'
  );
  process.exit(1);
}
console.log('Done. Sign in with any demo email and password: demo');
