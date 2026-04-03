import apiClient from '@/shared/api/client';
import type { 
  Service, 
  ServiceFormData, 
  PaginatedServiceResponse 
} from '../types';

export const servicesApi = {
  getServices: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedServiceResponse> => {
    const response = await apiClient.get('/services', { params });
    return response.data;
  },

  getService: async (id: string): Promise<Service> => {
    const response = await apiClient.get(`/services/${id}`);
    return response.data.data;
  },

  createService: async (data: ServiceFormData): Promise<Service> => {
    const response = await apiClient.post('/services', data);
    return response.data.data;
  },

  updateService: async ({ id, data }: { id: string; data: Partial<ServiceFormData> }): Promise<Service> => {
    const response = await apiClient.put(`/services/${id}`, data);
    return response.data.data;
  },

  deleteService: async (id: string): Promise<void> => {
    await apiClient.delete(`/services/${id}`);
  },

  // Soft delete management
  getTrash: async (params?: { page?: number; per_page?: number }): Promise<PaginatedServiceResponse> => {
    const response = await apiClient.get('/services/trash', { params });
    return response.data;
  },

  restoreService: async (id: string): Promise<Service> => {
    const response = await apiClient.post(`/services/${id}/restore`);
    return response.data.data;
  },

  forceDeleteService: async (id: string): Promise<void> => {
    await apiClient.delete(`/services/${id}/force`);
  }
};
