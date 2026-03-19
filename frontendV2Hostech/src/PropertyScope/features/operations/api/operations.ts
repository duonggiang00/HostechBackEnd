import apiClient from '@/shared/api/client';
import type { Asset } from '../types';

export const operationsApi = {
  getAssets: async (propertyId: string, roomId: string) => {
    const response = await apiClient.get(`/properties/${propertyId}/rooms/${roomId}/assets`);
    return (response.data.data || response.data) as Asset[];
  },

  addAsset: async (propertyId: string, roomId: string, data: Partial<Asset>) => {
    const response = await apiClient.post(`/properties/${propertyId}/rooms/${roomId}/assets`, data);
    return response.data;
  },
};
