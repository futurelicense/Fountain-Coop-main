'use client';

import { useMemo } from 'react';
import {
  CoinsIcon,
  UsersIcon,
  UserCheckIcon,
  TargetIcon,
  SearchIcon,
  FilterIcon,
  FlameIcon,
  PlusIcon,
  Trash2,
} from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickNum, pickStr } from '@/lib/pickData';

export default function ThriftPage() {
  const planRows = useOperationalRecords('thrift', 'thriftPlan');
  const participantRows = useOperationalRecords('thrift', 'thriftParticipant');
  const collectorRows = useOperationalRecords('thrift', 'collector');
  const calendarRows = useOperationalRecords('thrift', 'collectionDay');

  const formatNaira = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

  const totalCollected = useMemo(() => planRows.items.reduce((s, r) => s + pickNum(r.data, 'totalCollected'), 0), [planRows.items]);
  const activePlans = planRows.items.length;
  const todayCollected = useMemo(() => collectorRows.items.reduce((s, r) => s + pickNum(r.data, 'todayCollected'), 0), [collectorRows.items]);
  const dailyTargetSum = useMemo(() => collectorRows.items.reduce((s, r) => s + pickNum(r.data, 'dailyTarget'), 0), [collectorRows.items]);
  const todayPct = dailyTargetSum > 0 ? Math.min(100, Math.round((todayCollected / dailyTargetSum) * 100)) : 0;
  const loadError = planRows.error || participantRows.error || collectorRows.error || calendarRows.error;
  const calendarSorted = useMemo(() => [...calendarRows.items].sort((a, b) => pickStr(a.data, 'date').localeCompare(pickStr(b.data, 'date'))), [calendarRows.items]);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-2xl font-bold text-fountain-gray-900">Thrift Module</h2>
        <p className="text-fountain-gray-600 mt-1">Digitize flexible recurring thrift contributions and short-cycle financial participation.</p>
      </div>

      {loadError ? <p className="text-sm text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-4 py-3">{loadError}</p> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Active Thrift Plans" value={String(activePlans)} icon={<CoinsIcon className="w-6 h-6" />} iconBgColor="bg-fountain-teal/10" iconColor="text-fountain-teal" />
        <KPICard title="Total Collected (plans)" value={formatNaira(totalCollected)} icon={<TargetIcon className="w-6 h-6" />} iconBgColor="bg-fountain-green/10" iconColor="text-fountain-green" />
        <KPICard title="Active Collectors" value={String(collectorRows.items.length)} icon={<UserCheckIcon className="w-6 h-6" />} iconBgColor="bg-fountain-blue/10" iconColor="text-fountain-blue" />
        <KPICard title="Today vs target (collectors)" value={formatNaira(todayCollected)} icon={<UsersIcon className="w-6 h-6" />} iconBgColor="bg-fountain-amber/10" iconColor="text-fountain-amber" subtitle={dailyTargetSum ? `${todayPct}% of ${formatNaira(dailyTargetSum)} target` : 'Add collectors with daily targets'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card title="Thrift Plans" className="h-full" headerAction={
            <button type="button" disabled={planRows.loading} onClick={() => void planRows.createRow('thriftPlan', { name: 'New thrift plan', description: 'Short description', frequency: 'Daily', participants: 0, amount: 500, totalCollected: 0 })} className="inline-flex items-center gap-1 text-xs font-medium text-fountain-blue hover:text-fountain-dark">
              <PlusIcon className="w-3.5 h-3.5" />Add
            </button>
          }>
            <div className="space-y-3">
              {!planRows.items.length ? <p className="text-sm text-fountain-gray-500">No plans yet.</p> : null}
              {planRows.items.map((row) => {
                const plan = row.data;
                return (
                  <div key={row.id} className="p-3 bg-fountain-gray-50 rounded-lg border border-fountain-gray-200">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h4 className="font-semibold text-sm text-fountain-gray-900">{pickStr(plan, 'name', 'Plan')}</h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="success" size="sm">{pickStr(plan, 'frequency', 'Daily')}</Badge>
                        <button type="button" title="Delete" onClick={() => void planRows.removeRow(row.id)} className="p-1 text-fountain-gray-400 hover:text-fountain-red"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <p className="text-xs text-fountain-gray-500 mb-2">{pickStr(plan, 'description')}</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-fountain-gray-600">{pickNum(plan, 'participants')} participants</span>
                      <span className="font-bold text-fountain-teal">{formatNaira(pickNum(plan, 'amount'))}/{pickStr(plan, 'frequency', 'day').toLowerCase()}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-fountain-gray-200">
                      <div className="flex justify-between text-xs text-fountain-gray-500">
                        <span>Total Collected</span>
                        <span className="font-medium text-fountain-gray-900">{formatNaira(pickNum(plan, 'totalCollected'))}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title="Daily Collection Summary" subtitle="Calendar + collectors (live records)" headerAction={
            <button type="button" disabled={calendarRows.loading} onClick={() => void calendarRows.createRow('collectionDay', { date: new Date().toISOString().slice(0, 10), rate: 80 })} className="inline-flex items-center gap-1 text-xs font-medium text-fountain-blue hover:text-fountain-dark">
              <PlusIcon className="w-3.5 h-3.5" />Day
            </button>
          }>
            <div className="grid grid-cols-7 gap-2 mb-6">
              {calendarSorted.slice(0, 14).map((row) => {
                const day = row.data;
                const dateStr = pickStr(day, 'date');
                const date = dateStr ? new Date(dateStr) : new Date();
                const dayName = date.toLocaleDateString('en-NG', { weekday: 'short' });
                const dayNum = date.getDate();
                const rate = pickNum(day, 'rate', 0);
                const rateColor = rate >= 95 ? 'bg-fountain-green' : rate >= 85 ? 'bg-fountain-blue' : rate >= 75 ? 'bg-fountain-amber' : 'bg-fountain-red';
                return (
                  <div key={row.id} className="text-center p-2 bg-fountain-gray-50 rounded-lg border border-fountain-gray-200 relative">
                    <button type="button" title="Remove day" onClick={() => void calendarRows.removeRow(row.id)} className="absolute top-1 right-1 text-[10px] text-fountain-gray-400 hover:text-fountain-red">×</button>
                    <p className="text-[10px] text-fountain-gray-500 uppercase font-medium">{dayName}</p>
                    <p className="text-lg font-bold text-fountain-gray-900">{dayNum}</p>
                    <div className={`w-full h-1.5 rounded-full mt-1 ${rateColor}`} title={`${rate}%`} />
                    <p className="text-[10px] text-fountain-gray-600 mt-1 font-medium">{rate}%</p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-fountain-gray-900">Collector Performance</h4>
              <button type="button" disabled={collectorRows.loading} onClick={() => void collectorRows.createRow('collector', { name: 'New collector', route: 'Route A', assignedMembers: 0, todayCollected: 0, dailyTarget: 100000, status: 'Active' })} className="inline-flex items-center gap-1 text-xs font-medium text-fountain-blue hover:text-fountain-dark">
                <PlusIcon className="w-3.5 h-3.5" />Add collector
              </button>
            </div>
            <div className="space-y-3">
              {!collectorRows.items.length ? <p className="text-sm text-fountain-gray-500">No collectors yet.</p> : null}
              {collectorRows.items.map((row) => {
                const collector = row.data;
                const tgt = pickNum(collector, 'dailyTarget', 1);
                const col = pickNum(collector, 'todayCollected');
                const pct = Math.min(100, Math.round((col / tgt) * 100));
                const name = pickStr(collector, 'name', 'Collector');
                return (
                  <div key={row.id} className="flex items-center justify-between p-3 bg-fountain-gray-50 rounded-lg border border-fountain-gray-200 gap-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-fountain-teal/10 text-fountain-teal flex items-center justify-center font-bold text-xs shrink-0">{name.split(' ').map((n) => n[0]).join('').slice(0, 3)}</div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-fountain-gray-900 truncate">{name}</p>
                        <p className="text-xs text-fountain-gray-500 truncate">{pickStr(collector, 'route')} • {pickNum(collector, 'assignedMembers')} members</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-fountain-gray-900">{formatNaira(col)}</p>
                      <div className="flex items-center justify-end mt-1 gap-2">
                        <div className="w-16 bg-fountain-gray-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${pickStr(collector, 'status') === 'Completed' ? 'bg-fountain-green' : 'bg-fountain-blue'}`} style={{ width: `${pct}%` }} /></div>
                        <span className="text-[10px] text-fountain-gray-500">{pct}%</span>
                      </div>
                      <button type="button" className="mt-1 text-xs text-fountain-gray-500 hover:text-fountain-red" onClick={() => void collectorRows.removeRow(row.id)}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-fountain-gray-900">Thrift Participants</h3>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <SearchIcon className="w-4 h-4 text-fountain-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input type="text" placeholder="Search participants..." className="pl-9 pr-4 py-2 bg-white border border-fountain-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fountain-blue/50" />
            </div>
            <button type="button" disabled={participantRows.loading} onClick={() => void participantRows.createRow('thriftParticipant', { memberName: 'Member', branch: '—', plan: 'Daily Saver', frequency: 'Daily', amount: 500, totalPaid: 0, daysStreak: 0, collector: 'Unassigned', status: 'Active' })} className="inline-flex items-center gap-1 px-3 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <PlusIcon className="w-4 h-4" />Add participant
            </button>
            <button type="button" className="p-2 bg-white border border-fountain-gray-200 text-fountain-gray-600 rounded-lg hover:bg-fountain-gray-50 transition-colors"><FilterIcon className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Participant</th>
                  <th className="px-6 py-4 font-medium">Plan</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                  <th className="px-6 py-4 font-medium text-right">Total Paid</th>
                  <th className="px-6 py-4 font-medium">Streak</th>
                  <th className="px-6 py-4 font-medium">Collector</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fountain-gray-100">
                {participantRows.items.map((row) => {
                  const tp = row.data;
                  const name = pickStr(tp, 'memberName', 'Member');
                  return (
                    <tr key={row.id} className="hover:bg-fountain-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-fountain-teal/10 text-fountain-teal flex items-center justify-center font-bold text-xs">{name.split(' ').map((n) => n[0]).join('').slice(0, 3)}</div>
                          <div><p className="font-medium text-fountain-gray-900">{name}</p><p className="text-xs text-fountain-gray-500">{pickStr(tp, 'branch')}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><p className="text-fountain-gray-900">{pickStr(tp, 'plan')}</p><p className="text-xs text-fountain-gray-500">{pickStr(tp, 'frequency')}</p></td>
                      <td className="px-6 py-4 text-right font-medium text-fountain-gray-900">{formatNaira(pickNum(tp, 'amount'))}</td>
                      <td className="px-6 py-4 text-right font-bold text-fountain-gray-900">{formatNaira(pickNum(tp, 'totalPaid'))}</td>
                      <td className="px-6 py-4">
                        {pickNum(tp, 'daysStreak') > 0 ? (
                          <div className="flex items-center space-x-1"><FlameIcon className="w-4 h-4 text-fountain-amber" /><span className="font-medium text-fountain-gray-900">{pickNum(tp, 'daysStreak')} days</span></div>
                        ) : <span className="text-fountain-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4 text-fountain-gray-600">{pickStr(tp, 'collector')}</td>
                      <td className="px-6 py-4">
                        {pickStr(tp, 'status') === 'Active' ? <Badge variant="success" size="sm">Active</Badge> : <Badge variant="danger" size="sm">Missed</Badge>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button type="button" title="Delete" onClick={() => void participantRows.removeRow(row.id)} className="text-fountain-gray-400 hover:text-fountain-red transition-colors p-1"><Trash2 className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!participantRows.loading && !participantRows.items.length ? <p className="text-sm text-fountain-gray-500 p-6 text-center">No participants yet.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
