import { useCallback, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  X,
  Upload,
  Camera,
  Banknote,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import type { Invoice } from '@/shared/features/billing/types';
import { useSubmitPaymentProof } from '@/shared/features/billing/hooks/usePaymentVerification';

interface Props {
  invoice: Invoice;
  onClose: () => void;
  onSuccess?: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

export function SubmitPaymentProofModal({ invoice, onClose, onSuccess }: Props) {
  const outstanding = Math.max(
    0,
    Number(invoice.debt ?? invoice.total_amount - invoice.paid_amount),
  );

  const [method, setMethod] = useState<'CASH' | 'BANK_TRANSFER'>('BANK_TRANSFER');
  const [amount, setAmount] = useState<string>(String(outstanding));
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: submitProof, isPending } = useSubmitPaymentProof();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 5MB.');
      return;
    }
    setProofFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveFile = useCallback(() => {
    setProofFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ.');
      return;
    }
    if (numAmount > outstanding + 0.01) {
      toast.error(`Số tiền không được vượt quá ${formatCurrency(outstanding)}.`);
      return;
    }
    if (!proofFile) {
      toast.error('Vui lòng đính kèm ảnh bằng chứng thanh toán (biên lai / ảnh chuyển khoản).');
      return;
    }

    submitProof(
      {
        invoice_id: invoice.id,
        method,
        amount: numAmount,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
        proof_image: proofFile ?? undefined,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          onSuccess?.();
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
          toast.error(message);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
      <div className="flex h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:h-[min(92vh,820px)] sm:rounded-3xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Báo đã thanh toán
            </p>
            <h2 className="mt-0.5 text-lg font-black text-slate-900 dark:text-white">
              Hóa đơn {invoice.code}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {submitted ? (
          <div className="flex flex-1 flex-col items-center gap-4 overflow-y-auto px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Đã gửi thành công!</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Bằng chứng thanh toán của bạn đã được gửi lên hệ thống.
                <br />
                Quản lý sẽ xét duyệt và cập nhật trạng thái hóa đơn sớm nhất có thể.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Đóng
            </button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="space-y-5 overflow-y-auto px-6 py-5">

            {/* Outstanding amount info */}
            <div className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-500/10">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Số tiền còn phải trả</p>
              <p className="mt-1 text-2xl font-black text-amber-800 dark:text-amber-300">
                {formatCurrency(outstanding)}
              </p>
            </div>

            {/* Payment Method */}
            <div>
              <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Phương thức thanh toán</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'BANK_TRANSFER', label: 'Chuyển khoản', icon: ArrowRight },
                  { value: 'CASH', label: 'Tiền mặt', icon: Banknote },
                ] as const).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setMethod(value)}
                    className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                      method === value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                Số tiền đã trả (VND)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
                max={outstanding}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
                placeholder="Nhập số tiền..."
              />
            </div>

            {/* Reference (for bank transfer) */}
            {method === 'BANK_TRANSFER' && (
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Mã giao dịch / Số tham chiếu <span className="font-normal text-slate-400">(không bắt buộc)</span>
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
                  placeholder="VD: FT25111..."
                />
              </div>
            )}

            {/* Note */}
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                Ghi chú <span className="font-normal text-slate-400">(không bắt buộc)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
                placeholder="Ghi chú thêm cho quản lý..."
              />
            </div>

            {/* Proof image upload */}
            <div>
              <p className="mb-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                Ảnh bằng chứng <span className="font-normal text-rose-500">(bắt buộc)</span>
              </p>

              {previewUrl ? (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                  <img
                    src={previewUrl}
                    alt="Bằng chứng thanh toán"
                    className="max-h-48 w-full object-cover"
                  />
                  <button
                    onClick={handleRemoveFile}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 text-rose-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-rose-50 dark:bg-slate-900/90 dark:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="bg-slate-50 px-4 py-2 dark:bg-slate-800">
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{proofFile?.name}</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-slate-400 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-500 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5 dark:hover:text-indigo-400"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 dark:bg-slate-700">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">Chụp hoặc tải ảnh lên</p>
                    <p className="mt-0.5 text-xs">Ảnh chụp màn hình, biên lai, hoặc chứng từ (JPG, PNG, WEBP — max 5MB)</p>
                  </div>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 rounded-2xl bg-blue-50 px-4 py-3 dark:bg-blue-500/10">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-xs leading-5 text-blue-700 dark:text-blue-300">
                Sau khi gửi, hóa đơn chuyển sang trạng thái chờ xác minh cho đến khi quản lý duyệt bằng chứng.
              </p>
            </div>

            </div>
            {/* Actions */}
            <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isPending ? 'Đang gửi...' : 'Gửi bằng chứng'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
