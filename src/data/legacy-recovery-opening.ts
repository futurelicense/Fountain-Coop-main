/**
 * Opening legacy debt from PDF DOC-20260519-WA0006.
 * Source of truth: ./legacy-recovery/opening-balances.json
 * CSV exports: ../../data/legacy-recovery/csv/ (run npm run export:legacy-csv)
 */

import opening from './legacy-recovery/opening-balances.json';

export type OpeningLegacyRow = {
  personName: string;
  amount: number;
  notes?: string;
};

type JsonRow = { sn?: number; personName: string; amount: number; notes?: string };

function mapRows(rows: JsonRow[]): OpeningLegacyRow[] {
  return rows.map(({ personName, amount, notes }) => ({
    personName,
    amount,
    ...(notes ? { notes } : {}),
  }));
}

export const OPENING_OWING = mapRows(opening.owing);
export const OPENING_THRIFT_DUE = mapRows(opening.thriftDue);
export const OPENING_WITHDRAWAL_DUE = mapRows(opening.withdrawalDue);
export const OPENING_SHEET_REF = opening.sourceSheet;
