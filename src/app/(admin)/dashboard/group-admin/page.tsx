import { DashboardPage } from '@/components/dashboard/DashboardPage';

export default function GroupAdminDashboardPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-fountain-amber/30 bg-fountain-amber/10 px-4 py-3 text-sm text-fountain-amber">
        Group Admin view: member operations, collections, and day-to-day activity.
      </div>
      <DashboardPage roleView="group_admin" />
    </div>
  );
}
