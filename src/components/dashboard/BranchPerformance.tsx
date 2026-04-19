import type { DashboardBranchRow } from '@/api/types';
import { Badge } from '../ui/Badge';

interface BranchPerformanceProps {
  data?: DashboardBranchRow[];
}

export function BranchPerformance({ data }: BranchPerformanceProps) {
  const branchPerformance = data ?? [];
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount);
  };
  const getRecoveryBadge = (rate: number) => {
    if (rate >= 90)
    return (
      <Badge variant="success" size="sm">
          {rate}%
        </Badge>);

    if (rate >= 85)
    return (
      <Badge variant="warning" size="sm">
          {rate}%
        </Badge>);

    return (
      <Badge variant="danger" size="sm">
        {rate}%
      </Badge>);

  };
  if (!branchPerformance.length) {
    return (
      <p className="text-sm text-fountain-gray-500 py-6 text-center">
        No branch performance data yet.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
          <tr>
            <th className="px-4 py-3 font-medium">Branch Name</th>
            <th className="px-4 py-3 font-medium">Active Members</th>
            <th className="px-4 py-3 font-medium">Monthly Collections</th>
            <th className="px-4 py-3 font-medium">Recovery Rate</th>
          </tr>
        </thead>
        <tbody>
          {branchPerformance.map((branch, idx) =>
          <tr
            key={idx}
            className="border-b border-fountain-gray-100 hover:bg-fountain-gray-50 transition-colors">
            
              <td className="px-4 py-3 font-medium text-fountain-gray-900">
                {branch.name}
              </td>
              <td className="px-4 py-3 text-fountain-gray-600">
                {branch.members.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-fountain-gray-900 font-medium">
                {formatNaira(branch.collections)}
              </td>
              <td className="px-4 py-3">
                {getRecoveryBadge(branch.recoveryRate)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>);

}