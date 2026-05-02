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
      <div className="fixed inset-0 z-110 flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-zoom-out bg-[#0A0A0B]/85 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d0f] shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/25">
                <Receipt className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white">Hóa đơn {invoice?.code || '...'}</h2>
                  {invoice && <InvoiceStatusBadge status={invoice.status} />}
                </div>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">Chi tiết bảng kê hóa đơn</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-400 transition-all hover:bg-rose-500/15 hover:text-rose-400 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-8">
            {isLoading ? (
              <div className="flex h-64 flex-col items-center justify-center text-slate-500">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
                <p className="text-sm font-bold uppercase tracking-widest">Đang tải dữ liệu sổ cái...</p>
              </div>
            ) : invoice ? (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="space-y-8 lg:col-span-2">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h3 className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Các khoản thanh toán</h3>
                    <table className="w-full">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-4 text-xs font-black uppercase text-slate-500">Mô tả</th>
                          <th className="pb-4 text-center text-xs font-black uppercase text-slate-500">SL</th>
                          <th className="pb-4 text-right text-xs font-black uppercase text-slate-500">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {invoice.items?.map((item, i) => (
                          <tr key={i} className="group">
                            <td className="py-4">
                              <p className="text-sm font-black text-white transition-colors group-hover:text-emerald-400">{item.name}</p>
                              <p className="text-xs text-slate-500">{item.description}</p>
                            </td>
                            <td className="py-4 text-center">
                              <span className="text-xs font-bold text-slate-400">
                                {item.quantity} {item.unit}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <span className="text-sm font-black text-white">${item.total.toLocaleString()}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">Nguồn gốc Cơ sở</h3>
                      <p className="text-sm font-bold uppercase text-white">{invoice.property?.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{invoice.property?.address}</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">Người thanh toán</h3>
                      <p className="text-sm font-bold uppercase text-white">{invoice.tenant?.name}</p>
                      <p className="mt-1 text-xs text-slate-500">Phòng {invoice.tenant?.room}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="relative overflow-hidden rounded-3xl bg-emerald-950/40 p-8 text-white ring-1 ring-emerald-500/20">
                    <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl" />
                    <h3 className="mb-8 text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Tóm tắt Tài chính</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between opacity-80">
                        <span className="text-xs font-bold">Thành tiền</span>
                        <span className="text-xs font-bold">${(invoice.subtotal ?? invoice.total_amount).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between opacity-80">
                        <span className="text-xs font-bold">Thuế (0%)</span>
                        <span className="text-xs font-bold">$0</span>
                      </div>
                      <div className="flex items-end justify-between border-t border-white/10 pt-4">
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Tổng thanh toán</span>
                        <span className="text-3xl font-black tracking-tighter">
                          ${(invoice.total ?? invoice.total_amount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 active:scale-95">
                      <CreditCard className="h-4 w-4" />
                      Đánh dấu Đã thanh toán
                    </button>
                    <button className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-white/10 bg-white/5 py-4 text-xs font-black uppercase tracking-widest text-slate-300 transition-all hover:bg-white/10 active:scale-95">
                      <Download className="h-4 w-4" />
                      Tải PDF
                    </button>
                    <button className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-white/10 bg-white/5 py-4 text-xs font-black uppercase tracking-widest text-slate-300 transition-all hover:bg-white/10 active:scale-95">
                      <Send className="h-4 w-4" />
                      Gửi cho khách thuê
                    </button>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <History className="h-4 w-4 text-slate-500" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Hoạt động gần đây</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-2 text-xs font-medium text-slate-500">
                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <p>Hóa đơn được tạo bởi Hệ thống lúc 09:41 AM</p>
                      </div>
                      <div className="flex gap-2 text-xs font-medium text-slate-500">
                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
                        <p>Đang chờ khách thuê phản hồi</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center">
                <AlertCircle className="mx-auto mb-6 h-16 w-16 text-rose-500/30" />
                <h3 className="text-xl font-black uppercase text-white">Không tìm thấy Hóa đơn</h3>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  Mục dữ liệu sổ cái được yêu cầu không tồn tại.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
