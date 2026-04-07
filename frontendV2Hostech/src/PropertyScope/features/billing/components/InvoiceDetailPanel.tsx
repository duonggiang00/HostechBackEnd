import { useState } from 'react';
import { X, ArrowRight, Zap, CreditCard, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvoiceDetail, useCancelInvoice, useIssueInvoice } from '../hooks/usePropertyInvoices';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { RecordPaymentModal } from './RecordPaymentModal';
import { PermissionGate } from '@/shared/features/auth/components/PermissionGate';

interface Props {
  invoiceId: string;
  onClose: () => void;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('vi-VN', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  }).format(new Date(iso));
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

export function InvoiceDetailPanel({ invoiceId, onClose }: Props) {
  const { data: invoice, isLoading } = useInvoiceDetail(invoiceId);
  const { mutateAsync: issueInvoice, isPending: isIssuing } = useIssueInvoice(invoice?.property_id);
  const { mutateAsync: cancelInvoice, isPending: isCancelling } = useCancelInvoice(invoice?.property_id);

  const [activeTab, setActiveTab] = useState<'items' | 'timeline'>('items');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleIssue = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn phát hành hóa đơn này? Hóa đơn sẽ được gửi cho khách thuê.')) return;
    await issueInvoice({ id: invoiceId });
  };

  const handleCancel = async () => {
    const note = window.prompt('Lý do hủy hóa đơn này là gì?');
    if (note === null) return;
    await cancelInvoice({ id: invoiceId, payload: { note } });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative z-10 w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {isLoading || !invoice ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <InvoiceStatusBadge status={invoice.status} size="md" />
                  {invoice.is_termination && (
                    <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Tất toán hợp đồng
                    </span>
                  )}
                </div>
                
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1 leading-tight">
                  Kỳ {new Date(invoice.period_start).toLocaleDateString('vi-VN')} - {new Date(invoice.period_end).toLocaleDateString('vi-VN')}
                </h2>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Phòng {invoice.room?.code ?? invoice.room?.name}
                  </span>
                  <span>•</span>
                  <span>{invoice.property?.name}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="ml-3 p-2 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
              <div className="p-4 bg-white dark:bg-slate-900/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng cộng</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(invoice.total_amount)}</p>
              </div>
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10">
                <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-widest mb-1">Đã trả</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(invoice.paid_amount)}</p>
              </div>
              <div className="p-4 bg-rose-50/50 dark:bg-rose-900/10">
                <p className="text-[10px] font-bold text-rose-600/70 dark:text-rose-500/70 uppercase tracking-widest mb-1">Còn nợ</p>
                <p className="text-lg font-black text-rose-600 dark:text-rose-400">{formatCurrency(invoice.debt)}</p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <PermissionGate role={['Owner', 'Manager', 'Staff']}>
                {invoice.status === 'DRAFT' && (
                  <button
                    onClick={handleIssue}
                    disabled={isIssuing}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black transition-all disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" /> 
                    {isIssuing ? 'Đang xử lý...' : 'Phát hành hóa đơn'}
                  </button>
                )}
                
                {['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status) && invoice.debt > 0 && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black transition-all"
                  >
                    <CreditCard className="w-4 h-4" /> Nhận thanh toán
                  </button>
                )}
                
                {['DRAFT', 'ISSUED', 'OVERDUE'].includes(invoice.status) && (
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="ml-auto flex items-center gap-2 px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 rounded-xl text-sm font-black transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> 
                    {isCancelling ? '...' : 'Hủy hóa đơn'}
                  </button>
                )}
              </PermissionGate>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button
                onClick={() => setActiveTab('items')}
                className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === 'items'
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Chi tiết các khoản phí
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === 'timeline'
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Lịch sử trạng thái
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
              {activeTab === 'items' && (
                <div className="p-6 space-y-3">
                  {(invoice.items ?? []).map(item => (
                    <div key={item.id} className="flex justify-between items-start p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white capitalize">{item.description}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {item.quantity} x {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <p className="font-black text-slate-900 dark:text-white">{formatCurrency(item.amount)}</p>
                    </div>
                  ))}
                  
                  {invoice.items?.length === 0 && (
                    <div className="text-center py-12 text-slate-400">Không có dữ liệu chi phí.</div>
                  )}
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="p-6 space-y-6">
                  {(invoice.status_histories ?? []).length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-8">Chưa có lịch sử trạng thái.</p>
                  )}
                  {(invoice.status_histories ?? []).map((history, idx) => (
                    <div key={history.id} className="relative pl-6">
                      {idx !== (invoice.status_histories?.length ?? 0) - 1 && (
                        <div className="absolute left-2.5 top-6 bottom-[-24px] w-px bg-slate-200 dark:bg-slate-700" />
                      )}
                      <div className="absolute left-1 top-1.5 w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 ring-4 ring-slate-50 dark:ring-slate-900" />
                      
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {history.actor?.full_name || 'Hệ thống'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{formatDate(history.created_at)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1.5">
                        {history.from_status ? (
                          <>
                            <span className="text-xs font-bold text-slate-400"><InvoiceStatusBadge status={history.from_status} size="sm" /></span>
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                          </>
                        ) : null}
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          <InvoiceStatusBadge status={history.to_status} size="sm" />
                        </span>
                      </div>
                      
                      {history.note && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 italic">
                          "{history.note}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modals */}
            <AnimatePresence>
              {showPaymentModal && (
                <RecordPaymentModal 
                  isOpen={showPaymentModal}
                  onClose={() => setShowPaymentModal(false)}
                  invoice={invoice}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
