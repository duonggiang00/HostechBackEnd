import { useQuery } from '@tanstack/react-query';
import { templatesApi } from '../templates/api/templates';
import { isUuid } from '@/lib/utils';

export const ROOM_TEMPLATE_KEY = 'room-template';

export const useRoomTemplate = (propertyId?: string, templateId?: string) => {
  return useQuery({
    queryKey: [ROOM_TEMPLATE_KEY, propertyId, templateId],
    queryFn: async () => {
      if (!propertyId || !templateId) return null;
      return templatesApi.getRoomTemplate(propertyId, templateId);
    },
    enabled: isUuid(propertyId) && isUuid(templateId),
  });
};
