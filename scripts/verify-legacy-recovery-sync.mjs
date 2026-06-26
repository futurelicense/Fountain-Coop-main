#!/usr/bin/env node
/**
 * Verify legacy recovery opening balances are synced in Supabase operational_items.
 * Run: node scripts/verify-legacy-recovery-sync.mjs
 * Fix:  node scripts/verify-legacy-recovery-sync.mjs --import
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const doImport = process.argv.includes('--import');

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const openingPath = join(process.cwd(), 'src/data/legacy-recovery/opening-balances.json');
const opening = JSON.parse(readFileSync(openingPath, 'utf8'));

const SUBTYPES = {
  owing: 'legacyOwingRecord',
  thrift: 'legacyThriftTransaction',
  withdrawal: 'legacyWithdrawalTransaction',
};

const expected = {
  [SUBTYPES.owing]: opening.owing,
  [SUBTYPES.thrift]: opening.thriftDue,
  [SUBTYPES.withdrawal]: opening.withdrawalDue,
};

function sumAmount(rows) {
  return rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
}

function buildLegacyDebtData(input) {
  const amount = Math.max(0, Number(input.amount) || 0);
  const clearedAmount = Math.max(0, Number(input.clearedAmount) || 0);
  const balanceDue = Math.max(0, amount - clearedAmount);
  let status = 'open';
  if (balanceDue <= 0) status = 'cleared';
  else if (clearedAmount > 0) status = 'partial';
  return {
    personName: String(input.personName ?? '').trim(),
    amount,
    clearedAmount,
    balanceDue,
    branch: '',
    notes: String(input.notes ?? '').trim(),
    transactionDate: '',
    status,
    importBatchId: input.importBatchId,
    sourceSheet: opening.sourceSheet,
  };
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function fetchLegacyRows() {
  const { data, error } = await supabase
    .from('operational_items')
    .select('id, subtype, data')
    .eq('module', 'recovery')
    .in('subtype', Object.values(SUBTYPES));
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function importOpening(adminUserId) {
  const importBatchId = `OPEN-${Date.now()}`;
  const inserts = Object.entries(expected).flatMap(([subtype, rows]) =>
    rows.map((row) => ({
      module: 'recovery',
      subtype,
      data: buildLegacyDebtData({
        personName: row.personName,
        amount: row.amount,
        clearedAmount: 0,
        notes: row.notes ?? '',
        importBatchId,
      }),
      branch: null,
      owner_id: null,
      is_catalog: true,
      created_by: adminUserId,
    }))
  );

  const { data, error } = await supabase.from('operational_items').insert(inserts).select('id');
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

function compareRows(dbRows, expRows, subtype) {
  const dbByName = new Map(
    dbRows
      .filter((r) => r.subtype === subtype)
      .map((r) => [String(r.data?.personName ?? '').trim().toLowerCase(), r])
  );
  const missing = [];
  const amountMismatch = [];
  for (const exp of expRows) {
    const key = exp.personName.trim().toLowerCase();
    const db = dbByName.get(key);
    if (!db) {
      missing.push(exp.personName);
      continue;
    }
    const dbAmount = Number(db.data?.amount ?? 0);
    if (dbAmount !== exp.amount) {
      amountMismatch.push({ name: exp.personName, expected: exp.amount, actual: dbAmount });
    }
  }
  const expNames = new Set(expRows.map((r) => r.personName.trim().toLowerCase()));
  const extra = dbRows
    .filter((r) => r.subtype === subtype)
    .filter((r) => !expNames.has(String(r.data?.personName ?? '').trim().toLowerCase()))
    .map((r) => String(r.data?.personName ?? r.id));

  return { missing, amountMismatch, extra };
}

async function main() {
  console.log('Fountain Coop — legacy recovery Supabase sync check\n');
  console.log(`Project: ${url}`);
  console.log(`Source sheet: ${opening.sourceSheet}\n`);

  let rows = await fetchLegacyRows();
  const expectedTotal =
    opening.owing.length + opening.thriftDue.length + opening.withdrawalDue.length;

  if (!rows.length && doImport) {
    console.log('No legacy rows in DB — importing opening sheet...\n');
    const { data: staff } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['super_admin', 'tenant_admin', 'group_admin'])
      .limit(1)
      .maybeSingle();
    const adminId = staff?.id;
    if (!adminId) {
      console.error('No staff profile found to attribute import. Run npm run seed:demo-auth first.');
      process.exit(1);
    }
    if (rows.length) {
      await supabase
        .from('operational_items')
        .delete()
        .eq('module', 'recovery')
        .in('subtype', Object.values(SUBTYPES));
    }
    const imported = await importOpening(adminId);
    console.log(`Imported ${imported} rows.\n`);
    rows = await fetchLegacyRows();
  }

  const counts = {};
  const amounts = {};
  for (const subtype of Object.values(SUBTYPES)) {
    const subset = rows.filter((r) => r.subtype === subtype);
    counts[subtype] = subset.length;
    amounts[subtype] = subset.reduce((s, r) => s + Number(r.data?.amount ?? 0), 0);
  }

  let allSynced = true;
  console.log('Subtype counts:');
  for (const [key, subtype] of Object.entries(SUBTYPES)) {
    const exp = expected[subtype];
    const ok = counts[subtype] === exp.length;
    if (!ok) allSynced = false;
    console.log(
      `  ${subtype}: ${counts[subtype]} / ${exp.length} expected ${ok ? '✓' : '✗ MISSING'}`
    );
  }
  console.log(`\nTotal rows: ${rows.length} / ${expectedTotal} expected`);

  console.log('\nAmount totals (NGN):');
  for (const subtype of Object.values(SUBTYPES)) {
    const expSum = sumAmount(expected[subtype]);
    const dbSum = amounts[subtype];
    const ok = expSum === dbSum;
    if (!ok) allSynced = false;
    console.log(
      `  ${subtype}: ${dbSum.toLocaleString()} / ${expSum.toLocaleString()} ${ok ? '✓' : '✗'}`
    );
  }

  console.log('\nRow-level diff:');
  for (const subtype of Object.values(SUBTYPES)) {
    const { missing, amountMismatch, extra } = compareRows(rows, expected[subtype], subtype);
    if (!missing.length && !amountMismatch.length && !extra.length) {
      console.log(`  ${subtype}: all names and amounts match ✓`);
      continue;
    }
    allSynced = false;
    console.log(`  ${subtype}:`);
    if (missing.length) console.log(`    missing (${missing.length}): ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}`);
    if (amountMismatch.length)
      console.log(`    amount mismatches: ${amountMismatch.length}`);
    if (extra.length) console.log(`    extra in DB: ${extra.length}`);
  }

  // Branches module quick check
  const { data: branches, error: branchErr } = await supabase
    .from('operational_items')
    .select('subtype')
    .eq('module', 'branches');
  if (!branchErr) {
    const branchCount = branches?.filter((b) => b.subtype === 'branchDetail').length ?? 0;
    const staffCount = branches?.filter((b) => b.subtype === 'branchStaff').length ?? 0;
    console.log(`\nBranches module: ${branchCount} branches, ${staffCount} staff rows (admin-managed separately)`);
  }

  console.log('\n' + (allSynced && rows.length === expectedTotal ? '✅ SYNCED — Supabase matches PDF opening data.' : '❌ NOT FULLY SYNCED'));
  if (!rows.length) {
    console.log('\nTo import now, run:');
    console.log('  node scripts/verify-legacy-recovery-sync.mjs --import');
    console.log('Or in admin UI: Recovery → Load opening sheet');
  } else if (!allSynced) {
    console.log('\nTo replace with fresh PDF data:');
    console.log('  Admin → Recovery → Re-import sheet');
    console.log('  Or POST /api/admin/recovery/opening with { "replace": true }');
  }

  process.exit(allSynced && rows.length === expectedTotal ? 0 : 1);
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
