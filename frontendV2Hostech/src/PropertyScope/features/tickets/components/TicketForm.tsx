import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useTicketMutations } from '../hooks/useTickets';
import type { CreateTicketPayload, TicketPriority } from '../types';

interface Props {
  propertyId: string;
  roomId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORIES = ['Điện', 'Nước', 'Internet', 'Điều hòa', 'Cơ sở vật chất', 'An ninh', 'Vệ sinh', 'Khác'];
const PRIORITIES: { value: TicketPriority; label: string; color: string }[] = [
  { value: 'LOW',    label: 'Thấp',   color: 'border-slate-300 text-slate-600' },
  { value: 'MEDIUM', label: 'Trung bình', color: 'border-blue-400 text-blue-700' },
  { value: 'HIGH',   label: 'Cao',    color: 'border-amber-400 text-amber-700' },
  { value: 'URGENT', label: 'Khẩn cấp', color: 'border-rose-400 text-rose-700' },
];

export default function TicketForm({ propertyId, roomId, onSuccess, onCancel }: Props) {
  const { createTicket } = useTicketMutations();

  const [form, setForm] = useState<Partial<CreateTicketPayload>>({
    property_id: propertyId,
    room_id: roomId || '',
    priority: 'MEDIUM',
    category: '',
    description: '',
    due_at: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.description?.trim()) { setError('Vui lòng nhập mô tả sự cố.'); return; }
    if (!form.room_id) { setError('Vui lòng chọn phòng.'); return; }

    try {
      await createTicket.mutateAsync({
        property_id: propertyId,
        room_id: form.room_id!,
        priority: form.priority ?? 'MEDIUM',
        category: form.category || undefined,
        description: form.description!,
        due_at: form.due_at || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Category */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
          Loại sự cố
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setForm(f => ({ ...f, category: f.category === cat ? '' : cat }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                form.category === cat
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
          Độ ưu tiên
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PRIORITIES.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, priority: p.value }))}
              className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                form.priority === p.value
                  ? `${p.color} bg-opacity-10 shadow-sm`
                  : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
          Mô tả chi tiết <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={4}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Mô tả sự cố, vị trí, triệu chứng..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
          Hạn xử lý (tuỳ chọn)
        </label>
        <input
          type="datetime-local"
          value={form.due_at}
          onChange={e => setForm(f => ({ ...f, due_at: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <X className="w-4 h-4" /> Hủy
        </button>
        <button
          type="submit"
          disabled={createTicket.isPending}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50"
        >
          {createTicket.isPending ? 'Đang tạo...' : 'Tạo phiếu'}
        </button>
      </div>
    </form>
  );
}
