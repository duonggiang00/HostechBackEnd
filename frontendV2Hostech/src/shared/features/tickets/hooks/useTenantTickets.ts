import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '@/PropertyScope/features/tickets/api/ticketsApi';
import { ticketKeys } from '@/PropertyScope/features/tickets/hooks/useTickets';
import type {
  PaginatedTickets,
  TicketQueryParams,
  CreateTicketEventPayload,
} from '@/PropertyScope/features/tickets/types';

export type TenantTicketsParams = Pick<
  TicketQueryParams,
  'property_id' | 'room_id' | 'status' | 'priority' | 'search'
> & {
  page?: number;
  per_page?: number;
};

/**
 * Danh sách ticket của user hiện tại (backend scope Tenant theo created_by_user_id).
 * Hỗ trợ filter status / priority / search + pagination.
 */
export function useTenantTicketsList(params: TenantTicketsParams = {}) {
  const {
    property_id,
    room_id,
    status,
    priority,
    search,
    page = 1,
    per_page = 30,
  } = params;

  return useQuery<PaginatedTickets>({
    queryKey: [
      ...ticketKeys.lists(),
      'tenant',
      { property_id, room_id, status, priority, search, page, per_page },
    ],
    queryFn: ({ signal }) =>
      ticketsApi.getTickets(
        {
          property_id,
          room_id,
          status,
          priority,
          search,
          page,
          per_page,
        },
        signal,
      ),
    staleTime: 15_000,
  });
}

/**
 * Chi tiết ticket cho Tenant. Dùng polling 30s để hỗ trợ chat 2 chiều với
 * Manager/Staff (gần realtime, không cần websocket).
 */
export function useTenantTicketDetail(id: string | undefined) {
  return useQuery({
    queryKey: ticketKeys.detail(id!),
    queryFn: () => ticketsApi.getTicket(id!),
    enabled: !!id,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Tenant gửi comment (chat) lên ticket của mình. Invalidate detail + list để
 * Manager/Staff cũng thấy ngay khi mở panel kế bên.
 */
export function useTenantAddComment(ticketId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTicketEventPayload) =>
      ticketsApi.addEvent(ticketId!, data),
    onSuccess: () => {
      if (!ticketId) return;
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

/**
 * Tenant đính kèm file vào ticket của mình.
 */
export function useTenantAttachFiles(ticketId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (files: File[]) => ticketsApi.attachFiles(ticketId!, files),
    onSuccess: () => {
      if (!ticketId) return;
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

/**
 * Tenant xoá attachment trên ticket của mình (chỉ với file thuộc ticket này).
 */
export function useTenantDeleteAttachment(ticketId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mediaId: number) =>
      ticketsApi.deleteAttachment(ticketId!, mediaId),
    onSuccess: () => {
      if (!ticketId) return;
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    },
  });
}
