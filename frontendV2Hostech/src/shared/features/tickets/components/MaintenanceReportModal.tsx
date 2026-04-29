import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Upload,
  X,
  Lightbulb,
  Droplets,
  Hammer,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';
import { ticketsApi } from '@/PropertyScope/features/tickets/api/ticketsApi';
import { ticketKeys } from '@/PropertyScope/features/tickets/hooks/useTickets';

const CATEGORY_SLUG_TO_LABEL: Record<string, string> = {
  electric: 'Điện',
  plumbing: 'Nước',
  furniture: 'Thiết bị',
  other: 'Khác',
};

const categories = [
  { id: 'electric', label: 'Điện', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  { id: 'plumbing', label: 'Nước', icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  { id: 'furniture', label: 'Thiết bị', icon: Hammer, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  { id: 'other', label: 'Khác', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
];

export interface MaintenanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Từ hợp đồng / phòng đang thuê — bắt buộc để tạo phiếu */
  propertyId?: string;
  roomId?: string;
  onSubmitted?: () => void;
}

export default function MaintenanceReportModal({
  isOpen,
  onClose,
  propertyId,
  roomId,
  onSubmitted,
}: MaintenanceReportModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const canSubmitLocation = !!(propertyId && roomId);

  const createMutation = useMutation({
    mutationFn: () =>
      ticketsApi.createTicket({
        property_id: propertyId!,
        room_id: roomId!,
        category: CATEGORY_SLUG_TO_LABEL[category] || 'Khác',
        priority: 'MEDIUM',
        description: description.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      toast.success('Đã gửi phiếu sự cố. Ban quản lý sẽ xử lý sớm nhất.');
      onSubmitted?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không gửi được phiếu. Vui lòng thử lại.');
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setCategory('');
      setDescription('');
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!canSubmitLocation) {
      toast.error('Bạn cần có hợp đồng gắn phòng để gửi phiếu.');
      return;
    }
    if (!description.trim()) {
      toast.error('Vui lòng mô tả chi tiết sự cố.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !createMutation.isPending && onClose()}
            className="absolute inset-0 bg-[#0A0A0B]/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-t-[2.5rem] border border-white/10 bg-[#0A0A0B] shadow-2xl sm:rounded-5xl sm:border-t"
          >
            <div className="flex items-center justify-between p-8 pb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Bước {step}/2</span>
                <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-white">Báo sự cố</h2>
              </div>
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={onClose}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-400 transition-colors hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!canSubmitLocation && (
              <div className="mx-8 mb-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-200">
                Bạn cần có hợp đồng đang hiệu lực (có phòng) trên hệ thống để gửi phiếu sự cố.
              </div>
            )}

            <div className="max-h-[70vh] overflow-y-auto p-8 pt-4">
              {step === 1 ? (
                <div className="space-y-6">
                  <p className="font-medium text-slate-400">Bạn đang gặp vấn đề gì?</p>
                  <div className="grid grid-cols-2 gap-4">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`group relative overflow-hidden rounded-4xl border p-6 text-left transition-all duration-300 ${
                          category === cat.id
                            ? `${cat.border} ${cat.bg} scale-[1.02]`
                            : 'border-white/5 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className={`mb-4 w-fit rounded-2xl p-4 ${cat.bg} ${cat.color} transition-transform group-hover:scale-110`}>
                          <cat.icon className="h-6 w-6" />
                        </div>
                        <span className="block text-sm font-black uppercase tracking-wider text-white">{cat.label}</span>
                        <ChevronRight
                          className={`absolute bottom-6 right-6 h-4 w-4 transition-all duration-300 ${
                            category === cat.id ? 'translate-x-0 text-white opacity-100' : '-translate-x-4 text-slate-600 opacity-0'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="space-y-3">
                    <label className="pl-1 text-xs font-black uppercase tracking-widest text-slate-500">Mô tả chi tiết</label>
                    <textarea
                      autoFocus
                      placeholder="Hãy mô tả rõ vấn đề bạn đang gặp phải..."
                      className="min-h-[150px] w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-white outline-none transition-all focus:border-emerald-500/50"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="pl-1 text-xs font-black uppercase tracking-widest text-slate-500">Hình ảnh đính kèm</label>
                    <p className="text-xs text-slate-500">Tính năng đính kèm ảnh sẽ được bổ sung sau. Hiện tại vui lòng mô tả bằng chữ.</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 text-slate-500">
                        <Camera className="h-6 w-6" />
                        <span className="text-xs font-bold">Chụp ảnh</span>
                      </div>
                      <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 text-slate-500">
                        <Upload className="h-6 w-6" />
                        <span className="text-xs font-bold">Tải lên</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex gap-4 border-t border-white/5 p-8 pt-4">
              {step === 2 && (
                <PageBackButton
                  disabled={createMutation.isPending}
                  onBack={() => setStep(1)}
                  className="rounded-2xl bg-white/5 px-6 py-4 font-black uppercase tracking-wider text-slate-300 hover:bg-white/10 hover:text-slate-100 disabled:opacity-50 [&_svg]:text-slate-400"
                />
              )}
              {step === 1 ? (
                <button
                  type="button"
                  disabled={!category}
                  onClick={() => {
                    if (category) setStep(2);
                  }}
                  className="flex-1 rounded-2xl bg-emerald-500 px-8 py-4 font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                >
                  Tiếp tục
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canSubmitLocation || !description.trim() || createMutation.isPending}
                  onClick={handleSend}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                >
                  {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  Gửi yêu cầu
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
