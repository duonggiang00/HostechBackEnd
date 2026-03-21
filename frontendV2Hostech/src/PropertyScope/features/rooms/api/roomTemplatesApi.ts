import apiClient from '@/shared/api/client';
import type { RoomTemplate } from '../types';

export const roomTemplatesApi = {
  getTemplates: async (propertyId?: string) => {
    const response = await apiClient.get('/room-templates', {
      params: { 'filter[property_id]': propertyId || undefined, include: 'services,assets,meters' },
    });
    console.log('📡 API: GET /room-templates:', response.data.data || response.data);
    return (response.data.data || response.data) as RoomTemplate[];
  },

  getTemplate: async (id: string) => {
    const response = await apiClient.get(`/room-templates/${id}`, {
      params: { include: 'services,assets,meters' },
    });
    console.log(`📡 API: GET /room-templates/${id}:`, response.data.data);
    return response.data.data as RoomTemplate;
  },

  createTemplate: async (data: any) => {
    const response = await apiClient.post('/room-templates', data);
    console.log('📡 API: POST /room-templates (Created):', response.data.data);
    return response.data.data as RoomTemplate;
  },

  updateTemplate: async (id: string, data: any) => {
    const response = await apiClient.put(`/room-templates/${id}`, data);
    console.log(`📡 API: PUT /room-templates/${id} (Updated):`, response.data.data);
    return response.data.data as RoomTemplate;
  },

  deleteTemplate: async (id: string) => {
    await apiClient.delete(`/room-templates/${id}`);
  },
};
