/** Cooperative loan eligibility rules. */

export const LOAN_RULES = {
  minActiveMonths: 6,
  savingsMultiplier: 3,
  collateralThreshold: 1_000_000,
} as const;

export type LoanEligibility = {
  minActiveMonths: number;
  savingsMultiplier: number;
  collateralThreshold: number;
  monthsActive: number;
  meetsTenure: boolean;
  savingsBalance: number;
  loanBalance: number;
  maxEligibleAmount: number;
  canApply: boolean;
  hasOutstandingLoan: boolean;
  statusOk: boolean;
  blockReason: string | null;
};

export function monthsBetween(startIso: string, end = new Date()): number {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return 0;
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  const dayAdjust = end.getDate() < start.getDate() ? -1 : 0;
  return Math.max(0, months + dayAdjust);
}

export function computeLoanEligibility(input: {
  memberSince: string | null | undefined;
  savingsBalance: number;
  loanBalance: number;
  status: string | null | undefined;
}): LoanEligibility {
  const savingsBalance = Math.max(0, Number(input.savingsBalance) || 0);
  const loanBalance = Math.max(0, Number(input.loanBalance) || 0);
  const monthsActive = input.memberSince
    ? monthsBetween(input.memberSince)
    : 0;
  const meetsTenure = monthsActive >= LOAN_RULES.minActiveMonths;
  const statusOk =
    !input.status || input.status === 'Active' || input.status === 'On track';
  const hasOutstandingLoan = loanBalance > 0;
  const maxEligibleAmount = savingsBalance * LOAN_RULES.savingsMultiplier;

  let blockReason: string | null = null;
  if (!meetsTenure) {
    blockReason = `You must be an active member for at least ${LOAN_RULES.minActiveMonths} months before applying for a loan.`;
  } else if (!statusOk) {
    blockReason = 'Your membership status must be Active to apply for a loan.';
  } else if (hasOutstandingLoan) {
    blockReason = 'Clear your outstanding loan balance before applying for a new loan.';
  } else if (savingsBalance <= 0) {
    blockReason = 'Build cooperative savings first — your maximum loan is 3× your deposits.';
  }

  return {
    minActiveMonths: LOAN_RULES.minActiveMonths,
    savingsMultiplier: LOAN_RULES.savingsMultiplier,
    collateralThreshold: LOAN_RULES.collateralThreshold,
    monthsActive,
    meetsTenure,
    savingsBalance,
    loanBalance,
    maxEligibleAmount,
    canApply: meetsTenure && statusOk && !hasOutstandingLoan && savingsBalance > 0,
    hasOutstandingLoan,
    statusOk,
    blockReason,
  };
}

export function loanRequiresCollateral(amount: number): boolean {
  return amount > LOAN_RULES.collateralThreshold;
}

export function validateLoanApplicationAmount(input: {
  amount: number;
  maxEligibleAmount: number;
  collateralDescription?: string;
  collateralValue?: number;
}): { ok: true } | { ok: false; error: string } {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'invalid_amount' };
  }
  if (amount > input.maxEligibleAmount) {
    return { ok: false, error: 'loan_amount_exceeds_limit' };
  }
  if (loanRequiresCollateral(amount)) {
    const desc = String(input.collateralDescription ?? '').trim();
    if (desc.length < 10) {
      return { ok: false, error: 'collateral_required' };
    }
    const val = Number(input.collateralValue ?? 0);
    if (!Number.isFinite(val) || val <= 0) {
      return { ok: false, error: 'collateral_value_required' };
    }
  }
  return { ok: true };
}
