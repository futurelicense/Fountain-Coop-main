#!/usr/bin/env node
/**
 * Export legacy recovery opening balances (from PDF DOC-20260519-WA0006) to CSV files.
 * Source: data/legacy-recovery/opening-balances.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const jsonPath = join(root, 'data/legacy-recovery/opening-balances.json');
const payload = JSON.parse(readFileSync(jsonPath, 'utf8'));

function escapeCsv(value) {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows, category) {
  const header = [
    'S/N',
    'Name',
    'Amount',
    'Cleared Amount',
    'Balance Due',
    'Category',
    'Notes',
    'Source Sheet',
  ];
  const lines = [header.join(',')];
  for (const row of rows) {
    const amount = Number(row.amount) || 0;
    lines.push(
      [
        row.sn ?? '',
        escapeCsv(row.personName),
        amount,
        0,
        amount,
        escapeCsv(category),
        escapeCsv(row.notes ?? ''),
        escapeCsv(payload.sourceSheet),
      ].join(',')
    );
  }
  return lines.join('\n') + '\n';
}

function sum(rows) {
  return rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
}

const outputs = [
  { key: 'owing', file: 'people-owing.csv', category: 'People Owing', rows: payload.owing },
  {
    key: 'thriftDue',
    file: 'thrift-transactions-due.csv',
    category: 'Thrift Due',
    rows: payload.thriftDue,
  },
  {
    key: 'withdrawalDue',
    file: 'withdrawal-transactions-due.csv',
    category: 'Withdrawal Due',
    rows: payload.withdrawalDue,
  },
];

const allRows = [
  ...payload.owing.map((r) => ({ ...r, category: 'People Owing' })),
  ...payload.thriftDue.map((r) => ({ ...r, category: 'Thrift Due' })),
  ...payload.withdrawalDue.map((r) => ({ ...r, category: 'Withdrawal Due' })),
];

const combinedHeader = [
  'S/N',
  'Name',
  'Amount',
  'Cleared Amount',
  'Balance Due',
  'Category',
  'Notes',
  'Source Sheet',
];
const combinedLines = [combinedHeader.join(',')];
for (const row of allRows) {
  const amount = Number(row.amount) || 0;
  combinedLines.push(
    [
      row.sn ?? '',
      escapeCsv(row.personName),
      amount,
      0,
      amount,
      escapeCsv(row.category),
      escapeCsv(row.notes ?? ''),
      escapeCsv(payload.sourceSheet),
    ].join(',')
  );
}

const dirs = [
  join(root, 'data/legacy-recovery/csv'),
  join(root, 'public/legacy-recovery/csv'),
];

for (const dir of dirs) {
  mkdirSync(dir, { recursive: true });
  for (const { file, category, rows } of outputs) {
    const csv = rowsToCsv(rows, category);
    writeFileSync(join(dir, file), csv, 'utf8');
  }
  writeFileSync(join(dir, 'all-legacy-debt.csv'), combinedLines.join('\n') + '\n', 'utf8');
}

console.log('Legacy recovery CSV export complete\n');
console.log(`Source: ${payload.sourceSheet}`);
console.log(`Output folders:`);
for (const dir of dirs) console.log(`  - ${dir}`);
console.log('');
for (const { key, file, rows } of outputs) {
  const total = sum(rows);
  const pdfTotal = payload.totalsFromPdf[key === 'thriftDue' ? 'thriftAndWithdrawalDue' : key === 'withdrawalDue' ? 'batchIIWithdrawal' : key];
  const match = pdfTotal ? (total === pdfTotal ? '✓' : `PDF ${pdfTotal.toLocaleString()}`) : '';
  console.log(`${file}: ${rows.length} rows, total ₦${total.toLocaleString()} ${match}`);
}
console.log(`all-legacy-debt.csv: ${allRows.length} rows combined`);
