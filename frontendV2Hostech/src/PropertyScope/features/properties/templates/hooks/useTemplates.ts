import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesApi } from '../api/templates';
import type { CreateRoomTemplatePayload, CreateServiceTemplatePayload } from '../types';

export const ROOM_TEMPLATES_KEY = 'room-templates';
export const SERVICE_TEMPLATES_KEY = 'service-templates';

// --- Room Templates ---
export const useRoomTemplates = (propertyId: string | undefined) => {
  return useQuery({
    queryKey: [ROOM_TEMPLATES_KEY, propertyId],
    queryFn: () => {
      if (!propertyId) return [];
      return templatesApi.getRoomTemplates(propertyId);
    },
    enabled: !!propertyId,
  });
};

export const useRoomTemplateActions = (propertyId: string) => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [ROOM_TEMPLATES_KEY, propertyId] });

  const createTemplate = useMutation({
    mutationFn: (data: CreateRoomTemplatePayload) => templatesApi.createRoomTemplate(propertyId, data),
    onSuccess: () => invalidate(),
  });

  const updateTemplate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRoomTemplatePayload> }) => templatesApi.updateRoomTemplate(propertyId, id, data),
    onSuccess: () => invalidate(),
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => templatesApi.deleteRoomTemplate(propertyId, id),
    onSuccess: () => invalidate(),
  });

  return { createTemplate, updateTemplate, deleteTemplate };
};

// --- Service Templates ---
export const useServiceTemplates = (propertyId: string | undefined) => {
  return useQuery({
    queryKey: [SERVICE_TEMPLATES_KEY, propertyId],
    queryFn: () => {
      if (!propertyId) return [];
      return templatesApi.getServiceTemplates(propertyId);
    },
    enabled: !!propertyId,
  });
};

export const useServiceTemplateActions = (propertyId: string) => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [SERVICE_TEMPLATES_KEY, propertyId] });

  const createTemplate = useMutation({
    mutationFn: (data: CreateServiceTemplatePayload) => templatesApi.createServiceTemplate(propertyId, data),
    onSuccess: () => invalidate(),
  });

  const updateTemplate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateServiceTemplatePayload> }) => templatesApi.updateServiceTemplate(propertyId, id, data),
    onSuccess: () => invalidate(),
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => templatesApi.deleteServiceTemplate(propertyId, id),
    onSuccess: () => invalidate(),
  });

  return { createTemplate, updateTemplate, deleteTemplate };
};
