import apiClient from '@/shared/api/client';
import type { Floor } from '../types/floors';


export const floorsApi = {
  getFloors: async (propertyId?: string) => {
    const response = await apiClient.get('/floors', {
      params: propertyId ? { 'filter[property_id]': propertyId } : undefined
    });
    console.log('📡 API: GET /floors:', response.data.data);
    return response.data.data as Floor[];
  },

  getFloorsTrash: async (propertyId?: string) => {
    const response = await apiClient.get('/floors/trash', {
      params: propertyId ? { 'filter[property_id]': propertyId } : undefined
    });
    console.log('📡 API: GET /floors/trash:', response.data.data);
    return response.data.data as Floor[];
  },

  getFloor: async (id: string) => {
    const response = await apiClient.get(`/floors/${id}`);
    console.log(`📡 API: GET /floors/${id}:`, response.data.data);
    return response.data.data as Floor;
  },

  createFloor: async (data: Partial<Floor>) => {
    const response = await apiClient.post('/floors', data);
    console.log('📡 API: POST /floors (Created):', response.data.data);
    return response.data.data as Floor;
  },

  updateFloor: async (id: string, data: Partial<Floor>) => {
    const response = await apiClient.put(`/floors/${id}`, data);
    console.log(`📡 API: PUT /floors/${id} (Updated):`, response.data.data);
    return response.data.data as Floor;
  },

  uploadFloorPlan: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post(`/floors/${id}/upload-floor-plan`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteFloor: async (id: string) => {
    await apiClient.delete(`/floors/${id}`);
  },

  restoreFloor: async (id: string) => {
    const response = await apiClient.post(`/floors/${id}/restore`);
    return response.data;
  },

  forceDeleteFloor: async (id: string) => {
    const response = await apiClient.delete(`/floors/${id}/force`);
    return response.data;
  },
};
