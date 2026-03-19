import { useState } from 'react';
import { mediaApi } from '../api/media';
import type { UploadResponse } from '../types';
import toast from 'react-hot-toast';

export type { UploadResponse };

export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, path: string = 'general'): Promise<UploadResponse | null> => {
    setIsUploading(true);
    setProgress(0);

    try {
      const data = await mediaApi.uploadFile(file, path, (percent) => {
        setProgress(percent);
      });
      return data;
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload file');
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
