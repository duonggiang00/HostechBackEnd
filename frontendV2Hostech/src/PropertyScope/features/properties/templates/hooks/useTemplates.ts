import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesApi } from '../../api/templates';
import type { CreateRoomTemplatePayload } from '../../types/templates.types';

export const ROOM_TEMPLATES_KEY = 'room-templates';

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
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRoomTemplatePayload> }) =>
      templatesApi.updateRoomTemplate(propertyId, id, data),
    onSuccess: () => invalidate(),
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => templatesApi.deleteRoomTemplate(propertyId, id),
    onSuccess: () => invalidate(),
  });

  return { createTemplate, updateTemplate, deleteTemplate };
};
