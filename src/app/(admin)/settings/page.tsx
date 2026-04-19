import {
  UsersIcon,
  ShieldIcon,
  BellIcon,
  PaletteIcon,
  DatabaseIcon,
  GlobeIcon,
  KeyIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function SettingsPage() {
  const settingSections = [
    { icon: GlobeIcon, title: 'General Settings', description: 'Organization name, address, contact details, and branding', items: ['Organization Profile', 'Logo & Branding', 'Default Currency', 'Time Zone'], color: 'bg-fountain-blue/10 text-fountain-blue' },
    { icon: UsersIcon, title: 'Users & Roles', description: 'Manage admin users, roles, and permission levels', items: ['User Accounts (38)', 'Role Definitions (9)', 'Permission Matrix', 'Session Management'], color: 'bg-fountain-teal/10 text-fountain-teal' },
    { icon: DatabaseIcon, title: 'Product Configuration', description: 'Configure savings plans, loan products, pack rules, and cycle settings', items: ['Savings Plans (4)', 'Loan Products (4)', 'Thrift Plans (4)', 'Pack Templates (6)'], color: 'bg-fountain-green/10 text-fountain-green' },
    { icon: BellIcon, title: 'Notification Settings', description: 'Configure SMS, WhatsApp, email, and in-app notification rules', items: ['SMS Gateway', 'WhatsApp Business API', 'Email Templates', 'Trigger Rules'], color: 'bg-fountain-amber/10 text-fountain-amber' },
    { icon: ShieldIcon, title: 'Security & Compliance', description: 'Password policies, dual-authorization rules, and audit settings', items: ['Password Policy', 'Two-Factor Auth', 'Dual-Auth Rules', 'Data Retention'], color: 'bg-fountain-red/10 text-fountain-red' },
    { icon: PaletteIcon, title: 'White-Label', description: 'Multi-tenant configuration, branding, and tenant management', items: ['Tenant List', 'Branding Setup', 'Tenant Isolation', 'Usage Metrics'], color: 'bg-purple-500/10 text-purple-500' },
    { icon: KeyIcon, title: 'API & Integrations', description: 'Manage API keys, webhooks, and third-party integrations', items: ['API Keys', 'Webhooks', 'Payment Gateway', 'Bank Integration'], color: 'bg-indigo-500/10 text-indigo-500' },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-2xl font-bold text-fountain-gray-900">System Settings</h2>
        <p className="text-fountain-gray-600 mt-1">Configure platform parameters, user roles, products, and integrations.</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img src="/712c64ce-2884-4e65-9cac-33dd260726c9.png" alt="Fountain Coop Logo" className="h-14 w-14 object-contain bg-white rounded-full border-2 border-fountain-gray-200 p-1" />
            <div>
              <h3 className="text-lg font-bold text-fountain-gray-900">Fountain Coop</h3>
              <p className="text-sm text-fountain-gray-500">Multi-Purpose Co-operative Society Ltd</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="success" size="sm">Active</Badge>
                <span className="text-xs text-fountain-gray-400">Version 1.0.0 • Last updated March 26, 2026</span>
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-fountain-gray-500">
            <p>5 Branches • 38 Staff Users</p>
            <p>2,847 Members • 14 Modules</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {settingSections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <Card key={idx} className="flex flex-col h-full cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3 mb-3">
                <div className={`p-2.5 rounded-lg ${section.color}`}><Icon className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-bold text-fountain-gray-900">{section.title}</h4>
                  <p className="text-xs text-fountain-gray-500 mt-0.5">{section.description}</p>
                </div>
              </div>
              <div className="flex-1">
                <ul className="space-y-1.5">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-center text-sm text-fountain-gray-600 hover:text-fountain-blue transition-colors">
                      <span className="w-1 h-1 rounded-full bg-fountain-gray-400 mr-2"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-fountain-gray-100">
                <button className="text-sm font-medium text-fountain-blue hover:text-fountain-dark transition-colors">Configure &rarr;</button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
