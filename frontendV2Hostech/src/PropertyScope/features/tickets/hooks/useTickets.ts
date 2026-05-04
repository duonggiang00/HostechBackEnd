import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../api/ticketsApi';
import type {
  TicketQueryParams,
  CreateTicketPayload,
  UpdateTicketPayload,
  UpdateTicketStatusPayload,
  CreateTicketEventPayload,
  CreateTicketCostPayload,
  PaginatedTickets,
} from '../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (params: TicketQueryParams) => [...ticketKeys.lists(), params] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
};

// ─── List Hook ────────────────────────────────────────────────────────────────
export function useTickets(params: TicketQueryParams = {}, options: any = {}) {
  return useQuery<PaginatedTickets>({
    queryKey: ticketKeys.list(params),
    queryFn: ({ signal }) => ticketsApi.getTickets(params, signal),
    enabled: !!params.property_id,
    staleTime: 60 * 1000, // 1 minute default stale time
    ...options,
  });
}

// ─── Detail Hook ─────────────────────────────────────────────────────────────
/**
 * Lấy chi tiết ticket. Mặc định polling mỗi 30s khi tab focus để hỗ trợ chat
 * 2 chiều giữa Tenant và Manager/Staff (gần realtime, không cần websocket).
 */
export function useTicketDetail(id: string | undefined, options: any = {}) {
  return useQuery({
    queryKey: ticketKeys.detail(id!),
    queryFn: () => ticketsApi.getTicket(id!),
    enabled: !!id,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    ...options,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────
export function useTicketMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ticketKeys.all });
  };

  const createTicket = useMutation({
    mutationFn: (data: CreateTicketPayload) => ticketsApi.createTicket(data),
    onSuccess: invalidateAll,
  });

  const updateTicket = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketPayload }) =>
      ticketsApi.updateTicket(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketStatusPayload }) =>
      ticketsApi.updateStatus(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });

  const deleteTicket = useMutation({
    mutationFn: (id: string) => ticketsApi.deleteTicket(id),
    onSuccess: invalidateAll,
  });

  const addComment = useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: CreateTicketEventPayload }) =>
      ticketsApi.addEvent(ticketId, data),
    onSuccess: (_data, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });

  const addCost = useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: CreateTicketCostPayload }) =>
      ticketsApi.addCost(ticketId, data),
    onSuccess: (_data, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    },
  });

  const attachFiles = useMutation({
    mutationFn: ({ ticketId, files }: { ticketId: string; files: File[] }) =>
      ticketsApi.attachFiles(ticketId, files),
    onSuccess: (_data, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });

  const deleteAttachment = useMutation({
    mutationFn: ({ ticketId, mediaId }: { ticketId: string; mediaId: number }) =>
      ticketsApi.deleteAttachment(ticketId, mediaId),
    onSuccess: (_data, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    },
  });

  return {
    createTicket,
    updateTicket,
    updateStatus,
    deleteTicket,
    addComment,
    addCost,
    attachFiles,
    deleteAttachment,
  };
}
