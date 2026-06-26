'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  BuildingIcon,
  UsersIcon,
  TrendingUpIcon,
  SearchIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  PlusIcon,
  Trash2,
  PencilIcon,
  XIcon,
} from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickNum, pickStr } from '@/lib/pickData';
import type { OperationalItem } from '@/api/types';

type BranchForm = {
  name: string;
  address: string;
  manager: string;
  phone: string;
  status: string;
  activeMembers: number;
  staff: number;
  monthlyCollections: number;
  recoveryRate: number;
  totalSavings: number;
  loanBook: number;
};

type StaffForm = {
  name: string;
  role: string;
  branch: string;
  status: string;
  joinDate: string;
  phone: string;
  email: string;
};

const emptyBranch = (): BranchForm => ({
  name: '',
  address: '',
  manager: '',
  phone: '+234',
  status: 'Active',
  activeMembers: 0,
  staff: 0,
  monthlyCollections: 0,
  recoveryRate: 90,
  totalSavings: 0,
  loanBook: 0,
});

const emptyStaff = (branch = ''): StaffForm => ({
  name: '',
  role: 'Officer',
  branch,
  status: 'Active',
  joinDate: new Date().toISOString().slice(0, 10),
  phone: '',
  email: '',
});

function branchFromRow(row: OperationalItem): BranchForm {
  const d = row.data;
  return {
    name: pickStr(d, 'name'),
    address: pickStr(d, 'address'),
    manager: pickStr(d, 'manager'),
    phone: pickStr(d, 'phone'),
    status: pickStr(d, 'status', 'Active'),
    activeMembers: pickNum(d, 'activeMembers'),
    staff: pickNum(d, 'staff'),
    monthlyCollections: pickNum(d, 'monthlyCollections'),
    recoveryRate: pickNum(d, 'recoveryRate', 90),
    totalSavings: pickNum(d, 'totalSavings'),
    loanBook: pickNum(d, 'loanBook'),
  };
}

function staffFromRow(row: OperationalItem): StaffForm {
  const d = row.data;
  return {
    name: pickStr(d, 'name'),
    role: pickStr(d, 'role', 'Officer'),
    branch: pickStr(d, 'branch'),
    status: pickStr(d, 'status', 'Active'),
    joinDate: pickStr(d, 'joinDate', new Date().toISOString().slice(0, 10)),
    phone: pickStr(d, 'phone'),
    email: pickStr(d, 'email'),
  };
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-fountain-gray-200">
          <h3 className="font-bold text-fountain-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 text-fountain-gray-400 hover:text-fountain-gray-700">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function BranchesPage() {
  const branches = useOperationalRecords('branches', 'branchDetail');
  const staff = useOperationalRecords('branches', 'branchStaff');

  const [search, setSearch] = useState('');
  const [branchModal, setBranchModal] = useState<
    { mode: 'create' } | { mode: 'edit'; id: string; form: BranchForm } | null
  >(null);
  const [staffModal, setStaffModal] = useState<
    { mode: 'create' } | { mode: 'edit'; id: string; form: StaffForm } | null
  >(null);
  const [branchForm, setBranchForm] = useState<BranchForm>(emptyBranch());
  const [staffForm, setStaffForm] = useState<StaffForm>(emptyStaff());
  const [saving, setSaving] = useState(false);

  const formatNaira = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);

  const getRecoveryColor = (rate: number) => {
    if (rate >= 90) return 'text-fountain-green';
    if (rate >= 85) return 'text-fountain-amber';
    return 'text-fountain-red';
  };

  const branchNames = useMemo(
    () => branches.items.map((b) => pickStr(b.data, 'name')).filter(Boolean),
    [branches.items]
  );

  const filteredBranches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches.items;
    return branches.items.filter((b) => {
      const d = b.data;
      return (
        pickStr(d, 'name').toLowerCase().includes(q) ||
        pickStr(d, 'address').toLowerCase().includes(q) ||
        pickStr(d, 'manager').toLowerCase().includes(q)
      );
    });
  }, [branches.items, search]);

  const totalMembers = useMemo(
    () => branches.items.reduce((s, b) => s + pickNum(b.data, 'activeMembers'), 0),
    [branches.items]
  );
  const totalCollections = useMemo(
    () => branches.items.reduce((s, b) => s + pickNum(b.data, 'monthlyCollections'), 0),
    [branches.items]
  );
  const avgRecovery = useMemo(() => {
    if (!branches.items.length) return 0;
    const sum = branches.items.reduce((s, b) => s + pickNum(b.data, 'recoveryRate'), 0);
    return Math.round(sum / branches.items.length);
  }, [branches.items]);

  const loadError = branches.error || staff.error;

  const openCreateBranch = () => {
    setBranchForm(emptyBranch());
    setBranchModal({ mode: 'create' });
  };

  const openEditBranch = (row: OperationalItem) => {
    setBranchForm(branchFromRow(row));
    setBranchModal({ mode: 'edit', id: row.id, form: branchFromRow(row) });
  };

  const saveBranch = async () => {
    if (!branchForm.name.trim()) return;
    setSaving(true);
    const payload = { ...branchForm, name: branchForm.name.trim() };
    if (branchModal?.mode === 'create') {
      await branches.createRow('branchDetail', payload, {
        is_catalog: true,
        branch: branchForm.name.trim(),
      });
    } else if (branchModal?.mode === 'edit') {
      await branches.patchRow(branchModal.id, payload);
    }
    setSaving(false);
    setBranchModal(null);
  };

  const openCreateStaff = () => {
    setStaffForm(emptyStaff(branchNames[0] ?? ''));
    setStaffModal({ mode: 'create' });
  };

  const openEditStaff = (row: OperationalItem) => {
    const form = staffFromRow(row);
    setStaffForm(form);
    setStaffModal({ mode: 'edit', id: row.id, form });
  };

  const saveStaff = async () => {
    if (!staffForm.name.trim()) return;
    setSaving(true);
    const payload = { ...staffForm, name: staffForm.name.trim() };
    if (staffModal?.mode === 'create') {
      await staff.createRow('branchStaff', payload, {
        is_catalog: true,
        branch: staffForm.branch.trim() || null,
      });
    } else if (staffModal?.mode === 'edit') {
      await staff.patchRow(staffModal.id, payload);
    }
    setSaving(false);
    setStaffModal(null);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fountain-gray-900">Branch Operations</h2>
          <p className="text-fountain-gray-600 mt-1">
            Add branches, assign staff, and monitor performance by location.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={branches.loading}
            onClick={openCreateBranch}
            className="px-4 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4 inline mr-1" />Add branch
          </button>
          <button
            type="button"
            disabled={staff.loading}
            onClick={openCreateStaff}
            className="px-4 py-2 border border-fountain-gray-300 rounded-lg text-sm font-medium text-fountain-gray-700 hover:bg-fountain-gray-50"
          >
            <PlusIcon className="w-4 h-4 inline mr-1" />Add staff
          </button>
        </div>
      </div>

      {loadError ? (
        <p className="text-sm text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-4 py-3">
          {loadError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Branches" value={String(branches.items.length)} icon={<BuildingIcon className="w-6 h-6" />} iconBgColor="bg-fountain-blue/10" iconColor="text-fountain-blue" />
        <KPICard title="Staff" value={String(staff.items.length)} icon={<UsersIcon className="w-6 h-6" />} iconBgColor="bg-fountain-teal/10" iconColor="text-fountain-teal" />
        <KPICard title="Members (sum)" value={totalMembers.toLocaleString()} icon={<UsersIcon className="w-6 h-6" />} iconBgColor="bg-fountain-green/10" iconColor="text-fountain-green" />
        <KPICard title="Avg recovery %" value={`${avgRecovery}%`} icon={<TrendingUpIcon className="w-6 h-6" />} iconBgColor="bg-fountain-amber/10" iconColor="text-fountain-amber" subtitle={formatNaira(totalCollections) + ' collections'} />
      </div>

      <div className="relative max-w-md">
        <SearchIcon className="w-4 h-4 text-fountain-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search branches..."
          className="pl-9 pr-4 py-2 w-full bg-white border border-fountain-gray-200 rounded-lg text-sm"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-fountain-gray-900 mb-4">Branch Directory</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBranches.map((row) => {
            const branch = row.data;
            return (
              <Card key={row.id} className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div>
                    <h4 className="font-bold text-fountain-gray-900 text-lg">
                      {pickStr(branch, 'name', 'Branch')}
                    </h4>
                    <div className="flex items-center text-xs text-fountain-gray-500 mt-1">
                      <MapPinIcon className="w-3 h-3 mr-1 shrink-0" />
                      <span className="line-clamp-2">{pickStr(branch, 'address')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="success" size="sm">
                      {pickStr(branch, 'status', 'Active')}
                    </Badge>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEditBranch(row)}
                        className="text-fountain-blue hover:bg-fountain-blue/10 p-1 rounded"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void branches.removeRow(row.id)}
                        className="text-fountain-gray-400 hover:text-fountain-red p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs text-fountain-gray-600 mb-4 flex-wrap">
                  <UserIcon className="w-3 h-3 shrink-0" />
                  <span>{pickStr(branch, 'manager')}</span>
                  <span>•</span>
                  <PhoneIcon className="w-3 h-3 shrink-0" />
                  <span>{pickStr(branch, 'phone')}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm flex-1">
                  <div className="bg-fountain-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-fountain-gray-500">Members</p>
                    <p className="font-bold text-fountain-gray-900">
                      {pickNum(branch, 'activeMembers').toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-fountain-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-fountain-gray-500">Staff</p>
                    <p className="font-bold text-fountain-gray-900">
                      {
                        staff.items.filter(
                          (s) => pickStr(s.data, 'branch') === pickStr(branch, 'name')
                        ).length
                      }
                    </p>
                  </div>
                  <div className="bg-fountain-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-fountain-gray-500">Collections</p>
                    <p className="font-bold text-fountain-gray-900">
                      {formatNaira(pickNum(branch, 'monthlyCollections'))}
                    </p>
                  </div>
                  <div className="bg-fountain-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-fountain-gray-500">Recovery</p>
                    <p className={`font-bold ${getRecoveryColor(pickNum(branch, 'recoveryRate'))}`}>
                      {pickNum(branch, 'recoveryRate')}%
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-fountain-gray-100 flex justify-between text-xs text-fountain-gray-500">
                  <span>Savings: {formatNaira(pickNum(branch, 'totalSavings'))}</span>
                  <span>Loans: {formatNaira(pickNum(branch, 'loanBook'))}</span>
                </div>
              </Card>
            );
          })}
        </div>
        {!branches.loading && !filteredBranches.length ? (
          <p className="text-sm text-fountain-gray-500 mt-2">No branches yet — add your first branch.</p>
        ) : null}
      </div>

      <Card
        title="Branch Staff Directory"
        headerAction={
          <button
            type="button"
            disabled={staff.loading}
            onClick={openCreateStaff}
            className="text-xs font-medium text-fountain-blue hover:text-fountain-dark"
          >
            + Add staff
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-fountain-gray-500 uppercase bg-fountain-gray-50 border-b border-fountain-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium">Staff Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fountain-gray-100">
              {staff.items.map((row) => {
                const s = row.data;
                return (
                  <tr key={row.id} className="hover:bg-fountain-gray-50">
                    <td className="px-4 py-3 font-medium text-fountain-gray-900">
                      {pickStr(s, 'name')}
                    </td>
                    <td className="px-4 py-3 text-fountain-gray-600">{pickStr(s, 'role')}</td>
                    <td className="px-4 py-3 text-fountain-gray-600">{pickStr(s, 'branch')}</td>
                    <td className="px-4 py-3 text-fountain-gray-500 text-xs">
                      {pickStr(s, 'phone') || pickStr(s, 'email') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="success" size="sm">
                        {pickStr(s, 'status', 'Active')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-fountain-gray-500">{pickStr(s, 'joinDate')}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => openEditStaff(row)}
                        className="text-fountain-blue hover:bg-fountain-blue/10 p-1 rounded inline-flex"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="text-fountain-gray-400 hover:text-fountain-red p-1 inline-flex"
                        onClick={() => void staff.removeRow(row.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!staff.loading && !staff.items.length ? (
            <p className="text-sm text-fountain-gray-500 p-4">No staff yet — add staff and assign to a branch.</p>
          ) : null}
        </div>
      </Card>

      {branchModal ? (
        <Modal
          title={branchModal.mode === 'create' ? 'Add branch' : 'Edit branch'}
          onClose={() => setBranchModal(null)}
        >
          <div className="space-y-3">
            <Field label="Branch name" value={branchForm.name} onChange={(v) => setBranchForm({ ...branchForm, name: v })} />
            <Field label="Address" value={branchForm.address} onChange={(v) => setBranchForm({ ...branchForm, address: v })} />
            <Field label="Branch manager" value={branchForm.manager} onChange={(v) => setBranchForm({ ...branchForm, manager: v })} />
            <Field label="Phone" value={branchForm.phone} onChange={(v) => setBranchForm({ ...branchForm, phone: v })} />
            <div>
              <label className="block text-xs font-medium text-fountain-gray-600 mb-1">Status</label>
              <select
                value={branchForm.status}
                onChange={(e) => setBranchForm({ ...branchForm, status: e.target.value })}
                className="w-full p-2.5 border border-fountain-gray-200 rounded-lg text-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Active members" value={branchForm.activeMembers} onChange={(v) => setBranchForm({ ...branchForm, activeMembers: v })} />
              <NumberField label="Recovery %" value={branchForm.recoveryRate} onChange={(v) => setBranchForm({ ...branchForm, recoveryRate: v })} />
              <NumberField label="Monthly collections" value={branchForm.monthlyCollections} onChange={(v) => setBranchForm({ ...branchForm, monthlyCollections: v })} />
              <NumberField label="Total savings" value={branchForm.totalSavings} onChange={(v) => setBranchForm({ ...branchForm, totalSavings: v })} />
            </div>
            <button
              type="button"
              disabled={saving || !branchForm.name.trim()}
              onClick={() => void saveBranch()}
              className="w-full py-2.5 bg-fountain-blue text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save branch'}
            </button>
          </div>
        </Modal>
      ) : null}

      {staffModal ? (
        <Modal
          title={staffModal.mode === 'create' ? 'Add staff' : 'Edit staff'}
          onClose={() => setStaffModal(null)}
        >
          <div className="space-y-3">
            <Field label="Full name" value={staffForm.name} onChange={(v) => setStaffForm({ ...staffForm, name: v })} />
            <div>
              <label className="block text-xs font-medium text-fountain-gray-600 mb-1">Role</label>
              <select
                value={staffForm.role}
                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                className="w-full p-2.5 border border-fountain-gray-200 rounded-lg text-sm"
              >
                <option value="Branch Manager">Branch Manager</option>
                <option value="Recovery Officer">Recovery Officer</option>
                <option value="Teller">Teller</option>
                <option value="Officer">Officer</option>
                <option value="Admin Assistant">Admin Assistant</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-fountain-gray-600 mb-1">Branch</label>
              <select
                value={staffForm.branch}
                onChange={(e) => setStaffForm({ ...staffForm, branch: e.target.value })}
                className="w-full p-2.5 border border-fountain-gray-200 rounded-lg text-sm"
              >
                <option value="">Unassigned</option>
                {branchNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {!branchNames.length ? (
                <p className="text-xs text-fountain-amber mt-1">Add a branch first to assign staff.</p>
              ) : null}
            </div>
            <Field label="Phone" value={staffForm.phone} onChange={(v) => setStaffForm({ ...staffForm, phone: v })} />
            <Field label="Email" value={staffForm.email} onChange={(v) => setStaffForm({ ...staffForm, email: v })} />
            <Field label="Join date" value={staffForm.joinDate} onChange={(v) => setStaffForm({ ...staffForm, joinDate: v })} />
            <div>
              <label className="block text-xs font-medium text-fountain-gray-600 mb-1">Status</label>
              <select
                value={staffForm.status}
                onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                className="w-full p-2.5 border border-fountain-gray-200 rounded-lg text-sm"
              >
                <option value="Active">Active</option>
                <option value="On leave">On leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <button
              type="button"
              disabled={saving || !staffForm.name.trim()}
              onClick={() => void saveStaff()}
              className="w-full py-2.5 bg-fountain-blue text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save staff'}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-fountain-gray-600 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2.5 border border-fountain-gray-200 rounded-lg text-sm"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-fountain-gray-600 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full p-2.5 border border-fountain-gray-200 rounded-lg text-sm"
      />
    </div>
  );
}
