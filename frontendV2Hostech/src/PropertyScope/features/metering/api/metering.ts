import apiClient from '@/shared/api/client';
import type { Meter, MeterReading } from '../types';

export const meteringApi = {
  getMeters: async (propertyId: string) => {
    const response = await apiClient.get(`/properties/${propertyId}/meters`);
    console.log(`📡 API: GET /properties/${propertyId}/meters:`, response.data.data);
    return response.data.data as Meter[];
  },

  getMeterReadings: async (meterId: string, params?: { per_page?: number; sort?: string }) => {
    const response = await apiClient.get(`/meters/${meterId}/readings`, { params });
    console.log(`📡 API: GET /meters/${meterId}/readings:`, response.data.data);
    return response.data.data as MeterReading[];
  },

  addReading: async (meterId: string, reading_value: number, reading_date: string, photo?: File) => {
    const formData = new FormData();
    formData.append('reading_value', reading_value.toString());
    formData.append('reading_date', reading_date);
    if (photo) {
      formData.append('photo', photo);
    }
    
    const response = await apiClient.post(`/meters/${meterId}/readings`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    console.log(`📡 API: POST /meters/${meterId}/readings (Added):`, response.data.data);
    return response.data.data as MeterReading;
  },
};
