'use client';

import { useRouter } from 'next/navigation';
import { memberPaths } from '@/lib/memberPaths';
import { HandCoinsIcon, CheckCircleIcon, FileTextIcon, ChevronRightIcon } from 'lucide-react';

export default function MemberLoansPage() {
  const router = useRouter();
  const formatNaira = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

  const loanProducts = [
    { name: 'Regular Loan', maxAmount: 2000000, tenure: '12 months', rate: '1.5%/mo', requirement: '6 months savings', icon: '💰' },
    { name: 'Emergency Loan', maxAmount: 500000, tenure: '6 months', rate: '2.0%/mo', requirement: '3 months savings', icon: '🚨' },
    { name: 'Asset Loan', maxAmount: 5000000, tenure: '24 months', rate: '1.8%/mo', requirement: '12 months savings', icon: '🏠' },
    { name: 'Business Loan', maxAmount: 10000000, tenure: '36 months', rate: '1.5%/mo', requirement: '12 months + plan', icon: '📈' },
  ];

  return (
    <div className="space-y-5 pt-4">
      <h2 className="text-lg font-bold text-fountain-gray-900">My Loans</h2>

      <div className="bg-white rounded-2xl border border-fountain-gray-200 shadow-sm p-5">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-fountain-blue/10 rounded-xl"><HandCoinsIcon className="w-6 h-6 text-fountain-blue" /></div>
          <div>
            <p className="text-sm text-fountain-gray-500">Current Loan Balance</p>
            <p className="text-2xl font-bold text-fountain-gray-900">{formatNaira(0)}</p>
          </div>
        </div>
        <div className="bg-fountain-green/5 border border-fountain-green/20 rounded-xl p-4 flex items-center space-x-3">
          <CheckCircleIcon className="w-5 h-5 text-fountain-green flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-fountain-green">No Active Loan</p>
            <p className="text-xs text-fountain-gray-500">You're eligible to apply for a loan based on your savings history.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-fountain-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-fountain-gray-900 mb-3">Your Eligibility</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><span className="text-sm text-fountain-gray-600">Savings Duration</span><span className="text-sm font-bold text-fountain-gray-900">9 months ✓</span></div>
          <div className="flex items-center justify-between"><span className="text-sm text-fountain-gray-600">Current Balance</span><span className="text-sm font-bold text-fountain-gray-900">{formatNaira(450000)} ✓</span></div>
          <div className="flex items-center justify-between"><span className="text-sm text-fountain-gray-600">Outstanding Obligations</span><span className="text-sm font-bold text-fountain-green">None ✓</span></div>
          <div className="flex items-center justify-between"><span className="text-sm text-fountain-gray-600">Max Eligible Amount</span><span className="text-sm font-bold text-fountain-blue">{formatNaira(2000000)}</span></div>
        </div>
      </div>

      <button type="button" onClick={() => router.push(memberPaths.loanApply)} className="w-full py-3.5 bg-fountain-blue text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-fountain-blue/25">
        Apply for a Loan
      </button>

      <div>
        <h3 className="text-sm font-semibold text-fountain-gray-900 mb-3">Available Loan Products</h3>
        <div className="space-y-3">
          {loanProducts.map((product, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{product.icon}</span>
                  <div>
                    <h4 className="font-bold text-sm text-fountain-gray-900">{product.name}</h4>
                    <p className="text-xs text-fountain-gray-500">Up to {formatNaira(product.maxAmount)}</p>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-fountain-gray-400" />
              </div>
              <div className="flex items-center space-x-4 mt-3 text-xs text-fountain-gray-500">
                <span>{product.tenure}</span><span>•</span><span>{product.rate}</span><span>•</span><span>{product.requirement}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-fountain-gray-900 mb-3">Loan History</h3>
        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-5 text-center">
          <div className="p-3 bg-fountain-gray-100 rounded-full w-fit mx-auto mb-3"><FileTextIcon className="w-6 h-6 text-fountain-gray-400" /></div>
          <p className="text-sm text-fountain-gray-500">No previous loans</p>
          <p className="text-xs text-fountain-gray-400 mt-1">Your loan history will appear here</p>
        </div>
      </div>
    </div>
  );
}
