// @ts-nocheck
import { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  Calendar,
  DollarSign,
  TrendingUp,
  Loader2
} from 'lucide-react';
import InvoiceStatusBadge from '@/OrgScope/features/finance/components/InvoiceStatusBadge';
import { useInvoice, type Invoice } from '@/shared/features/billing/hooks/useInvoice';
import InvoiceDetailsModal from '@/OrgScope/features/finance/components/InvoiceDetailsModal';

export default function InvoicesPage() {
  const [filter, setFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  
  const { useInvoices } = useInvoice();
  const { data: response, isLoading } = useInvoices({ status: filter !== 'all' ? filter.toUpperCase() : undefined });
  
  const invoices = response?.data || [];

  const stats = [
    { label: 'Total Revenue', value: '$45,230', change: '+12.5%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Collections', value: '$8,120', change: '-2.4%', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Active Contracts', value: '142', change: '+5', icon: Receipt, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];



  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Billing & Finance</h1>
          <p className="text-slate-500 mt-1">Monitor revenue, invoices, and payment statuses.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95">
            Create Invoice
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search invoices, tenants or units..."
               className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
             />
           </div>
           <div className="flex items-center gap-2">
             <button className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors">
               <Filter className="w-4 h-4" />
             </button>
             <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                {['all', 'paid', 'unpaid'].map((t) => (
                  <button 
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${filter === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {t}
                  </button>
                ))}
             </div>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Invoice</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Tenant</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-medium">
                    No invoices found.
                  </td>
                </tr>
              ) : invoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-900">{inv.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{inv.tenant?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 font-medium">Unit {inv.tenant?.room || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-slate-900">${inv.total?.toLocaleString() || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{inv.invoice_date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <InvoiceStatusBadge status={inv.status.toLowerCase()} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedInvoice(inv.id)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                       <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
             Showing {invoices.length} Invoices
           </p>
           <div className="flex gap-2">
              <button className="px-3 py-1 text-xs font-bold border border-slate-200 rounded-lg bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>Prev</button>
              <button className="px-3 py-1 text-xs font-bold border border-slate-200 rounded-lg bg-white text-slate-500 hover:bg-slate-50 outline-indigo-500" disabled>Next</button>
           </div>
        </div>
      </div>
      
      {selectedInvoice && (
        <InvoiceDetailsModal 
          invoiceId={selectedInvoice} 
          onClose={() => setSelectedInvoice(null)} 
        />
      )}
    </div>
  );
}

