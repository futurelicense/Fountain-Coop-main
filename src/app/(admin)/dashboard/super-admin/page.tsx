import { DashboardPage } from '@/components/dashboard/DashboardPage';

export default function SuperAdminDashboardPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-fountain-blue/20 bg-fountain-blue/5 px-4 py-3 text-sm text-fountain-blue">
        Super Admin view: full-tenant executive insights and cross-module controls.
      </div>
      <DashboardPage roleView="super_admin" />
    </div>
  );
}
