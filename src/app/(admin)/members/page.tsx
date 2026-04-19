'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  SearchIcon,
  FilterIcon,
  PlusIcon,
  MoreVerticalIcon,
} from 'lucide-react';
import { fetchMembers } from '@/api';
import type { MemberRow, MembersSummary } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { MemberDetailPanel } from '@/components/members/MemberDetailPanel';

export default function MembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [summary, setSummary] = useState<MembersSummary | null>(null);
  const [platformTotal, setPlatformTotal] = useState(0);
  const [pageTotal, setPageTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showAddHint, setShowAddHint] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMembers();
      setMembers(res.members);
      setSummary(res.summary);
      setPlatformTotal(res.total);
      setPageTotal(res.pageTotal);
    } catch {
      setError('Could not load members. Check that the API is running.');
      setMembers([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleRowClick = (member: MemberRow) => {
    setSelectedMember(member);
    setIsPanelOpen(true);
  };

  const handleAddMember = () => {
    setShowAddHint(true);
    setError('Member creation is managed in Supabase Auth for this demo. Create the user in Authentication, then refresh this page.');
  };

  const formatNaira = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return <Badge variant="success" size="sm">Active</Badge>;
      case 'Owing': return <Badge variant="warning" size="sm">Owing</Badge>;
      case 'Inactive': return <Badge variant="neutral" size="sm">Inactive</Badge>;
      case 'Suspended': return <Badge variant="danger" size="sm">Suspended</Badge>;
      default: return <Badge size="sm">{status}</Badge>;
    }
  };

  const getProductColor = (product: string) => {
    switch (product) {
      case 'Cooperative': return 'bg-fountain-blue/10 text-fountain-blue border-fountain-blue/20';
      case 'Thrift': return 'bg-fountain-teal/10 text-fountain-teal border-fountain-teal/20';
      case 'Ajo/Osusu': return 'bg-fountain-amber/10 text-fountain-amber border-fountain-amber/20';
      case 'Packs': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Loan': return 'bg-fountain-red/10 text-fountain-red border-fountain-red/20';
      default: return 'bg-fountain-gray-100 text-fountain-gray-600 border-fountain-gray-200';
    }
  };

  if (loading && !summary) {
    return <div className="flex items-center justify-center min-h-[40vh] text-fountain-gray-600">Loading members…</div>;
  }

  if (error || !summary) {
    return (
      <div className="bg-white border border-fountain-gray-200 rounded-xl p-8 text-center space-y-4 max-w-lg mx-auto mt-8">
        <p className="text-fountain-gray-800 font-medium">{error ?? 'No data'}</p>
        <button type="button" onClick={() => void load()} className="px-4 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <MemberDetailPanel member={selectedMember} isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fountain-gray-900">Member Management</h2>
          <p className="text-fountain-gray-600 mt-1">View and manage all cooperative members, their products, and statuses.</p>
        </div>
        <button type="button" onClick={handleAddMember} className="flex items-center justify-center px-4 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <PlusIcon className="w-4 h-4 mr-2" />Add Member
        </button>
      </div>

      <div className="flex flex-wrap gap-4 text-sm font-medium text-fountain-gray-600 bg-white p-4 rounded-xl border border-fountain-gray-200 shadow-sm">
        {showAddHint ? <p className="w-full text-xs text-fountain-amber bg-fountain-amber/10 border border-fountain-amber/30 rounded-md px-3 py-2">Add Member clicked. For now, add users from Supabase Dashboard → Authentication → Users, then return here and click Retry.</p> : null}
        <div className="pr-4 border-r border-fountain-gray-200">Total <span className="text-fountain-gray-900 ml-1">{summary.total.toLocaleString()}</span></div>
        <div className="pr-4 border-r border-fountain-gray-200">Active <span className="text-fountain-green ml-1">{summary.active.toLocaleString()}</span></div>
        <div className="pr-4 border-r border-fountain-gray-200">Owing <span className="text-fountain-amber ml-1">{summary.owing.toLocaleString()}</span></div>
        <div>Inactive <span className="text-fountain-gray-400 ml-1">{summary.inactive.toLocaleString()}</span></div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-fountain-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="w-5 h-5 text-fountain-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input type="text" placeholder="Search by name, ID, or phone..." className="w-full pl-10 pr-4 py-2 bg-fountain-gray-50 border border-fountain-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fountain-blue/50 focus:border-fountain-blue transition-all" />
        </div>
        <div className="flex flex-wrap gap-3">
          <select className="px-3 py-2 bg-fountain-gray-50 border border-fountain-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fountain-blue/50 text-fountain-gray-700">
            <option>All Branches</option>
            <option>Lagos Main</option>
            <option>Ikeja</option>
            <option>Abuja</option>
            <option>Port Harcourt</option>
            <option>Lekki</option>
          </select>
          <select className="px-3 py-2 bg-fountain-gray-50 border border-fountain-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fountain-blue/50 text-fountain-gray-700">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Owing</option>
            <option>Inactive</option>
            <option>Suspended</option>
          </select>
          <button type="button" className="p-2 bg-fountain-gray-100 text-fountain-gray-600 rounded-lg hover:bg-fountain-gray-200 transition-colors"><FilterIcon className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">Member Details</th>
                <th className="px-6 py-4 font-medium">Contact & Branch</th>
                <th className="px-6 py-4 font-medium">Active Products</th>
                <th className="px-6 py-4 font-medium text-right">Savings Bal</th>
                <th className="px-6 py-4 font-medium text-right">Loan Bal</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fountain-gray-100">
              {members.map((member) => (
                <tr key={member.id} onClick={() => handleRowClick(member)} className="hover:bg-fountain-gray-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-fountain-blue/10 text-fountain-blue flex items-center justify-center font-bold text-sm border border-fountain-blue/20">
                        {member.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-fountain-gray-900">{member.name}</p>
                        <p className="text-xs text-fountain-gray-500 font-mono mt-0.5">{member.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><p className="text-fountain-gray-900">{member.phone}</p><p className="text-xs text-fountain-gray-500 mt-0.5">{member.branch}</p></td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {member.products.map((product, idx) => (
                        <span key={idx} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getProductColor(product)}`}>{product}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-fountain-gray-900">{formatNaira(member.savingsBalance)}</td>
                  <td className="px-6 py-4 text-right font-medium text-fountain-gray-900">
                    {member.loanBalance > 0 ? <span className="text-fountain-red">{formatNaira(member.loanBalance)}</span> : <span className="text-fountain-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(member.status)}</td>
                  <td className="px-6 py-4 text-center">
                    <button type="button" className="text-fountain-gray-400 hover:text-fountain-blue transition-colors p-1" onClick={(e) => { e.stopPropagation(); handleRowClick(member); }}>
                      <MoreVerticalIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-fountain-gray-200 flex items-center justify-between bg-fountain-gray-50">
          <span className="text-sm text-fountain-gray-600">
            Showing <span className="font-medium text-fountain-gray-900">{pageTotal > 0 ? 1 : 0}</span> to <span className="font-medium text-fountain-gray-900">{pageTotal}</span> of <span className="font-medium text-fountain-gray-900">{platformTotal.toLocaleString()}</span> members
          </span>
          <div className="flex space-x-2">
            <button type="button" className="px-3 py-1 border border-fountain-gray-300 rounded-md text-sm font-medium text-fountain-gray-600 bg-white hover:bg-fountain-gray-50 disabled:opacity-50">Previous</button>
            <button type="button" className="px-3 py-1 border border-fountain-gray-300 rounded-md text-sm font-medium text-fountain-gray-600 bg-white hover:bg-fountain-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
