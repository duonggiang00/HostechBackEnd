import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '../api/properties';
import type { Property } from '../types';
import toast from 'react-hot-toast';
import { isUuid } from '@/lib/utils';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

export type { Property };

export const useProperties = (params?: Record<string, any>) => {
  const orgId = params?.['filter[org_id]'] || params?.orgId;
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['properties', orgId, params],
    queryFn: () => propertiesApi.getProperties({
      'filter[org_id]': orgId || undefined,
      ...params,
    }),
    enabled: isUuid(orgId) || (user?.role === 'Manager' || user?.role === 'Staff'),
    select: (data) => {
      // If data is structured as { data: Property[], ... }
      const propertiesList = Array.isArray(data) ? data : (data as any)?.data || [];
      
      // We removed the redundant frontend filter that was causing visibility issues 
      // when the auth store's property list was slightly out of sync.
      // The backend (PropertyService) already enforces Manager/Staff scoping.
      
      return propertiesList;
    }
  });
};

export const usePropertyDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      if (!id) return null;
      return propertiesApi.getProperty(id);
    },
    enabled: isUuid(id),
  });
};

export const usePropertyActions = () => {
  const queryClient = useQueryClient();

  const createProperty = useMutation({
    mutationFn: (data: Partial<Property>) => propertiesApi.createProperty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property created successfully');
    },
  });

  const updateProperty = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Property> }) => 
      propertiesApi.updateProperty(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', variables.id] });
      toast.success('Property updated successfully');
    },
  });

  const deleteProperty = useMutation({
    mutationFn: (id: string) => propertiesApi.deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property moved to trash');
    },
  });

  return { createProperty, updateProperty, deleteProperty };
};
