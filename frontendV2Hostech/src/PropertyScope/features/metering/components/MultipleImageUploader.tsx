import { useRef, useState, useCallback } from 'react';
import { ImagePlus, X, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { meteringApi } from '../api/metering';

export interface UploadedProof {
  temporaryId: string;
  previewUrl: string;
  fileName: string;
  size: number;
}

interface MultipleImageUploaderProps {
  value: UploadedProof[];
  onChange: (proofs: UploadedProof[]) => void;
  maxFiles?: number;
  maxSizeMb?: number;
  disabled?: boolean;
  label?: string;
}

/**
 * Cho phép chọn & upload tối đa `maxFiles` ảnh minh chứng.
 * Mỗi ảnh được upload ngay lên /media/upload để lấy temporary_upload_id.
 * Trả về danh sách UploadedProof để component cha gửi proof_media_ids tới backend.
 */
export function MultipleImageUploader({
  value,
  onChange,
  maxFiles = 5,
  maxSizeMb = 5,
  disabled = false,
  label = 'Ảnh minh chứng',
}: MultipleImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = maxFiles - value.length;
    if (remaining <= 0) {
      toast.error(`Tối đa ${maxFiles} ảnh cho mỗi lần chốt`);
      return;
    }

    const toProcess = Array.from(files).slice(0, remaining);
    const valid: File[] = [];

    for (const file of toProcess) {
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" không phải file ảnh`);
        continue;
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        toast.error(`"${file.name}" vượt quá ${maxSizeMb}MB`);
        continue;
      }
      valid.push(file);
    }

    if (valid.length === 0) return;

    setUploading(true);
    try {
      const results = await Promise.allSettled(
        valid.map(async (file) => {
          const previewUrl = URL.createObjectURL(file);
          const uploaded = await meteringApi.uploadReadingProof(file);
          return {
            temporaryId: uploaded.temporary_upload_id,
            previewUrl,
            fileName: file.name,
            size: file.size,
          } as UploadedProof;
        })
      );

      const successful: UploadedProof[] = [];
      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          successful.push(r.value);
        } else {
          toast.error('Có lỗi khi upload ảnh, vui lòng thử lại');
        }
      });

      if (successful.length > 0) {
        onChange([...value, ...successful]);
        toast.success(`Đã thêm ${successful.length} ảnh`);
      }
    } catch {
      toast.error('Upload ảnh thất bại');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [value, onChange, maxFiles, maxSizeMb]);

  const removeProof = (temporaryId: string) => {
    const removed = value.find((p) => p.temporaryId === temporaryId);
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    onChange(value.filter((p) => p.temporaryId !== temporaryId));
  };

  const canAddMore = value.length < maxFiles && !disabled;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
          <span className="ml-2 text-xs font-normal text-slate-400">(tối đa {maxFiles} ảnh)</span>
        </label>
        {value.length > 0 && (
          <span className="text-xs text-slate-400 font-medium">{value.length}/{maxFiles}</span>
        )}
      </div>

      {/* Image Grid */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((proof) => (
            <div key={proof.temporaryId} className="relative group w-20 h-20">
              <img
                src={proof.previewUrl}
                alt={proof.fileName}
                className="w-20 h-20 object-cover rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeProof(proof.temporaryId)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa ảnh"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Trigger */}
      {canAddMore && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all w-full justify-center font-medium"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tải ảnh lên...
            </>
          ) : (
            <>
              <ImagePlus className="w-4 h-4" />
              {value.length === 0 ? 'Thêm ảnh minh chứng' : 'Thêm ảnh khác'}
            </>
          )}
        </button>
      )}

      {value.length >= maxFiles && (
        <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          Đã đạt tối đa {maxFiles} ảnh
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
