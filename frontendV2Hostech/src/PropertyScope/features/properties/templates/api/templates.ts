import apiClient from '@/shared/api/client';
import type { RoomTemplate, ServiceTemplate, CreateRoomTemplatePayload, CreateServiceTemplatePayload } from './types';

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
  },

  // --- Service Templates ---
  getServiceTemplates: async (propertyId: string) => {
    const response = await apiClient.get(`/properties/${propertyId}/service-templates`);
    return response.data?.data as ServiceTemplate[];
  },
  
  getServiceTemplate: async (propertyId: string, templateId: string) => {
    const response = await apiClient.get(`/properties/${propertyId}/service-templates/${templateId}`);
    return response.data?.data as ServiceTemplate;
  },
  
  createServiceTemplate: async (propertyId: string, data: CreateServiceTemplatePayload) => {
    const response = await apiClient.post(`/properties/${propertyId}/service-templates`, data);
    return response.data?.data as ServiceTemplate;
  },
  
  updateServiceTemplate: async (propertyId: string, templateId: string, data: Partial<CreateServiceTemplatePayload>) => {
    const response = await apiClient.put(`/properties/${propertyId}/service-templates/${templateId}`, data);
    return response.data?.data as ServiceTemplate;
  },

  deleteServiceTemplate: async (propertyId: string, templateId: string) => {
    const response = await apiClient.delete(`/properties/${propertyId}/service-templates/${templateId}`);
    return response.data;
  },
};
