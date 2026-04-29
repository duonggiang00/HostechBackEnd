import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Save, X, ClipboardList, Loader2, CheckCircle2, FileText,
  AlertCircle, User, Building2
} from 'lucide-react';
import { useHandover } from '@/shared/features/operations/hooks/useHandover';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface HandoverFormProps {
  /** 'modal' = có overlay (standalone), 'embedded' = dùng trong wizard (không overlay) */
  mode?: 'modal' | 'embedded';
  onClose?: () => void;
  roomId?: string;
  roomName?: string;
  contractId?: string;
  tenantName?: string;
  /** Chỉ dùng cho biên bản bàn giao khi kết thúc hợp đồng */
  type?: 'OUT';
  initialData?: any;
  readOnly?: boolean;
  /** Callback sau khi tạo DRAFT thành công */
  onSubmitted?: (handoverId: string) => void;
}

export default function HandoverForm({
  mode = 'modal',
  onClose,
  roomId,
  roomName,
  contractId,
  tenantName,
  type = 'OUT',
  initialData = null,
  readOnly = false,
  onSubmitted,
}: HandoverFormProps) {
  const { createHandover } = useHandover();

  const [note, setNote] = useState<string>(initialData?.note ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [createdHandover, setCreatedHandover] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (readOnly) { onClose?.(); return; }
    setError(null);
    try {
      const payload = {
        room_id: roomId,
        contract_id: contractId,
        type,
        note: note.trim() || null,
      };
      const created = await createHandover.mutateAsync(payload);
      setCreatedHandover(created);
      setSubmitted(true);
      onSubmitted?.(created.id);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Có lỗi xảy ra khi tạo biên bản bàn giao.';
      setError(msg);
      toast.error(msg);
    }
  };

  const typeLabel = 'Bàn giao kết thúc hợp đồng';
  const typeColor = 'rose';

  const body = (
    <div className={
      mode === 'embedded'
        ? 'flex flex-col gap-5'
        : 'relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[16px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]'
    }>
      {/* Header — chỉ hiển thị trong modal mode */}
      {mode === 'modal' && (
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-[8px] bg-${typeColor}-50 dark:bg-${typeColor}-500/10 flex items-center justify-center`}>
              <ClipboardList className={`w-5 h-5 text-${typeColor}-600 dark:text-${typeColor}-400`} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {typeLabel}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Biên bản bàn giao phòng
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-[8px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Nội dung chính */}
      <div className={mode === 'embedded' ? 'flex flex-col gap-4' : 'p-6 overflow-y-auto flex-1 flex flex-col gap-4'}>

        {/* Trạng thái đã submit */}
        {submitted && createdHandover ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 py-6 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-base font-black text-slate-900 dark:text-white">
                Biên bản đã được tạo
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Trạng thái: <span className="font-bold text-amber-600 dark:text-amber-400">Chờ xác nhận (Bản nháp)</span>
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Quản lý sẽ xem xét và xác nhận biên bản bàn giao.
              </p>
            </div>
            {note && (
              <div className="w-full p-3 rounded-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-left mt-1">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Ghi chú</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{note}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <>
            {/* Thông tin phòng / khách */}
            <div className="p-3 rounded-[10px] bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex flex-col gap-2">
              {roomName && (
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phòng</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{roomName}</p>
                  </div>
                </div>
              )}
              {tenantName && (
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Khách thuê</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{tenantName}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngày lập biên bản</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {format(new Date(), 'dd/MM/yyyy', { locale: vi })}
                  </p>
                </div>
              </div>
            </div>

            {/* Type badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
              <ClipboardList className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-sm font-black text-rose-700 dark:text-rose-400">
                {typeLabel}
              </span>
            </div>

            {/* Ghi chú tình trạng phòng */}
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                Ghi chú tình trạng phòng
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                disabled={readOnly}
                placeholder="Mô tả tình trạng phòng khi bàn giao: tường, sàn, thiết bị, chìa khóa..."
                className="w-full px-4 py-3 rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-colors resize-none disabled:opacity-60"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-[8px]">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">{error}</p>
              </div>
            )}

            {/* Info note */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-[8px]">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                Biên bản sẽ được tạo ở trạng thái <strong>Bản nháp</strong> và cần Quản lý xác nhận trước khi hoàn tất thanh lý hợp đồng.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer actions */}
      {!submitted && (
        <div className={`flex justify-end gap-3 ${mode === 'modal' ? 'px-6 pb-5 pt-4 border-t border-slate-100 dark:border-slate-800' : 'pt-2'}`}>
          {mode === 'modal' && onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-sm rounded-[8px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
          )}
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={createHandover.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm rounded-[8px] transition-colors"
            >
              {createHandover.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Save className="w-4 h-4" />}
              {createHandover.isPending ? 'Đang lưu...' : 'Tạo biên bản Nháp'}
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (mode === 'embedded') return body;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-lg"
      >
        {body}
      </motion.div>
    </div>
  );
}
