'use client';

import { ArrowDownLeftIcon, ArrowUpRightIcon, FilterIcon } from 'lucide-react';

export default function MemberActivityPage() {
  const formatNaira = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

  const transactions = [
    { id: 1, type: 'credit', label: 'Savings Deposit', category: 'Cooperative', amount: 50000, date: 'Mar 26, 2026', time: '2:32 PM', ref: 'SAV-26032601' },
    { id: 2, type: 'credit', label: 'Thrift Contribution', category: 'Thrift', amount: 500, date: 'Mar 26, 2026', time: '8:00 AM', ref: 'THR-26032601' },
    { id: 3, type: 'credit', label: 'Ajo Payout Received', category: 'Ajo/Osusu', amount: 600000, date: 'Mar 25, 2026', time: '10:05 AM', ref: 'AJO-25032601' },
    { id: 4, type: 'credit', label: 'Thrift Contribution', category: 'Thrift', amount: 500, date: 'Mar 25, 2026', time: '8:00 AM', ref: 'THR-25032601' },
    { id: 5, type: 'credit', label: 'Thrift Contribution', category: 'Thrift', amount: 500, date: 'Mar 24, 2026', time: '8:00 AM', ref: 'THR-24032601' },
    { id: 6, type: 'credit', label: 'Savings Deposit', category: 'Cooperative', amount: 50000, date: 'Mar 1, 2026', time: '9:15 AM', ref: 'SAV-01032601' },
    { id: 7, type: 'credit', label: 'Ajo Contribution', category: 'Ajo/Osusu', amount: 50000, date: 'Mar 1, 2026', time: '9:20 AM', ref: 'AJO-01032601' },
    { id: 8, type: 'credit', label: 'Thrift Contribution', category: 'Thrift', amount: 500, date: 'Mar 23, 2026', time: '8:00 AM', ref: 'THR-23032601' },
    { id: 9, type: 'credit', label: 'Savings Deposit', category: 'Cooperative', amount: 50000, date: 'Feb 1, 2026', time: '10:00 AM', ref: 'SAV-01022601' },
    { id: 10, type: 'credit', label: 'Ajo Contribution', category: 'Ajo/Osusu', amount: 50000, date: 'Feb 1, 2026', time: '10:05 AM', ref: 'AJO-01022601' },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Cooperative': return 'bg-fountain-green/10 text-fountain-green';
      case 'Thrift': return 'bg-fountain-teal/10 text-fountain-teal';
      case 'Ajo/Osusu': return 'bg-fountain-amber/10 text-fountain-amber';
      case 'Loans': return 'bg-fountain-blue/10 text-fountain-blue';
      default: return 'bg-fountain-gray-100 text-fountain-gray-600';
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-fountain-gray-900">Activity</h2>
        <button className="p-2 bg-white border border-fountain-gray-200 rounded-lg text-fountain-gray-600 hover:bg-fountain-gray-50">
          <FilterIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4 text-center">
          <ArrowDownLeftIcon className="w-5 h-5 text-fountain-green mx-auto mb-1" />
          <p className="text-xs text-fountain-gray-500">Total In</p>
          <p className="text-lg font-bold text-fountain-green">{formatNaira(914000)}</p>
        </div>
        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4 text-center">
          <ArrowUpRightIcon className="w-5 h-5 text-fountain-gray-400 mx-auto mb-1" />
          <p className="text-xs text-fountain-gray-500">Total Out</p>
          <p className="text-lg font-bold text-fountain-gray-900">{formatNaira(0)}</p>
        </div>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-1">
        {['All', 'Cooperative', 'Thrift', 'Ajo/Osusu', 'Loans'].map((filter, idx) => (
          <button key={filter} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${idx === 0 ? 'bg-fountain-blue text-white' : 'bg-white border border-fountain-gray-200 text-fountain-gray-600 hover:bg-fountain-gray-50'}`}>
            {filter}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm divide-y divide-fountain-gray-100">
        {transactions.map((txn) => (
          <div key={txn.id} className="p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-3">
                <div className={`p-1.5 rounded-lg ${getCategoryColor(txn.category)}`}>
                  {txn.type === 'credit' ? <ArrowDownLeftIcon className="w-4 h-4" /> : <ArrowUpRightIcon className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-fountain-gray-900">{txn.label}</p>
                  <p className="text-[10px] text-fountain-gray-400">{txn.date} • {txn.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${txn.type === 'credit' ? 'text-fountain-green' : 'text-fountain-red'}`}>
                  {txn.type === 'credit' ? '+' : '-'}{formatNaira(txn.amount)}
                </p>
                <p className="text-[10px] text-fountain-gray-400 font-mono">{txn.ref}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
