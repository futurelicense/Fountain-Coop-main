'use client';

import { useMemo, useState } from 'react';
import {
  PackageIcon,
  GridIcon,
  CheckCircleIcon,
  WalletIcon,
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

export default function PacksPage() {
  const packs = useOperationalRecords('packs', 'pack');
  const slots = useOperationalRecords('packs', 'packSlot');
  const [featuredId, setFeaturedId] = useState<string | null>(null);

  const featuredPackId = useMemo(() => {
    if (featuredId && packs.items.some((p) => p.id === featuredId)) return featuredId;
    return packs.items[0]?.id ?? null;
  }, [packs.items, featuredId]);

  const formatNaira = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return <Badge variant="success" size="sm">{status}</Badge>;
      case 'Full': return <Badge variant="warning" size="sm">{status}</Badge>;
      case 'Completed': return <Badge variant="neutral" size="sm">{status}</Badge>;
      case 'Upcoming': return <Badge variant="info" size="sm">{status}</Badge>;
      default: return <Badge size="sm">{status}</Badge>;
    }
  };

  const getSlotColor = (status: string) => {
    switch (status) {
      case 'Filled': return 'bg-fountain-blue/10 text-fountain-blue border-fountain-blue/20';
      case 'Available': return 'bg-fountain-green/10 text-fountain-green border-fountain-green/20';
      case 'Reserved': return 'bg-fountain-amber/10 text-fountain-amber border-fountain-amber/20';
      default: return 'bg-fountain-gray-100 text-fountain-gray-600 border-fountain-gray-200';
    }
  };

  const totalSlots = useMemo(() => packs.items.reduce((s, p) => s + pickNum(p.data, 'totalSlots'), 0), [packs.items]);
  const filledSlots = useMemo(() => packs.items.reduce((s, p) => s + pickNum(p.data, 'filledSlots'), 0), [packs.items]);
  const valueUnder = useMemo(() => packs.items.reduce((s, p) => s + pickNum(p.data, 'packValue'), 0), [packs.items]);
  const boardSlots = useMemo(() => {
    if (!featuredPackId) return [];
    return slots.items.filter((s) => pickStr(s.data, 'packId') === featuredPackId);
  }, [slots.items, featuredPackId]);
  const loadError = packs.error || slots.error;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fountain-gray-900">Contribution Packs</h2>
          <p className="text-fountain-gray-600 mt-1">Manage structured contribution plans and slot availability.</p>
        </div>
        <button type="button" disabled={packs.loading} onClick={() => void packs.createRow('pack', { name: 'New pack', status: 'Active', contributionAmount: 1500, frequency: 'Daily', packValue: 45000, durationDays: 30, adminFee: 0, nextPayoutDate: new Date().toISOString().slice(0, 10), filledSlots: 0, totalSlots: 30 })} className="flex items-center justify-center px-4 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <PlusIcon className="w-4 h-4 mr-2" />Create New Pack
        </button>
      </div>

      {loadError ? <p className="text-sm text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-4 py-3">{loadError}</p> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Active Packs" value={String(packs.items.filter((p) => pickStr(p.data, 'status') === 'Active').length)} icon={<PackageIcon className="w-6 h-6" />} iconBgColor="bg-purple-500/10" iconColor="text-purple-500" />
        <KPICard title="Total Slots (pack defs)" value={String(totalSlots)} icon={<GridIcon className="w-6 h-6" />} iconBgColor="bg-fountain-blue/10" iconColor="text-fountain-blue" />
        <KPICard title="Filled Slots (pack defs)" value={String(filledSlots)} icon={<CheckCircleIcon className="w-6 h-6" />} iconBgColor="bg-fountain-green/10" iconColor="text-fountain-green" subtitle={totalSlots ? `${((filledSlots / totalSlots) * 100).toFixed(1)}% fill (defs)` : undefined} />
        <KPICard title="Pack values (sum)" value={formatNaira(valueUnder)} icon={<WalletIcon className="w-6 h-6" />} iconBgColor="bg-fountain-teal/10" iconColor="text-fountain-teal" />
      </div>

      <div className="bg-white p-4 rounded-xl border border-fountain-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="w-5 h-5 text-fountain-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input type="text" placeholder="Search packs..." className="w-full pl-10 pr-4 py-2 bg-fountain-gray-50 border border-fountain-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fountain-blue/50 focus:border-fountain-blue" />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <select className="px-3 py-2 bg-fountain-gray-50 border border-fountain-gray-200 rounded-lg text-sm text-fountain-gray-700" value={featuredPackId ?? ''} onChange={(e) => setFeaturedId(e.target.value || null)}>
            <option value="">Featured pack…</option>
            {packs.items.map((p) => <option key={p.id} value={p.id}>{pickStr(p.data, 'name', p.id.slice(0, 8))}</option>)}
          </select>
          <button type="button" className="p-2 bg-fountain-gray-100 text-fountain-gray-600 rounded-lg hover:bg-fountain-gray-200 transition-colors"><FilterIcon className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-fountain-gray-900">Pack Marketplace</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packs.items.map((row) => {
              const pack = row.data;
              const filled = pickNum(pack, 'filledSlots');
              const total = Math.max(1, pickNum(pack, 'totalSlots'));
              const st = pickStr(pack, 'status', 'Active');
              return (
                <Card key={row.id} className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h4 className="font-bold text-fountain-gray-900 leading-tight pr-2">{pickStr(pack, 'name', 'Pack')}</h4>
                    <div className="flex items-center gap-1 shrink-0">
                      {getStatusBadge(st)}
                      <button type="button" title="Delete" onClick={() => void packs.removeRow(row.id)} className="p-1 text-fountain-gray-400 hover:text-fountain-red"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm mb-4 flex-1">
                    <div className="flex justify-between"><span className="text-fountain-gray-500">Contribution:</span><span className="font-medium text-fountain-gray-900">{formatNaira(pickNum(pack, 'contributionAmount'))} / {pickStr(pack, 'frequency', 'daily').toLowerCase()}</span></div>
                    <div className="flex justify-between"><span className="text-fountain-gray-500">Pack Value:</span><span className="font-medium text-fountain-gray-900">{formatNaira(pickNum(pack, 'packValue'))}</span></div>
                    <div className="flex justify-between"><span className="text-fountain-gray-500">Duration:</span><span className="font-medium text-fountain-gray-900">{pickNum(pack, 'durationDays')} days</span></div>
                    <div className="flex justify-between"><span className="text-fountain-gray-500">Next Payout:</span><span className="font-medium text-fountain-gray-900">{pickStr(pack, 'nextPayoutDate')}</span></div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1"><span className="text-fountain-gray-500">Slots Filled</span><span className="font-medium text-fountain-gray-900">{filled} / {pickNum(pack, 'totalSlots')}</span></div>
                    <div className="w-full bg-fountain-gray-100 rounded-full h-1.5"><div className="bg-fountain-blue h-1.5 rounded-full" style={{ width: `${Math.min(100, (filled / total) * 100)}%` }} /></div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-fountain-gray-100">
                    <button type="button" className="flex-1 px-3 py-1.5 border border-fountain-gray-300 rounded-lg text-sm font-medium text-fountain-gray-700 hover:bg-fountain-gray-50" onClick={() => setFeaturedId(row.id)}>Slot board</button>
                    <button type="button" className="flex-1 px-3 py-1.5 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50" disabled={st === 'Full' || st === 'Completed'} onClick={() => void packs.patchRow(row.id, { filledSlots: filled + 1, status: filled + 1 >= pickNum(pack, 'totalSlots') ? 'Full' : st })}>+1 slot</button>
                  </div>
                </Card>
              );
            })}
          </div>
          {!packs.loading && !packs.items.length ? <p className="text-sm text-fountain-gray-500">No packs yet.</p> : null}
        </div>

        <div className="lg:col-span-1">
          <Card title="Slot Status Board" subtitle={featuredPackId ? `Pack ${featuredPackId.slice(0, 8)}…` : 'Select a pack'} className="h-full" headerAction={
            <button type="button" disabled={slots.loading || !featuredPackId} onClick={() => void slots.createRow('packSlot', { packId: featuredPackId, slotNumber: boardSlots.length + 1, payoutPosition: boardSlots.length + 1, memberName: '', status: 'Available' })} className="inline-flex items-center gap-1 text-xs font-medium text-fountain-blue hover:text-fountain-dark">
              <PlusIcon className="w-3.5 h-3.5" />Slot
            </button>
          }>
            <div className="grid grid-cols-2 gap-2">
              {boardSlots.map((row) => {
                const slot = row.data;
                const st = pickStr(slot, 'status', 'Available');
                return (
                  <div key={row.id} className={`p-2 rounded-lg border text-xs flex flex-col justify-between h-16 ${getSlotColor(st)}`}>
                    <div className="flex justify-between font-bold gap-1">
                      <span>#{pickNum(slot, 'slotNumber')}</span>
                      <button type="button" className="text-fountain-gray-400 hover:text-fountain-red" onClick={() => void slots.removeRow(row.id)}>×</button>
                    </div>
                    <div className="truncate font-medium mt-1">{pickStr(slot, 'memberName') || 'Available'}</div>
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
