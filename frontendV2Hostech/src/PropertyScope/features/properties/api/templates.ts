import apiClient from '@/shared/api/client';
import type { 
  RoomTemplate, 
  CreateRoomTemplatePayload 
} from '../types/templates.types';

export const templatesApi = {
  // --- Room Templates ---
  getRoomTemplates: async (propertyId: string) => {
    const response = await apiClient.get(`/properties/${propertyId}/room-templates`);
    return response.data?.data as RoomTemplate[];
  },
  
  getRoomTemplate: async (propertyId: string, templateId: string) => {
    const response = await apiClient.get(`/properties/${propertyId}/room-templates/${templateId}`);
    return response.data?.data as RoomTemplate;
  },
  
  createRoomTemplate: async (propertyId: string, data: CreateRoomTemplatePayload) => {
    const response = await apiClient.post(`/properties/${propertyId}/room-templates`, data);
    return response.data?.data as RoomTemplate;
  },
  
  updateRoomTemplate: async (propertyId: string, templateId: string, data: Partial<CreateRoomTemplatePayload>) => {
    const response = await apiClient.put(`/properties/${propertyId}/room-templates/${templateId}`, data);
    return response.data?.data as RoomTemplate;
  },

  deleteRoomTemplate: async (propertyId: string, templateId: string) => {
    const response = await apiClient.delete(`/properties/${propertyId}/room-templates/${templateId}`);
    return response.data;
  }
};
