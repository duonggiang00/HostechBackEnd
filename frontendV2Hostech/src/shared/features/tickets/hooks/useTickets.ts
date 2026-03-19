import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../api/tickets';
import type { Ticket } from '../types';
import { useScopeStore } from '@/shared/stores/useScopeStore';

export type { Ticket };

export const useTickets = (params?: { property_id?: string; room_id?: string; status?: string }) => {
  const { propertyId: scopedPropertyId } = useScopeStore();
  const propertyId = params?.property_id || scopedPropertyId;

  return useQuery({
    queryKey: ['tickets', propertyId, params?.room_id, params?.status],
    queryFn: () => ticketsApi.getTickets({
      ...params,
      property_id: propertyId || undefined,
    }),
    enabled: !!propertyId,
  });
};

export const useTicketActions = () => {
  const queryClient = useQueryClient();

  const updateTicketStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      ticketsApi.updateTicketStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  return { updateTicketStatus };
};
