import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  ChevronRight,
  Droplets,
  FileText,
  Hammer,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';
import { ticketsApi } from '@/PropertyScope/features/tickets/api/ticketsApi';
import { ticketKeys } from '@/PropertyScope/features/tickets/hooks/useTickets';
import type { TicketPriority } from '@/PropertyScope/features/tickets/types';

const CATEGORY_SLUG_TO_LABEL: Record<string, string> = {
  electric: 'Điện',
  plumbing: 'Nước',
  furniture: 'Thiết bị',
  other: 'Khác',
};

const categories = [
  {
    id: 'electric',
    label: 'Điện',
    icon: Lightbulb,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
  },
  {
    id: 'plumbing',
    label: 'Nước',
    icon: Droplets,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
  },
  {
    id: 'furniture',
    label: 'Thiết bị',
    icon: Hammer,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
  },
  {
    id: 'other',
    label: 'Khác',
    icon: Sparkles,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
  },
];

const PRIORITY_OPTIONS: {
  value: TicketPriority;
  label: string;
  hint: string;
  tone: string;
}[] = [
  {
    value: 'LOW',
    label: 'Thấp',
    hint: 'Có thể chờ vài ngày',
    tone: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
  },
  {
    value: 'MEDIUM',
    label: 'Bình thường',
    hint: 'Mặc định',
    tone: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  },
  {
    value: 'HIGH',
    label: 'Cao',
    hint: 'Ảnh hưởng sinh hoạt',
    tone: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  },
  {
    value: 'URGENT',
    label: 'Khẩn cấp',
    hint: 'Cần xử lý ngay',
    tone: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  },
];

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_FILES = 10;

interface PendingFile {
  id: string;
  file: File;
  previewUrl: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [description, setDescription] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const canSubmitLocation = !!(propertyId && roomId);

  const createMutation = useMutation({
    mutationFn: async () => {
      const ticket = await ticketsApi.createTicket({
        property_id: propertyId!,
        room_id: roomId!,
        category: CATEGORY_SLUG_TO_LABEL[category] || 'Khác',
        priority,
        description: description.trim(),
      });

      if (pendingFiles.length > 0) {
        try {
          await ticketsApi.attachFiles(
            ticket.id,
            pendingFiles.map((p) => p.file),
          );
        } catch (err: any) {
          // Ticket đã tạo thành công, attachment lỗi → cảnh báo nhẹ thay vì throw.
          toast.error(
            err?.response?.data?.message ||
              'Đã tạo phiếu nhưng tải tệp đính kèm thất bại. Bạn có thể thử lại từ chi tiết phiếu.',
          );
        }
      }

      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      toast.success('Đã gửi phiếu sự cố. Ban quản lý sẽ xử lý sớm nhất.');
      onSubmitted?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          'Không gửi được phiếu. Vui lòng thử lại.',
      );
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setCategory('');
      setPriority('MEDIUM');
      setDescription('');
      setPendingFiles((prev) => {
        prev.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
        return [];
      });
    }
  }, [isOpen]);

  const totalSize = useMemo(
    () => pendingFiles.reduce((sum, p) => sum + p.file.size, 0),
    [pendingFiles],
  );

  const handleFilesPicked = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const accepted: PendingFile[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: định dạng không hỗ trợ.`);
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        errors.push(
          `${file.name}: vượt quá ${formatBytes(MAX_FILE_BYTES)} cho phép.`,
        );
        return;
      }
      accepted.push({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : null,
      });
    });

    setPendingFiles((prev) => {
      const merged = [...prev, ...accepted];
      if (merged.length > MAX_FILES) {
        errors.push(`Chỉ được đính kèm tối đa ${MAX_FILES} tệp.`);
        const cut = merged.slice(0, MAX_FILES);
        merged.slice(MAX_FILES).forEach((p) => {
          if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
        });
        return cut;
      }
      return merged;
    });

    if (errors.length > 0) {
      toast.error(errors.join('\n'));
    }
  };

  const removePending = (id: string) => {
    setPendingFiles((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

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
                <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                  Bước {step}/2
                </span>
                <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-white">
                  Báo sự cố
                </h2>
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
                Bạn cần có hợp đồng đang hiệu lực (có phòng) trên hệ thống để
                gửi phiếu sự cố.
              </div>
            )}

            <div className="max-h-[70vh] overflow-y-auto p-8 pt-4">
              {step === 1 ? (
                <div className="space-y-6">
                  <p className="font-medium text-slate-400">
                    Bạn đang gặp vấn đề gì?
                  </p>
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
                        <div
                          className={`mb-4 w-fit rounded-2xl p-4 ${cat.bg} ${cat.color} transition-transform group-hover:scale-110`}
                        >
                          <cat.icon className="h-6 w-6" />
                        </div>
                        <span className="block text-sm font-black uppercase tracking-wider text-white">
                          {cat.label}
                        </span>
                        <ChevronRight
                          className={`absolute bottom-6 right-6 h-4 w-4 transition-all duration-300 ${
                            category === cat.id
                              ? 'translate-x-0 text-white opacity-100'
                              : '-translate-x-4 text-slate-600 opacity-0'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="pl-1 text-xs font-black uppercase tracking-widest text-slate-500">
                      Mức độ ưu tiên
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {PRIORITY_OPTIONS.map((opt) => {
                        const active = priority === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setPriority(opt.value)}
                            className={`rounded-2xl border p-4 text-left transition-all ${
                              active
                                ? `${opt.tone} scale-[1.02]`
                                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                            }`}
                          >
                            <p className="text-sm font-black uppercase tracking-wider">
                              {opt.label}
                            </p>
                            <p className="mt-1 text-[11px] font-bold text-slate-500">
                              {opt.hint}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <label className="pl-1 text-xs font-black uppercase tracking-widest text-slate-500">
                      Mô tả chi tiết
                    </label>
                    <textarea
                      autoFocus
                      placeholder="Hãy mô tả rõ vấn đề bạn đang gặp phải..."
                      className="min-h-[150px] w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-white outline-none transition-all focus:border-emerald-500/50"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Tệp đính kèm
                      </label>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {pendingFiles.length}/{MAX_FILES} ·{' '}
                        {formatBytes(totalSize)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Hỗ trợ JPG, PNG, WebP, GIF, PDF — tối đa{' '}
                      {formatBytes(MAX_FILE_BYTES)} mỗi tệp.
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={ALLOWED_TYPES.join(',')}
                      className="hidden"
                      onChange={(e) => {
                        handleFilesPicked(e.target.files);
                        e.target.value = '';
                      }}
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        handleFilesPicked(e.target.files);
                        e.target.value = '';
                      }}
                    />

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={pendingFiles.length >= MAX_FILES}
                        className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-40"
                      >
                        <Camera className="h-6 w-6" />
                        <span className="text-xs font-bold">Chụp ảnh</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={pendingFiles.length >= MAX_FILES}
                        className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-40"
                      >
                        <Upload className="h-6 w-6" />
                        <span className="text-xs font-bold">Tải lên</span>
                      </button>

                      {pendingFiles.slice(0, 1).map((p) => (
                        <PendingFilePreview
                          key={p.id}
                          item={p}
                          onRemove={() => removePending(p.id)}
                        />
                      ))}
                    </div>

                    {pendingFiles.length > 1 && (
                      <div className="grid grid-cols-3 gap-3">
                        {pendingFiles.slice(1).map((p) => (
                          <PendingFilePreview
                            key={p.id}
                            item={p}
                            onRemove={() => removePending(p.id)}
                          />
                        ))}
                      </div>
                    )}
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
                  disabled={
                    !canSubmitLocation ||
                    !description.trim() ||
                    createMutation.isPending
                  }
                  onClick={handleSend}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : null}
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

function PendingFilePreview({
  item,
  onRemove,
}: {
  item: PendingFile;
  onRemove: () => void;
}) {
  const isImage = item.file.type.startsWith('image/');

  return (
    <div className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
      {isImage && item.previewUrl ? (
        <img
          src={item.previewUrl}
          alt={item.file.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-slate-400">
          <FileText className="h-6 w-6" />
          <span className="line-clamp-2 text-center text-[10px] font-bold">
            {item.file.name}
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[10px] font-bold text-white">
        <div className="flex items-center gap-1">
          {isImage ? (
            <ImageIcon className="h-3 w-3 shrink-0" />
          ) : (
            <FileText className="h-3 w-3 shrink-0" />
          )}
          <span className="truncate">{formatBytes(item.file.size)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white/90 opacity-0 transition-opacity hover:bg-rose-500 group-hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
