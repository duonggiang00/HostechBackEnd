import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Download, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { useInvoice } from '@/shared/features/billing/hooks/useInvoice';
import { format } from 'date-fns';

export default function TenantBillingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const { useInvoices } = useInvoice();
  const { data: invoicesResponse, isLoading } = useInvoices();
  
  const invoices = invoicesResponse?.data || [];

  const filteredInvoices = invoices.filter((inv: any) => {
    const matchesSearch = inv.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'ISSUED': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'OVERDUE': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle2 className="w-4 h-4" />;
      case 'ISSUED': return <Clock className="w-4 h-4" />;
      case 'OVERDUE': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Billing & Invoices</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your payments and billing history</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 rounded-4xl p-6 text-white relative overflow-hidden shadow-xl shadow-indigo-200 dark:shadow-none">
          <div className="relative z-10">
            <p className="text-indigo-200 font-bold uppercase tracking-wider text-xs mb-2">Total Outstanding</p>
            <h3 className="text-4xl font-black mb-4">
              ${invoices.filter((i: any) => ['ISSUED', 'OVERDUE'].includes(i.status)).reduce((acc: number, i: any) => acc + i.total - i.paid_amount, 0).toLocaleString()}
            </h3>
            <button className="px-6 py-2.5 bg-white text-indigo-600 rounded-xl text-sm font-black w-full hover:bg-slate-50 transition-colors">
              Pay All Balance
            </button>
          </div>
          <CreditCard className="absolute -bottom-6 -right-6 w-32 h-32 text-indigo-500/50 -rotate-12" />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-4xl p-6 border border-slate-200/60 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs mb-2">Next Payment Due</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-1">
              {invoices.filter((i: any) => i.status === 'ISSUED').length > 0 
                ? format(new Date(invoices.filter((i: any) => i.status === 'ISSUED')[0].due_date), 'MMM dd, yyyy')
                : 'No upcoming bills'
              }
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              For {invoices.filter((i: any) => i.status === 'ISSUED').length > 0 ? invoices.filter((i: any) => i.status === 'ISSUED')[0].code : '-'}
            </p>
          </div>
          <Clock className="absolute -bottom-6 -right-6 w-32 h-32 text-slate-100 dark:text-slate-700 -rotate-12" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by invoice #..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select 
              className="pl-10 pr-8 py-3 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="ISSUED">Unpaid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white dark:bg-slate-800 rounded-4xl border border-slate-200/60 dark:border-slate-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">Loading your invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center">
            <CreditCard className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium">No invoices found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-700">
            {filteredInvoices.map((inv: any, idx: number) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={inv.id}
                className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-base font-black text-slate-900 dark:text-slate-100 truncate">Invoice {inv.code}</h4>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${getStatusColor(inv.status)}`}>
                        {getStatusIcon(inv.status)}
                        {inv.status}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Due: {format(new Date(inv.due_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto gap-8">
                  <div className="text-left md:text-right">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Amount</p>
                    <p className="text-xl font-black text-slate-900 dark:text-slate-100">${inv.total.toLocaleString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">
                      <Download className="w-5 h-5" />
                    </button>
                    {['ISSUED', 'OVERDUE'].includes(inv.status) && (
                      <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg shadow-slate-900/10 active:scale-95">
                        Pay Now <ArrowUpRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
