'use client';

import { useMemo } from 'react';
import { DownloadIcon, FileTextIcon, ClockIcon, PlusIcon, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useOperationalRecords } from '@/hooks/useOperationalRecords';
import { pickStr } from '@/lib/pickData';

export default function ReportsPage() {
  const catalog = useOperationalRecords('reports', 'catalogEntry');

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Members': return 'bg-fountain-blue/10 text-fountain-blue';
      case 'Savings': return 'bg-fountain-green/10 text-fountain-green';
      case 'Thrift': return 'bg-fountain-teal/10 text-fountain-teal';
      case 'Ajo/Osusu': return 'bg-fountain-amber/10 text-fountain-amber';
      case 'Packs': return 'bg-purple-500/10 text-purple-500';
      case 'Loans': return 'bg-blue-500/10 text-blue-500';
      case 'Investment': return 'bg-emerald-500/10 text-emerald-600';
      case 'Recovery': return 'bg-fountain-red/10 text-fountain-red';
      case 'Branches': return 'bg-indigo-500/10 text-indigo-500';
      case 'Executive': return 'bg-fountain-dark/10 text-fountain-dark';
      case 'Compliance': return 'bg-orange-500/10 text-orange-500';
      case 'Finance': return 'bg-emerald-500/10 text-emerald-500';
      default: return 'bg-fountain-gray-100 text-fountain-gray-600';
    }
  };

  const getFrequencyBadge = (freq: string) => {
    switch (freq) {
      case 'Daily': return <Badge variant="info" size="sm">{freq}</Badge>;
      case 'Weekly': return <Badge variant="success" size="sm">{freq}</Badge>;
      case 'Monthly': return <Badge variant="neutral" size="sm">{freq}</Badge>;
      case 'On Demand': return <Badge variant="warning" size="sm">{freq}</Badge>;
      default: return <Badge size="sm">{freq}</Badge>;
    }
  };

  const scheduled = useMemo(
    () => catalog.items.filter((r) => ['Daily', 'Weekly', 'Monthly'].includes(pickStr(r.data, 'frequency'))).length,
    [catalog.items]
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fountain-gray-900">Reports & Analytics</h2>
          <p className="text-fountain-gray-600 mt-1">Generate, schedule, and export reports for management and compliance.</p>
        </div>
        <button type="button" disabled={catalog.loading} onClick={() => void catalog.createRow('catalogEntry', { name: 'New report', description: 'Describe the dataset and filters.', category: 'Finance', frequency: 'On Demand', lastGenerated: '—' })} className="flex items-center px-4 py-2 bg-fountain-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <PlusIcon className="w-4 h-4 mr-2" />Catalog entry
        </button>
      </div>

      {catalog.error ? <p className="text-sm text-fountain-red bg-fountain-red/5 border border-fountain-red/20 rounded-lg px-4 py-3">{catalog.error}</p> : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><div className="flex items-center space-x-3"><div className="p-3 bg-fountain-blue/10 text-fountain-blue rounded-lg"><FileTextIcon className="w-6 h-6" /></div><div><p className="text-sm text-fountain-gray-500">Catalog entries</p><p className="text-2xl font-bold text-fountain-gray-900">{catalog.items.length}</p></div></div></Card>
        <Card><div className="flex items-center space-x-3"><div className="p-3 bg-fountain-green/10 text-fountain-green rounded-lg"><ClockIcon className="w-6 h-6" /></div><div><p className="text-sm text-fountain-gray-500">Scheduled-style</p><p className="text-2xl font-bold text-fountain-gray-900">{scheduled}</p></div></div></Card>
        <Card><div className="flex items-center space-x-3"><div className="p-3 bg-fountain-amber/10 text-fountain-amber rounded-lg"><DownloadIcon className="w-6 h-6" /></div><div><p className="text-sm text-fountain-gray-500">Exports (UI)</p><p className="text-2xl font-bold text-fountain-gray-900">—</p></div></div></Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-fountain-gray-900 mb-4">Report Catalog</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {catalog.items.map((row) => {
            const report = row.data;
            const freq = pickStr(report, 'frequency', 'On Demand');
            const cat = pickStr(report, 'category', 'Executive');
            return (
              <Card key={row.id} className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className={`p-2 rounded-lg ${getCategoryColor(cat)}`}><FileTextIcon className="w-5 h-5" /></div>
                  <div className="flex items-center gap-1">
                    {getFrequencyBadge(freq)}
                    <button type="button" title="Delete" onClick={() => void catalog.removeRow(row.id)} className="p-1 text-fountain-gray-400 hover:text-fountain-red"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <h4 className="font-bold text-fountain-gray-900 mb-1">{pickStr(report, 'name', 'Report')}</h4>
                <p className="text-xs text-fountain-gray-500 mb-3 flex-1">{pickStr(report, 'description')}</p>
                <div className="flex items-center justify-between pt-3 border-t border-fountain-gray-100">
                  <span className="text-xs text-fountain-gray-400">Last: {pickStr(report, 'lastGenerated', '—')}</span>
                  <div className="flex gap-2">
                    <button type="button" className="text-xs font-medium text-fountain-blue hover:text-fountain-dark transition-colors" onClick={() => void catalog.patchRow(row.id, { lastGenerated: new Date().toISOString().slice(0, 10) })}>Generate</button>
                    <button type="button" className="text-xs font-medium text-fountain-gray-500 hover:text-fountain-gray-700 transition-colors flex items-center" onClick={() => void catalog.patchRow(row.id, { lastExportNote: 'csv_requested' })}>
                      <DownloadIcon className="w-3 h-3 mr-1" />CSV
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        {!catalog.loading && !catalog.items.length ? <p className="text-sm text-fountain-gray-500 mt-3">No catalog entries yet.</p> : null}
      </div>
    </div>
  );
}
