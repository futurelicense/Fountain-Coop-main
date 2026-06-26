import type { SupabaseClient } from '@supabase/supabase-js';
import {
  computeLoanEligibility,
  validateLoanApplicationAmount,
  type LoanEligibility,
} from '@/lib/loan-eligibility';
import { pickNum, pickStr } from '@/lib/pickData';

export async function getMemberLoanEligibility(
  supabase: SupabaseClient,
  userId: string
): Promise<LoanEligibility & { memberSince: string | null }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('savings_balance, loan_balance, status, created_at')
    .eq('id', userId)
    .maybeSingle();

  const memberSince = (profile?.created_at as string | null) ?? null;
  const eligibility = computeLoanEligibility({
    memberSince,
    savingsBalance: Number(profile?.savings_balance ?? 0),
    loanBalance: Number(profile?.loan_balance ?? 0),
    status: (profile?.status as string | null) ?? null,
  });

  return { ...eligibility, memberSince };
}

export async function assertValidMemberLoanApplication(
  supabase: SupabaseClient,
  userId: string,
  data: Record<string, unknown>
): Promise<void> {
  const eligibility = await getMemberLoanEligibility(supabase, userId);
  if (!eligibility.canApply) {
    throw new Error(
      eligibility.blockReason ? 'loan_not_eligible' : 'loan_not_eligible'
    );
  }

  const amount = pickNum(data, 'amount');
  const validation = validateLoanApplicationAmount({
    amount,
    maxEligibleAmount: eligibility.maxEligibleAmount,
    collateralDescription: pickStr(data, 'collateralDescription'),
    collateralValue: pickNum(data, 'collateralValue'),
  });

  if (!validation.ok) {
    throw new Error(validation.error);
  }
}
