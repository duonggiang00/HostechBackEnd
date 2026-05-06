import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, AlertCircle, Clock, ExternalLink, FileText } from 'lucide-react';
import { useInvoice } from '@/shared/features/billing/hooks/useInvoice';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { toast } from 'react-hot-toast';
import { SubmitPaymentProofModal } from './SubmitPaymentProofModal';
import { TenantInvoicePaymentActions } from './TenantInvoicePaymentActions';
import type { Invoice } from '@/shared/features/billing/types';

interface Props {
  invoiceId: string | null;
  onClose: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa có';
  return new Date(value).toLocaleDateString('vi-VN');
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PAID': return 'Đã thanh toán';
    case 'ISSUED': return 'Chờ thanh toán';
    case 'PARTIAL': return 'Thanh toán 1 phần';
    case 'OVERDUE': return 'Quá hạn';
    default: return status;
  }
};

const getStatusClasses = (status: string) => {
  switch (status) {
    case 'PAID': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300';
    case 'ISSUED': return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
    case 'PARTIAL': return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300';
    case 'OVERDUE': return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300';
    default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PAID': return <CheckCircle2 className="h-4 w-4" />;
    case 'OVERDUE': return <AlertCircle className="h-4 w-4" />;
    case 'PARTIAL': return <Clock className="h-4 w-4 opacity-70" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

export const TenantInvoiceDetailModal: React.FC<Props> = ({ invoiceId, onClose }) => {
  const { user } = useAuthStore();
  const { useInvoiceDetails, createVnpayPayment } = useInvoice();
  const { data: invoice, isLoading } = useInvoiceDetails(invoiceId || '');

  const [isPaying, setIsPaying] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);

  // Use the same outstanding calculation
  const outstandingAmount = invoice ? Math.max(0, Number(invoice.debt ?? invoice.total_amount - invoice.paid_amount)) : 0;

  const handlePay = () => {
    if (!invoice || !user?.id) return;
    
    if (outstandingAmount <= 0) {
      toast.error('Hóa đơn này không còn số dư cần thanh toán.');
      return;
    }

    setIsPaying(true);
    createVnpayPayment.mutate(
      {
        org_id: invoice.org_id || '',
        payer_user_id: user.id,
        method: 'QR',
        amount: outstandingAmount,
        note: `Thanh toán ${invoice.code}`,
        allocations: [{ invoice_id: invoice.id || '', amount: outstandingAmount }],
      },
      {
        onSuccess: (response) => {
          window.location.assign(response.payment_url);
        },
        onError: () => {
          setIsPaying(false);
          toast.error('Lỗi khi lấy link thanh toán. Vui lòng thử lại.');
        },
      }
    );
  };

  const canPayManually = invoice && ['ISSUED', 'PARTIAL', 'OVERDUE'].includes(invoice.status) && outstandingAmount > 0;

  return (
    <>
      <AnimatePresence>
        {invoiceId && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative z-10 w-full max-w-lg h-[100dvh] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 flex flex-col shrink-0">
                <div className="flex items-start justify-between mb-4">
                  {isLoading || !invoice ? (
                    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-black ${getStatusClasses(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {getStatusLabel(invoice.status)}
                    </span>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 -mr-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {isLoading || !invoice ? (
                  <div className="space-y-4">
                    <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-black text-slate-950 dark:text-white leading-tight">
                      Hóa Đơn {invoice.code}
                    </h2>
                    <p className="flex flex-col text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                      <span>
                        Chu kỳ: {formatDate(invoice.period_start ?? undefined)} - {formatDate(invoice.period_end ?? undefined)}
                      </span>
                      <span>Hạn nộp: {formatDate(invoice.due_date ?? undefined)}</span>
                    </p>
                    <div className="mt-3">
                      {!invoice.pdf_url && (
                        <span className="text-xs font-medium text-slate-400">Chưa có bản mềm hóa đơn</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Content Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50 dark:bg-slate-950">
                {isLoading || !invoice ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Box */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm grid gap-4 grid-cols-2">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Tổng hóa đơn</p>
                        <p className="text-lg font-black text-slate-800 dark:text-slate-200">{formatCurrency(invoice.total_amount ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">Cần thanh toán</p>
                        <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(outstandingAmount)}</p>
                      </div>
                    </div>

                    {/* Items list */}
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 mt-6 px-1">Chi tiết phí</h3>
                      
                      <div className="space-y-3">
                        {(invoice.items && invoice.items.length > 0) ? (
                          invoice.items.map(item => (
                            <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white capitalize text-sm">{item.description}</p>
                                {item.quantity && item.unit_price && (
                                  <p className="text-xs font-medium text-slate-500 mt-1">
                                    {item.quantity} × {formatCurrency(item.unit_price)}
                                  </p>
                                )}
                              </div>
                              <p className="font-black text-slate-900 dark:text-white">{formatCurrency(item.amount ?? 0)}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm font-medium text-slate-400 text-center py-8">Không có dữ liệu chi phí.</p>
                        )}
                      </div>
                    </div>

                    {/* Bản mềm hóa đơn */}
                    <div>
                      <div className="flex items-center justify-between mb-3 mt-6 px-1">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Bản mềm hóa đơn</h3>
                        {invoice.pdf_url && (
                          <a
                            href={invoice.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Mở tab mới
                          </a>
                        )}
                      </div>
                      {invoice.pdf_url ? (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" style={{ height: '480px' }}>
                          <iframe
                            src={`${invoice.pdf_url}#toolbar=0`}
                            className="w-full h-full border-0"
                            title="Bản mềm hóa đơn"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                          <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                          <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Bản mềm hóa đơn chưa được tạo.</p>
                          <p className="text-xs text-slate-400 dark:text-slate-600">PDF sẽ tự động được tạo khi phát hành hóa đơn.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer / Actions */}
              {canPayManually && (
                <div className="shrink-0 border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <TenantInvoicePaymentActions
                    variant="drawer"
                    sectionTitle="Chọn hình thức thanh toán"
                    vnpayLabel="Thanh Toán Bằng VNPay"
                    vnpayPendingLabel="Đang chuyển hướng sang VNPay..."
                    manualLabel="Trả tiền mặt / chuyển khoản"
                    isVnpayPending={isPaying}
                    onVnpay={handlePay}
                    onManualProof={() => setShowProofModal(true)}
                  />
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Submit Payment Proof Modal */}
      {showProofModal && invoice && (
        <SubmitPaymentProofModal
          invoice={invoice as Invoice}
          onClose={() => setShowProofModal(false)}
          onSuccess={() => setShowProofModal(false)}
        />
      )}
    </>
  );
};
