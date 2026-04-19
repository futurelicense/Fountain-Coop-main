'use client';

import { useMemo } from 'react';
import {
  ShieldCheckIcon,
  ClockIcon,
  AlertTriangleIcon,
  FileSearchIcon,
  SearchIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  Trash2,
} from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickStr } from '@/lib/pickData';

export default function CompliancePage() {
  const audit = useOperationalRecords('compliance', 'auditLog');
  const pending = useOperationalRecords('compliance', 'pendingApproval');

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <Badge variant="danger" size="sm">High</Badge>;
      case 'warning': return <Badge variant="warning" size="sm">Warning</Badge>;
      case 'normal': return <Badge variant="neutral" size="sm">Normal</Badge>;
      default: return <Badge size="sm">{severity}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="danger" size="sm">High Priority</Badge>;
      case 'medium': return <Badge variant="warning" size="sm">Medium</Badge>;
      case 'low': return <Badge variant="info" size="sm">Low</Badge>;
      default: return <Badge size="sm">{priority}</Badge>;
    }
  };

  const openApprovals = useMemo(
    () => pending.items.filter((p) => pickStr(p.data, 'status', 'pending') === 'pending'),
    [pending.items]
  );
  const highLogs = useMemo(
    () => audit.items.filter((l) => pickStr(l.data, 'severity') === 'high').length,
    [audit.items]
  );

  const loadError = audit.error || pending.error;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fountain-gray-900">Compliance & Audit</h2>
          <p className="text-fountain-gray-600 mt-1">
            Enforce control rules, maintain traceability, and support regulatory discipline.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending.loading}
            onClick={() =>
              void pending.createRow('pendingApproval', {
                type: 'Loan', priority: 'medium', description: 'New approval request',
                requestedBy: 'Staff', requestDate: new Date().toISOString().slice(0, 10),
                requiresDual: false, status: 'pending',
              })
            }
            className="px-4 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4 inline mr-1" />Approval
          </button>
          <button
            type="button"
            disabled={audit.loading}
            onClick={() =>
              void audit.createRow('auditLog', {
                timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
                user: 'System', role: 'Automated', action: 'Recorded compliance event',
                category: 'Compliance', severity: 'normal', ip: '—',
              })
            }
            className="px-4 py-2 border border-fountain-gray-300 rounded-lg text-sm font-medium text-fountain-gray-700 hover:bg-fountain-gray-50"
          >
            Log event
          </button>
        </div>
      </div>

      {loadError ? (
        <p className="text-sm text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-4 py-3">{loadError}</p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Open approvals" value={String(openApprovals.length)} icon={<ClockIcon className="w-6 h-6" />} iconBgColor="bg-fountain-amber/10" iconColor="text-fountain-amber" />
        <KPICard title="Audit rows" value={String(audit.items.length)} icon={<FileSearchIcon className="w-6 h-6" />} iconBgColor="bg-fountain-blue/10" iconColor="text-fountain-blue" />
        <KPICard title="High severity (logs)" value={String(highLogs)} icon={<AlertTriangleIcon className="w-6 h-6" />} iconBgColor="bg-fountain-red/10" iconColor="text-fountain-red" />
        <KPICard title="Compliance score (placeholder)" value="—" icon={<ShieldCheckIcon className="w-6 h-6" />} iconBgColor="bg-fountain-green/10" iconColor="text-fountain-green" />
      </div>

      <Card title="Pending Approvals" headerAction={<Badge variant="warning" size="sm">{openApprovals.length} open</Badge>}>
        <div className="space-y-3">
          {!pending.items.length ? <p className="text-sm text-fountain-gray-500">No approval rows.</p> : null}
          {pending.items.map((row) => {
            const approval = row.data;
            const pr = pickStr(approval, 'priority', 'medium');
            const st = pickStr(approval, 'status', 'pending');
            return (
              <div
                key={row.id}
                className={`p-4 bg-fountain-gray-50 rounded-lg border ${pr === 'high' ? 'border-l-4 border-l-fountain-red border-fountain-gray-200' : pr === 'medium' ? 'border-l-4 border-l-fountain-amber border-fountain-gray-200' : 'border-fountain-gray-200'}`}
              >
                <div className="flex items-start justify-between mb-2 gap-2 flex-wrap">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs font-bold text-fountain-gray-500 uppercase">{pickStr(approval, 'type', 'Request')}</span>
                    {getPriorityBadge(pr)}
                    {(approval as Record<string, unknown>).requiresDual === true ? (
                      <Badge variant="info" size="sm">Dual Auth Required</Badge>
                    ) : null}
                  </div>
                  <button type="button" className="text-fountain-gray-400 hover:text-fountain-red p-1" onClick={() => void pending.removeRow(row.id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-fountain-gray-900 mb-1">{pickStr(approval, 'description')}</p>
                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                  <p className="text-xs text-fountain-gray-500">
                    Requested by {pickStr(approval, 'requestedBy')} on {pickStr(approval, 'requestDate')}
                  </p>
                  {st === 'pending' ? (
                    <div className="flex gap-2">
                      <button type="button" className="flex items-center px-3 py-1 bg-fountain-green text-white rounded-md text-xs font-medium hover:bg-green-600" onClick={() => void pending.patchRow(row.id, { status: 'approved' })}>
                        <CheckCircleIcon className="w-3 h-3 mr-1" />Approve
                      </button>
                      <button type="button" className="flex items-center px-3 py-1 bg-white border border-fountain-gray-300 text-fountain-gray-700 rounded-md text-xs font-medium hover:bg-fountain-gray-50" onClick={() => void pending.patchRow(row.id, { status: 'rejected' })}>
                        <XCircleIcon className="w-3 h-3 mr-1" />Reject
                      </button>
                    </div>
                  ) : (
                    <Badge variant="neutral" size="sm">{st}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-fountain-gray-900">Audit Log</h3>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <SearchIcon className="w-4 h-4 text-fountain-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input type="text" placeholder="Search audit logs..." className="pl-9 pr-4 py-2 bg-white border border-fountain-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fountain-blue/50" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Severity</th>
                  <th className="px-6 py-4 font-medium text-right"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fountain-gray-100">
                {audit.items.map((row) => {
                  const log = row.data;
                  return (
                    <tr key={row.id} className="hover:bg-fountain-gray-50">
                      <td className="px-6 py-4 text-fountain-gray-600 whitespace-nowrap text-xs">{pickStr(log, 'timestamp')}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-fountain-gray-900">{pickStr(log, 'user')}</p>
                        <p className="text-xs text-fountain-gray-500">{pickStr(log, 'role')}</p>
                      </td>
                      <td className="px-6 py-4 text-fountain-gray-900 max-w-md">{pickStr(log, 'action')}</td>
                      <td className="px-6 py-4 text-fountain-gray-600">{pickStr(log, 'category')}</td>
                      <td className="px-6 py-4">{getSeverityBadge(pickStr(log, 'severity', 'normal'))}</td>
                      <td className="px-6 py-4 text-right">
                        <button type="button" className="text-fountain-gray-400 hover:text-fountain-red p-1" onClick={() => void audit.removeRow(row.id)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!audit.loading && !audit.items.length ? (
              <p className="text-sm text-fountain-gray-500 p-6 text-center">No audit rows yet.</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
