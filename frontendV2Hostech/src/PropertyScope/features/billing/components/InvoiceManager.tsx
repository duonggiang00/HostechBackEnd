import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  DollarSign
} from 'lucide-react';
import type { Invoice } from '@/PropertyScope/features/rooms/types';

interface InvoiceManagerProps {
  roomId: string;
  data?: Invoice[];
  isLoading?: boolean;
}

export default function InvoiceManager({ data = [], isLoading }: InvoiceManagerProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-12 bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem] text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
          <FileText className="w-8 h-8" />
        </div>
        <h4 className="text-lg font-black text-slate-900 mb-1">No Invoices Found</h4>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          No billing history detected for this unit. Invoices are generated automatically at the end of each cycle.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end px-1">
        <div>
          <h3 className="text-xl font-black text-slate-900">Billing History</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Recent Invoices</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Outstanding</p>
          <p className="text-lg font-black text-rose-600">
            {data.reduce((acc, inv) => acc + (inv.total_amount - inv.paid_amount), 0).toLocaleString()}₫
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()).map((invoice) => (
          <div key={invoice.id} className="group relative bg-white border border-slate-100 rounded-[2rem] p-5 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${
                  invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                  invoice.status === 'overdue' ? 'bg-rose-50 text-rose-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Invoice {new Date(invoice.issue_date).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Issued: {new Date(invoice.issue_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                invoice.status === 'overdue' ? 'bg-rose-100 text-rose-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {invoice.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                {invoice.status === 'overdue' && <AlertCircle className="w-3 h-3" />}
                {invoice.status === 'issued' && <Clock className="w-3 h-3" />}
                {invoice.status}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</p>
                <p className="text-sm font-black text-slate-900">{invoice.total_amount.toLocaleString()}₫</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Paid</p>
                <p className="text-sm font-black text-emerald-600">{invoice.paid_amount.toLocaleString()}₫</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Remaining</p>
                <p className="text-sm font-black text-rose-600">{(invoice.total_amount - invoice.paid_amount).toLocaleString()}₫</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 italic">
                <Clock className="w-3 h-3" />
                Period: {new Date(invoice.period_start).toLocaleDateString()} - {new Date(invoice.period_end).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1 text-indigo-600 font-black text-[10px] uppercase tracking-widest group-hover:gap-2 transition-all">
                View Details
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full flex items-center justify-center gap-3 p-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 group">
        <DollarSign className="w-5 h-5 group-hover:scale-110 transition-transform" />
        Generate Custom Invoice
      </button>
    </div>
  );
}
