import { X, Receipt, Download, Send, CreditCard, History, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvoice } from '@/shared/features/billing/hooks/useInvoice';
import InvoiceStatusBadge from './InvoiceStatusBadge';

interface InvoiceDetailsModalProps {
  invoiceId: string;
  onClose: () => void;
}

export default function InvoiceDetailsModal({ invoiceId, onClose }: InvoiceDetailsModalProps) {
  const { useInvoiceDetails } = useInvoice();
  const { data: invoice, isLoading } = useInvoiceDetails(invoiceId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-zoom-out"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Receipt className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">
                    Invoice {invoice?.code || '...'}
                  </h2>
                  {invoice && <InvoiceStatusBadge status={invoice.status} />}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed billing breakdown</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">Fetching Ledger Data...</p>
              </div>
            ) : invoice ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Summary and Status */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Items Table */}
                  <div className="bg-slate-50 rounded-4xl p-6 border border-slate-100">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-6">Billable Items</h3>
                    <table className="w-full">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-4 text-xs font-black text-slate-400 uppercase">Description</th>
                          <th className="pb-4 text-xs font-black text-slate-400 uppercase text-center">Qty</th>
                          <th className="pb-4 text-xs font-black text-slate-400 uppercase text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {invoice.items?.map((item, i) => (
                          <tr key={i} className="group">
                            <td className="py-4">
                              <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{item.name}</p>
                              <p className="text-xs text-slate-500">{item.description}</p>
                            </td>
                            <td className="py-4 text-center">
                              <span className="text-xs font-bold text-slate-600">{item.quantity} {item.unit}</span>
                            </td>
                            <td className="py-4 text-right">
                              <span className="text-sm font-black text-slate-900">${item.total.toLocaleString()}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Property & Tenant Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-white border border-slate-100 rounded-3xl">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Property Origin</h3>
                      <p className="text-sm font-bold text-slate-900 uppercase italic">{invoice.property?.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{invoice.property?.address}</p>
                    </div>
                    <div className="p-6 bg-white border border-slate-100 rounded-3xl">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Billed To</h3>
                      <p className="text-sm font-bold text-slate-900 uppercase italic">{invoice.tenant?.name}</p>
                      <p className="text-xs text-slate-500 mt-1">Room {invoice.tenant?.room}</p>
                    </div>
                  </div>
                </div>

                {/* Right Side: Totals and Actions */}
                <div className="space-y-6">
                  <div className="p-8 bg-slate-900 rounded-4xl text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16" />
                    <h3 className="text-xs font-black uppercase text-indigo-400 tracking-[0.2em] mb-8">Financial Summary</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center opacity-60">
                        <span className="text-xs font-bold">Subtotal</span>
                        <span className="text-xs font-bold">${invoice.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center opacity-60">
                        <span className="text-xs font-bold">Tax (0%)</span>
                        <span className="text-xs font-bold">$0</span>
                      </div>
                      <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Total Due</span>
                        <span className="text-3xl font-black italic tracking-tighter">${invoice.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 active:scale-95">
                      <CreditCard className="w-4 h-4" />
                      Mark as Paid
                    </button>
                    <button className="flex items-center justify-center gap-3 w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all active:scale-95">
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                    <button className="flex items-center justify-center gap-3 w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all active:scale-95">
                      <Send className="w-4 h-4" />
                      Send to Tenant
                    </button>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                      <History className="w-4 h-4 text-slate-400" />
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Recent Activity</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-2 text-xs font-medium text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1" />
                        <p>Invoice generated by System at 09:41 AM</p>
                      </div>
                      <div className="flex gap-2 text-xs font-medium text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1" />
                        <p>Awaiting tenant interaction</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6 opacity-20" />
                <h3 className="text-xl font-black text-slate-900 italic uppercase">Invoice Not Found</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">The requested ledger entry does not exist.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
