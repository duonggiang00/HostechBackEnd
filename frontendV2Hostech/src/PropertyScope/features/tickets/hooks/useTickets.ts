import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../api/ticketsApi';
import type {
  TicketQueryParams,
  CreateTicketPayload,
  UpdateTicketPayload,
  UpdateTicketStatusPayload,
  CreateTicketEventPayload,
  CreateTicketCostPayload,
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
export function useTickets(params: TicketQueryParams = {}) {
  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: ({ signal }) => ticketsApi.getTickets(params, signal),
    enabled: !!params.property_id || true,
  });
}

// ─── Detail Hook ─────────────────────────────────────────────────────────────
export function useTicketDetail(id: string | undefined) {
  return useQuery({
    queryKey: ticketKeys.detail(id!),
    queryFn: () => ticketsApi.getTicket(id!),
    enabled: !!id,
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
    },
  });

  const addCost = useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: CreateTicketCostPayload }) =>
      ticketsApi.addCost(ticketId, data),
    onSuccess: (_data, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    },
  });

  return { createTicket, updateTicket, updateStatus, deleteTicket, addComment, addCost };
}
