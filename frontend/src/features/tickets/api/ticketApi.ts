import axiosClient from "../../../shared/api/axiosClient";
import type { Ticket, TicketFilters, TicketFormValues } from "../types";

// ─────────────────────────────────────────────────────────
// Helper — build Spatie-compatible query params
// ─────────────────────────────────────────────────────────

const buildParams = (filters?: TicketFilters) => {
  const params: Record<string, string | number> = {};
  if (!filters) return params;
  if (filters.status) params["filter[status]"] = filters.status;
  if (filters.type) params["filter[type]"] = filters.type;
  if (filters.priority) params["filter[priority]"] = filters.priority;
  if (filters.sort) params["sort"] = filters.sort;
  if (filters.page) params["page"] = filters.page;
  if (filters.per_page) params["per_page"] = filters.per_page;
  return params;
};

// ─────────────────────────────────────────────────────────
// Ticket CRUD
// ─────────────────────────────────────────────────────────

export const getTickets = async (
  filters?: TicketFilters
): Promise<{ data: Ticket[]; meta?: any }> => {
  const res = await axiosClient.get("tickets", { params: buildParams(filters) });
  return {
    data: res.data?.data ?? res.data,
    meta: res.data?.meta ?? undefined,
  };
};

export const getTicketById = async (id: number): Promise<Ticket> => {
  const res = await axiosClient.get(`tickets/${id}`);
  return res.data?.data ?? res.data;
};

export const createTicket = async (data: TicketFormValues): Promise<Ticket> => {
  const res = await axiosClient.post("tickets", data);
  return res.data?.data ?? res.data;
};

export const updateTicket = async (
  id: number,
  data: Partial<TicketFormValues>
): Promise<Ticket> => {
  const res = await axiosClient.put(`tickets/${id}`, data);
  return res.data?.data ?? res.data;
};

export const updateTicketStatus = async (
  id: number,
  status: string,
  note?: string
): Promise<Ticket> => {
  const res = await axiosClient.put(`tickets/${id}/status`, { status, note });
  return res.data?.data ?? res.data;
};

export const deleteTicket = async (id: number): Promise<void> => {
  await axiosClient.delete(`tickets/${id}`);
};
