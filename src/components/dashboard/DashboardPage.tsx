'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  UsersIcon,
  PiggyBankIcon,
  HandCoinsIcon,
  ShieldAlertIcon,
  TrendingUpIcon,
  UserPlusIcon,
} from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { Card } from '@/components/ui/Card';
import { MemberGrowthChart } from '@/components/dashboard/MemberGrowthChart';
import { LoanPortfolioChart } from '@/components/dashboard/LoanPortfolioChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { ComplianceAlerts } from '@/components/dashboard/ComplianceAlerts';
import { BranchPerformance } from '@/components/dashboard/BranchPerformance';
import { ProductsSummary } from '@/components/dashboard/ProductsSummary';
import { ApiError, fetchDashboard } from '@/api';
import type { DashboardResponse } from '@/api/types';
import { useRouter } from 'next/navigation';

type AdminDashboardRole = 'super_admin' | 'tenant_admin' | 'group_admin';

interface DashboardPageProps {
  roleView?: AdminDashboardRole;
}

export function DashboardPage({ roleView = 'super_admin' }: DashboardPageProps) {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDashboard();
      setData(res);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setError('You do not have access to the executive dashboard.');
      } else {
        setError('Could not load dashboard. Check that the API is running.');
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-fountain-gray-600">
        Loading dashboard…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-fountain-gray-200 rounded-xl p-8 text-center space-y-4 max-w-lg mx-auto mt-8">
        <p className="text-fountain-gray-800 font-medium">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="px-4 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const k = data.kpis;
  const isSuperAdmin = roleView === 'super_admin';
  const isTenantAdmin = roleView === 'tenant_admin';
  const isGroupAdmin = roleView === 'group_admin';

  const downloadReport = () => {
    const lines = [
      ['Metric', 'Value'],
      ['Total Active Members', String(k.totalMembers.value)],
      ['Total Savings', String(k.totalSavings.value)],
      ['Loan Book', String(k.loanBook.value)],
      ['Portfolio at Risk', String(k.portfolioAtRisk.value)],
      ['Recovery This Month', String(k.recoveryThisMonth.value)],
      ['New Members', String(k.newMembers.value)],
    ];
    const csv = lines
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fountain-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-fountain-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fountain-gray-900">
            Good morning, {data.welcome.greetingName}
          </h2>
          <p className="text-fountain-gray-600 mt-1">
            Here&apos;s what&apos;s happening across Fountain Coop today,{' '}
            {data.welcome.dateLabel}.
          </p>
        </div>
        <div className="flex gap-3">
          {(isSuperAdmin || isTenantAdmin) && (
            <button
              type="button"
              onClick={downloadReport}
              className="px-4 py-2 bg-white border border-fountain-gray-300 rounded-lg text-sm font-medium text-fountain-gray-700 hover:bg-fountain-gray-50 transition-colors"
            >
              Download Report
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push('/members')}
            className="px-4 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {isGroupAdmin ? 'View Members' : 'New Member'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Active Members"
          value={k.totalMembers.value.toLocaleString()}
          icon={<UsersIcon className="w-6 h-6" />}
          trend={k.totalMembers.trend}
          isPositive={k.totalMembers.isPositive}
        />
        <KPICard
          title="Total Savings"
          value={formatNaira(k.totalSavings.value)}
          icon={<PiggyBankIcon className="w-6 h-6" />}
          iconBgColor="bg-fountain-green/10"
          iconColor="text-fountain-green"
          trend={k.totalSavings.trend}
          isPositive={k.totalSavings.isPositive}
        />
        <KPICard
          title="Loan Book"
          value={formatNaira(k.loanBook.value)}
          icon={<HandCoinsIcon className="w-6 h-6" />}
          iconBgColor="bg-fountain-teal/10"
          iconColor="text-fountain-teal"
          subtitle={k.loanBook.subtitle}
        />
        {!isGroupAdmin && (
          <KPICard
            title="Portfolio at Risk"
            value={formatNaira(k.portfolioAtRisk.value)}
            icon={<ShieldAlertIcon className="w-6 h-6" />}
            iconBgColor="bg-fountain-red/10"
            iconColor="text-fountain-red"
            trend={k.portfolioAtRisk.trend}
            isPositive={k.portfolioAtRisk.isPositive}
            subtitle={k.portfolioAtRisk.subtitle}
          />
        )}
        <KPICard
          title="Recovery This Month"
          value={formatNaira(k.recoveryThisMonth.value)}
          icon={<TrendingUpIcon className="w-6 h-6" />}
          iconBgColor="bg-fountain-green/10"
          iconColor="text-fountain-green"
          subtitle={k.recoveryThisMonth.subtitle}
        />
        {!isGroupAdmin && (
          <KPICard
            title="New Members"
            value={k.newMembers.value}
            icon={<UserPlusIcon className="w-6 h-6" />}
            trend={k.newMembers.trend}
            isPositive={k.newMembers.isPositive}
            subtitle={k.newMembers.subtitle}
          />
        )}
      </div>

      <ProductsSummary data={data.productsSummary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Member Growth Trend">
          <MemberGrowthChart data={data.memberGrowth} />
        </Card>
        {!isGroupAdmin && (
          <Card title="Loan Portfolio Trend">
            <LoanPortfolioChart data={data.loanPortfolio} />
          </Card>
        )}
      </div>

      {isGroupAdmin ? (
        <div className="grid grid-cols-1 gap-6">
          <Card title="Recent Activity">
            <RecentActivity items={data.recentActivities} />
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {(isSuperAdmin || isTenantAdmin) && (
              <Card title="Branch Performance Overview">
                <BranchPerformance data={data.branchPerformance} />
              </Card>
            )}
            <Card title="Recent Activity">
              <RecentActivity items={data.recentActivities} />
            </Card>
          </div>
          <div className="lg:col-span-1">
            {isSuperAdmin && (
              <Card title="Compliance & Risk Alerts" className="h-full">
                <ComplianceAlerts items={data.complianceAlerts} />
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
