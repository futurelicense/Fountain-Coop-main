import {
  XIcon,
  PhoneIcon,
  MapPinIcon,
  ShieldCheckIcon,
  WalletIcon,
  HandCoinsIcon,
  FileTextIcon,
  MessageSquareIcon,
  EditIcon } from
'lucide-react';
import { Badge } from '../ui/Badge';
import type { MemberRow } from '../../api/types';
interface MemberDetailPanelProps {
  member: MemberRow | null;
  isOpen: boolean;
  onClose: () => void;
}
export function MemberDetailPanel({
  member,
  isOpen,
  onClose
}: MemberDetailPanelProps) {
  if (!member) return null;
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount);
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <Badge variant="success" size="sm">
            Active
          </Badge>);

      case 'Owing':
        return (
          <Badge variant="warning" size="sm">
            Owing
          </Badge>);

      case 'Inactive':
        return (
          <Badge variant="neutral" size="sm">
            Inactive
          </Badge>);

      case 'Suspended':
        return (
          <Badge variant="danger" size="sm">
            Suspended
          </Badge>);

      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };
  const netPosition = member.savingsBalance - member.loanBalance;
  return (
    <>
      {/* Overlay */}
      {isOpen &&
      <div
        className="fixed inset-0 bg-fountain-dark/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose} />

      }

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-fountain-gray-200 bg-fountain-gray-50">
          <div>
            <h2 className="text-lg font-bold text-fountain-gray-900">
              Member Details
            </h2>
            <p className="text-xs text-fountain-gray-500">{member.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-fountain-gray-400 hover:text-fountain-gray-900 hover:bg-fountain-gray-200 rounded-full transition-colors">
            
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-fountain-blue/10 text-fountain-blue flex items-center justify-center text-xl font-bold border-2 border-fountain-blue/20">
              {member.name.
              split(' ').
              map((n: string) => n[0]).
              join('')}
            </div>
            <div>
              <h3 className="text-xl font-bold text-fountain-gray-900">
                {member.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusBadge(member.status)}
                <span className="text-xs text-fountain-gray-500 flex items-center">
                  <ShieldCheckIcon className="w-3 h-3 mr-1 text-fountain-green" />{' '}
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-fountain-gray-50 p-3 rounded-xl border border-fountain-gray-100">
              <div className="flex items-center text-xs text-fountain-gray-500 mb-1">
                <PhoneIcon className="w-3 h-3 mr-1" /> Phone
              </div>
              <p className="text-sm font-medium text-fountain-gray-900">
                {member.phone}
              </p>
            </div>
            <div className="bg-fountain-gray-50 p-3 rounded-xl border border-fountain-gray-100">
              <div className="flex items-center text-xs text-fountain-gray-500 mb-1">
                <MapPinIcon className="w-3 h-3 mr-1" /> Branch
              </div>
              <p className="text-sm font-medium text-fountain-gray-900">
                {member.branch}
              </p>
            </div>
          </div>

          {/* Financial Summary */}
          <div>
            <h4 className="text-sm font-semibold text-fountain-gray-900 mb-3">
              Financial Summary
            </h4>
            <div className="bg-white border border-fountain-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 flex items-center justify-between border-b border-fountain-gray-100">
                <div className="flex items-center text-fountain-gray-600">
                  <WalletIcon className="w-4 h-4 mr-2 text-fountain-green" />
                  <span className="text-sm">Total Savings</span>
                </div>
                <span className="font-bold text-fountain-gray-900">
                  {formatNaira(member.savingsBalance)}
                </span>
              </div>
              <div className="p-4 flex items-center justify-between border-b border-fountain-gray-100">
                <div className="flex items-center text-fountain-gray-600">
                  <HandCoinsIcon className="w-4 h-4 mr-2 text-fountain-red" />
                  <span className="text-sm">Loan Balance</span>
                </div>
                <span className="font-bold text-fountain-gray-900">
                  {formatNaira(member.loanBalance)}
                </span>
              </div>
              <div className="p-4 flex items-center justify-between bg-fountain-gray-50">
                <span className="text-sm font-medium text-fountain-gray-600">
                  Net Position
                </span>
                <span
                  className={`font-bold ${netPosition >= 0 ? 'text-fountain-green' : 'text-fountain-red'}`}>
                  
                  {netPosition >= 0 ? '+' : ''}
                  {formatNaira(netPosition)}
                </span>
              </div>
            </div>
          </div>

          {/* Active Products */}
          <div>
            <h4 className="text-sm font-semibold text-fountain-gray-900 mb-3">
              Active Products
            </h4>
            <div className="flex flex-wrap gap-2">
              {member.products.map((product: string, idx: number) =>
              <span
                key={idx}
                className="px-3 py-1.5 bg-fountain-blue/10 text-fountain-blue text-xs font-medium rounded-lg border border-fountain-blue/20">
                
                  {product}
                </span>
              )}
            </div>
          </div>

          {/* Recent Activity (Mocked) */}
          <div>
            <h4 className="text-sm font-semibold text-fountain-gray-900 mb-3">
              Recent Activity
            </h4>
            <div className="space-y-3">
              {[
              {
                action: 'Savings Deposit',
                amount: 50000,
                date: 'Mar 26, 2026',
                type: 'credit'
              },
              {
                action: 'Thrift Contribution',
                amount: 500,
                date: 'Mar 25, 2026',
                type: 'credit'
              },
              {
                action: 'Loan Repayment',
                amount: 98333,
                date: 'Mar 15, 2026',
                type: 'credit'
              }].
              map((txn, idx) =>
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-fountain-gray-50 rounded-lg border border-fountain-gray-100">
                
                  <div>
                    <p className="text-sm font-medium text-fountain-gray-900">
                      {txn.action}
                    </p>
                    <p className="text-xs text-fountain-gray-500">{txn.date}</p>
                  </div>
                  <span
                  className={`text-sm font-bold ${txn.type === 'credit' ? 'text-fountain-green' : 'text-fountain-gray-900'}`}>
                  
                    +{formatNaira(txn.amount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-fountain-gray-200 bg-white grid grid-cols-3 gap-2">
          <button className="flex flex-col items-center justify-center p-2 text-fountain-gray-600 hover:text-fountain-blue hover:bg-fountain-blue/5 rounded-lg transition-colors">
            <FileTextIcon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Statement</span>
          </button>
          <button className="flex flex-col items-center justify-center p-2 text-fountain-gray-600 hover:text-fountain-blue hover:bg-fountain-blue/5 rounded-lg transition-colors">
            <MessageSquareIcon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Message</span>
          </button>
          <button className="flex flex-col items-center justify-center p-2 text-fountain-gray-600 hover:text-fountain-blue hover:bg-fountain-blue/5 rounded-lg transition-colors">
            <EditIcon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Edit Profile</span>
          </button>
        </div>
      </div>
    </>);

}