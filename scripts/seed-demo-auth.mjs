/**
 * Creates or updates Fountain Coop demo Auth users with password `demo` using the
 * Admin API (correct bcrypt for signInWithPassword). SQL-only seeds often fail login on Cloud.
 *
 * Prerequisites in .env.local (or .env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (Dashboard → Settings → API → service_role — never expose to client)
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

async function upsert({ email, meta }) {
  const { error } = await admin.auth.admin.createUser({
    email,
    password: 'demo',
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) {
    const msg = String(error.message || '');
    if (/already registered|already been registered|already exists/i.test(msg)) {
      console.log(
        `exists: ${email} (if login still fails, reset this user's password to "demo" in Supabase Dashboard → Authentication → Users)`
      );
      return true;
    }
    console.error('create failed:', email, msg);
    return false;
  }
  console.log('created:', email);
  return true;
}

let allOk = true;
for (const d of demos) {
  const ok = await upsert(d);
  if (!ok) allOk = false;
}

if (!allOk) {
  console.error(
    'One or more demo users failed to seed. Verify Auth service health and key/project alignment in Supabase Dashboard.'
  );
  process.exit(1);
}
console.log('Done. Sign in with any demo email and password: demo');
