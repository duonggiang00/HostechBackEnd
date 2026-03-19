import apiClient from '@/shared/api/client';
import type { UploadResponse } from '../types';

export const mediaApi = {
  uploadFile: async (file: File, path: string = 'general', onProgress?: (percent: number) => void): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await apiClient.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    
    return response.data;
  },
};
