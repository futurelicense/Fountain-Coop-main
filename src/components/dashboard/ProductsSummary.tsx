import {
  CoinsIcon,
  RepeatIcon,
  PackageIcon,
  TrendingUpIcon } from
'lucide-react';
import type { DashboardProductsSummary } from '@/api/types';

const EMPTY: DashboardProductsSummary = {
  thrift: { activePlans: 0, collected: 0 },
  ajo: { activeCycles: 0, participants: 0 },
  packs: { activePacks: 0, slotsFilled: 0 },
};

interface ProductsSummaryProps {
  data?: DashboardProductsSummary;
}

export function ProductsSummary({ data }: ProductsSummaryProps) {
  const productsSummary = data ?? EMPTY;
  const formatNaira = (amount: number) => {
    return `₦${(amount / 1000000).toFixed(1)}M`;
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white border border-fountain-gray-200 rounded-xl p-4 shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-fountain-teal/10 text-fountain-teal rounded-lg">
          <CoinsIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-fountain-gray-500 uppercase tracking-wider">
            Thrift Plans
          </p>
          <p className="text-lg font-bold text-fountain-gray-900">
            {productsSummary.thrift.activePlans}
          </p>
          <p className="text-xs text-fountain-gray-600 mt-0.5">
            {formatNaira(productsSummary.thrift.collected)} collected
          </p>
        </div>
      </div>

      <div className="bg-white border border-fountain-gray-200 rounded-xl p-4 shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-fountain-blue/10 text-fountain-blue rounded-lg">
          <RepeatIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-fountain-gray-500 uppercase tracking-wider">
            Ajo/Osusu
          </p>
          <p className="text-lg font-bold text-fountain-gray-900">
            {productsSummary.ajo.activeCycles}
          </p>
          <p className="text-xs text-fountain-gray-600 mt-0.5">
            {productsSummary.ajo.participants} participants
          </p>
        </div>
      </div>

      <div className="bg-white border border-fountain-gray-200 rounded-xl p-4 shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg">
          <PackageIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-fountain-gray-500 uppercase tracking-wider">
            Packs
          </p>
          <p className="text-lg font-bold text-fountain-gray-900">
            {productsSummary.packs.activePacks}
          </p>
          <p className="text-xs text-fountain-gray-600 mt-0.5">
            {productsSummary.packs.slotsFilled} slots filled
          </p>
        </div>
      </div>

      <div className="bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl p-4 shadow-sm flex items-center space-x-4 opacity-75">
        <div className="p-3 bg-fountain-gray-200 text-fountain-gray-500 rounded-lg">
          <TrendingUpIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-fountain-gray-500 uppercase tracking-wider">
            Investments
          </p>
          <p className="text-sm font-medium text-fountain-gray-600 mt-1">
            Coming Soon
          </p>
          <p className="text-xs text-fountain-gray-400 mt-0.5">
            Phase 3 Feature
          </p>
        </div>
      </div>
    </div>);

}