import { DashboardPage } from '@/components/dashboard/DashboardPage';

export default function TenantAdminDashboardPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-fountain-teal/20 bg-fountain-teal/5 px-4 py-3 text-sm text-fountain-teal">
        Tenant Admin view: branch-level performance, lending health, and operations.
      </div>
      <DashboardPage roleView="tenant_admin" />
    </div>
  );
}
