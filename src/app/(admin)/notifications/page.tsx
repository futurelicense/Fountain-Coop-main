'use client';

import { useMemo } from 'react';
import {
  BellIcon,
  SendIcon,
  CheckCheckIcon,
  AlertCircleIcon,
  SearchIcon,
  MessageSquareIcon,
  SmartphoneIcon,
  MailIcon,
  PlusIcon,
  Trash2,
} from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickStr } from '@/lib/pickData';

export default function NotificationsPage() {
  const rows = useOperationalRecords('notifications', 'notification');

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SMS': return <SmartphoneIcon className="w-4 h-4" />;
      case 'WhatsApp': return <MessageSquareIcon className="w-4 h-4" />;
      case 'In-App': return <BellIcon className="w-4 h-4" />;
      case 'Email': return <MailIcon className="w-4 h-4" />;
      default: return <BellIcon className="w-4 h-4" />;
    }
  };

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case 'SMS': return <Badge variant="info" size="sm">{channel}</Badge>;
      case 'WhatsApp': return <Badge variant="success" size="sm">{channel}</Badge>;
      case 'In-App': return <Badge variant="neutral" size="sm">{channel}</Badge>;
      case 'Email': return <Badge variant="warning" size="sm">{channel}</Badge>;
      default: return <Badge size="sm">{channel}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered': return <Badge variant="success" size="sm">{status}</Badge>;
      case 'Failed': return <Badge variant="danger" size="sm">{status}</Badge>;
      case 'Partial': return <Badge variant="warning" size="sm">{status}</Badge>;
      default: return <Badge size="sm">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'loan': return 'bg-fountain-teal/10 text-fountain-teal';
      case 'reminder': return 'bg-fountain-blue/10 text-fountain-blue';
      case 'alert': return 'bg-fountain-red/10 text-fountain-red';
      case 'payout': return 'bg-fountain-green/10 text-fountain-green';
      case 'welcome': return 'bg-purple-500/10 text-purple-500';
      case 'promo': return 'bg-fountain-amber/10 text-fountain-amber';
      default: return 'bg-fountain-gray-100 text-fountain-gray-600';
    }
  };

  const delivered = useMemo(() => rows.items.filter((n) => pickStr(n.data, 'status') === 'Delivered').length, [rows.items]);
  const failed = useMemo(() => rows.items.filter((n) => pickStr(n.data, 'status') === 'Failed').length, [rows.items]);
  const rate = rows.items.length > 0 ? `${Math.round((delivered / rows.items.length) * 100)}%` : '—';

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fountain-gray-900">Notifications</h2>
          <p className="text-fountain-gray-600 mt-1">Manage member and staff communications across all channels.</p>
        </div>
        <button type="button" disabled={rows.loading} onClick={() => void rows.createRow('notification', { title: 'New message', message: 'Message body', channel: 'In-App', type: 'reminder', recipient: 'All members', sentAt: new Date().toISOString().slice(0, 16).replace('T', ' '), status: 'Delivered' })} className="flex items-center justify-center px-4 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <PlusIcon className="w-4 h-4 mr-2" />Compose
        </button>
      </div>

      {rows.error ? <p className="text-sm text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-4 py-3">{rows.error}</p> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Rows" value={String(rows.items.length)} icon={<SendIcon className="w-6 h-6" />} iconBgColor="bg-fountain-blue/10" iconColor="text-fountain-blue" />
        <KPICard title="Delivered" value={String(delivered)} icon={<CheckCheckIcon className="w-6 h-6" />} iconBgColor="bg-fountain-green/10" iconColor="text-fountain-green" subtitle={`of ${rows.items.length}`} />
        <KPICard title="Failed" value={String(failed)} icon={<AlertCircleIcon className="w-6 h-6" />} iconBgColor="bg-fountain-red/10" iconColor="text-fountain-red" />
        <KPICard title="Delivery rate" value={rate} icon={<BellIcon className="w-6 h-6" />} iconBgColor="bg-fountain-teal/10" iconColor="text-fountain-teal" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><div className="flex items-center space-x-3"><div className="p-2 bg-fountain-blue/10 text-fountain-blue rounded-lg"><SmartphoneIcon className="w-5 h-5" /></div><div><p className="text-xs text-fountain-gray-500">SMS rows</p><p className="text-lg font-bold text-fountain-gray-900">{rows.items.filter((n) => pickStr(n.data, 'channel') === 'SMS').length}</p></div></div></Card>
        <Card><div className="flex items-center space-x-3"><div className="p-2 bg-fountain-green/10 text-fountain-green rounded-lg"><MessageSquareIcon className="w-5 h-5" /></div><div><p className="text-xs text-fountain-gray-500">WhatsApp rows</p><p className="text-lg font-bold text-fountain-gray-900">{rows.items.filter((n) => pickStr(n.data, 'channel') === 'WhatsApp').length}</p></div></div></Card>
        <Card><div className="flex items-center space-x-3"><div className="p-2 bg-fountain-gray-100 text-fountain-gray-600 rounded-lg"><BellIcon className="w-5 h-5" /></div><div><p className="text-xs text-fountain-gray-500">In-App rows</p><p className="text-lg font-bold text-fountain-gray-900">{rows.items.filter((n) => pickStr(n.data, 'channel') === 'In-App').length}</p></div></div></Card>
      </div>

      <div className="bg-white p-4 rounded-xl border border-fountain-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="w-5 h-5 text-fountain-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input type="text" placeholder="Search notifications..." className="w-full pl-10 pr-4 py-2 bg-fountain-gray-50 border border-fountain-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fountain-blue/50" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-fountain-gray-100">
          {rows.items.map((row) => {
            const notif = row.data;
            const type = pickStr(notif, 'type', 'reminder');
            return (
              <div key={row.id} className="px-6 py-4 hover:bg-fountain-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-full mt-0.5 ${getTypeIcon(type)}`}>{getChannelIcon(pickStr(notif, 'channel', 'In-App'))}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-fountain-gray-900">{pickStr(notif, 'title')}</h4>
                      {getChannelBadge(pickStr(notif, 'channel', 'In-App'))}
                      {getStatusBadge(pickStr(notif, 'status', 'Delivered'))}
                    </div>
                    <p className="text-sm text-fountain-gray-600 mb-1">{pickStr(notif, 'message')}</p>
                    <div className="flex items-center flex-wrap gap-3 text-xs text-fountain-gray-400">
                      <span>To: {pickStr(notif, 'recipient')}</span>
                      <span>•</span>
                      <span>{pickStr(notif, 'sentAt')}</span>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs">
                      <button type="button" className="text-fountain-blue hover:underline" onClick={() => void rows.patchRow(row.id, { status: 'Delivered' })}>Mark delivered</button>
                      <button type="button" className="text-fountain-red hover:underline" onClick={() => void rows.removeRow(row.id)}>Delete</button>
                    </div>
                  </div>
                  <button type="button" className="text-fountain-gray-400 hover:text-fountain-red p-1 shrink-0" onClick={() => void rows.removeRow(row.id)}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
        {!rows.loading && !rows.items.length ? <p className="text-sm text-fountain-gray-500 p-6 text-center">No notifications yet.</p> : null}
      </div>
    </div>
  );
}
