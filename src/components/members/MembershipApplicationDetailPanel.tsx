'use client';

import { useEffect, useState } from 'react';
import {
  XIcon,
  PhoneIcon,
  MapPinIcon,
  MailIcon,
  BriefcaseIcon,
  UsersIcon,
  UserIcon,
  Loader2Icon,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { fetchMembershipApplicationDetail } from '../../api';
import type { MembershipApplicationDetail, MembershipApplicationRow } from '../../api/types';
import { formatNaira } from '../../lib/formatNaira';

interface MembershipApplicationDetailPanelProps {
  application: MembershipApplicationRow | null;
  isOpen: boolean;
  onClose: () => void;
}

function statusBadge(status: string) {
  switch (status) {
    case 'account_created':
      return <Badge variant="success" size="sm">Account created</Badge>;
    case 'paid':
      return <Badge variant="info" size="sm">Paid, awaiting sign-up</Badge>;
    case 'pending_payment':
      return <Badge variant="warning" size="sm">Pending payment</Badge>;
    case 'cancelled':
      return <Badge variant="neutral" size="sm">Cancelled</Badge>;
    default:
      return <Badge size="sm">{status}</Badge>;
  }
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="p-4 flex justify-between gap-4">
      <span className="text-fountain-gray-500 shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function MembershipApplicationDetailPanel({
  application,
  isOpen,
  onClose,
}: MembershipApplicationDetailPanelProps) {
  const [detail, setDetail] = useState<MembershipApplicationDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!application || !isOpen) return;
    let cancelled = false;
    setDetail(null);
    setLoading(true);
    void fetchMembershipApplicationDetail(application.id)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [application, isOpen]);

  if (!application) return null;

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 bg-fountain-dark/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      ) : null}

      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-fountain-gray-200 bg-fountain-gray-50">
          <div>
            <h2 className="text-lg font-bold text-fountain-gray-900">Membership Application</h2>
            <p className="text-xs text-fountain-gray-500 font-mono">{application.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-fountain-gray-400 hover:text-fountain-gray-900 hover:bg-fountain-gray-200 rounded-full transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-fountain-blue/10 text-fountain-blue flex items-center justify-center overflow-hidden border-2 border-fountain-blue/20">
              {detail?.photo_signed_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detail.photo_signed_url}
                  alt={application.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-7 h-7" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-fountain-gray-900">{application.full_name}</h3>
              <div className="mt-1">{statusBadge(application.status)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-fountain-gray-50 p-3 rounded-xl border border-fountain-gray-100">
              <div className="flex items-center text-xs text-fountain-gray-500 mb-1">
                <PhoneIcon className="w-3 h-3 mr-1" /> Mobile / WhatsApp
              </div>
              <p className="text-sm font-medium text-fountain-gray-900">{application.phone}</p>
            </div>
            <div className="bg-fountain-gray-50 p-3 rounded-xl border border-fountain-gray-100">
              <div className="flex items-center text-xs text-fountain-gray-500 mb-1">
                <MailIcon className="w-3 h-3 mr-1" /> Email (membership login)
              </div>
              <p className="text-sm font-medium text-fountain-gray-900">{application.email}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-fountain-gray-400 gap-2 text-sm">
              <Loader2Icon className="w-4 h-4 animate-spin" /> Loading full details…
            </div>
          ) : detail ? (
            <>
              <div>
                <h4 className="text-sm font-semibold text-fountain-gray-900 mb-3 flex items-center gap-1.5">
                  <BriefcaseIcon className="w-4 h-4" /> Occupation & business
                </h4>
                <div className="bg-white border border-fountain-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-fountain-gray-100 text-sm">
                  <Row label="Occupation" value={detail.occupation} />
                  <Row
                    label="Working?"
                    value={detail.is_employed ? `Yes — ${detail.employer || '—'}` : 'No'}
                  />
                  <Row
                    label="Owns business?"
                    value={detail.owns_business ? `Yes — ${detail.business_type || '—'}` : 'No'}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-fountain-gray-900 mb-3 flex items-center gap-1.5">
                  <MapPinIcon className="w-4 h-4" /> Addresses
                </h4>
                <div className="bg-white border border-fountain-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-fountain-gray-100 text-sm">
                  <Row label="Home" value={detail.home_address} />
                  <Row label="Office" value={detail.office_address} />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-fountain-gray-900 mb-3">Membership</h4>
                <div className="bg-white border border-fountain-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-fountain-gray-100 text-sm">
                  <Row label="Heard about us via" value={detail.referral_source} />
                  <Row
                    label="Monthly contribution"
                    value={formatNaira(Number(detail.monthly_contribution || 0))}
                  />
                  <Row
                    label="Fountain Basket"
                    value={detail.wants_fountain_basket ? 'Yes, registering' : 'No'}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-fountain-gray-900 mb-3 flex items-center gap-1.5">
                  <UsersIcon className="w-4 h-4" /> Next of kin & emergency contact
                </h4>
                <div className="bg-white border border-fountain-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-fountain-gray-100 text-sm">
                  <Row label="Name" value={detail.next_of_kin_name} />
                  <Row label="Address" value={detail.next_of_kin_address} />
                  <Row label="Mobile" value={detail.next_of_kin_phone} />
                  <Row label="Emergency contact" value={detail.emergency_contact} />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-fountain-gray-900 mb-3">Payment</h4>
                <div className="bg-white border border-fountain-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-fountain-gray-100 text-sm">
                  <Row label="Registration fee" value={formatNaira(Number(detail.registration_fee || 0))} />
                  <Row label="Reference" value={detail.payment_reference} />
                  <Row
                    label="Amount paid"
                    value={detail.amount_paid ? formatNaira(Number(detail.amount_paid)) : null}
                  />
                  <Row
                    label="Paid at"
                    value={detail.paid_at ? new Date(detail.paid_at).toLocaleString() : null}
                  />
                  <Row label="Declaration accepted" value={detail.declaration_accepted ? 'Yes' : 'No'} />
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-fountain-gray-400">Could not load full details.</p>
          )}
        </div>
      </div>
    </>
  );
}
