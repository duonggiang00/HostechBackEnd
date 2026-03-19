import apiClient from '@/shared/api/client';
import type { Meter, MeterReading } from '../types';

export const meteringApi = {
  // Meter CRUD Operations
  getMeters: async (propertyId: string, filters?: Record<string, any>, search?: string, page: number = 1, perPage: number = 15) => {
    const params = {
      ...filters,
      search,
      page,
      per_page: perPage,
      include: 'room', // Load room relationship
    };
    const response = await apiClient.get(`/properties/${propertyId}/meters`, { params });
    console.log(`📡 API Response:`, response.data);
    // Handle both paginated and direct array responses
    const data = Array.isArray(response.data) ? response.data : (response.data.data || response.data);
    console.log(`📡 Extracted Meters (${data?.length || 0}):`, data);
    return data;
  },

  getMeter: async (meterId: string) => {
    const response = await apiClient.get(`/meters/${meterId}`, {
      params: { include: 'room,meter_readings' }
    });
    console.log(`📡 API: GET /meters/${meterId}:`, response.data.data);
    return response.data.data as Meter;
  },

  createMeter: async (data: Partial<Meter>) => {
    const response = await apiClient.post('/meters', data);
    console.log(`📡 API: POST /meters (Created):`, response.data.data);
    return response.data.data as Meter;
  },

  updateMeter: async (meterId: string, data: Partial<Meter>) => {
    const response = await apiClient.put(`/meters/${meterId}`, data);
    console.log(`📡 API: PUT /meters/${meterId} (Updated):`, response.data.data);
    return response.data.data as Meter;
  },

  deleteMeter: async (meterId: string) => {
    const response = await apiClient.delete(`/meters/${meterId}`);
    console.log(`📡 API: DELETE /meters/${meterId} (Deleted):`, response.status);
    return response;
  },

  // Meter Reading Operations
  getMeterReadings: async (meterId: string, page: number = 1, perPage: number = 20, filters?: Record<string, any>) => {
    const params = {
      page,
      per_page: perPage,
      sort: '-period_end',
      include: 'submittedBy,approvedBy',
      ...filters,
    };
    const response = await apiClient.get(`/meters/${meterId}/readings`, { params });
    console.log(`📡 API: GET /meters/${meterId}/readings:`, response.data);
    return response.data.data || response.data;
  },

  getMeterReading: async (meterId: string, readingId: string) => {
    const response = await apiClient.get(`/meters/${meterId}/readings/${readingId}`, {
      params: { include: 'meter,submittedBy,approvedBy' }
    });
    console.log(`📡 API: GET /meters/${meterId}/readings/${readingId}:`, response.data.data);
    return response.data.data as MeterReading;
  },

  createReading: async (meterId: string, data: { reading_value: number; period_start: string; period_end: string; meta?: Record<string, any> }) => {
    // Ensure dates are in YYYY-MM-DD format
    const payload = {
      reading_value: data.reading_value,
      period_start: data.period_start, // Should be YYYY-MM-DD from input type="date"
      period_end: data.period_end,     // Should be YYYY-MM-DD from input type="date"
      ...(data.meta && { meta: data.meta }),
    };
    
    console.log(`📤 Sending POST /meters/${meterId}/readings:`, JSON.stringify(payload, null, 2));
    console.log(`📊 Payload details:`, {
      meterId,
      reading_value: `${payload.reading_value} (type: ${typeof payload.reading_value})`,
      period_start: `${payload.period_start} (type: ${typeof payload.period_start})`,
      period_end: `${payload.period_end} (type: ${typeof payload.period_end})`,
    });
    
    try {
      const response = await apiClient.post(`/meters/${meterId}/readings`, payload);
      console.log(`📡 API: POST /meters/${meterId}/readings -Status ${response.status}:`, response.data);
      const result = response.data.data || response.data;
      console.log(`📡 API: POST /meters/${meterId}/readings (Created):`, result);
      return result as MeterReading;
    } catch (error: any) {
      console.error(`❌ API Error:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  updateReading: async (meterId: string, readingId: string, data: Partial<MeterReading>) => {
    const response = await apiClient.put(`/meters/${meterId}/readings/${readingId}`, data);
    console.log(`📡 API: PUT /meters/${meterId}/readings/${readingId} (Updated):`, response.data.data);
    return response.data.data as MeterReading;
  },

  approveReading: async (meterId: string, readingId: string) => {
    const response = await apiClient.put(`/meters/${meterId}/readings/${readingId}`, { status: 'APPROVED' });
    const result = response.data.data || response.data;
    console.log(`📡 API: Approved reading:`, result);
    return result as MeterReading;
  },

  rejectReading: async (meterId: string, readingId: string, reason?: string) => {
    const response = await apiClient.put(`/meters/${meterId}/readings/${readingId}`, { 
      status: 'REJECTED',
      meta: { rejection_reason: reason }
    });
    const result = response.data.data || response.data;
    console.log(`📡 API: Rejected reading:`, result);
    return result as MeterReading;
  },

  deleteReading: async (meterId: string, readingId: string) => {
    const response = await apiClient.delete(`/meters/${meterId}/readings/${readingId}`);
    console.log(`📡 API: DELETE reading:`, response.status);
    return response;
  },

  // Legacy method
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
