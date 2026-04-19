'use client';

import { useMemo } from 'react';
import {
  ArrowLeftRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  PlusIcon,
  Trash2,
} from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickNum, pickStr } from '@/lib/pickData';

export default function TransactionsPage() {
  const ledger = useOperationalRecords('transactions', 'ledgerEntry');

  const formatNaira = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Cooperative': return 'bg-fountain-blue/10 text-fountain-blue border-fountain-blue/20';
      case 'Loans': return 'bg-fountain-teal/10 text-fountain-teal border-fountain-teal/20';
      case 'Thrift': return 'bg-fountain-green/10 text-fountain-green border-fountain-green/20';
      case 'Ajo/Osusu': return 'bg-fountain-amber/10 text-fountain-amber border-fountain-amber/20';
      case 'Packs': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Recovery': return 'bg-fountain-red/10 text-fountain-red border-fountain-red/20';
      default: return 'bg-fountain-gray-100 text-fountain-gray-600 border-fountain-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <Badge variant="success" size="sm">{status}</Badge>;
      case 'Pending': return <Badge variant="warning" size="sm">{status}</Badge>;
      case 'Reversed': return <Badge variant="danger" size="sm">{status}</Badge>;
      default: return <Badge size="sm">{status}</Badge>;
    }
  };

  const credits = useMemo(() => ledger.items.filter((t) => pickStr(t.data, 'direction') === 'credit').reduce((s, t) => s + pickNum(t.data, 'amount'), 0), [ledger.items]);
  const debits = useMemo(() => ledger.items.filter((t) => pickStr(t.data, 'direction') === 'debit').reduce((s, t) => s + pickNum(t.data, 'amount'), 0), [ledger.items]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fountain-gray-900">Transactions Ledger</h2>
          <p className="text-fountain-gray-600 mt-1">Unified ledger sourced from live operational records.</p>
        </div>
        <button type="button" disabled={ledger.loading} onClick={() => void ledger.createRow('ledgerEntry', { idLabel: `TXN-${Date.now()}`, date: new Date().toISOString().slice(0, 16).replace('T', ' '), member: 'Member', memberId: 'FC-NEW', type: 'Adjustment', category: 'Cooperative', amount: 0, direction: 'credit', branch: '—', reference: `REF-${Date.now()}`, status: 'Completed' })} className="inline-flex items-center gap-2 px-4 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <PlusIcon className="w-4 h-4" />New entry
        </button>
      </div>

      {ledger.error ? <p className="text-sm text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-4 py-3">{ledger.error}</p> : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Ledger rows" value={String(ledger.items.length)} icon={<ArrowLeftRightIcon className="w-6 h-6" />} />
        <KPICard title="Credits (sum)" value={formatNaira(credits)} icon={<ArrowUpIcon className="w-6 h-6" />} iconBgColor="bg-fountain-green/10" iconColor="text-fountain-green" />
        <KPICard title="Debits (sum)" value={formatNaira(debits)} icon={<ArrowDownIcon className="w-6 h-6" />} iconBgColor="bg-fountain-red/10" iconColor="text-fountain-red" />
      </div>

      <Card title="Filters">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="w-4 h-4 text-fountain-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search reference, member..." className="w-full pl-9 pr-4 py-2 border border-fountain-gray-200 rounded-lg text-sm" />
          </div>
          <button type="button" className="p-2 border border-fountain-gray-200 rounded-lg text-fountain-gray-600 hover:bg-fountain-gray-50"><FilterIcon className="w-5 h-5" /></button>
          <button type="button" className="inline-flex items-center gap-2 px-4 py-2 border border-fountain-gray-300 rounded-lg text-sm font-medium text-fountain-gray-700 hover:bg-fountain-gray-50"><DownloadIcon className="w-4 h-4" />Export CSV</button>
        </div>
      </Card>

      <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">Reference</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Member</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-center"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fountain-gray-100">
              {ledger.items.map((row) => {
                const t = row.data;
                const dir = pickStr(t, 'direction', 'credit');
                const cat = pickStr(t, 'category', 'Cooperative');
                return (
                  <tr key={row.id} className="hover:bg-fountain-gray-50">
                    <td className="px-6 py-4 font-mono text-xs">{pickStr(t, 'reference', row.id.slice(0, 8))}</td>
                    <td className="px-6 py-4 text-fountain-gray-600">{pickStr(t, 'date')}</td>
                    <td className="px-6 py-4"><p className="font-medium text-fountain-gray-900">{pickStr(t, 'member')}</p><p className="text-xs text-fountain-gray-500">{pickStr(t, 'memberId')}</p></td>
                    <td className="px-6 py-4 text-fountain-gray-700">{pickStr(t, 'type')}</td>
                    <td className="px-6 py-4"><span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getCategoryColor(cat)}`}>{cat}</span></td>
                    <td className={`px-6 py-4 text-right font-bold ${dir === 'credit' ? 'text-fountain-green' : 'text-fountain-red'}`}>{dir === 'credit' ? '+' : '-'}{formatNaira(pickNum(t, 'amount'))}</td>
                    <td className="px-6 py-4">{getStatusBadge(pickStr(t, 'status', 'Completed'))}</td>
                    <td className="px-6 py-4 text-center"><button type="button" className="text-fountain-gray-400 hover:text-fountain-red p-1" onClick={() => void ledger.removeRow(row.id)}><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!ledger.loading && !ledger.items.length ? <p className="text-sm text-fountain-gray-500 p-6 text-center">No transactions yet.</p> : null}
        </div>
      </div>
    </div>
  );
}
