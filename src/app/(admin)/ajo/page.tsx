'use client';

import { useMemo, useState } from 'react';
import {
  RepeatIcon,
  UsersIcon,
  CalendarCheckIcon,
  CheckCheck,
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

export default function AjoPage() {
  const cycles = useOperationalRecords('ajo', 'ajoCycle');
  const slots = useOperationalRecords('ajo', 'cycleSlot');
  const [featuredId, setFeaturedId] = useState<string | null>(null);

  const featuredCycleId = useMemo(() => {
    if (featuredId && cycles.items.some((c) => c.id === featuredId)) {
      return featuredId;
    }
    return cycles.items[0]?.id ?? null;
  }, [cycles.items, featuredId]);

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSlotStatusColor = (status: string) => {
    switch (status) {
      case 'Paid Out':
        return 'bg-fountain-green/10 text-fountain-green border-fountain-green/30';
      case 'Next Payout':
        return 'bg-fountain-blue/10 text-fountain-blue border-fountain-blue/30 ring-2 ring-fountain-blue/20';
      case 'Waiting':
        return 'bg-fountain-gray-50 text-fountain-gray-600 border-fountain-gray-200';
      default:
        return 'bg-fountain-gray-50 text-fountain-gray-600 border-fountain-gray-200';
    }
  };

  const getContributionBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <Badge variant="success" size="sm">
            Paid
          </Badge>
        );
      case 'Current':
        return (
          <Badge variant="info" size="sm">
            Current
          </Badge>
        );
      case 'Owing':
        return (
          <Badge variant="danger" size="sm">
            Owing
          </Badge>
        );
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  const activeCycles = cycles.items.filter(
    (c) => pickStr(c.data, 'status', 'Active') === 'Active'
  ).length;
  const totalParticipants = useMemo(
    () => cycles.items.reduce((s, c) => s + pickNum(c.data, 'totalParticipants'), 0),
    [cycles.items]
  );
  const nextPayoutValue = useMemo(() => {
    const row = cycles.items.find(
      (c) => pickStr(c.data, 'status', 'Active') === 'Active'
    );
    return row ? pickNum(row.data, 'nextPayoutValue') : 0;
  }, [cycles.items]);
  const completedCycles = cycles.items.filter(
    (c) => pickStr(c.data, 'status') === 'Completed'
  ).length;

  const featuredSlots = useMemo(() => {
    if (!featuredCycleId) return [];
    return slots.items.filter(
      (s) => pickStr(s.data, 'cycleId') === featuredCycleId
    );
  }, [slots.items, featuredCycleId]);

  const loadError = cycles.error || slots.error;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fountain-gray-900">
            Ajo/Osusu Cycles
          </h2>
          <p className="text-fountain-gray-600 mt-1">
            Formalize rotational savings cycles with payout order and
            cycle-level controls.
          </p>
        </div>
        <button
          type="button"
          disabled={cycles.loading}
          onClick={() =>
            void cycles.createRow('ajoCycle', {
              name: 'New cycle',
              status: 'Active',
              contributionAmount: 10000,
              frequency: 'Weekly',
              totalParticipants: 0,
              totalValue: 0,
              nextPayoutDate: new Date().toISOString().slice(0, 10),
              nextPayoutRecipient: '—',
              completedPayouts: 0,
              nextPayoutValue: 0,
            })
          }
          className="flex items-center justify-center px-4 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create New Cycle
        </button>
      </div>

      {loadError ? (
        <p className="text-sm text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-4 py-3">
          {loadError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Cycles"
          value={String(activeCycles)}
          icon={<RepeatIcon className="w-6 h-6" />}
          iconBgColor="bg-fountain-blue/10"
          iconColor="text-fountain-blue"
        />
        <KPICard
          title="Participants (sum)"
          value={String(totalParticipants)}
          icon={<UsersIcon className="w-6 h-6" />}
          iconBgColor="bg-fountain-teal/10"
          iconColor="text-fountain-teal"
        />
        <KPICard
          title="Next payout (first active)"
          value={formatNaira(nextPayoutValue)}
          icon={<CalendarCheckIcon className="w-6 h-6" />}
          iconBgColor="bg-fountain-green/10"
          iconColor="text-fountain-green"
        />
        <KPICard
          title="Completed Cycles"
          value={String(completedCycles)}
          icon={<CheckCheck className="w-6 h-6" />}
          iconBgColor="bg-fountain-amber/10"
          iconColor="text-fountain-amber"
        />
      </div>

      <div className="bg-white p-4 rounded-xl border border-fountain-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="w-5 h-5 text-fountain-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search cycles..."
            className="w-full pl-10 pr-4 py-2 bg-fountain-gray-50 border border-fountain-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fountain-blue/50 focus:border-fountain-blue"
          />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            className="px-3 py-2 bg-fountain-gray-50 border border-fountain-gray-200 rounded-lg text-sm text-fountain-gray-700"
            value={featuredCycleId ?? ''}
            onChange={(e) => setFeaturedId(e.target.value || null)}
          >
            <option value="">Featured cycle…</option>
            {cycles.items.map((c) => (
              <option key={c.id} value={c.id}>
                {pickStr(c.data, 'name', c.id.slice(0, 8))}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="p-2 bg-fountain-gray-100 text-fountain-gray-600 rounded-lg hover:bg-fountain-gray-200 transition-colors"
          >
            <FilterIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-fountain-gray-900">
            Cycles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cycles.items.map((row) => {
              const cycle = row.data;
              const st = pickStr(cycle, 'status', 'Active');
              const total = Math.max(1, pickNum(cycle, 'totalParticipants'));
              const done = pickNum(cycle, 'completedPayouts');
              return (
                <Card key={row.id} className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h4 className="font-bold text-fountain-gray-900 leading-tight pr-2">
                      {pickStr(cycle, 'name', 'Cycle')}
                    </h4>
                    <div className="flex items-center gap-1 shrink-0">
                      {st === 'Active' ? (
                        <Badge variant="success" size="sm">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Completed
                        </Badge>
                      )}
                      <button
                        type="button"
                        title="Delete cycle"
                        onClick={() => void cycles.removeRow(row.id)}
                        className="p-1 text-fountain-gray-400 hover:text-fountain-red"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm flex-1">
                    <div className="flex justify-between">
                      <span className="text-fountain-gray-500">
                        Contribution:
                      </span>
                      <span className="font-medium text-fountain-gray-900">
                        {formatNaira(pickNum(cycle, 'contributionAmount'))} /{' '}
                        {pickStr(cycle, 'frequency', 'weekly').toLowerCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-fountain-gray-500">
                        Participants:
                      </span>
                      <span className="font-medium text-fountain-gray-900">
                        {pickNum(cycle, 'totalParticipants')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-fountain-gray-500">Cycle Value:</span>
                      <span className="font-medium text-fountain-gray-900">
                        {formatNaira(pickNum(cycle, 'totalValue'))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-fountain-gray-500">Next Payout:</span>
                      <span className="font-medium text-fountain-gray-900">
                        {pickStr(cycle, 'nextPayoutDate')}
                      </span>
                    </div>
                    {st === 'Active' ? (
                      <div className="flex justify-between">
                        <span className="text-fountain-gray-500">
                          Next Recipient:
                        </span>
                        <span className="font-medium text-fountain-blue">
                          {pickStr(cycle, 'nextPayoutRecipient')}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 pt-3 border-t border-fountain-gray-100">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-fountain-gray-500">
                        Cycle Progress
                      </span>
                      <span className="font-medium text-fountain-gray-900">
                        {done} / {pickNum(cycle, 'totalParticipants')} payouts
                      </span>
                    </div>
                    <div className="w-full bg-fountain-gray-100 rounded-full h-2">
                      <div
                        className="bg-fountain-blue h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (done / total) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-fountain-gray-100 flex gap-2">
                    <button
                      type="button"
                      className="flex-1 text-sm font-medium text-fountain-blue hover:text-fountain-dark"
                      onClick={() => setFeaturedId(row.id)}
                    >
                      Show slots →
                    </button>
                    <button
                      type="button"
                      className="text-xs text-fountain-gray-500 hover:text-fountain-red"
                      onClick={() =>
                        void cycles.patchRow(row.id, {
                          status:
                            pickStr(cycle, 'status') === 'Completed'
                              ? 'Active'
                              : 'Completed',
                        })
                      }
                    >
                      Toggle status
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
          {!cycles.loading && !cycles.items.length ? (
            <p className="text-sm text-fountain-gray-500">No cycles yet.</p>
          ) : null}
        </div>

        <div className="lg:col-span-1">
          <Card
            title="Cycle Slot Map"
            subtitle={
              featuredCycleId
                ? `Cycle ${featuredCycleId.slice(0, 8)}…`
                : 'Select or create a cycle'
            }
            className="h-full"
            headerAction={
              <button
                type="button"
                disabled={slots.loading || !featuredCycleId}
                onClick={() =>
                  void slots.createRow('cycleSlot', {
                    cycleId: featuredCycleId,
                    position: featuredSlots.length + 1,
                    memberName: `Member ${featuredSlots.length + 1}`,
                    status: 'Waiting',
                    contributionStatus: 'Current',
                  })
                }
                className="inline-flex items-center gap-1 text-xs font-medium text-fountain-blue hover:text-fountain-dark"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Slot
              </button>
            }
          >
            <div className="space-y-2">
              {!featuredCycleId ? (
                <p className="text-sm text-fountain-gray-500">
                  Create a cycle, then pick it in the filter to manage slots.
                </p>
              ) : null}
              {featuredSlots.map((row) => {
                const slot = row.data;
                const status = pickStr(slot, 'status', 'Waiting');
                return (
                  <div
                    key={row.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border ${getSlotStatusColor(status)}`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center text-xs font-bold shrink-0">
                        {pickNum(slot, 'position')}
                      </div>
                      <span className="font-medium text-sm truncate">
                        {pickStr(slot, 'memberName')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      {getContributionBadge(
                        pickStr(slot, 'contributionStatus', 'Current')
                      )}
                      <button
                        type="button"
                        title="Remove slot"
                        onClick={() => void slots.removeRow(row.id)}
                        className="p-1 text-fountain-gray-400 hover:text-fountain-red"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
