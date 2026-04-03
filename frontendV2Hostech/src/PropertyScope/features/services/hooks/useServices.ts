import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../api/servicesApi';
import type { ServiceFormData } from '../types';

export const SERVICE_KEYS = {
  all: ['services'] as const,
  lists: () => [...SERVICE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...SERVICE_KEYS.lists(), { filters }] as const,
  details: () => [...SERVICE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SERVICE_KEYS.details(), id] as const,
};

export const useServices = (params?: { page?: number; per_page?: number; search?: string; is_active?: boolean }) => {
  return useQuery({
    queryKey: SERVICE_KEYS.list(JSON.stringify(params)),
    queryFn: () => servicesApi.getServices(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useServiceDetail = (id: string) => {
  return useQuery({
    queryKey: SERVICE_KEYS.detail(id),
    queryFn: () => servicesApi.getService(id),
    enabled: !!id,
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ServiceFormData) => servicesApi.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_KEYS.lists() });
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceFormData> }) => 
      servicesApi.updateService({ id, data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SERVICE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SERVICE_KEYS.detail(variables.id) });
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => servicesApi.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_KEYS.lists() });
    },
  });
};
