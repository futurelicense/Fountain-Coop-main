'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearToken } from '@/api/session';
import {
  UserIcon, PhoneIcon, MapPinIcon, MailIcon, ShieldCheckIcon, FileTextIcon,
  HelpCircleIcon, LogOutIcon, ChevronRightIcon, CameraIcon, XIcon, DownloadIcon,
  CheckCircleIcon, ClockIcon, UploadIcon, MessageCircleIcon,
  ChevronDownIcon, ChevronUpIcon, BuildingIcon, SendIcon,
} from 'lucide-react';

export default function MemberProfilePage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<'main' | 'statement' | 'kyc' | 'support'>('main');
  const [statementGenerated, setStatementGenerated] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [issueSubmitted, setIssueSubmitted] = useState(false);

  if (activeView === 'statement') {
    return (
      <div className="space-y-5 pt-4">
        <div className="flex items-center space-x-3">
          <button onClick={() => { setActiveView('main'); setStatementGenerated(false); }} className="p-2 -ml-2 text-fountain-gray-600 hover:text-fountain-gray-900"><XIcon className="w-5 h-5" /></button>
          <h2 className="text-lg font-bold text-fountain-gray-900">Download Statement</h2>
        </div>
        {!statementGenerated ? (
          <div className="space-y-5">
            <div className="bg-fountain-blue/5 border border-fountain-blue/20 rounded-xl p-4 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-fountain-blue text-white flex items-center justify-center font-bold text-sm">CO</div>
              <div><p className="text-sm font-bold text-fountain-gray-900">Chioma Okafor</p><p className="text-xs text-fountain-gray-500">FC-1001 • Lagos Main Branch</p></div>
            </div>
            <div><label className="block text-sm font-medium text-fountain-gray-700 mb-2">Select Product</label>
              <select className="w-full p-3 bg-white border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue"><option>All Products (Combined)</option><option>Cooperative Savings</option><option>Thrift Savings</option></select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-fountain-gray-700 mb-2">From</label><select className="w-full p-3 bg-white border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue"><option>January 2026</option><option>February 2026</option><option>March 2026</option></select></div>
              <div><label className="block text-sm font-medium text-fountain-gray-700 mb-2">To</label><select className="w-full p-3 bg-white border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue"><option>March 2026</option><option>February 2026</option><option>January 2026</option></select></div>
            </div>
            <div><label className="block text-xs font-medium text-fountain-gray-500 mb-2">Quick Select</label>
              <div className="flex flex-wrap gap-2">{['Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'Year to Date', 'All Time'].map((range) => <button key={range} className="px-3 py-1.5 bg-fountain-gray-100 text-fountain-gray-700 rounded-lg text-xs font-medium hover:bg-fountain-blue/10 hover:text-fountain-blue transition-colors">{range}</button>)}</div></div>
            <div><label className="block text-sm font-medium text-fountain-gray-700 mb-2">Format</label>
              <div className="grid grid-cols-3 gap-2">{[{ id: 'pdf', label: 'PDF', desc: 'Best for printing' }, { id: 'csv', label: 'CSV', desc: 'For spreadsheets' }, { id: 'excel', label: 'Excel', desc: 'Formatted table' }].map((fmt, idx) => <button key={fmt.id} className={`p-3 rounded-xl border-2 text-center transition-all ${idx === 0 ? 'border-fountain-blue bg-fountain-blue/5' : 'border-fountain-gray-200 hover:border-fountain-blue/50'}`}><p className="text-sm font-bold text-fountain-gray-900">{fmt.label}</p><p className="text-[10px] text-fountain-gray-400">{fmt.desc}</p></button>)}</div></div>
            <button onClick={() => setStatementGenerated(true)} className="w-full py-3.5 bg-fountain-blue text-white rounded-xl font-semibold text-sm shadow-lg shadow-fountain-blue/25 flex items-center justify-center space-x-2"><FileTextIcon className="w-4 h-4" /><span>Generate Statement</span></button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-fountain-gray-200 shadow-sm p-6 text-center">
              <div className="w-16 h-16 bg-fountain-green/10 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircleIcon className="w-8 h-8 text-fountain-green" /></div>
              <h3 className="text-lg font-bold text-fountain-gray-900 mb-1">Statement Ready!</h3>
              <p className="text-sm text-fountain-gray-500 mb-4">Your account statement has been generated</p>
            </div>
            <button className="w-full py-3.5 bg-fountain-blue text-white rounded-xl font-semibold text-sm shadow-lg shadow-fountain-blue/25 flex items-center justify-center space-x-2"><DownloadIcon className="w-4 h-4" /><span>Download PDF</span></button>
            <button className="w-full py-3 bg-white border border-fountain-gray-200 text-fountain-gray-700 rounded-xl font-medium text-sm flex items-center justify-center space-x-2"><SendIcon className="w-4 h-4" /><span>Send to Email</span></button>
            <button onClick={() => setStatementGenerated(false)} className="w-full text-center text-sm text-fountain-blue font-medium py-2">Generate Another Statement</button>
          </div>
        )}
      </div>
    );
  }

  if (activeView === 'kyc') {
    const documents = [
      { type: 'National ID (NIN)', status: 'verified', number: '123•••••89', date: 'Jul 15, 2025', icon: '🪪' },
      { type: 'BVN Verification', status: 'verified', number: '221•••••45', date: 'Jul 15, 2025', icon: '🏦' },
      { type: 'Passport Photo', status: 'verified', number: null, date: 'Jul 16, 2025', icon: '📷' },
      { type: 'Proof of Address', status: 'verified', number: 'Utility Bill', date: 'Jul 18, 2025', icon: '🏠' },
      { type: 'Next of Kin Form', status: 'pending', number: null, date: 'Mar 20, 2026', icon: '👤' },
      { type: 'Employment Letter', status: 'not_uploaded', number: null, date: null, icon: '💼' },
    ];
    return (
      <div className="space-y-5 pt-4">
        <div className="flex items-center space-x-3">
          <button onClick={() => setActiveView('main')} className="p-2 -ml-2 text-fountain-gray-600"><XIcon className="w-5 h-5" /></button>
          <h2 className="text-lg font-bold text-fountain-gray-900">KYC Documents</h2>
        </div>
        <div className="bg-fountain-green/5 border border-fountain-green/20 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 bg-fountain-green/10 rounded-full flex items-center justify-center"><ShieldCheckIcon className="w-5 h-5 text-fountain-green" /></div>
          <div><p className="text-sm font-bold text-fountain-green">KYC Verified</p><p className="text-xs text-fountain-gray-500">Your identity has been verified. 4 of 6 documents approved.</p></div>
        </div>
        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4">
          <div className="flex justify-between text-xs mb-1.5"><span className="text-fountain-gray-500 font-medium">Completion</span><span className="font-bold text-fountain-gray-900">4 of 6 documents</span></div>
          <div className="w-full bg-fountain-gray-100 rounded-full h-2"><div className="bg-fountain-green h-2 rounded-full" style={{ width: '67%' }} /></div>
        </div>
        <div className="space-y-3">
          {documents.map((doc, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{doc.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-fountain-gray-900">{doc.type}</p>
                    {doc.number && <p className="text-xs text-fountain-gray-500 font-mono mt-0.5">{doc.number}</p>}
                    {doc.date && <p className="text-[10px] text-fountain-gray-400 mt-0.5">Uploaded: {doc.date}</p>}
                  </div>
                </div>
                <div>
                  {doc.status === 'verified' && <span className="flex items-center text-[10px] font-bold text-fountain-green bg-fountain-green/10 px-2 py-1 rounded-md"><CheckCircleIcon className="w-3 h-3 mr-1" /> Verified</span>}
                  {doc.status === 'pending' && <span className="flex items-center text-[10px] font-bold text-fountain-amber bg-fountain-amber/10 px-2 py-1 rounded-md"><ClockIcon className="w-3 h-3 mr-1" /> Pending</span>}
                  {doc.status === 'not_uploaded' && <span className="flex items-center text-[10px] font-bold text-fountain-gray-500 bg-fountain-gray-100 px-2 py-1 rounded-md">Required</span>}
                </div>
              </div>
              {doc.status === 'not_uploaded' && <button className="mt-3 w-full py-2.5 bg-fountain-gray-50 border border-dashed border-fountain-gray-300 rounded-lg text-xs font-medium text-fountain-blue flex items-center justify-center space-x-1.5"><UploadIcon className="w-3.5 h-3.5" /><span>Upload Document</span></button>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeView === 'support') {
    const faqs = [
      { q: 'How do I make a savings deposit?', a: 'Navigate to Products → Cooperative tab and tap the "Deposit" button. You can pay via bank transfer, card, or USSD. Your deposit will reflect immediately after confirmation.' },
      { q: 'When can I withdraw my cooperative savings?', a: 'Withdrawals require a 30-day notice period and admin approval. Go to Products → Cooperative → Withdraw to submit a request.' },
      { q: 'How does the Ajo/Osusu cycle work?', a: 'Each cycle has a fixed number of participants who contribute equally each month. Payouts rotate based on your position number.' },
      { q: 'What happens if I miss a thrift contribution?', a: 'Missed days are recorded and may affect your streak. Contact your collector or make the payment through the app.' },
      { q: 'How do I apply for a loan?', a: "Go to Loans → Apply for a Loan. You'll need to select a product, enter the amount, add guarantors, and submit for review." },
      { q: 'How do I update my personal information?', a: 'Contact your branch office or the admin team to update personal details like phone number, address, or next of kin.' },
    ];
    return (
      <div className="space-y-5 pt-4">
        <div className="flex items-center space-x-3">
          <button onClick={() => { setActiveView('main'); setIssueSubmitted(false); }} className="p-2 -ml-2 text-fountain-gray-600"><XIcon className="w-5 h-5" /></button>
          <h2 className="text-lg font-bold text-fountain-gray-900">Help & Support</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <a href="tel:+2341234567890" className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4 text-center hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-fountain-blue/10 rounded-full flex items-center justify-center mx-auto mb-2"><PhoneIcon className="w-5 h-5 text-fountain-blue" /></div>
            <p className="text-xs font-bold text-fountain-gray-900">Call Us</p><p className="text-[10px] text-fountain-gray-400 mt-0.5">9am - 5pm</p>
          </a>
          <a href="https://wa.me/2341234567890" className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4 text-center hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-fountain-green/10 rounded-full flex items-center justify-center mx-auto mb-2"><MessageCircleIcon className="w-5 h-5 text-fountain-green" /></div>
            <p className="text-xs font-bold text-fountain-gray-900">WhatsApp</p><p className="text-[10px] text-fountain-gray-400 mt-0.5">Quick chat</p>
          </a>
          <a href="mailto:support@fountaincoop.com" className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4 text-center hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-fountain-amber/10 rounded-full flex items-center justify-center mx-auto mb-2"><MailIcon className="w-5 h-5 text-fountain-amber" /></div>
            <p className="text-xs font-bold text-fountain-gray-900">Email</p><p className="text-[10px] text-fountain-gray-400 mt-0.5">24hr reply</p>
          </a>
        </div>
        <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-fountain-dark/10 rounded-full flex items-center justify-center"><BuildingIcon className="w-5 h-5 text-fountain-dark" /></div>
            <div className="flex-1"><p className="text-sm font-bold text-fountain-gray-900">Lagos Main Branch</p><p className="text-xs text-fountain-gray-500">15 Marina Road, Lagos Island</p><p className="text-[10px] text-fountain-gray-400 mt-0.5">Mon-Fri: 8am-4pm • Sat: 9am-1pm</p></div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-fountain-gray-900 mb-3">Frequently Asked Questions</h3>
          <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm overflow-hidden divide-y divide-fountain-gray-100">
            {faqs.map((faq, idx) => (
              <div key={idx}>
                <button onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)} className="w-full flex items-center justify-between p-4 text-left hover:bg-fountain-gray-50 transition-colors">
                  <span className="text-sm font-medium text-fountain-gray-900 pr-4">{faq.q}</span>
                  {expandedFaq === idx ? <ChevronUpIcon className="w-4 h-4 text-fountain-blue flex-shrink-0" /> : <ChevronDownIcon className="w-4 h-4 text-fountain-gray-400 flex-shrink-0" />}
                </button>
                {expandedFaq === idx && <div className="px-4 pb-4 -mt-1"><p className="text-xs text-fountain-gray-600 leading-relaxed bg-fountain-gray-50 p-3 rounded-lg">{faq.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-fountain-gray-900 mb-3">Report an Issue</h3>
          {!issueSubmitted ? (
            <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-4 space-y-4">
              <div><label className="block text-sm font-medium text-fountain-gray-700 mb-1">Category</label><select className="w-full p-3 bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue"><option>Select category...</option><option>Account Issue</option><option>Payment Problem</option><option>Loan Query</option><option>App Bug</option><option>Complaint</option><option>Other</option></select></div>
              <div><label className="block text-sm font-medium text-fountain-gray-700 mb-1">Describe your issue</label><textarea rows={4} placeholder="Tell us what happened..." className="w-full p-3 bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue resize-none" /></div>
              <button onClick={() => setIssueSubmitted(true)} className="w-full py-3 bg-fountain-blue text-white rounded-xl font-semibold text-sm shadow-lg shadow-fountain-blue/25">Submit Issue</button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-fountain-gray-200 shadow-sm p-6 text-center">
              <div className="w-14 h-14 bg-fountain-green/10 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircleIcon className="w-7 h-7 text-fountain-green" /></div>
              <h4 className="text-base font-bold text-fountain-gray-900 mb-1">Issue Submitted</h4>
              <p className="text-sm text-fountain-gray-500 mb-1">Ticket #SUP-2026-0412</p>
              <p className="text-xs text-fountain-gray-400">We'll respond within 24 hours via SMS or email.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-4">
      <div className="bg-white rounded-2xl border border-fountain-gray-200 shadow-sm p-5 text-center">
        <div className="relative w-20 h-20 mx-auto mb-3">
          <div className="w-20 h-20 rounded-full bg-fountain-blue text-white flex items-center justify-center text-2xl font-bold">CO</div>
          <button className="absolute bottom-0 right-0 p-1.5 bg-fountain-blue text-white rounded-full shadow-lg"><CameraIcon className="w-3 h-3" /></button>
        </div>
        <h2 className="text-lg font-bold text-fountain-gray-900">Chioma Okafor</h2>
        <p className="text-sm text-fountain-gray-500">FC-1001</p>
        <div className="flex items-center justify-center space-x-1 mt-1"><ShieldCheckIcon className="w-3 h-3 text-fountain-green" /><span className="text-xs text-fountain-green font-medium">Verified Member</span></div>
      </div>

      <div className="bg-white rounded-2xl border border-fountain-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-fountain-gray-100"><h3 className="text-sm font-semibold text-fountain-gray-900">Personal Information</h3></div>
        <div className="divide-y divide-fountain-gray-100">
          {[
            { icon: <PhoneIcon className="w-4 h-4 text-fountain-gray-400 mr-3" />, label: 'Phone', value: '+234 803 123 4567' },
            { icon: <MailIcon className="w-4 h-4 text-fountain-gray-400 mr-3" />, label: 'Email', value: 'chioma.okafor@email.com' },
            { icon: <MapPinIcon className="w-4 h-4 text-fountain-gray-400 mr-3" />, label: 'Branch', value: 'Lagos Main' },
            { icon: <UserIcon className="w-4 h-4 text-fountain-gray-400 mr-3" />, label: 'Member Since', value: 'June 2025' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center px-5 py-3.5">
              {item.icon}
              <div className="flex-1"><p className="text-xs text-fountain-gray-400">{item.label}</p><p className="text-sm text-fountain-gray-900">{item.value}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-fountain-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-fountain-gray-100">
          <button onClick={() => setActiveView('statement')} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-fountain-gray-50 transition-colors">
            <div className="flex items-center space-x-3"><FileTextIcon className="w-5 h-5 text-fountain-blue" /><div className="text-left"><span className="text-sm font-medium text-fountain-gray-900 block">Download Statement</span><span className="text-[10px] text-fountain-gray-400">PDF, CSV, or Excel format</span></div></div>
            <ChevronRightIcon className="w-4 h-4 text-fountain-gray-400" />
          </button>
          <button onClick={() => setActiveView('kyc')} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-fountain-gray-50 transition-colors">
            <div className="flex items-center space-x-3"><ShieldCheckIcon className="w-5 h-5 text-fountain-teal" /><div className="text-left"><span className="text-sm font-medium text-fountain-gray-900 block">KYC Documents</span><span className="text-[10px] text-fountain-gray-400">4 of 6 verified</span></div></div>
            <ChevronRightIcon className="w-4 h-4 text-fountain-gray-400" />
          </button>
          <button onClick={() => setActiveView('support')} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-fountain-gray-50 transition-colors">
            <div className="flex items-center space-x-3"><HelpCircleIcon className="w-5 h-5 text-fountain-amber" /><div className="text-left"><span className="text-sm font-medium text-fountain-gray-900 block">Help & Support</span><span className="text-[10px] text-fountain-gray-400">FAQs, contact, report issue</span></div></div>
            <ChevronRightIcon className="w-4 h-4 text-fountain-gray-400" />
          </button>
        </div>
      </div>

      <button type="button" onClick={() => { clearToken(); router.push('/'); }} className="w-full flex items-center justify-center space-x-2 py-3 bg-white border border-fountain-red/20 rounded-xl text-fountain-red hover:bg-fountain-red/5 transition-colors">
        <LogOutIcon className="w-4 h-4" /><span className="text-sm font-medium">Sign Out</span>
      </button>
      <p className="text-center text-[10px] text-fountain-gray-400 pb-4">Fountain Coop v1.0.0 • Member Portal</p>
    </div>
  );
}
