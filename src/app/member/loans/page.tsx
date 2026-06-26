'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { memberPaths } from '@/lib/memberPaths';
import {
  HandCoinsIcon,
  CheckCircleIcon,
  FileTextIcon,
  AlertTriangleIcon,
  Loader2Icon,
} from 'lucide-react';
import { fetchMe } from '@/api';
import { fetchLoanEligibility, type MemberLoanEligibility } from '@/api/loans';
import { formatNaira } from '@/lib/formatNaira';
import { LOAN_RULES } from '@/lib/loan-eligibility';
import { AlertBanner } from '@/components/member/ui/AlertBanner';

export default function MemberLoansPage() {
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(true);
  const [loanBalance, setLoanBalance] = useState(0);
  const [eligibility, setEligibility] = useState<MemberLoanEligibility | null>(null);

  const load = useCallback(async () => {
    setProfileLoading(true);
    try {
      const [{ profile }, elig] = await Promise.all([fetchMe(), fetchLoanEligibility()]);
      setLoanBalance(profile?.loan_balance ?? 0);
      setEligibility(elig);
    } catch {
      setEligibility(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const monthsRemaining = eligibility
    ? Math.max(0, LOAN_RULES.minActiveMonths - eligibility.monthsActive)
    : LOAN_RULES.minActiveMonths;

  return (
    <div className="space-y-5 pt-4">
      <h2 className="text-lg font-bold text-fountain-gray-900">My Loans</h2>

      <div className="bg-white rounded-2xl border border-fountain-gray-200 shadow-sm p-5">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-fountain-blue/10 rounded-xl">
            <HandCoinsIcon className="w-6 h-6 text-fountain-blue" />
          </div>
          <div>
            <p className="text-sm text-fountain-gray-500">Current Loan Balance</p>
            {profileLoading ? (
              <Loader2Icon className="w-5 h-5 animate-spin text-fountain-gray-400 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-fountain-gray-900">
                {formatNaira(loanBalance)}
              </p>
            )}
          </div>
        </div>
        {eligibility?.canApply ? (
          <div className="bg-fountain-green/5 border border-fountain-green/20 rounded-xl p-4 flex items-center space-x-3">
            <CheckCircleIcon className="w-5 h-5 text-fountain-green flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-fountain-green">Eligible to apply</p>
              <p className="text-xs text-fountain-gray-500">
                Up to {formatNaira(eligibility.maxEligibleAmount)} (3× your savings deposits).
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-fountain-amber/5 border border-fountain-amber/20 rounded-xl p-4 flex items-start space-x-3">
            <AlertTriangleIcon className="w-5 h-5 text-fountain-amber flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Not eligible yet</p>
              <p className="text-xs text-fountain-gray-600 mt-0.5">
                {eligibility?.blockReason ??
                  `Active membership of ${LOAN_RULES.minActiveMonths} months required.`}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-fountain-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-fountain-gray-900 mb-3">Your eligibility</h3>
        {profileLoading || !eligibility ? (
          <p className="text-sm text-fountain-gray-500">Loading…</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-fountain-gray-600">Membership duration</span>
              <span className="text-sm font-bold text-fountain-gray-900">
                {eligibility.monthsActive} months
                {eligibility.meetsTenure ? ' ✓' : ` (${monthsRemaining} mo. to go)`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-fountain-gray-600">Savings deposits</span>
              <span className="text-sm font-bold text-fountain-gray-900">
                {formatNaira(eligibility.savingsBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-fountain-gray-600">Loan limit (×3 deposits)</span>
              <span className="text-sm font-bold text-fountain-blue">
                {formatNaira(eligibility.maxEligibleAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-fountain-gray-600">Collateral above</span>
              <span className="text-sm font-bold text-fountain-gray-900">
                {formatNaira(LOAN_RULES.collateralThreshold)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-fountain-gray-600">Outstanding obligations</span>
              <span
                className={`text-sm font-bold ${eligibility.hasOutstandingLoan ? 'text-fountain-red' : 'text-fountain-green'}`}
              >
                {eligibility.hasOutstandingLoan
                  ? formatNaira(eligibility.loanBalance)
                  : 'None ✓'}
              </span>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-fountain-gray-500 px-1">
        Loans are available after {LOAN_RULES.minActiveMonths} months of active membership, up
        to 3× your cooperative savings. Amounts above {formatNaira(LOAN_RULES.collateralThreshold)}{' '}
        require collateral.
      </p>

      <button
        type="button"
        disabled={!eligibility?.canApply || profileLoading}
        onClick={() => router.push(memberPaths.loanApply)}
        className="w-full py-3.5 bg-fountain-blue text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-fountain-blue/25 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Apply for a Loan
      </button>

      {!eligibility?.canApply && eligibility?.blockReason ? (
        <AlertBanner tone="warning" message={eligibility.blockReason} />
      ) : null}

      <div>
        <h3 className="text-sm font-semibold text-fountain-gray-900 mb-3">Loan history</h3>
        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-5 text-center">
          <div className="p-3 bg-fountain-gray-100 rounded-full w-fit mx-auto mb-3">
            <FileTextIcon className="w-6 h-6 text-fountain-gray-400" />
          </div>
          <p className="text-sm text-fountain-gray-500">No previous loans</p>
          <p className="text-xs text-fountain-gray-400 mt-1">Your loan history will appear here</p>
        </div>
      </div>
    </div>
  );
}
