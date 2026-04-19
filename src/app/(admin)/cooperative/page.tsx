'use client';

import { useMemo } from 'react';
import {
  PiggyBankIcon,
  UsersIcon,
  ArrowUpRightIcon,
  ClockIcon,
  SearchIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  Trash2,
} from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SavingsGrowthChart } from '@/components/cooperative/SavingsGrowthChart';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickNum, pickStr } from '@/lib/pickData';

export default function CooperativePage() {
  const plans = useOperationalRecords('cooperative', 'savingsPlan');
  const memberRows = useOperationalRecords('cooperative', 'memberSaving');
  const withdrawals = useOperationalRecords('cooperative', 'withdrawalRequest');
  const chartRows = useOperationalRecords('cooperative', 'coopChart');

  const formatNaira = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

  const chartData = useMemo(
    () => chartRows.items.map((row) => ({ month: pickStr(row.data, 'month'), totalSavings: pickNum(row.data, 'totalSavings'), contributions: pickNum(row.data, 'contributions') })).filter((p) => p.month),
    [chartRows.items]
  );
  const totalSavings = useMemo(() => memberRows.items.reduce((s, r) => s + pickNum(r.data, 'currentBalance'), 0), [memberRows.items]);
  const activeSavers = memberRows.items.length;
  const monthlyContributions = useMemo(() => memberRows.items.reduce((s, r) => s + pickNum(r.data, 'monthlyTarget'), 0), [memberRows.items]);
  const pendingWithdrawals = useMemo(() => withdrawals.items.filter((w) => pickStr(w.data, 'status', 'Pending') === 'Pending').length, [withdrawals.items]);
  const loadError = plans.error || memberRows.error || withdrawals.error || chartRows.error;

  const getSavingsStatusBadge = (status: string) => {
    switch (status) {
      case 'On Track': return <Badge variant="success" size="sm">{status}</Badge>;
      case 'Behind': return <Badge variant="warning" size="sm">{status}</Badge>;
      case 'Missed': return <Badge variant="danger" size="sm">{status}</Badge>;
      default: return <Badge size="sm">{status}</Badge>;
    }
  };

  const getWithdrawalStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <Badge variant="warning" size="sm">{status}</Badge>;
      case 'Approved': return <Badge variant="success" size="sm">{status}</Badge>;
      case 'Rejected': return <Badge variant="danger" size="sm">{status}</Badge>;
      default: return <Badge size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-2xl font-bold text-fountain-gray-900">Cooperative Savings</h2>
        <p className="text-fountain-gray-600 mt-1">Manage long-term structured member savings and contribution records.</p>
      </div>

      {loadError ? <p className="text-sm text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-4 py-3">{loadError}</p> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Savings" value={formatNaira(totalSavings)} icon={<PiggyBankIcon className="w-6 h-6" />} iconBgColor="bg-fountain-green/10" iconColor="text-fountain-green" />
        <KPICard title="Active Savers" value={activeSavers.toLocaleString()} icon={<UsersIcon className="w-6 h-6" />} iconBgColor="bg-fountain-blue/10" iconColor="text-fountain-blue" />
        <KPICard title="Monthly Contributions (targets)" value={formatNaira(monthlyContributions)} icon={<ArrowUpRightIcon className="w-6 h-6" />} iconBgColor="bg-fountain-teal/10" iconColor="text-fountain-teal" />
        <KPICard title="Pending Withdrawals" value={String(pendingWithdrawals)} icon={<ClockIcon className="w-6 h-6" />} iconBgColor="bg-fountain-amber/10" iconColor="text-fountain-amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Savings Growth Trend" headerAction={
            <button type="button" disabled={chartRows.loading} onClick={() => void chartRows.createRow('coopChart', { month: `M${chartRows.items.length + 1}`, totalSavings: 0, contributions: 0 })} className="inline-flex items-center gap-1 text-xs font-medium text-fountain-blue hover:text-fountain-dark">
              <PlusIcon className="w-3.5 h-3.5" />Add point
            </button>
          }>
            <SavingsGrowthChart data={chartData} />
            {chartRows.items.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {chartRows.items.map((row) => (
                  <button key={row.id} type="button" title="Remove data point" onClick={() => void chartRows.removeRow(row.id)} className="text-xs px-2 py-1 rounded border border-fountain-gray-200 text-fountain-gray-600 hover:bg-fountain-red/10 hover:text-fountain-red">
                    {pickStr(row.data, 'month') || row.id.slice(0, 6)}
                  </button>
                ))}
              </div>
            ) : null}
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card title="Savings Plans" className="h-full" headerAction={
            <button type="button" disabled={plans.loading} onClick={() => void plans.createRow('savingsPlan', { name: 'New savings plan', description: 'Describe eligibility and rules.', monthlyTarget: 10000, members: 0, lockPeriod: '12 mo' })} className="inline-flex items-center gap-1 text-xs font-medium text-fountain-blue hover:text-fountain-dark">
              <PlusIcon className="w-3.5 h-3.5" />Add
            </button>
          }>
            <div className="space-y-3">
              {plans.loading && !plans.items.length ? <p className="text-sm text-fountain-gray-500">Loading…</p> : null}
              {!plans.loading && !plans.items.length ? <p className="text-sm text-fountain-gray-500">No plans yet. Use Add to create a catalog entry.</p> : null}
              {plans.items.map((row) => {
                const d = row.data;
                return (
                  <div key={row.id} className="p-3 bg-fountain-gray-50 rounded-lg border border-fountain-gray-200 flex justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h4 className="font-semibold text-sm text-fountain-gray-900 truncate">{pickStr(d, 'name', 'Plan')}</h4>
                        <span className="text-xs font-bold text-fountain-green shrink-0">{formatNaira(pickNum(d, 'monthlyTarget'))}/mo</span>
                      </div>
                      <p className="text-xs text-fountain-gray-500 mb-2 line-clamp-2">{pickStr(d, 'description')}</p>
                      <div className="flex justify-between text-xs text-fountain-gray-600">
                        <span>{pickNum(d, 'members').toLocaleString()} members</span>
                        <span>Lock: {pickStr(d, 'lockPeriod', '—')}</span>
                      </div>
                    </div>
                    <button type="button" title="Delete plan" onClick={() => void plans.removeRow(row.id)} className="p-1.5 text-fountain-gray-400 hover:text-fountain-red shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-fountain-gray-900">Member Savings</h3>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <SearchIcon className="w-4 h-4 text-fountain-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input type="text" placeholder="Search members..." className="pl-9 pr-4 py-2 bg-white border border-fountain-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fountain-blue/50" />
            </div>
            <button type="button" disabled={memberRows.loading} onClick={() => void memberRows.createRow('memberSaving', { memberName: 'New member', memberId: 'FC-NEW', branch: '—', plan: 'Standard', monthlyTarget: 5000, currentBalance: 0, monthsActive: 0, lastContribution: '—', status: 'On Track' })} className="inline-flex items-center gap-1 px-3 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <PlusIcon className="w-4 h-4" />Add row
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Member</th>
                  <th className="px-6 py-4 font-medium">Plan</th>
                  <th className="px-6 py-4 font-medium text-right">Monthly Target</th>
                  <th className="px-6 py-4 font-medium text-right">Current Balance</th>
                  <th className="px-6 py-4 font-medium">Months Active</th>
                  <th className="px-6 py-4 font-medium">Last Contribution</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fountain-gray-100">
                {memberRows.items.map((row) => {
                  const ms = row.data;
                  const name = pickStr(ms, 'memberName', 'Member');
                  const initials = name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 3);
                  return (
                    <tr key={row.id} className="hover:bg-fountain-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-fountain-green/10 text-fountain-green flex items-center justify-center font-bold text-xs">{initials || '?'}</div>
                          <div>
                            <p className="font-medium text-fountain-gray-900">{name}</p>
                            <p className="text-xs text-fountain-gray-500">{pickStr(ms, 'memberId')} • {pickStr(ms, 'branch')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-fountain-gray-600">{pickStr(ms, 'plan')}</td>
                      <td className="px-6 py-4 text-right text-fountain-gray-900">{formatNaira(pickNum(ms, 'monthlyTarget'))}</td>
                      <td className="px-6 py-4 text-right font-bold text-fountain-gray-900">{formatNaira(pickNum(ms, 'currentBalance'))}</td>
                      <td className="px-6 py-4 text-fountain-gray-600">{pickNum(ms, 'monthsActive')} months</td>
                      <td className="px-6 py-4 text-fountain-gray-600">{pickStr(ms, 'lastContribution')}</td>
                      <td className="px-6 py-4">{getSavingsStatusBadge(pickStr(ms, 'status', 'On Track'))}</td>
                      <td className="px-6 py-4 text-center">
                        <button type="button" title="Delete row" onClick={() => void memberRows.removeRow(row.id)} className="text-fountain-gray-400 hover:text-fountain-red transition-colors p-1">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!memberRows.loading && !memberRows.items.length ? <p className="text-sm text-fountain-gray-500 p-6 text-center">No member savings rows yet.</p> : null}
          </div>
        </div>
      </div>

      <Card title="Withdrawal Requests" headerAction={
        <div className="flex items-center gap-2">
          <Badge variant="warning" size="sm">{pendingWithdrawals} Pending</Badge>
          <button type="button" disabled={withdrawals.loading} onClick={() => void withdrawals.createRow('withdrawalRequest', { memberName: 'Member', status: 'Pending', reason: 'Withdrawal request', requestDate: new Date().toISOString().slice(0, 10), amount: 0 })} className="inline-flex items-center gap-1 text-xs font-medium text-fountain-blue hover:text-fountain-dark">
            <PlusIcon className="w-3.5 h-3.5" />New
          </button>
        </div>
      }>
        <div className="space-y-3">
          {!withdrawals.items.length ? <p className="text-sm text-fountain-gray-500">No withdrawal requests.</p> : null}
          {withdrawals.items.map((row) => {
            const wr = row.data;
            const status = pickStr(wr, 'status', 'Pending');
            return (
              <div key={row.id} className="flex items-center justify-between p-4 bg-fountain-gray-50 rounded-lg border border-fountain-gray-200 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <p className="font-medium text-fountain-gray-900">{pickStr(wr, 'memberName')}</p>
                    {getWithdrawalStatusBadge(status)}
                  </div>
                  <p className="text-xs text-fountain-gray-500 mt-1">{pickStr(wr, 'reason')} • Requested {pickStr(wr, 'requestDate')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-fountain-gray-900">{formatNaira(pickNum(wr, 'amount'))}</p>
                  {status === 'Pending' ? (
                    <div className="flex gap-2 mt-2 justify-end">
                      <button type="button" className="p-1 text-fountain-green hover:bg-fountain-green/10 rounded transition-colors" title="Approve" onClick={() => void withdrawals.patchRow(row.id, { status: 'Approved' })}>
                        <CheckCircleIcon className="w-5 h-5" />
                      </button>
                      <button type="button" className="p-1 text-fountain-red hover:bg-fountain-red/10 rounded transition-colors" title="Reject" onClick={() => void withdrawals.patchRow(row.id, { status: 'Rejected' })}>
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ) : null}
                  <button type="button" className="mt-2 text-xs text-fountain-gray-500 hover:text-fountain-red" onClick={() => void withdrawals.removeRow(row.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
