'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { memberPaths } from '@/lib/memberPaths';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  Loader2Icon,
} from 'lucide-react';
import { ApiError, fetchMe } from '@/api';
import { fetchLoanEligibility, type MemberLoanEligibility } from '@/api/loans';
import { createOperational } from '@/api/operations';
import { formatNaira } from '@/lib/formatNaira';
import {
  LOAN_RULES,
  loanRequiresCollateral,
} from '@/lib/loan-eligibility';
import { AlertBanner } from '@/components/member/ui/AlertBanner';

export default function MemberLoanApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('500000');
  const [purpose, setPurpose] = useState('');
  const [tenure, setTenure] = useState('12');
  const [collateralDescription, setCollateralDescription] = useState('');
  const [collateralValue, setCollateralValue] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [eligibility, setEligibility] = useState<MemberLoanEligibility | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [me, elig] = await Promise.all([fetchMe(), fetchLoanEligibility()]);
      setMemberName(me.profile?.full_name ?? me.user.name);
      setMemberId(me.profile?.member_code ?? me.user.memberId ?? '');
      setEligibility(elig);
      if (elig.maxEligibleAmount > 0) {
        setAmount(String(Math.min(500_000, elig.maxEligibleAmount)));
      }
    } catch {
      setEligibility(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const amountNum = Number(amount) || 0;
  const maxAmount = eligibility?.maxEligibleAmount ?? 0;
  const minAmount = Math.min(50_000, maxAmount || 50_000);
  const needsCollateral = loanRequiresCollateral(amountNum);
  const totalSteps = needsCollateral ? 4 : 3;
  const reviewStep = totalSteps;

  const stepLabels = useMemo(() => {
    const labels = ['Loan amount', 'Purpose & tenure'];
    if (needsCollateral) labels.push('Collateral');
    labels.push('Review & submit');
    return labels;
  }, [needsCollateral]);

  const formatDisplay = (val: string | number) => formatNaira(Number(val) || 0);

  const submitApplication = async () => {
    if (!eligibility?.canApply || !confirmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const ref = `APP-${Date.now().toString().slice(-6)}`;
      await createOperational('loans', {
        subtype: 'loanApplication',
        data: {
          memberName,
          memberId,
          loanType: 'Regular Loan',
          amount: amountNum,
          purpose,
          tenureMonths: Number(tenure),
          appliedDate: new Date().toISOString().slice(0, 10),
          guarantors: needsCollateral ? 'Collateral provided' : '—',
          status: 'Pending',
          reference: ref,
          requiresCollateral: needsCollateral,
          collateralDescription: needsCollateral ? collateralDescription.trim() : '',
          collateralValue: needsCollateral ? Number(collateralValue) : 0,
          maxEligibleAtApply: maxAmount,
          savingsAtApply: eligibility.savingsBalance,
        },
      });
      setSubmittedRef(ref);
      setStep(reviewStep + 1);
    } catch (e) {
      const code =
        e instanceof ApiError ? (e.body as { error?: string })?.error : null;
      if (code === 'loan_amount_exceeds_limit') {
        setError(`Amount cannot exceed ${formatNaira(maxAmount)} (3× your savings).`);
      } else if (code === 'collateral_required') {
        setError('Describe the collateral you are pledging for loans above ₦1M.');
      } else if (code === 'collateral_value_required') {
        setError('Enter the estimated value of your collateral.');
      } else if (code === 'loan_not_eligible') {
        setError(eligibility.blockReason ?? 'You are not eligible to apply.');
      } else {
        setError('Could not submit application. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-12 flex justify-center text-fountain-gray-500 text-sm gap-2">
        <Loader2Icon className="w-4 h-4 animate-spin" /> Checking eligibility…
      </div>
    );
  }

  if (!eligibility?.canApply) {
    return (
      <div className="space-y-4 pt-4">
        <button
          type="button"
          onClick={() => router.push(memberPaths.loans)}
          className="p-2 -ml-2 text-fountain-gray-600"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <AlertBanner
          tone="warning"
          message={
            eligibility?.blockReason ??
            `You need ${LOAN_RULES.minActiveMonths} months of active membership before applying.`
          }
        />
        <button
          type="button"
          onClick={() => router.push(memberPaths.loans)}
          className="w-full py-3 bg-fountain-blue text-white rounded-xl text-sm font-semibold"
        >
          Back to loans
        </button>
      </div>
    );
  }

  if (step === reviewStep + 1 && submittedRef) {
    return (
      <div className="pt-12 pb-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 bg-fountain-green/10 rounded-full flex items-center justify-center mb-2">
          <CheckCircleIcon className="w-10 h-10 text-fountain-green" />
        </div>
        <h2 className="text-2xl font-bold text-fountain-gray-900">Application submitted!</h2>
        <p className="text-sm text-fountain-gray-500 max-w-xs">
          Reference{' '}
          <span className="font-mono font-bold text-fountain-gray-900">{submittedRef}</span> — admin
          will review within 24–48 hours.
        </p>
        <div className="bg-fountain-gray-50 p-4 rounded-xl border border-fountain-gray-200 w-full mt-6 text-left">
          <p className="text-xs text-fountain-gray-500 mb-1">Requested amount</p>
          <p className="text-lg font-bold text-fountain-gray-900 mb-3">
            {formatDisplay(amount)}
          </p>
          {needsCollateral ? (
            <p className="text-xs text-fountain-amber">Collateral details included for review.</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => router.push(memberPaths.loans)}
          className="w-full py-3.5 bg-fountain-blue text-white rounded-xl font-semibold text-sm mt-8"
        >
          Return to loans
        </button>
      </div>
    );
  }

  const goNext = () => {
    if (step === 1 && amountNum > maxAmount) {
      setError(`Maximum eligible amount is ${formatNaira(maxAmount)}.`);
      return;
    }
    if (step === 2 && !purpose) {
      setError('Select a loan purpose.');
      return;
    }
    if (step === 3 && needsCollateral) {
      if (collateralDescription.trim().length < 10) {
        setError('Describe your collateral (minimum 10 characters).');
        return;
      }
      if (!Number(collateralValue) || Number(collateralValue) <= 0) {
        setError('Enter the estimated collateral value.');
        return;
      }
    }
    setError(null);
    setStep(step + 1);
  };

  return (
    <div className="space-y-6 pt-2 pb-8">
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={
            step === 1 ? () => router.push(memberPaths.loans) : () => setStep(step - 1)
          }
          className="p-2 -ml-2 text-fountain-gray-600"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-fountain-gray-900">Apply for loan</h2>
      </div>

      <div className="flex items-center justify-between px-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((i) => (
          <div key={i} className="flex flex-col items-center flex-1 relative">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                step >= i ? 'bg-fountain-blue text-white' : 'bg-fountain-gray-200 text-fountain-gray-500'
              }`}
            >
              {i}
            </div>
            {i < totalSteps ? (
              <div
                className={`absolute top-3 left-1/2 w-full h-0.5 ${
                  step > i ? 'bg-fountain-blue' : 'bg-fountain-gray-200'
                }`}
              />
            ) : null}
          </div>
        ))}
      </div>
      <p className="text-center text-xs font-medium text-fountain-gray-500 uppercase tracking-wider">
        {stepLabels[step - 1]}
      </p>

      {error ? <AlertBanner tone="warning" message={error} /> : null}

      {step === 1 ? (
        <div className="space-y-4">
          <div className="bg-fountain-blue/5 border border-fountain-blue/20 rounded-xl p-3 text-xs text-fountain-gray-700">
            Maximum loan: <strong>{formatNaira(maxAmount)}</strong> (3× your savings of{' '}
            {formatNaira(eligibility.savingsBalance)}). Active membership:{' '}
            {eligibility.monthsActive} months.
          </div>
          <div className="bg-white p-5 rounded-xl border border-fountain-gray-200 shadow-sm">
            <label className="block text-sm font-medium text-fountain-gray-700 mb-2">
              How much do you need?
            </label>
            <p className="text-3xl font-bold text-fountain-gray-900 mb-4 text-center">
              {formatDisplay(amount)}
            </p>
            <input
              type="range"
              min={minAmount}
              max={Math.max(minAmount, maxAmount)}
              step={50_000}
              value={Math.min(amountNum, maxAmount) || minAmount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-2 bg-fountain-gray-200 rounded-lg appearance-none cursor-pointer accent-fountain-blue"
            />
            <div className="flex justify-between text-xs text-fountain-gray-400 mt-2">
              <span>{formatNaira(minAmount)}</span>
              <span>{formatNaira(maxAmount)} max</span>
            </div>
            {needsCollateral ? (
              <p className="text-xs text-fountain-amber mt-3 flex items-start gap-1">
                <ShieldCheckIcon className="w-4 h-4 shrink-0" />
                Amounts above {formatNaira(LOAN_RULES.collateralThreshold)} require collateral
                details in the next steps.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fountain-gray-700 mb-1">
              Loan purpose
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full p-3 bg-white border border-fountain-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-fountain-blue/50"
            >
              <option value="">Select purpose…</option>
              <option value="Business expansion">Business expansion</option>
              <option value="School fees">School fees</option>
              <option value="Medical emergency">Medical emergency</option>
              <option value="Asset purchase">Asset purchase</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-fountain-gray-700 mb-1">
              Preferred tenure (months)
            </label>
            <select
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
              className="w-full p-3 bg-white border border-fountain-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-fountain-blue/50"
            >
              <option value="12">12 months</option>
              <option value="9">9 months</option>
              <option value="6">6 months</option>
              <option value="3">3 months</option>
            </select>
          </div>
        </div>
      ) : null}

      {step === 3 && needsCollateral ? (
        <div className="space-y-4">
          <div className="bg-fountain-amber/10 p-4 rounded-xl flex items-start space-x-3">
            <ShieldCheckIcon className="w-5 h-5 text-fountain-amber flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 font-medium leading-relaxed">
              Loans above {formatNaira(LOAN_RULES.collateralThreshold)} require acceptable
              collateral. Provide details for admin verification.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-fountain-gray-700 mb-1">
              Collateral description
            </label>
            <textarea
              value={collateralDescription}
              onChange={(e) => setCollateralDescription(e.target.value)}
              rows={3}
              placeholder="e.g. Toyota Corolla 2015, registered — Lagos plate"
              className="w-full p-3 bg-white border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fountain-gray-700 mb-1">
              Estimated collateral value (NGN)
            </label>
            <input
              type="number"
              min={0}
              value={collateralValue}
              onChange={(e) => setCollateralValue(e.target.value)}
              className="w-full p-3 bg-white border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue"
            />
          </div>
        </div>
      ) : null}

      {step === reviewStep ? (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-fountain-gray-50 border-b border-fountain-gray-200">
              <h3 className="font-bold text-fountain-gray-900">Application summary</h3>
            </div>
            <div className="divide-y divide-fountain-gray-100 text-sm">
              <div className="p-4 flex justify-between">
                <span className="text-fountain-gray-500">Member</span>
                <span className="font-medium">
                  {memberName} · {memberId}
                </span>
              </div>
              <div className="p-4 flex justify-between">
                <span className="text-fountain-gray-500">Amount</span>
                <span className="font-bold">{formatDisplay(amount)}</span>
              </div>
              <div className="p-4 flex justify-between">
                <span className="text-fountain-gray-500">Max eligible (3× savings)</span>
                <span>{formatNaira(maxAmount)}</span>
              </div>
              <div className="p-4 flex justify-between">
                <span className="text-fountain-gray-500">Purpose</span>
                <span>{purpose}</span>
              </div>
              <div className="p-4 flex justify-between">
                <span className="text-fountain-gray-500">Tenure</span>
                <span>{tenure} months</span>
              </div>
              {needsCollateral ? (
                <>
                  <div className="p-4">
                    <span className="text-fountain-gray-500 block mb-1">Collateral</span>
                    <span>{collateralDescription}</span>
                  </div>
                  <div className="p-4 flex justify-between">
                    <span className="text-fountain-gray-500">Collateral value</span>
                    <span>{formatDisplay(collateralValue)}</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
          <label className="flex items-start space-x-3 p-4 bg-white border border-fountain-gray-200 rounded-xl">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 text-fountain-blue rounded border-fountain-gray-300"
            />
            <span className="text-xs text-fountain-gray-600 leading-relaxed">
              I confirm the information is accurate and understand the loan limit is 3× my
              cooperative savings, with collateral required above{' '}
              {formatNaira(LOAN_RULES.collateralThreshold)}.
            </span>
          </label>
        </div>
      ) : null}

      <div className="pt-4">
        <button
          type="button"
          disabled={
            (step === reviewStep && (!confirmed || submitting)) ||
            (step === 1 && maxAmount <= 0)
          }
          onClick={() =>
            step === reviewStep ? void submitApplication() : goNext()
          }
          className="w-full py-3.5 bg-fountain-blue text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg shadow-fountain-blue/25 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2Icon className="w-4 h-4 animate-spin" /> Submitting…
            </>
          ) : step === reviewStep ? (
            'Submit application'
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
}
