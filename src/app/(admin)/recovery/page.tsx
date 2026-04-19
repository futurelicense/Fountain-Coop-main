'use client';

import { useMemo } from 'react';
import {
  AlertTriangleIcon,
  FolderOpenIcon,
  TrendingUpIcon,
  TargetIcon,
  CalendarIcon,
  SearchIcon,
  FilterIcon,
  PhoneIcon,
  PlusIcon,
  Trash2,
} from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  AgingBuckets,
  type AgingBucketsSnapshot,
  type AgingBucketSlice,
} from '@/components/recovery/AgingBuckets';
import { RecoveryTrendChart } from '@/components/recovery/RecoveryTrendChart';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickNum, pickObj, pickStr } from '@/lib/pickData';

function sliceFrom(d: Record<string, unknown>, key: string): AgingBucketSlice {
  const o = pickObj(d, key);
  if (!o) return { count: 0, amount: 0 };
  return { count: pickNum(o, 'count'), amount: pickNum(o, 'amount') };
}

function parseAgingSnapshot(d: Record<string, unknown>): AgingBucketsSnapshot {
  return {
    current: sliceFrom(d, 'current'),
    bucket1_30: sliceFrom(d, 'bucket1_30'),
    bucket31_60: sliceFrom(d, 'bucket31_60'),
    bucket61_90: sliceFrom(d, 'bucket61_90'),
    bucket90plus: sliceFrom(d, 'bucket90plus'),
  };
}

export default function RecoveryPage() {
  const cases = useOperationalRecords('recovery', 'recoveryCase');
  const officers = useOperationalRecords('recovery', 'recoveryOfficer');
  const ptp = useOperationalRecords('recovery', 'promiseToPay');
  const trendRows = useOperationalRecords('recovery', 'recoveryTrend');
  const agingRows = useOperationalRecords('recovery', 'agingSnapshot');

  const formatNaira = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

  const agingSnapshot = useMemo(() => {
    const row = agingRows.items[0];
    if (!row) return null;
    return parseAgingSnapshot(row.data);
  }, [agingRows.items]);

  const trendData = useMemo(
    () => trendRows.items.map((r) => ({ month: pickStr(r.data, 'month'), recovered: pickNum(r.data, 'recovered'), target: pickNum(r.data, 'target') })).filter((p) => p.month),
    [trendRows.items]
  );

  const totalOverdue = useMemo(() => cases.items.reduce((s, r) => s + pickNum(r.data, 'outstanding'), 0), [cases.items]);
  const activeCases = cases.items.filter((r) => { const st = pickStr(r.data, 'status'); return st && st !== 'Fulfilled'; }).length;
  const recoveredMonth = useMemo(() => cases.items.reduce((s, r) => s + pickNum(r.data, 'recoveredThisMonth'), 0), [cases.items]);
  const recoveryRate = useMemo(() => {
    const resolved = cases.items.filter((r) => pickStr(r.data, 'status') === 'Fulfilled').length;
    return Math.round((resolved / (cases.items.length || 1)) * 100);
  }, [cases.items]);
  const ptpDue = ptp.items.filter((r) => pickStr(r.data, 'status') !== 'Fulfilled').length;
  const loadError = cases.error || officers.error || ptp.error || trendRows.error || agingRows.error;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': case 'Pending': return <Badge variant="info" size="sm">{status}</Badge>;
      case 'Promise to Pay': return <Badge variant="warning" size="sm">{status}</Badge>;
      case 'Escalated': case 'Overdue': return <Badge variant="danger" size="sm">{status}</Badge>;
      case 'Guarantor Activated': return <Badge variant="neutral" size="sm">{status}</Badge>;
      case 'Restructured': case 'Fulfilled': return <Badge variant="success" size="sm">{status}</Badge>;
      default: return <Badge size="sm">{status}</Badge>;
    }
  };

  const getAgingBadgeColor = (bucket: string) => {
    switch (bucket) {
      case '1-30': return 'bg-fountain-blue/10 text-fountain-blue border-fountain-blue/20';
      case '31-60': return 'bg-fountain-amber/10 text-fountain-amber border-fountain-amber/20';
      case '61-90': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case '90+': return 'bg-fountain-red/10 text-fountain-red border-fountain-red/20';
      default: return 'bg-fountain-gray-100 text-fountain-gray-600 border-fountain-gray-200';
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-2xl font-bold text-fountain-gray-900">Recovery & Collections</h2>
        <p className="text-fountain-gray-600 mt-1">Monitor overdue obligations, aging buckets, and officer performance.</p>
      </div>

      {loadError ? <p className="text-sm text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-4 py-3">{loadError}</p> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard title="Total Overdue" value={formatNaira(totalOverdue)} icon={<AlertTriangleIcon className="w-6 h-6" />} iconBgColor="bg-fountain-red/10" iconColor="text-fountain-red" />
        <KPICard title="Active Cases" value={String(activeCases)} icon={<FolderOpenIcon className="w-6 h-6" />} iconBgColor="bg-fountain-amber/10" iconColor="text-fountain-amber" />
        <KPICard title="Recovered (case rows)" value={formatNaira(recoveredMonth)} icon={<TrendingUpIcon className="w-6 h-6" />} iconBgColor="bg-fountain-green/10" iconColor="text-fountain-green" />
        <KPICard title="Fulfilled rate" value={`${recoveryRate}%`} icon={<TargetIcon className="w-6 h-6" />} iconBgColor="bg-fountain-blue/10" iconColor="text-fountain-blue" />
        <KPICard title="Open PTP" value={String(ptpDue)} icon={<CalendarIcon className="w-6 h-6" />} iconBgColor="bg-fountain-teal/10" iconColor="text-fountain-teal" subtitle="promise-to-pay rows" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AgingBuckets snapshot={agingSnapshot} />
        <div className="space-y-3">
          <RecoveryTrendChart data={trendData} />
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={trendRows.loading} onClick={() => void trendRows.createRow('recoveryTrend', { month: `M${trendRows.items.length + 1}`, recovered: 0, target: 0 })} className="text-xs px-3 py-1.5 rounded-lg border border-fountain-gray-200 text-fountain-blue hover:bg-fountain-gray-50">Add trend point</button>
            {trendRows.items.map((row) => (
              <button key={row.id} type="button" onClick={() => void trendRows.removeRow(row.id)} className="text-xs px-2 py-1 rounded border border-fountain-gray-200 text-fountain-gray-600 hover:text-fountain-red">
                {pickStr(row.data, 'month') || row.id.slice(0, 6)} ×
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!agingRows.items.length ? (
          <button type="button" disabled={agingRows.loading} onClick={() => void agingRows.createRow('agingSnapshot', { current: { count: 0, amount: 0 }, bucket1_30: { count: 0, amount: 0 }, bucket31_60: { count: 0, amount: 0 }, bucket61_90: { count: 0, amount: 0 }, bucket90plus: { count: 0, amount: 0 } })} className="text-xs px-3 py-1.5 rounded-lg bg-fountain-blue text-white hover:bg-blue-700">
            Initialize aging snapshot
          </button>
        ) : (
          <button type="button" onClick={() => void agingRows.removeRow(agingRows.items[0].id)} className="text-xs px-3 py-1.5 rounded-lg border border-fountain-gray-200 text-fountain-gray-600 hover:text-fountain-red">Clear aging snapshot</button>
        )}
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-fountain-gray-900">Top Defaulters & Active Cases</h3>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <SearchIcon className="w-4 h-4 text-fountain-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input type="text" placeholder="Search cases..." className="pl-9 pr-4 py-2 bg-white border border-fountain-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fountain-blue/50" />
            </div>
            <button type="button" disabled={cases.loading} onClick={() => void cases.createRow('recoveryCase', { memberName: 'Member', branch: '—', loanType: 'Standard', outstanding: 0, originalAmount: 0, agingBucket: '1-30', daysOverdue: 0, assignedOfficer: 'Unassigned', lastContact: '—', status: 'Active', recoveredThisMonth: 0 })} className="inline-flex items-center gap-1 px-3 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <PlusIcon className="w-4 h-4" />Add case
            </button>
            <button type="button" className="p-2 bg-white border border-fountain-gray-200 text-fountain-gray-600 rounded-lg hover:bg-fountain-gray-50 transition-colors"><FilterIcon className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Member</th>
                  <th className="px-6 py-4 font-medium text-right">Outstanding</th>
                  <th className="px-6 py-4 font-medium">Aging</th>
                  <th className="px-6 py-4 font-medium">Assigned To</th>
                  <th className="px-6 py-4 font-medium">Last Contact</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fountain-gray-100">
                {cases.items.map((row) => {
                  const c = row.data;
                  const bucket = pickStr(c, 'agingBucket', '1-30');
                  return (
                    <tr key={row.id} className="hover:bg-fountain-gray-50 transition-colors">
                      <td className="px-6 py-4"><p className="font-medium text-fountain-gray-900">{pickStr(c, 'memberName')}</p><p className="text-xs text-fountain-gray-500">{pickStr(c, 'branch')} • {pickStr(c, 'loanType')}</p></td>
                      <td className="px-6 py-4 text-right"><p className="font-medium text-fountain-gray-900">{formatNaira(pickNum(c, 'outstanding'))}</p><p className="text-xs text-fountain-gray-500">of {formatNaira(pickNum(c, 'originalAmount'))}</p></td>
                      <td className="px-6 py-4"><span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getAgingBadgeColor(bucket)}`}>{bucket} Days</span><p className="text-xs text-fountain-gray-500 mt-1">{pickNum(c, 'daysOverdue')} days</p></td>
                      <td className="px-6 py-4 text-fountain-gray-600">{pickStr(c, 'assignedOfficer')}</td>
                      <td className="px-6 py-4 text-fountain-gray-600">{pickStr(c, 'lastContact')}</td>
                      <td className="px-6 py-4">{getStatusBadge(pickStr(c, 'status', 'Active'))}</td>
                      <td className="px-6 py-4 text-center space-x-1">
                        <button type="button" className="p-1.5 bg-fountain-blue/10 text-fountain-blue rounded hover:bg-fountain-blue hover:text-white transition-colors" title="Mark contacted" onClick={() => void cases.patchRow(row.id, { lastContact: new Date().toISOString().slice(0, 10) })}><PhoneIcon className="w-4 h-4" /></button>
                        <button type="button" title="Delete" onClick={() => void cases.removeRow(row.id)} className="p-1.5 text-fountain-gray-400 hover:text-fountain-red"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!cases.loading && !cases.items.length ? <p className="text-sm text-fountain-gray-500 p-6 text-center">No recovery cases yet.</p> : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-fountain-gray-900">Officer Performance</h3>
            <button type="button" disabled={officers.loading} onClick={() => void officers.createRow('recoveryOfficer', { name: 'Officer', casesAssigned: 0, casesResolved: 0, amountRecovered: 0, successRate: 0 })} className="inline-flex items-center gap-1 text-xs font-medium text-fountain-blue hover:text-fountain-dark">
              <PlusIcon className="w-3.5 h-3.5" />Add officer
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {officers.items.map((row) => {
              const officer = row.data;
              const rate = pickNum(officer, 'successRate');
              return (
                <Card key={row.id}>
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <div>
                      <h4 className="font-bold text-fountain-gray-900">{pickStr(officer, 'name', 'Officer')}</h4>
                      <p className="text-xs text-fountain-gray-500">{pickNum(officer, 'casesAssigned')} cases assigned</p>
                    </div>
                    <button type="button" title="Remove" onClick={() => void officers.removeRow(row.id)} className="text-fountain-gray-400 hover:text-fountain-red p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="text-right mb-2"><p className="text-sm font-bold text-fountain-green">{rate}%</p><p className="text-xs text-fountain-gray-500">Success rate</p></div>
                  <div className="w-full bg-fountain-gray-100 rounded-full h-1.5 mb-4"><div className="bg-fountain-green h-1.5 rounded-full" style={{ width: `${Math.min(100, rate)}%` }} /></div>
                  <div className="flex justify-between text-sm">
                    <div><p className="text-fountain-gray-500 text-xs">Resolved</p><p className="font-medium text-fountain-gray-900">{pickNum(officer, 'casesResolved')}</p></div>
                    <div className="text-right"><p className="text-fountain-gray-500 text-xs">Recovered</p><p className="font-medium text-fountain-gray-900">{formatNaira(pickNum(officer, 'amountRecovered'))}</p></div>
                  </div>
                </Card>
              );
            })}
          </div>
          {!officers.loading && !officers.items.length ? <p className="text-sm text-fountain-gray-500 mt-2">No officers yet.</p> : null}
        </div>
        <div className="lg:col-span-1">
          <Card title="Upcoming Promise-to-Pay" className="h-full" headerAction={
            <button type="button" disabled={ptp.loading} onClick={() => void ptp.createRow('promiseToPay', { memberName: 'Member', dueDate: new Date().toISOString().slice(0, 10), amount: 0, status: 'Pending' })} className="inline-flex items-center gap-1 text-xs font-medium text-fountain-blue hover:text-fountain-dark">
              <PlusIcon className="w-3.5 h-3.5" />Add
            </button>
          }>
            <div className="space-y-4">
              {!ptp.items.length ? <p className="text-sm text-fountain-gray-500">No promise-to-pay rows.</p> : null}
              {ptp.items.map((row) => {
                const p = row.data;
                return (
                  <div key={row.id} className="flex justify-between items-center p-3 bg-fountain-gray-50 rounded-lg border border-fountain-gray-200 gap-2">
                    <div>
                      <p className="font-medium text-sm text-fountain-gray-900">{pickStr(p, 'memberName')}</p>
                      <p className="text-xs text-fountain-gray-500 mt-0.5">Due: {pickStr(p, 'dueDate')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-fountain-gray-900 mb-1">{formatNaira(pickNum(p, 'amount'))}</p>
                      {getStatusBadge(pickStr(p, 'status', 'Pending'))}
                      <div className="mt-2 flex justify-end gap-2">
                        <button type="button" className="text-[10px] text-fountain-blue hover:underline" onClick={() => void ptp.patchRow(row.id, { status: 'Fulfilled' })}>Mark met</button>
                        <button type="button" className="text-[10px] text-fountain-red hover:underline" onClick={() => void ptp.removeRow(row.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
