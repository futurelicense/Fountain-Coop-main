import type React from 'react';
import { ShieldAlertIcon, AlertTriangleIcon, InfoIcon } from 'lucide-react';
import type { DashboardComplianceItem } from '@/api/types';
import { Badge } from '../ui/Badge';

interface ComplianceAlertsProps {
  items?: DashboardComplianceItem[];
}

export function ComplianceAlerts({ items }: ComplianceAlertsProps) {
  const complianceAlerts = items ?? [];
  type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'default';
  const getSeverityStyles = (severity: string): { badge: BadgeVariant; icon: React.ReactNode; border: string } => {
    switch (severity) {
      case 'high':
        return {
          badge: 'danger',
          icon: <ShieldAlertIcon className="w-5 h-5 text-fountain-red" />,
          border: 'border-l-4 border-l-fountain-red'
        };
      case 'medium':
        return {
          badge: 'warning',
          icon: <AlertTriangleIcon className="w-5 h-5 text-fountain-amber" />,
          border: 'border-l-4 border-l-fountain-amber'
        };
      case 'low':
        return {
          badge: 'info',
          icon: <InfoIcon className="w-5 h-5 text-fountain-blue" />,
          border: 'border-l-4 border-l-fountain-blue'
        };
      default:
        return {
          badge: 'neutral',
          icon: <InfoIcon className="w-5 h-5 text-fountain-gray-500" />,
          border: 'border-l-4 border-l-fountain-gray-300'
        };
    }
  };
  if (!complianceAlerts.length) {
    return (
      <p className="text-sm text-fountain-gray-500 py-6 text-center">
        No compliance alerts at this time.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {complianceAlerts.map((alert) => {
        const styles = getSeverityStyles(alert.severity);
        return (
          <div
            key={alert.id}
            className={`bg-white border border-fountain-gray-200 rounded-lg p-4 shadow-sm ${styles.border}`}>
            
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">{styles.icon}</div>
                <div>
                  <h4 className="text-sm font-semibold text-fountain-gray-900">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-fountain-gray-600 mt-1">
                    {alert.description}
                  </p>
                  <p className="text-xs text-fountain-gray-400 mt-2">
                    {alert.time}
                  </p>
                </div>
              </div>
              <Badge
                variant={styles.badge}
                size="sm"
                className="uppercase tracking-wider text-[10px]">
                
                {alert.severity}
              </Badge>
            </div>
            <div className="mt-3 flex justify-end">
              <button className="text-xs font-medium text-fountain-blue hover:text-fountain-dark transition-colors">
                Review Issue &rarr;
              </button>
            </div>
          </div>);

      })}
    </div>);

}