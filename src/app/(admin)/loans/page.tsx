'use client';

import { useMemo } from 'react';
import {
  HandCoinsIcon,
  FileTextIcon,
  ClockIcon,
  ArrowUpRightIcon,
  SearchIcon,
  FilterIcon,
  PlusIcon,
  Trash2,
} from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickNum, pickStr } from '@/lib/pickData';

export default function LoansPage() {
  const products = useOperationalRecords('loans', 'loanProduct');
  const applications = useOperationalRecords('loans', 'loanApplication');
  const active = useOperationalRecords('loans', 'activeLoan');

  const formatNaira = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': case 'Current': return <Badge variant="success" size="sm">{status}</Badge>;
      case 'Pending': case 'Under Review': return <Badge variant="warning" size="sm">{status}</Badge>;
      case 'Rejected': case 'Overdue': return <Badge variant="danger" size="sm">{status}</Badge>;
      case 'Disbursed': case 'Restructured': return <Badge variant="info" size="sm">{status}</Badge>;
      default: return <Badge size="sm">{status}</Badge>;
    }
  };

  const loanBook = useMemo(() => active.items.reduce((s, r) => s + pickNum(r.data, 'outstanding'), 0), [active.items]);
  const pendingApps = applications.items.filter((a) => pickStr(a.data, 'status') === 'Pending' || pickStr(a.data, 'status') === 'Under Review').length;
  const disbursedMonth = useMemo(() => active.items.reduce((s, r) => s + pickNum(r.data, 'disbursedThisMonth'), 0), [active.items]);
  const loadError = products.error || applications.error || active.error;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fountain-gray-900">Loan Management</h2>
          <p className="text-fountain-gray-600 mt-1">Manage loan products, applications, and active portfolio.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={products.loading} onClick={() => void products.createRow('loanProduct', { name: 'New product', maxAmount: 500000, tenure: '12 months', interestRate: '2% monthly', requirement: 'Savings history + guarantors' })} className="px-4 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <PlusIcon className="w-4 h-4 inline mr-1" />Product
          </button>
          <button type="button" disabled={applications.loading} onClick={() => void applications.createRow('loanApplication', { memberName: 'Applicant', memberId: 'FC-NEW', loanType: 'Regular', amount: 100000, appliedDate: new Date().toISOString().slice(0, 10), guarantors: '0/2', status: 'Pending' })} className="px-4 py-2 border border-fountain-gray-300 rounded-lg text-sm font-medium text-fountain-gray-700 hover:bg-fountain-gray-50">
            Application
          </button>
          <button type="button" disabled={active.loading} onClick={() => void active.createRow('activeLoan', { memberName: 'Borrower', memberId: 'FC-NEW', branch: '—', loanType: 'Regular', tenure: 12, principal: 0, outstanding: 0, nextPaymentDate: '—', nextPaymentAmount: 0, status: 'Current', daysOverdue: 0, disbursedThisMonth: 0 })} className="px-4 py-2 border border-fountain-gray-300 rounded-lg text-sm font-medium text-fountain-gray-700 hover:bg-fountain-gray-50">
            Active loan
          </button>
        </div>
      </div>

      {loadError ? <p className="text-sm text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-4 py-3">{loadError}</p> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Outstanding (active loans)" value={formatNaira(loanBook)} icon={<HandCoinsIcon className="w-6 h-6" />} iconBgColor="bg-fountain-teal/10" iconColor="text-fountain-teal" />
        <KPICard title="Active Loans" value={String(active.items.length)} icon={<FileTextIcon className="w-6 h-6" />} iconBgColor="bg-fountain-blue/10" iconColor="text-fountain-blue" />
        <KPICard title="Pending Applications" value={String(pendingApps)} icon={<ClockIcon className="w-6 h-6" />} iconBgColor="bg-fountain-amber/10" iconColor="text-fountain-amber" />
        <KPICard title="Disbursed (rows, month field)" value={formatNaira(disbursedMonth)} icon={<ArrowUpRightIcon className="w-6 h-6" />} iconBgColor="bg-fountain-green/10" iconColor="text-fountain-green" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-fountain-gray-900 mb-4">Loan Products</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {products.items.map((row) => {
            const product = row.data;
            return (
              <Card key={row.id} className="flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="text-base font-bold text-fountain-gray-900">{pickStr(product, 'name', 'Product')}</h4>
                    <button type="button" onClick={() => void products.removeRow(row.id)} className="text-fountain-gray-400 hover:text-fountain-red p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-fountain-gray-500">Max Amount:</span><span className="font-medium text-fountain-gray-900">{formatNaira(pickNum(product, 'maxAmount'))}</span></div>
                    <div className="flex justify-between"><span className="text-fountain-gray-500">Tenure:</span><span className="font-medium text-fountain-gray-900">{pickStr(product, 'tenure')}</span></div>
                    <div className="flex justify-between"><span className="text-fountain-gray-500">Interest:</span><span className="font-medium text-fountain-gray-900">{pickStr(product, 'interestRate')}</span></div>
                    <div className="mt-3 pt-3 border-t border-fountain-gray-100"><p className="text-xs text-fountain-gray-500">{pickStr(product, 'requirement')}</p></div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        {!products.loading && !products.items.length ? <p className="text-sm text-fountain-gray-500 mt-2">No products yet.</p> : null}
      </div>

      <Card title="Applications Pipeline" headerAction={
        <button type="button" disabled={applications.loading} onClick={() => void applications.createRow('loanApplication', { memberName: 'Applicant', memberId: 'FC-NEW', loanType: 'Regular', amount: 250000, appliedDate: new Date().toISOString().slice(0, 10), guarantors: '1/2', status: 'Under Review' })} className="text-xs font-medium text-fountain-blue hover:text-fountain-dark">
          + Add
        </button>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium">Applicant</th>
                <th className="px-4 py-3 font-medium">Loan Type</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Applied</th>
                <th className="px-4 py-3 font-medium">Guarantors</th>
                <th className="px-4 py-3 font-medium">Collateral</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fountain-gray-100">
              {applications.items.map((row) => {
                const app = row.data;
                return (
                  <tr key={row.id} className="hover:bg-fountain-gray-50">
                    <td className="px-4 py-3"><p className="font-medium text-fountain-gray-900">{pickStr(app, 'memberName')}</p><p className="text-xs text-fountain-gray-500">{pickStr(app, 'memberId')}</p></td>
                    <td className="px-4 py-3 text-fountain-gray-600">{pickStr(app, 'loanType')}</td>
                    <td className="px-4 py-3 font-medium text-fountain-gray-900">{formatNaira(pickNum(app, 'amount'))}</td>
                    <td className="px-4 py-3 text-fountain-gray-600">{pickStr(app, 'appliedDate')}</td>
                    <td className="px-4 py-3 text-fountain-gray-600">{pickStr(app, 'guarantors')}</td>
                    <td className="px-4 py-3 text-fountain-gray-600 max-w-[200px]">
                      {app.requiresCollateral === true || pickNum(app, 'amount') > 1_000_000 ? (
                        <span className="text-xs">
                          {pickStr(app, 'collateralDescription', '—')}
                          {pickNum(app, 'collateralValue') > 0 ? (
                            <span className="block text-fountain-gray-500 mt-0.5">
                              {formatNaira(pickNum(app, 'collateralValue'))}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(pickStr(app, 'status', 'Pending'))}</td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button type="button" className="text-fountain-blue hover:text-fountain-dark text-xs font-medium" onClick={() => void applications.patchRow(row.id, { status: 'Approved' })}>Approve</button>
                      <button type="button" className="text-xs text-fountain-red hover:underline" onClick={() => void applications.patchRow(row.id, { status: 'Rejected' })}>Reject</button>
                      <button type="button" className="text-fountain-gray-400 hover:text-fountain-red p-1" onClick={() => void applications.removeRow(row.id)}><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!applications.loading && !applications.items.length ? <p className="text-sm text-fountain-gray-500 p-4">No applications.</p> : null}
        </div>
      </Card>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-fountain-gray-900">Active Loans</h3>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <SearchIcon className="w-4 h-4 text-fountain-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input type="text" placeholder="Search loans..." className="pl-9 pr-4 py-2 bg-white border border-fountain-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fountain-blue/50" />
            </div>
            <button type="button" className="p-2 bg-white border border-fountain-gray-200 text-fountain-gray-600 rounded-lg hover:bg-fountain-gray-50"><FilterIcon className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Borrower</th>
                  <th className="px-6 py-4 font-medium">Loan Details</th>
                  <th className="px-6 py-4 font-medium text-right">Principal</th>
                  <th className="px-6 py-4 font-medium text-right">Outstanding</th>
                  <th className="px-6 py-4 font-medium">Next Payment</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fountain-gray-100">
                {active.items.map((row) => {
                  const loan = row.data;
                  const name = pickStr(loan, 'memberName', 'Borrower');
                  return (
                    <tr key={row.id} className="hover:bg-fountain-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-fountain-blue/10 text-fountain-blue flex items-center justify-center font-bold text-xs">{name.split(' ').map((n) => n[0]).join('').slice(0, 3)}</div>
                          <div>
                            <p className="font-medium text-fountain-gray-900">{name}</p>
                            <p className="text-xs text-fountain-gray-500">{pickStr(loan, 'memberId')} • {pickStr(loan, 'branch')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><p className="text-fountain-gray-900">{pickStr(loan, 'loanType')}</p><p className="text-xs text-fountain-gray-500">{pickNum(loan, 'tenure')} months</p></td>
                      <td className="px-6 py-4 text-right font-medium text-fountain-gray-900">{formatNaira(pickNum(loan, 'principal'))}</td>
                      <td className="px-6 py-4 text-right font-medium text-fountain-gray-900">{formatNaira(pickNum(loan, 'outstanding'))}</td>
                      <td className="px-6 py-4"><p className="text-fountain-gray-900">{pickStr(loan, 'nextPaymentDate')}</p><p className="text-xs text-fountain-gray-500">{formatNaira(pickNum(loan, 'nextPaymentAmount'))}</p></td>
                      <td className="px-6 py-4">
                        {getStatusBadge(pickStr(loan, 'status', 'Current'))}
                        {pickNum(loan, 'daysOverdue') > 0 ? <span className="text-[10px] text-fountain-red mt-1 font-medium block">{pickNum(loan, 'daysOverdue')} days late</span> : null}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button type="button" className="text-fountain-gray-400 hover:text-fountain-red p-1" onClick={() => void active.removeRow(row.id)}><Trash2 className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!active.loading && !active.items.length ? <p className="text-sm text-fountain-gray-500 p-6 text-center">No active loans yet.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
