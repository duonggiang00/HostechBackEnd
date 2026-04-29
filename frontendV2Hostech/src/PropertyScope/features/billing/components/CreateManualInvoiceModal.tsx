import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { 
  X, Calendar, Plus, Trash2, Loader2, 
  FileText, Info, CheckCircle2, Save,
  Home, Settings, MoreHorizontal
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { billingApi } from '../api/billing';
import { roomsApi } from '../../rooms/api/rooms';
import type { CreateInvoicePayload, CreateInvoiceItemPayload, InvoiceItemType, InvoiceStatus } from '../types';

interface CreateManualInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  propertyId: string;
  roomName?: string;
}

const ITEM_TYPES: { value: InvoiceItemType; label: string; icon: any; color: string }[] = [
  { value: 'RENT', label: 'Tiền thuê phòng', icon: Home, color: 'text-blue-500' },
  { value: 'SERVICE', label: 'Phí dịch vụ / Tiền điện / Nước', icon: Settings, color: 'text-indigo-500' },
  { value: 'PENALTY', label: 'Phí phạt / Bồi thường', icon: Info, color: 'text-red-500' },
  { value: 'ADJUSTMENT', label: 'Điều chỉnh phí', icon: FileText, color: 'text-emerald-500' },
  { value: 'DEBT', label: 'Nợ cũ', icon: MoreHorizontal, color: 'text-slate-500' },
  { value: 'DEPOSIT', label: 'Tiền cọc', icon: FileText, color: 'text-blue-400' },
  { value: 'DISCOUNT', label: 'Giảm giá', icon: MoreHorizontal, color: 'text-green-500' },
];

export const CreateManualInvoiceModal: React.FC<CreateManualInvoiceModalProps> = ({ 
  isOpen, 
  onClose, 
  roomId,
  propertyId,
  roomName
}) => {
  const queryClient = useQueryClient();
  
  // ─── State ──────────────────────────────────────────────────────────────────
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(endOfMonth(new Date()), 3), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<InvoiceStatus>('ISSUED');
  const [items, setItems] = useState<CreateInvoiceItemPayload[]>([
    { type: 'SERVICE', description: '', quantity: 1, unit_price: 0, amount: 0 }
  ]);

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const { data: room } = useQuery({
    queryKey: ['rooms', roomId],
    queryFn: () => roomsApi.getRoom(roomId),
    enabled: isOpen,
  });

  const activeContract = room?.contracts?.find(
    c => String(c.status).toLowerCase() === 'active' || String(c.status).toLowerCase() === 'pending_termination'
  );

  // ─── Calculations ───────────────────────────────────────────────────────────
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  }, [items]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const addItem = () => {
    setItems([...items, { type: 'SERVICE', description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.error('Phải có ít nhất một hạng mục phí');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof CreateInvoiceItemPayload, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    // Auto calculate amount
    if (field === 'quantity' || field === 'unit_price') {
      const q = field === 'quantity' ? Number(value) : item.quantity;
      const p = field === 'unit_price' ? Number(value) : item.unit_price;
      item.amount = q * p;
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const createInvoiceMutation = useMutation({
    mutationFn: (payload: CreateInvoicePayload) => billingApi.createInvoice(payload),
    onSuccess: () => {
      toast.success('Hóa đơn đã được tạo thành công!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể tạo hóa đơn. Vui lòng kiểm tra lại.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeContract) {
      toast.error('Phòng hiện không có hợp đồng hiệu lực. Không thể tạo hóa đơn.');
      return;
    }

    if (items.some(item => !item.description || item.unit_price < 0)) {
      toast.error('Vui lòng nhập đầy đủ mô tả và đơn giá hợp lệ cho các hạng mục.');
      return;
    }

    createInvoiceMutation.mutate({
      property_id: propertyId,
      room_id: roomId,
      contract_id: activeContract.id,
      period_start: periodStart,
      period_end: periodEnd,
      due_date: dueDate,
      status: status,
      items: items.map(item => ({
        ...item,
        amount: item.quantity * item.unit_price
      }))
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight ">
                    Tạo Hóa Đơn Tùy Chỉnh
                  </h2>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    Phòng {roomName || room?.name} • {activeContract ? `Khách: ${activeContract.tenant_full_name || 'Khách thuê'}` : 'Phòng trống'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-12 h-12 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-2xl flex items-center justify-center transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <form id="manual-invoice-form" onSubmit={handleSubmit} className="space-y-10">
                
                {/* 1. General Info & Period */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> Từ ngày
                    </label>
                    <input
                      type="date"
                      required
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> Đến ngày
                    </label>
                    <input
                      type="date"
                      required
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <Info className="w-3.5 h-3.5" /> Hạn thanh toán
                    </label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-4 py-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl focus:ring-2 focus:ring-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold"
                    />
                  </div>
                </div>

                {/* 2. Items List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                      Chi tiết các khoản phí
                    </h3>
                    <button
                      type="button"
                      onClick={addItem}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-none uppercase"
                    >
                      <Plus className="w-4 h-4" /> Thêm hạng mục
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={index} 
                        className="group flex flex-col md:flex-row gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all hover:shadow-xl hover:shadow-slate-100 dark:hover:shadow-none"
                      >
                        {/* Type Select */}
                        <div className="min-w-[180px]">
                          <select
                            value={item.type}
                            onChange={(e) => updateItem(index, 'type', e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                          >
                            {ITEM_TYPES.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Description */}
                        <div className="flex-1">
                          <input
                            placeholder="Nhập nội dung/mô tả khoản phí..."
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Qty & Price */}
                        <div className="w-full md:w-32">
                          <input
                            type="number"
                            min="1"
                            placeholder="SL"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="w-full md:w-44">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              placeholder="Đơn giá"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-black text-right text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 ">đ</span>
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* 3. Summary & Note */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                       Ghi chú nội bộ / Gửi khách
                    </label>
                    <textarea
                      placeholder="Nhập ghi chú cho hóa đơn này (nếu có)..."
                      className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 dark:text-white min-h-[120px]"
                    />
                  </div>

                  <div className="bg-slate-900 dark:bg-indigo-600 p-8 rounded-[2rem] text-white shadow-2xl shadow-slate-200 dark:shadow-none space-y-4">
                    <div className="flex items-center justify-between border-b border-white/20 pb-4">
                      <span className="text-sm font-bold opacity-70 uppercase">Tổng cộng hóa đơn</span>
                      <span className="text-3xl font-black tabular-nums">{totalAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-tighter opacity-60">Trạng thái phát hành</span>
                      <div className="flex bg-white/10 p-1 rounded-xl">
                        <button 
                          type="button"
                          onClick={() => setStatus('DRAFT')}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${status === 'DRAFT' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/60 hover:text-white'}`}
                        >
                          Lưu nháp
                        </button>
                        <button 
                          type="button"
                          onClick={() => setStatus('ISSUED')}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${status === 'ISSUED' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/60 hover:text-white'}`}
                        >
                          Phát hành
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 text-slate-500 dark:text-slate-400 font-black uppercase text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
                disabled={createInvoiceMutation.isPending}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="manual-invoice-form"
                disabled={createInvoiceMutation.isPending || !activeContract}
                className="px-12 py-4 bg-indigo-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {createInvoiceMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang khởi tạo...
                  </>
                ) : (
                  <>
                    {status === 'DRAFT' ? <Save className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    {status === 'DRAFT' ? 'Lưu hóa đơn nháp' : 'Phát hành hóa đơn'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
