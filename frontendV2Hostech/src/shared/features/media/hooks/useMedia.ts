import { useState } from 'react';
import axios from 'axios';
import { mediaApi } from '../api/media';
import type { UploadResponse } from '../types';
import toast from 'react-hot-toast';

export type { UploadResponse };

export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, collection: string = 'default'): Promise<UploadResponse | null> => {
    setIsUploading(true);
    setProgress(0);

    try {
      const data = await mediaApi.uploadFile(file, collection, (percent) => {
        setProgress(percent);
      });
      return data;
    } catch (error) {
      console.error('Upload failed:', error);
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
        const fileErrs = data?.errors?.file;
        const isMimeRejection =
          Array.isArray(fileErrs) &&
          fileErrs.some(
            (m) =>
              typeof m === 'string' &&
              (m.includes('mimes') || m.includes('mime') || m.includes('validation.mimes') || m.includes('loại tệp')),
          );
        if (isMimeRejection) {
          toast.error(
            'Định dạng file không được chấp nhận. Hãy dùng JPEG hoặc PNG; nếu chụp bằng iPhone vẫn lỗi, đổi Camera → Định dạng → «Tương thích» rồi chụp lại.',
          );
        } else {
          const flat = data?.errors ? Object.values(data.errors).flat().join(' ') : '';
          toast.error((typeof data?.message === 'string' && data.message) || flat || 'Tải file thất bại.');
        }
      } else {
        toast.error('Tải file thất bại.');
      }
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadFile,
    isUploading,
    progress
  };
}
