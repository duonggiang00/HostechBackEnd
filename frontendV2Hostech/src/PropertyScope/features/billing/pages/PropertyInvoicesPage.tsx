import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Search, Filter, FileText, ClipboardList, TrendingUp, Loader2 } from 'lucide-react';
import { usePropertyInvoices } from '../hooks/usePropertyInvoices';
import { InvoiceStatusBadge } from '../components/InvoiceStatusBadge';
import { GenerateMonthlyModal } from '../components/GenerateMonthlyModal';
import { InvoiceDetailPanel } from '../components/InvoiceDetailPanel';
import { BillingPeriodChecklist } from '../components/BillingPeriodChecklist';
import { BulkApproveReadingsModal } from '../../metering/components/BulkApproveReadingsModal';
import type { InvoiceStatus } from '../types';
import { AnimatePresence } from 'framer-motion';


export function PropertyInvoicesPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
  const [page, setPage] = useState(1);
  
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isBulkApproveOpen, setIsBulkApproveOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const { data, isLoading } = usePropertyInvoices(propertyId!, {
    search: search || undefined,
    status: statusFilter || undefined,
    page,
    per_page: 15,
  });

  const { data: allInvoicesData, isLoading: statsLoading } = usePropertyInvoices(propertyId!, {
    per_page: 100,   // max backend cho phép là 100

    page: 1,
  });

  const summary = useMemo(() => {
    const all = allInvoicesData?.data ?? [];
    const totalRevenue = all.reduce((s, inv) => s + (inv.total_amount ?? 0), 0);
    const totalPaid    = all.reduce((s, inv) => s + (inv.paid_amount  ?? 0), 0);
    const totalDebt    = all.reduce((s, inv) => s + (inv.debt         ?? 0), 0);
    return { totalRevenue, totalPaid, totalDebt, count: all.length };
  }, [allInvoicesData]);

  const fmtVND = (n: number) =>
    n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

  const invoices = data?.data ?? [];
  const meta = data?.meta;

  const handleRowClick = (id: string) => setSelectedInvoiceId(id);

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 w-full flex flex-col min-h-0 relative">
      <div className="p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Hóa đơn thanh toán</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              Quản lý toàn bộ hóa đơn thu phí của tòa nhà
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBulkApproveOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-[8px] font-black text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <ClipboardList className="w-4 h-4 text-[#1E3A8A]" />
              Duyệt chốt số
            </button>
            <button 
              onClick={() => setIsGenerateModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-[8px] font-black text-sm transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Tạo hóa đơn tháng
            </button>
          </div>
        </div>

        {/* Billing Period Checklist */}
        <BillingPeriodChecklist
          propertyId={propertyId!}
          onOpenBulkApprove={() => setIsBulkApproveOpen(true)}
          onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
        />

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-[12px] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-500/10 rounded-full translate-x-12 -translate-y-12 blur-3xl group-hover:bg-blue-100 transition-all duration-500"></div>
            <div className="flex items-start justify-between relative z-10">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tổng doanh thu kỳ này</p>
              {statsLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-300" /> : <TrendingUp className="w-4 h-4 text-[#1E3A8A]" />}
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 relative z-10">
              {statsLoading ? <span className="text-slate-300 dark:text-slate-600">---</span> : fmtVND(summary.totalRevenue)}
            </h3>
            <p className="text-xs text-slate-400 mt-1 relative z-10">{summary.count} hóa đơn</p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 rounded-[12px] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-500/10 rounded-full translate-x-12 -translate-y-12 blur-3xl group-hover:bg-emerald-100 transition-all duration-500"></div>
            <div className="flex items-start justify-between relative z-10">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Đã thu</p>
              {statsLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-300" /> : null}
            </div>
            <h3 className="text-2xl font-black text-[#10B981] mt-2 relative z-10">
              {statsLoading ? <span className="text-slate-300 dark:text-slate-600">---</span> : fmtVND(summary.totalPaid)}
            </h3>
            <p className="text-xs text-slate-400 mt-1 relative z-10">
              {statsLoading ? '' : `${summary.totalRevenue > 0 ? Math.round(summary.totalPaid / summary.totalRevenue * 100) : 0}% tổng doanh thu`}
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 rounded-[12px] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 dark:bg-rose-500/10 rounded-full translate-x-12 -translate-y-12 blur-3xl group-hover:bg-rose-100 transition-all duration-500"></div>
            <div className="flex items-start justify-between relative z-10">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dư nợ / Chưa thanh toán</p>
              {statsLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-300" /> : null}
            </div>
            <h3 className="text-2xl font-black text-[#EF4444] mt-2 relative z-10">
              {statsLoading ? <span className="text-slate-300 dark:text-slate-600">---</span> : fmtVND(summary.totalDebt)}
            </h3>
            <p className="text-xs text-slate-400 mt-1 relative z-10">
              {statsLoading ? '' : summary.totalDebt > 0 ? `${allInvoicesData?.data.filter(i => i.debt > 0).length} hóa đơn còn nợ` : 'Không có dư nợ'}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm hóa đơn, mã phòng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] transition-all"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-sm font-bold text-slate-700 dark:text-slate-300 appearance-none focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] transition-all"
            >
               <option value="">Tất cả trạng thái</option>
               <option value="DRAFT">Nháp</option>
               <option value="ISSUED">Đã phát hành</option>
               <option value="PAID">Đã thanh toán</option>
               <option value="OVERDUE">Quá hạn</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-[12px] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
          {isLoading ? (
             <div className="flex justify-center py-20">
               <div className="w-8 h-8 border-4 border-[#1E3A8A]/20 border-t-[#1E3A8A] rounded-full animate-spin"></div>
             </div>
          ) : invoices.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-24 text-center px-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                 <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white mb-2">Chưa có hóa đơn nào</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">Danh sách hóa đơn trống hoặc không tìm thấy kết quả phù hợp với bộ lọc hiện tại.</p>
            </div>
          ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                     <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#4B5563] dark:text-slate-400">Phòng</th>
                     <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#4B5563] dark:text-slate-400">Kỳ thanh toán</th>
                     <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#4B5563] dark:text-slate-400">Tổng cộng</th>
                     <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#4B5563] dark:text-slate-400">Đã trả</th>
                     <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#4B5563] dark:text-slate-400">Còn nợ</th>
                     <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#4B5563] dark:text-slate-400">Trạng thái</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                   {invoices.map((inv) => (
                      <tr 
                        key={inv.id} 
                        onClick={() => handleRowClick(inv.id)}
                        className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                      >
                         <td className="py-4 px-6">
                            <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors">
                              {inv.room?.code ?? inv.room?.name ?? '—'}
                            </span>
                         </td>
                         <td className="py-4 px-6">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                               Tháng {new Date(inv.period_start).getMonth() + 1}/{new Date(inv.period_start).getFullYear()}
                            </span>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                               {new Date(inv.period_start).toLocaleDateString('vi-VN')} - {new Date(inv.period_end).toLocaleDateString('vi-VN')}
                            </div>
                         </td>
                         <td className="py-4 px-6">
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                               {inv.total_amount.toLocaleString()} ₫
                            </span>
                         </td>
                         <td className="py-4 px-6">
                            <span className="text-sm font-black text-[#10B981]">
                               {inv.paid_amount.toLocaleString()} ₫
                            </span>
                         </td>
                         <td className="py-4 px-6">
                           <span className={`text-sm font-black ${inv.debt > 0 ? 'text-[#EF4444]' : 'text-slate-400'}`}>
                             {inv.debt.toLocaleString()} ₫
                           </span>
                         </td>
                         <td className="py-4 px-6">
                            <InvoiceStatusBadge status={inv.status} />
                         </td>
                      </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          )}
          
          {/* Pagination */}
          {meta && meta.last_page > 1 && (
             <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
               <span className="text-xs font-bold text-slate-500">
                 Trang {meta.current_page} / {meta.last_page} ({meta.total} hóa đơn)
               </span>
               <div className="flex gap-1">
                 <button 
                   disabled={page === 1}
                   onClick={() => setPage(p => p - 1)}
                   className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-bold disabled:opacity-50"
                 >
                   Trước
                 </button>
                 <button 
                   disabled={page === meta.last_page}
                   onClick={() => setPage(p => p + 1)}
                   className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-bold disabled:opacity-50"
                 >
                   Sau
                 </button>
               </div>
             </div>
          )}
        </div>

      </div>

      <GenerateMonthlyModal 
        propertyId={propertyId!}
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
      />

      {isBulkApproveOpen && (
        <BulkApproveReadingsModal
          propertyId={propertyId!}
          isOpen={isBulkApproveOpen}
          onClose={() => setIsBulkApproveOpen(false)}
        />
      )}

      <AnimatePresence>
        {selectedInvoiceId && (
          <InvoiceDetailPanel 
            invoiceId={selectedInvoiceId} 
            onClose={() => setSelectedInvoiceId(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
