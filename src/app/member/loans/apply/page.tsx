'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { memberPaths } from '@/lib/memberPaths';
import { ArrowLeftIcon, CheckCircleIcon, ShieldCheckIcon } from 'lucide-react';

export default function MemberLoanApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [amount, setAmount] = useState('500000');

  const formatNaira = (val: string | number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(val));

  const products = [
    { id: 'regular', name: 'Regular Loan', max: 2000000, rate: '1.5%/mo', tenure: '12 mos' },
    { id: 'emergency', name: 'Emergency Loan', max: 500000, rate: '2.0%/mo', tenure: '6 mos' },
    { id: 'asset', name: 'Asset Loan', max: 5000000, rate: '1.8%/mo', tenure: '24 mos' },
  ];

  if (step === 5) {
    return (
      <div className="pt-12 pb-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 bg-fountain-green/10 rounded-full flex items-center justify-center mb-2"><CheckCircleIcon className="w-10 h-10 text-fountain-green" /></div>
        <h2 className="text-2xl font-bold text-fountain-gray-900">Application Submitted!</h2>
        <p className="text-sm text-fountain-gray-500 max-w-xs">Your loan application <span className="font-mono font-bold text-fountain-gray-900">APP-109</span> has been received and is under review.</p>
        <div className="bg-fountain-gray-50 p-4 rounded-xl border border-fountain-gray-200 w-full mt-6 text-left">
          <p className="text-xs text-fountain-gray-500 mb-1">Requested Amount</p>
          <p className="text-lg font-bold text-fountain-gray-900 mb-3">{formatNaira(amount)}</p>
          <p className="text-xs text-fountain-gray-500 mb-1">Expected Review Time</p>
          <p className="text-sm font-medium text-fountain-gray-900">24 - 48 hours</p>
        </div>
        <button onClick={() => router.push(memberPaths.loans)} className="w-full py-3.5 bg-fountain-blue text-white rounded-xl font-semibold text-sm mt-8">Return to Loans</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 pb-8">
      <div className="flex items-center space-x-3">
        <button onClick={step === 1 ? () => router.push(memberPaths.loans) : () => setStep(step - 1)} className="p-2 -ml-2 text-fountain-gray-600"><ArrowLeftIcon className="w-5 h-5" /></button>
        <h2 className="text-lg font-bold text-fountain-gray-900">Apply for Loan</h2>
      </div>

      <div className="flex items-center justify-between px-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center w-1/4 relative">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${step >= i ? 'bg-fountain-blue text-white' : 'bg-fountain-gray-200 text-fountain-gray-500'}`}>{i}</div>
            {i < 4 && <div className={`absolute top-3 left-1/2 w-full h-0.5 ${step > i ? 'bg-fountain-blue' : 'bg-fountain-gray-200'}`} />}
          </div>
        ))}
      </div>
      <div className="text-center text-xs font-medium text-fountain-gray-500 uppercase tracking-wider">
        {step === 1 && 'Select Product'}{step === 2 && 'Loan Details'}{step === 3 && 'Guarantors'}{step === 4 && 'Review & Submit'}
      </div>

      {step === 1 && (
        <div className="space-y-3 animate-in slide-in-from-right-4">
          {products.map((prod) => (
            <button key={prod.id} onClick={() => setSelectedProduct(prod.id)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedProduct === prod.id ? 'border-fountain-blue bg-fountain-blue/5' : 'border-fountain-gray-200 bg-white hover:border-fountain-blue/50'}`}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-fountain-gray-900">{prod.name}</h3>
                {selectedProduct === prod.id && <CheckCircleIcon className="w-5 h-5 text-fountain-blue" />}
              </div>
              <p className="text-xs text-fountain-gray-500 mb-2">Up to {formatNaira(prod.max)}</p>
              <div className="flex items-center space-x-3 text-xs font-medium text-fountain-gray-600 bg-white p-2 rounded-lg border border-fountain-gray-100">
                <span>{prod.rate}</span><span>•</span><span>{prod.tenure} max</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5 animate-in slide-in-from-right-4">
          <div className="bg-white p-5 rounded-xl border border-fountain-gray-200 shadow-sm">
            <label className="block text-sm font-medium text-fountain-gray-700 mb-2">How much do you need?</label>
            <p className="text-3xl font-bold text-fountain-gray-900 mb-4 text-center">{formatNaira(amount)}</p>
            <input type="range" min="50000" max="2000000" step="50000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full h-2 bg-fountain-gray-200 rounded-lg appearance-none cursor-pointer accent-fountain-blue" />
            <div className="flex justify-between text-xs text-fountain-gray-400 mt-2"><span>₦50K</span><span>₦2M Max</span></div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fountain-gray-700 mb-1">Loan Purpose</label>
              <select className="w-full p-3 bg-white border border-fountain-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-fountain-blue/50 outline-none">
                <option>Select purpose...</option><option>Business Expansion</option><option>School Fees</option><option>Medical Emergency</option><option>Asset Purchase</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-fountain-gray-700 mb-1">Preferred Tenure</label>
              <select className="w-full p-3 bg-white border border-fountain-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-fountain-blue/50 outline-none">
                <option>12 Months</option><option>9 Months</option><option>6 Months</option><option>3 Months</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-in slide-in-from-right-4">
          <div className="bg-fountain-blue/10 p-4 rounded-xl flex items-start space-x-3">
            <ShieldCheckIcon className="w-5 h-5 text-fountain-blue flex-shrink-0 mt-0.5" />
            <p className="text-xs text-fountain-blue font-medium leading-relaxed">This loan amount requires 2 guarantors who are active members of Fountain Coop with sufficient savings.</p>
          </div>
          {[1, 2].map((n) => (
            <div key={n} className="bg-white p-4 rounded-xl border border-fountain-gray-200 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-fountain-gray-900 border-b border-fountain-gray-100 pb-2">Guarantor {n}</h4>
              <input type="text" placeholder={`Member ID (e.g. FC-10${40 + n})`} className="w-full p-3 bg-fountain-gray-50 border border-fountain-gray-200 rounded-lg text-sm outline-none focus:border-fountain-blue" />
              <input type="text" placeholder="Full Name" className="w-full p-3 bg-fountain-gray-50 border border-fountain-gray-200 rounded-lg text-sm outline-none focus:border-fountain-blue" />
            </div>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 animate-in slide-in-from-right-4">
          <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-fountain-gray-50 border-b border-fountain-gray-200"><h3 className="font-bold text-fountain-gray-900">Application Summary</h3></div>
            <div className="divide-y divide-fountain-gray-100">
              <div className="p-4 flex justify-between"><span className="text-sm text-fountain-gray-500">Product</span><span className="text-sm font-medium text-fountain-gray-900">Regular Loan</span></div>
              <div className="p-4 flex justify-between"><span className="text-sm text-fountain-gray-500">Amount</span><span className="text-sm font-bold text-fountain-gray-900">{formatNaira(amount)}</span></div>
              <div className="p-4 flex justify-between"><span className="text-sm text-fountain-gray-500">Tenure</span><span className="text-sm font-medium text-fountain-gray-900">12 Months</span></div>
              <div className="p-4 flex justify-between"><span className="text-sm text-fountain-gray-500">Interest Rate</span><span className="text-sm font-medium text-fountain-gray-900">1.5% Monthly</span></div>
              <div className="p-4 flex justify-between bg-fountain-blue/5"><span className="text-sm font-medium text-fountain-blue">Est. Monthly Repayment</span><span className="text-sm font-bold text-fountain-blue">{formatNaira(Number(amount) / 12 * 1.015)}</span></div>
            </div>
          </div>
          <label className="flex items-start space-x-3 p-4 bg-white border border-fountain-gray-200 rounded-xl">
            <input type="checkbox" className="mt-1 w-4 h-4 text-fountain-blue rounded border-fountain-gray-300 focus:ring-fountain-blue" />
            <span className="text-xs text-fountain-gray-600 leading-relaxed">I confirm that the information provided is accurate. I authorize Fountain Coop to review my savings history and contact my guarantors.</span>
          </label>
        </div>
      )}

      <div className="pt-4">
        <button onClick={() => setStep(step + 1)} disabled={step === 1 && !selectedProduct} className="w-full py-3.5 bg-fountain-blue text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fountain-blue/25">
          {step === 4 ? 'Submit Application' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
