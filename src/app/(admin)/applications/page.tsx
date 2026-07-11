'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserPlusIcon } from 'lucide-react';
import { fetchMembershipApplications } from '@/api';
import type {
  MembershipApplicationRow,
  MembershipApplicationsListResponse,
} from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { formatNaira } from '@/lib/formatNaira';
import { MembershipApplicationDetailPanel } from '@/components/members/MembershipApplicationDetailPanel';

function statusBadge(status: string) {
  switch (status) {
    case 'account_created':
      return <Badge variant="success" size="sm">Account created</Badge>;
    case 'paid':
      return <Badge variant="info" size="sm">Paid</Badge>;
    case 'pending_payment':
      return <Badge variant="warning" size="sm">Pending payment</Badge>;
    case 'cancelled':
      return <Badge variant="neutral" size="sm">Cancelled</Badge>;
    default:
      return <Badge size="sm">{status}</Badge>;
  }
}

export default function MembershipApplicationsPage() {
  const [data, setData] = useState<MembershipApplicationsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MembershipApplicationRow | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMembershipApplications();
      setData(res);
    } catch {
      setError('Could not load membership applications.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRowClick = (application: MembershipApplicationRow) => {
    setSelected(application);
    setIsPanelOpen(true);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-fountain-gray-600">
        Loading applications…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-fountain-gray-200 rounded-xl p-8 text-center space-y-4 max-w-lg mx-auto mt-8">
        <p className="text-fountain-gray-800 font-medium">{error ?? 'No data'}</p>
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

  return (
    <div className="space-y-6 pb-8">
      <MembershipApplicationDetailPanel
        application={selected}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fountain-gray-900 flex items-center gap-2">
            <UserPlusIcon className="w-6 h-6 text-fountain-blue" />
            Membership Applications
          </h2>
          <p className="text-fountain-gray-600 mt-1">
            Applications submitted via &quot;Be a Member&quot; on the login page — registration fee,
            declaration, and photo are captured before their account is created.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm font-medium text-fountain-gray-600 bg-white p-4 rounded-xl border border-fountain-gray-200 shadow-sm">
        <div className="pr-4 border-r border-fountain-gray-200">
          Total <span className="text-fountain-gray-900 ml-1">{data.summary.total.toLocaleString()}</span>
        </div>
        <div className="pr-4 border-r border-fountain-gray-200">
          Pending payment{' '}
          <span className="text-fountain-amber ml-1">{data.summary.pendingPayment.toLocaleString()}</span>
        </div>
        <div className="pr-4 border-r border-fountain-gray-200">
          Paid, awaiting sign-up{' '}
          <span className="text-fountain-blue ml-1">{data.summary.paid.toLocaleString()}</span>
        </div>
        <div>
          Account created{' '}
          <span className="text-fountain-green ml-1">{data.summary.accountCreated.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">Applicant</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Occupation</th>
                <th className="px-6 py-4 font-medium text-right">Monthly contribution</th>
                <th className="px-6 py-4 font-medium">Fountain Basket</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fountain-gray-100">
              {data.applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-fountain-gray-400">
                    No applications yet.
                  </td>
                </tr>
              ) : (
                data.applications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => handleRowClick(app)}
                    className="hover:bg-fountain-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-fountain-blue/10 text-fountain-blue flex items-center justify-center font-bold text-sm border border-fountain-blue/20">
                          {app.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <p className="font-bold text-fountain-gray-900">{app.full_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-fountain-gray-900">{app.phone}</p>
                      <p className="text-xs text-fountain-gray-500 mt-0.5">{app.email}</p>
                    </td>
                    <td className="px-6 py-4 text-fountain-gray-700">{app.occupation || '—'}</td>
                    <td className="px-6 py-4 text-right font-medium text-fountain-gray-900">
                      {formatNaira(Number(app.monthly_contribution || 0))}
                    </td>
                    <td className="px-6 py-4">
                      {app.wants_fountain_basket ? (
                        <Badge variant="info" size="sm">Yes</Badge>
                      ) : (
                        <span className="text-fountain-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{statusBadge(app.status)}</td>
                    <td className="px-6 py-4 text-fountain-gray-500 text-xs">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
