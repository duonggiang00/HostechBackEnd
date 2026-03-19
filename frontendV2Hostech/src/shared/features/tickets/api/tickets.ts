import apiClient from '@/shared/api/client';
import type { Ticket } from '../types';

export const ticketsApi = {
  getTickets: async (params?: { property_id?: string; room_id?: string; status?: string }) => {
    const response = await apiClient.get('/tickets', {
      params: {
        include: 'room',
        ...params,
      }
    });
    return (response.data.data || response.data) as Ticket[];
  },

  updateTicketStatus: async (id: string, status: string) => {
    await apiClient.put(`/tickets/${id}/status`, { status });
  },
};
