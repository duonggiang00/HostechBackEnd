import { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  DollarSign,
  CreditCard,
  Zap,
  Ban
} from 'lucide-react';
import type { Invoice } from '../types';
import { RecordPaymentModal } from './RecordPaymentModal';
import { useIssueInvoice } from '../hooks/usePropertyInvoices';
import { PermissionGate } from '@/shared/features/auth/components/PermissionGate';

interface InvoiceManagerProps {
  roomId: string;
  data?: Invoice[];
  isLoading?: boolean;
}

export default function InvoiceManager({ data = [], isLoading }: InvoiceManagerProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { mutateAsync: issueInvoice, isPending: isIssuing } = useIssueInvoice();

  if (isLoading) {
    return (
      <div className="flex justify-center p-12 transition-colors">
        <div className="w-8 h-8 border-4 border-indigo-500/20 dark:border-indigo-400/20 border-t-indigo-500 dark:border-t-indigo-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-12 bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-5xl text-center transition-colors">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600 shadow-sm transition-colors">
          <FileText className="w-8 h-8" />
        </div>
        <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1 transition-colors">Không tìm thấy hóa đơn</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto transition-colors">
          Không tìm thấy lịch sử thanh toán cho phòng này. Hóa đơn được tạo tự động vào cuối mỗi chu kỳ.
        </p>
      </div>
    );
  }

  const handleIssue = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Phát hành hóa đơn này cho khách thuê?')) return;
    await issueInvoice({ id });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end px-1 transition-colors">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white transition-colors">Lịch sử thanh toán</h3>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 transition-colors">Hóa đơn gần đây</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">Tổng dư nợ</p>
          <p className="text-lg font-black text-rose-600 dark:text-rose-400 transition-colors">
            {data.reduce((acc, inv) => acc + (inv.debt || 0), 0).toLocaleString()}₫
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.sort((a, b) => new Date(b.period_start).getTime() - new Date(a.period_start).getTime()).map((invoice) => (
          <div key={invoice.id} className="group relative bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-4xl p-5 hover:border-indigo-100 dark:hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-50/50 dark:hover:shadow-none transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl transition-colors ${
                  invoice.status === 'PAID' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                  invoice.status === 'OVERDUE' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                  invoice.status === 'DRAFT' ? 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400' :
                  invoice.status === 'CANCELLED' ? 'bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 line-through' :
                  'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Hóa đơn tháng {new Date(invoice.period_start).getMonth() + 1}/{new Date(invoice.period_start).getFullYear()}
                  </h4>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 transition-colors">
                    Ngày gửi: {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('vi-VN') : 'Chưa gửi'}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${
                invoice.status === 'PAID' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                invoice.status === 'OVERDUE' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400' :
                invoice.status === 'DRAFT' ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400' :
                invoice.status === 'CANCELLED' ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500 line-through' :
                'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
              }`}>
                {invoice.status === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                {invoice.status === 'OVERDUE' && <AlertCircle className="w-3 h-3" />}
                {invoice.status === 'ISSUED' && <Clock className="w-3 h-3" />}
                {invoice.status === 'DRAFT' && <FileText className="w-3 h-3" />}
                {invoice.status === 'CANCELLED' && <Ban className="w-3 h-3" />}
                {invoice.status === 'PARTIALLY_PAID' && <CreditCard className="w-3 h-3" />}
                {
                  invoice.status === 'PAID' ? 'Đã thanh toán' : 
                  invoice.status === 'OVERDUE' ? 'Quá hạn' : 
                  invoice.status === 'DRAFT' ? 'Nháp' :
                  invoice.status === 'CANCELLED' ? 'Đã hủy' :
                  invoice.status === 'PARTIALLY_PAID' ? 'Trợ một phần' : 'Đã phát hành'
                }
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-600 transition-colors">
              <div>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Tổng tiền</p>
                <p className="text-sm font-black text-slate-900 dark:text-white transition-colors">{invoice.total_amount.toLocaleString()}₫</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Đã trả</p>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 transition-colors">{invoice.paid_amount.toLocaleString()}₫</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Còn nợ</p>
                <p className="text-sm font-black text-rose-600 dark:text-rose-400 transition-colors">{(invoice.debt || 0).toLocaleString()}₫</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 italic">
                <Clock className="w-3 h-3" />
                Kỳ: {new Date(invoice.period_start).toLocaleDateString('vi-VN')} - {new Date(invoice.period_end).toLocaleDateString('vi-VN')}
              </div>
              <div className="flex items-center gap-3">
                <PermissionGate role={['Manager', 'Staff', 'Owner']}>
                  {invoice.status === 'DRAFT' && (
                    <button 
                      onClick={(e) => handleIssue(e, invoice.id)}
                      disabled={isIssuing}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Zap className="w-3 h-3" />
                      Phát hành
                    </button>
                  )}
                  
                  {['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status) && (invoice.debt || 0) > 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInvoice(invoice);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-lg transition-colors"
                    >
                      <CreditCard className="w-3 h-3" />
                      Nhận tiền
                    </button>
                  )}
                </PermissionGate>

                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-widest group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:gap-2 transition-all">
                  Chi tiết
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full flex items-center justify-center gap-3 p-5 bg-slate-900 dark:bg-slate-700 text-white rounded-4xl font-black text-sm hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-xl shadow-slate-200 dark:shadow-none group">
        <DollarSign className="w-5 h-5 group-hover:scale-110 transition-transform" />
        Tạo hóa đơn tùy chỉnh
      </button>

      {selectedInvoice && (
        <RecordPaymentModal 
          isOpen={true} 
          invoice={selectedInvoice as any} 
          onClose={() => setSelectedInvoice(null)} 
        />
      )}
    </div>
  );
}
