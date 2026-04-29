import React from 'react';
import { format } from 'date-fns';
import { Plus, RotateCcw, Send, Settings2, Info } from 'lucide-react';
import { InvoiceItemRow } from './InvoiceItemRow';
import type { EditableInvoiceItem } from '../../types';

interface InvoiceCanvasProps {
  roomDetail: any;
  periodStart: string;
  setPeriodStart: (val: string) => void;
  periodEnd: string;
  setPeriodEnd: (val: string) => void;
  invoiceItems: EditableInvoiceItem[];
  onUpdateItem: (id: string, updates: Partial<EditableInvoiceItem>) => void;
  onRemoveItem: (id: string) => void;
  onAddCustomItem: () => void;
  onResetItems: () => void;
  totalAmount: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  calculateTieredAmount: (usage: number, tiers: any[]) => { total: number; breakdown: any[] };
}

export const InvoiceCanvas: React.FC<InvoiceCanvasProps> = ({
  roomDetail,
  periodStart,
  setPeriodStart,
  periodEnd,
  setPeriodEnd,
  invoiceItems,
  onUpdateItem,
  onRemoveItem,
  onAddCustomItem,
  onResetItems,
  totalAmount,
  isSubmitting,
  onSubmit,
  calculateTieredAmount
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const activeContract = roomDetail?.contracts?.find(
    (c: any) => c.status === 'ACTIVE' || c.status === 'PENDING_TERMINATION'
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-8 pb-20">
      {/* ─── Control Bar ─────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-white shadow-sm rounded-xl border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <Settings2 size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tạo hóa đơn</p>
              <p className="font-bold text-base text-gray-900 leading-tight">
                {roomDetail?.name || 'Vui lòng chọn phòng'}
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-gray-100 hidden lg:block" />

          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
            <div className="flex flex-col">
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider pl-1">Từ ngày</span>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="bg-transparent border-none text-sm font-semibold text-gray-900 focus:ring-0 p-0 pl-1 h-6"
              />
            </div>
            <span className="text-gray-300 text-sm">→</span>
            <div className="flex flex-col">
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider pl-1">Đến ngày</span>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="bg-transparent border-none text-sm font-semibold text-gray-900 focus:ring-0 p-0 pl-1 h-6"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onResetItems}
            className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors font-semibold text-sm"
          >
            <RotateCcw size={15} /> Reset
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting || !roomDetail}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white rounded-lg transition-colors font-semibold text-sm"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Send size={15} />}
            Xuất hóa đơn
          </button>
        </div>
      </div>

      {/* ─── A4 Canvas ──────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto bg-white shadow-md min-h-[1100px] rounded-xl border border-gray-200 flex flex-col">

        {!roomDetail && (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
              <Settings2 size={36} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-700 mb-1">Chưa chọn phòng</h2>
              <p className="text-gray-400 text-sm">
                Vui lòng chọn một phòng từ danh sách bên trái để bắt đầu lập hóa đơn
              </p>
            </div>
          </div>
        )}

        {roomDetail && (
          <div className="p-10 flex-1 flex flex-col">
            {/* Invoice Top Section */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">HÓA ĐƠN</h1>
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 font-semibold text-xs uppercase tracking-wider rounded-full">
                  Bản nháp • Chưa phát hành
                </span>
              </div>
              <div className="text-right">
                <h2 className="font-bold text-sm text-gray-800">{roomDetail.property?.name}</h2>
                <p className="text-xs text-gray-400 max-w-[240px] leading-relaxed mt-1">
                  {roomDetail.property?.address}
                </p>
              </div>
            </div>

            {/* Billing Info */}
            <div className="grid grid-cols-2 gap-10 mb-10">
              <div className="p-5 border border-gray-100 rounded-xl bg-gray-50">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-gray-400 mb-3">Khách hàng</h3>
                <p className="font-bold text-lg text-gray-900">
                  {activeContract?.tenant?.name || 'Chưa có người thuê'}
                </p>
                <p className="font-medium text-sm text-gray-500">Phòng {roomDetail.name}</p>
              </div>
              <div className="p-5 border border-gray-100 rounded-xl bg-gray-50 text-right">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-gray-400 mb-3">Chi tiết</h3>
                <div className="flex justify-end gap-8">
                  <div>
                    <p className="text-xs text-gray-400">Kỳ thanh toán</p>
                    <p className="font-bold text-sm text-gray-900">
                      {periodStart ? format(new Date(periodStart), 'MM/yyyy') : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Ngày tạo</p>
                    <p className="font-bold text-sm text-gray-900">{format(new Date(), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="py-3 font-semibold text-xs uppercase tracking-wider text-gray-400 w-10 text-center">#</th>
                    <th className="py-3 font-semibold text-xs uppercase tracking-wider text-gray-400 text-left">Nội dung</th>
                    <th className="py-3 font-semibold text-xs uppercase tracking-wider text-gray-400 w-20 text-center">SL</th>
                    <th className="py-3 font-semibold text-xs uppercase tracking-wider text-gray-400 w-32 text-right">Đơn giá</th>
                    <th className="py-3 font-semibold text-xs uppercase tracking-wider text-gray-400 w-36 text-right">Thành tiền</th>
                    <th className="w-8 shrink-0"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoiceItems.map((item, idx) => (
                    <InvoiceItemRow
                      key={item.id}
                      item={item}
                      index={idx}
                      onUpdate={onUpdateItem}
                      onRemove={onRemoveItem}
                      calculateTieredAmount={calculateTieredAmount}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </tbody>
              </table>

              {/* Add Item Button */}
              <button
                onClick={onAddCustomItem}
                className="mt-6 w-full py-4 border-2 border-dashed border-gray-200 hover:border-teal-400 hover:bg-teal-50 rounded-xl transition-colors flex items-center justify-center gap-3 text-gray-400 hover:text-teal-600"
              >
                <Plus size={16} />
                <span className="font-semibold text-sm">Thêm chi phí vào hóa đơn</span>
              </button>
            </div>

            {/* Summary */}
            <div className="mt-12 pt-6 border-t-2 border-gray-200 flex justify-between items-end">
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 max-w-sm">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-white rounded-lg shadow-sm text-teal-600 mt-0.5">
                    <Info size={16} />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Hóa đơn này được phát hành chính thức qua hệ thống. Vui lòng thanh toán trước ngày hạn.
                  </p>
                </div>
              </div>
              <div className="w-72 space-y-3">
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Tổng cộng (chưa VAT)</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Thuế GTGT (0%)</span>
                  <span className="font-semibold text-gray-800">0 ₫</span>
                </div>
                <div className="p-5 bg-teal-600 text-white rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-xs text-teal-200 mb-0.5">Tổng thanh toán</p>
                    <p className="text-2xl font-black">{formatCurrency(totalAmount)}</p>
                  </div>
                  <Send size={24} className="opacity-40" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
