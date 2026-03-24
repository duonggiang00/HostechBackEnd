import apiClient from '@/shared/api/client';
import type {
  Ticket,
  PaginatedTickets,
  TicketQueryParams,
  CreateTicketPayload,
  UpdateTicketPayload,
  UpdateTicketStatusPayload,
  CreateTicketEventPayload,
  CreateTicketCostPayload,
  TicketEvent,
  TicketCost,
} from '../types';

export const ticketsApi = {
  // ─── List ──────────────────────────────────────────────────────────────────
  getTickets: async (params?: TicketQueryParams, signal?: AbortSignal): Promise<PaginatedTickets> => {
    const apiParams: any = {
      'filter[property_id]': params?.property_id || undefined,
      'filter[room_id]': params?.room_id || undefined,
      'filter[status]': params?.status || undefined,
      'filter[priority]': params?.priority || undefined,
      search: params?.search || undefined,
      page: params?.page ?? 1,
      per_page: params?.per_page ?? 15,
      include: 'property,room,createdBy,assignedTo',
    };

    const response = await apiClient.get('/tickets', { params: apiParams, signal });
    return response.data as PaginatedTickets;
  },

  // ─── Detail ────────────────────────────────────────────────────────────────
  getTicket: async (id: string): Promise<Ticket> => {
    const response = await apiClient.get(`/tickets/${id}`, {
      params: { include: 'property,room,createdBy,assignedTo,events.actor,costs.createdBy' },
    });
    return response.data.data as Ticket;
  },

  // ─── Create ────────────────────────────────────────────────────────────────
  createTicket: async (data: CreateTicketPayload): Promise<Ticket> => {
    const response = await apiClient.post('/tickets', data);
    return response.data.data as Ticket;
  },

  // ─── Update ────────────────────────────────────────────────────────────────
  updateTicket: async (id: string, data: UpdateTicketPayload): Promise<Ticket> => {
    const response = await apiClient.put(`/tickets/${id}`, data);
    return response.data.data as Ticket;
  },

  // ─── Status ────────────────────────────────────────────────────────────────
  updateStatus: async (id: string, data: UpdateTicketStatusPayload): Promise<Ticket> => {
    const response = await apiClient.patch(`/tickets/${id}/status`, data);
    return response.data.data as Ticket;
  },

  // ─── Delete ────────────────────────────────────────────────────────────────
  deleteTicket: async (id: string): Promise<void> => {
    await apiClient.delete(`/tickets/${id}`);
  },

  // ─── Events / Comments ────────────────────────────────────────────────────
  addEvent: async (ticketId: string, data: CreateTicketEventPayload): Promise<TicketEvent> => {
    const response = await apiClient.post(`/tickets/${ticketId}/events`, data);
    return response.data.data as TicketEvent;
  },

  // ─── Costs ────────────────────────────────────────────────────────────────
  addCost: async (ticketId: string, data: CreateTicketCostPayload): Promise<TicketCost> => {
    const response = await apiClient.post(`/tickets/${ticketId}/costs`, data);
    return response.data.data as TicketCost;
  },
};
