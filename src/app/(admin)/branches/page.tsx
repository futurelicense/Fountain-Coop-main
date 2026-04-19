'use client';

import { useMemo } from 'react';
import {
  BuildingIcon,
  UsersIcon,
  WalletIcon,
  TrendingUpIcon,
  SearchIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  PlusIcon,
  Trash2,
} from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickNum, pickStr } from '@/lib/pickData';

export default function BranchesPage() {
  const branches = useOperationalRecords('branches', 'branchDetail');
  const staff = useOperationalRecords('branches', 'branchStaff');

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRecoveryColor = (rate: number) => {
    if (rate >= 90) return 'text-fountain-green';
    if (rate >= 85) return 'text-fountain-amber';
    return 'text-fountain-red';
  };

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

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fountain-gray-900">Branch Operations</h2>
          <p className="text-fountain-gray-600 mt-1">
            Control and monitor multiple operational locations under one central system.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={branches.loading}
            onClick={() =>
              void branches.createRow('branchDetail', {
                name: 'New branch', address: 'Address', manager: 'Manager',
                phone: '+234', status: 'Active', activeMembers: 0, staff: 0,
                monthlyCollections: 0, recoveryRate: 90, totalSavings: 0, loanBook: 0,
              })
            }
            className="px-4 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4 inline mr-1" />Branch
          </button>
          <button
            type="button"
            disabled={staff.loading}
            onClick={() =>
              void staff.createRow('branchStaff', {
                name: 'Staff member', role: 'Teller', branch: 'HQ',
                status: 'Active', joinDate: new Date().toISOString().slice(0, 10),
              })
            }
            className="px-4 py-2 border border-fountain-gray-300 rounded-lg text-sm font-medium text-fountain-gray-700 hover:bg-fountain-gray-50"
          >
            Staff
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
        <KPICard title="Members (sum)" value={totalMembers.toLocaleString()} icon={<UsersIcon className="w-6 h-6" />} iconBgColor="bg-fountain-teal/10" iconColor="text-fountain-teal" />
        <KPICard title="Collections (sum)" value={formatNaira(totalCollections)} icon={<WalletIcon className="w-6 h-6" />} iconBgColor="bg-fountain-green/10" iconColor="text-fountain-green" />
        <KPICard title="Avg recovery %" value={`${avgRecovery}%`} icon={<TrendingUpIcon className="w-6 h-6" />} iconBgColor="bg-fountain-amber/10" iconColor="text-fountain-amber" />
      </div>

      <div className="relative max-w-md">
        <SearchIcon className="w-4 h-4 text-fountain-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        <input type="text" placeholder="Search branches..." className="pl-9 pr-4 py-2 w-full bg-white border border-fountain-gray-200 rounded-lg text-sm" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-fountain-gray-900 mb-4">Branch Directory</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {branches.items.map((row) => {
            const branch = row.data;
            return (
              <Card key={row.id} className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div>
                    <h4 className="font-bold text-fountain-gray-900 text-lg">{pickStr(branch, 'name', 'Branch')}</h4>
                    <div className="flex items-center text-xs text-fountain-gray-500 mt-1">
                      <MapPinIcon className="w-3 h-3 mr-1 shrink-0" />
                      <span className="line-clamp-2">{pickStr(branch, 'address')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="success" size="sm">{pickStr(branch, 'status', 'Active')}</Badge>
                    <button type="button" onClick={() => void branches.removeRow(row.id)} className="text-fountain-gray-400 hover:text-fountain-red p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                    <p className="font-bold text-fountain-gray-900">{pickNum(branch, 'activeMembers').toLocaleString()}</p>
                  </div>
                  <div className="bg-fountain-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-fountain-gray-500">Staff</p>
                    <p className="font-bold text-fountain-gray-900">{pickNum(branch, 'staff')}</p>
                  </div>
                  <div className="bg-fountain-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-fountain-gray-500">Collections</p>
                    <p className="font-bold text-fountain-gray-900">{formatNaira(pickNum(branch, 'monthlyCollections'))}</p>
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
        {!branches.loading && !branches.items.length ? (
          <p className="text-sm text-fountain-gray-500 mt-2">No branches yet.</p>
        ) : null}
      </div>

      <Card
        title="Branch Staff Directory"
        headerAction={
          <button
            type="button"
            disabled={staff.loading}
            onClick={() =>
              void staff.createRow('branchStaff', {
                name: 'New hire', role: 'Officer', branch: 'HQ',
                status: 'Active', joinDate: new Date().toISOString().slice(0, 10),
              })
            }
            className="text-xs font-medium text-fountain-blue hover:text-fountain-dark"
          >
            + Add
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
                    <td className="px-4 py-3 font-medium text-fountain-gray-900">{pickStr(s, 'name')}</td>
                    <td className="px-4 py-3 text-fountain-gray-600">{pickStr(s, 'role')}</td>
                    <td className="px-4 py-3 text-fountain-gray-600">{pickStr(s, 'branch')}</td>
                    <td className="px-4 py-3"><Badge variant="success" size="sm">{pickStr(s, 'status', 'Active')}</Badge></td>
                    <td className="px-4 py-3 text-fountain-gray-500">{pickStr(s, 'joinDate')}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" className="text-fountain-gray-400 hover:text-fountain-red p-1" onClick={() => void staff.removeRow(row.id)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!staff.loading && !staff.items.length ? (
            <p className="text-sm text-fountain-gray-500 p-4">No staff rows.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
