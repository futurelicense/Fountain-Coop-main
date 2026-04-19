import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { Card } from './Card';
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  trend?: string;
  isPositive?: boolean;
  subtitle?: string;
}
export function KPICard({
  title,
  value,
  icon,
  iconBgColor = 'bg-fountain-blue/10',
  iconColor = 'text-fountain-blue',
  trend,
  isPositive,
  subtitle
}: KPICardProps) {
  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconBgColor} ${iconColor}`}>
          {icon}
        </div>
        {trend &&
        <div
          className={`flex items-center text-sm font-medium ${isPositive ? 'text-fountain-green' : 'text-fountain-red'}`}>
          
            {isPositive ?
          <TrendingUpIcon className="w-4 h-4 mr-1" /> :

          <TrendingDownIcon className="w-4 h-4 mr-1" />
          }
            {trend}
          </div>
        }
      </div>
      <div>
        <h4 className="text-sm font-medium text-fountain-gray-600 mb-1">
          {title}
        </h4>
        <div className="text-2xl font-bold text-fountain-gray-900">{value}</div>
        {subtitle &&
        <p className="text-xs text-fountain-gray-400 mt-2">{subtitle}</p>
        }
      </div>
    </Card>);

}