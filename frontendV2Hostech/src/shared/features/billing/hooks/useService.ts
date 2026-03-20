import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';
import type { Service } from '../types';

export function useService() {
  const queryClient = useQueryClient();

  const useServices = (filters?: any) => useQuery({
    queryKey: ['services', filters],
    queryFn: async () => {
      const response = await apiClient.get('/services', { params: filters });
      return response.data;
    }
  });

  const useServiceDetails = (id: string) => useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      const response = await apiClient.get(`/services/${id}`);
      return response.data.data as Service;
    },
    enabled: !!id,
  });

  const createService = useMutation({
    mutationFn: async (data: Partial<Service>) => {
      const response = await apiClient.post('/services', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    }
  });

  const updateService = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Service> }) => {
      const response = await apiClient.put(`/services/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', id] });
    }
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    }
  });

  return {
    useServices,
    useServiceDetails,
    createService,
    updateService,
    deleteService
  };
}
