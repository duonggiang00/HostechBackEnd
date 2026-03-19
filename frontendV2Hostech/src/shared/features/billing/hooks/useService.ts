import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { Service, ServiceRate, TieredRate } from '../types';

export function useService() {
  const queryClient = useQueryClient();

  const useServices = (filters?: any) => useQuery({
    queryKey: ['services', filters],
    queryFn: async () => {
      const response = await axios.get('/api/services', { params: filters });
      return response.data;
    }
  });

  const useServiceDetails = (id: string) => useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      const response = await axios.get(`/api/services/${id}`);
      return response.data.data as Service;
    },
    enabled: !!id,
  });

  const createService = useMutation({
    mutationFn: async (data: Partial<Service>) => {
      const response = await axios.post('/api/services', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    }
  });

  const updateService = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Service> }) => {
      const response = await axios.put(`/api/services/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', id] });
    }
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/services/${id}`);
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
