import { apiFetch } from './client';
import type { LoanEligibility } from '@/lib/loan-eligibility';

export type MemberLoanEligibility = LoanEligibility & {
  memberSince: string | null;
};

export async function fetchLoanEligibility(): Promise<MemberLoanEligibility> {
  return apiFetch('/api/member/loans/eligibility');
}
