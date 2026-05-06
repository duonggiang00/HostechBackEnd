import apiClient from '@/shared/api/client';
import type { UploadResponse } from '../types';

export const mediaApi = {
  /** `collection` khớp Laravel `UploadRequest` + Spatie collection (vd. contract-members, reading_proofs). */
  uploadFile: async (
    file: File,
    collection: string = 'default',
    onProgress?: (percent: number) => void,
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection', collection);

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
    const result = response.data?.data || response.data;
    return {
      url: result.url,
      // RoomTemplate expects media UUIDs (media.uuid), not temporary_upload_id
      id: result.media_id || result.id,
      name: result.file_name || result.name,
      mediaId: result.media_id,
    };
  },
};
