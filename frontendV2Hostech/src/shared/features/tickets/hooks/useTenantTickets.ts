import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '@/PropertyScope/features/tickets/api/ticketsApi';
import { ticketKeys } from '@/PropertyScope/features/tickets/hooks/useTickets';
import type { PaginatedTickets, TicketQueryParams } from '@/PropertyScope/features/tickets/types';

export type TenantTicketsParams = Pick<TicketQueryParams, 'property_id' | 'room_id'> & {
  page?: number;
  per_page?: number;
};

/**
 * Danh sách ticket của user hiện tại (backend scope Tenant theo created_by_user_id).
 * Có thể lọc thêm theo property_id / room_id từ hợp đồng đang thuê.
 */
export function useTenantTicketsList(params: TenantTicketsParams = {}) {
  const { property_id, room_id, page = 1, per_page = 30 } = params;

  return useQuery<PaginatedTickets>({
    queryKey: [...ticketKeys.lists(), 'tenant', { property_id, room_id, page, per_page }],
    queryFn: ({ signal }) =>
      ticketsApi.getTickets(
        {
          property_id,
          room_id,
          page,
          per_page,
        },
        signal,
      ),
    staleTime: 30_000,
  });
}
