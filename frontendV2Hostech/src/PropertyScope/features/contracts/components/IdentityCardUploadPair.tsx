import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, CreditCard, IdCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMediaUpload } from '@/shared/features/media/hooks/useMedia';

type Props = {
  frontMediaUuid: string | null;
  backMediaUuid: string | null;
  onFrontMediaUuid: (uuid: string | null) => void;
  onBackMediaUuid: (uuid: string | null) => void;
  uploadPath?: string;
  disabled?: boolean;
  className?: string;
  /** false = CCCD tuỳ chọn (vd. dưới 18 tuổi), ẩn dấu * */
  identityRequired?: boolean;
};

function resolveMediaUuid(res: { mediaId?: string; id: string; url?: string } | null): string | null {
  if (!res) return null;
  return res.mediaId || res.id || null;
}

function revokeIfBlob(url: string | null) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export function IdentityCardUploadPair({
  frontMediaUuid,
  backMediaUuid,
  onFrontMediaUuid,
  onBackMediaUuid,
  uploadPath = 'contract-members',
  disabled = false,
  className = '',
  identityRequired = true,
}: Props) {
  const { uploadFile, isUploading } = useMediaUpload();
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const frontPreviewRef = useRef<string | null>(null);
  const backPreviewRef = useRef<string | null>(null);
  frontPreviewRef.current = frontPreview;
  backPreviewRef.current = backPreview;

  useEffect(() => {
    if (!frontMediaUuid) {
      setFrontPreview((prev) => {
        revokeIfBlob(prev);
        return null;
      });
    }
  }, [frontMediaUuid]);

  useEffect(() => {
    if (!backMediaUuid) {
      setBackPreview((prev) => {
        revokeIfBlob(prev);
        return null;
      });
    }
  }, [backMediaUuid]);

  useEffect(
    () => () => {
      revokeIfBlob(frontPreviewRef.current);
      revokeIfBlob(backPreviewRef.current);
    },
    [],
  );

  const handlePick = useCallback(
    async (
      file: File | undefined,
      setterUuid: (uuid: string | null) => void,
      setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    ) => {
      if (!file || disabled) return;
      const blobUrl = URL.createObjectURL(file);
      setPreview((prev) => {
        revokeIfBlob(prev);
        return blobUrl;
      });

      const res = await uploadFile(file, uploadPath);
      const uuid = resolveMediaUuid(res);
      if (!uuid) {
        toast.error('Không nhận được mã ảnh từ máy chủ. Vui lòng thử lại.');
        setPreview((prev) => {
          revokeIfBlob(prev);
          return null;
        });
        return;
      }
      setterUuid(uuid);
      if (res?.url) {
        setPreview((prev) => {
          revokeIfBlob(prev);
          return res.url;
        });
      }
    },
    [disabled, uploadFile, uploadPath],
  );

  const clearFront = useCallback(() => {
    setFrontPreview((prev) => {
      revokeIfBlob(prev);
      return null;
    });
    onFrontMediaUuid(null);
  }, [onFrontMediaUuid]);

  const clearBack = useCallback(() => {
    setBackPreview((prev) => {
      revokeIfBlob(prev);
      return null;
    });
    onBackMediaUuid(null);
  }, [onBackMediaUuid]);

  const reqMark = identityRequired ? <span className="text-rose-500">*</span> : null;
  const optHint = !identityRequired ? (
    <span className="text-xs font-normal normal-case text-slate-400"> (tuỳ chọn)</span>
  ) : null;

  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${className}`}>
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <IdCard className="h-4 w-4 shrink-0 text-indigo-500" />
          <span>
            CCCD mặt trước
            {reqMark}
            {optHint}
          </span>
        </div>
        <input
          ref={frontInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled || isUploading}
          onChange={(e) => {
            void handlePick(e.target.files?.[0], onFrontMediaUuid, setFrontPreview);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => frontInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-300 bg-white px-3 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-700 dark:bg-slate-950 dark:text-indigo-200 dark:hover:bg-indigo-950/40"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {frontMediaUuid ? 'Đã chọn — đổi ảnh' : 'Tải ảnh mặt trước'}
        </button>
        {frontPreview && (
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-950">
            <img src={frontPreview} alt="Xem trước CCCD mặt trước" className="mx-auto max-h-36 w-full object-contain" />
          </div>
        )}
        {frontMediaUuid && (
          <button
            type="button"
            className="mt-1 text-xs font-semibold text-rose-600 hover:underline"
            disabled={disabled || isUploading}
            onClick={clearFront}
          >
            Xóa
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <IdCard className="h-4 w-4 shrink-0 text-indigo-500" />
          <span>
            CCCD mặt sau
            {reqMark}
            {optHint}
          </span>
        </div>
        <input
          ref={backInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled || isUploading}
          onChange={(e) => {
            void handlePick(e.target.files?.[0], onBackMediaUuid, setBackPreview);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => backInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-300 bg-white px-3 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-700 dark:bg-slate-950 dark:text-indigo-200 dark:hover:bg-indigo-950/40"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {backMediaUuid ? 'Đã chọn — đổi ảnh' : 'Tải ảnh mặt sau'}
        </button>
        {backPreview && (
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-950">
            <img src={backPreview} alt="Xem trước CCCD mặt sau" className="mx-auto max-h-36 w-full object-contain" />
          </div>
        )}
        {backMediaUuid && (
          <button
            type="button"
            className="mt-1 text-xs font-semibold text-rose-600 hover:underline"
            disabled={disabled || isUploading}
            onClick={clearBack}
          >
            Xóa
          </button>
        )}
      </div>
    </div>
  );
}
