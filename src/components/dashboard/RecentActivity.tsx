import {
  UserPlusIcon,
  HandCoinsIcon,
  CoinsIcon,
  ArrowDownToLineIcon,
  ShieldAlertIcon,
  PackageIcon } from
'lucide-react';
import type { DashboardActivityItem } from '@/api/types';

interface RecentActivityProps {
  items?: DashboardActivityItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  const recentActivities = items ?? [];
  const getIcon = (type: string) => {
    switch (type) {
      case 'join':
        return <UserPlusIcon className="w-4 h-4 text-fountain-blue" />;
      case 'loan':
        return <HandCoinsIcon className="w-4 h-4 text-fountain-teal" />;
      case 'contribution':
        return <CoinsIcon className="w-4 h-4 text-fountain-green" />;
      case 'payout':
        return <ArrowDownToLineIcon className="w-4 h-4 text-fountain-amber" />;
      case 'recovery':
        return <ShieldAlertIcon className="w-4 h-4 text-fountain-red" />;
      case 'pack':
        return <PackageIcon className="w-4 h-4 text-purple-500" />;
      default:
        return <CoinsIcon className="w-4 h-4 text-fountain-gray-500" />;
    }
  };
  const getBgColor = (type: string) => {
    switch (type) {
      case 'join':
        return 'bg-fountain-blue/10';
      case 'loan':
        return 'bg-fountain-teal/10';
      case 'contribution':
        return 'bg-fountain-green/10';
      case 'payout':
        return 'bg-fountain-amber/10';
      case 'recovery':
        return 'bg-fountain-red/10';
      case 'pack':
        return 'bg-purple-500/10';
      default:
        return 'bg-fountain-gray-100';
    }
  };
  if (!recentActivities.length) {
    return (
      <p className="text-sm text-fountain-gray-500 py-6 text-center">
        No recent activity recorded yet.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {recentActivities.map((activity) =>
      <div key={activity.id} className="flex items-start space-x-3">
          <div
          className={`p-2 rounded-full mt-0.5 ${getBgColor(activity.type)}`}>
          
            {getIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-fountain-gray-900">
              <span className="font-medium">{activity.user}</span>{' '}
              {activity.action}
            </p>
            <p className="text-xs text-fountain-gray-500 mt-0.5">
              {activity.time}
            </p>
          </div>
        </div>
      )}
    </div>);

}