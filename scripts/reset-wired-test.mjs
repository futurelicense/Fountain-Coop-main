/**
 * Clears mock operational data and zeroes member balances via service role.
 * Run after applying 008_clear_mock_data_wired_test.sql or instead of it.
 *
 *   npm run reset:wired-test
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = t.slice(eq + 1).trim();
  }
}

loadEnvFile(join(process.cwd(), '.env.local'));
loadEnvFile(join(process.cwd(), '.env'));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error: delOps } = await admin
  .from('operational_items')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000');
if (delOps) {
  console.error('operational_items delete:', delOps.message);
  process.exit(1);
}
console.log('cleared operational_items');

const { data: members, error: listErr } = await admin
  .from('profiles')
  .select('id')
  .eq('role', 'member');
if (listErr) {
  console.error('profiles list:', listErr.message);
  process.exit(1);
}

for (const m of members ?? []) {
  const { error } = await admin
    .from('profiles')
    .update({ savings_balance: 0, loan_balance: 0 })
    .eq('id', m.id);
  if (error) {
    console.error('profile reset', m.id, error.message);
    process.exit(1);
  }
}
console.log(`zeroed ${members?.length ?? 0} member profile(s)`);
console.log('Done. Set NEXT_PUBLIC_WIRED_TEST_MODE=true, restart dev, sign in with demo-member@fountain.coop');
