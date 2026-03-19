import apiClient from '@/shared/api/client';
import type { Property } from '../types';

export const propertiesApi = {
  getProperties: async (params?: Record<string, any>) => {
    const response = await apiClient.get('/properties', { params });
    const data = response.data.data || response.data;
    return data.map((p: any) => ({
      ...p,
      status: p.status || 'active',
      roomCount: p.rooms_count || 0,
      staffCount: p.staff_count || 0,
    })) as Property[];
  },

  getProperty: async (id: string) => {
    const response = await apiClient.get(`/properties/${id}`);
    return (response.data.data || response.data) as Property;
  },

  createProperty: async (data: Partial<Property>) => {
    const resp = await apiClient.post('/properties', data);
    return resp.data.data || resp.data;
  },

  updateProperty: async (id: string, data: Partial<Property>) => {
    const resp = await apiClient.put(`/properties/${id}`, data);
    return resp.data.data || resp.data;
  },

  deleteProperty: async (id: string) => {
    await apiClient.delete(`/properties/${id}`);
  },
};
