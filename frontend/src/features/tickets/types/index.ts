import { z } from "zod";

// ─────────────────────────────────────────────────────────
// Enums / Constants
// ─────────────────────────────────────────────────────────

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED";

export type TicketType = "MAINTENANCE" | "COMPLAINT" | "REQUEST" | "OTHER";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export const TicketStatusLabels: Record<TicketStatus, string> = {
  OPEN: "Mở",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã giải quyết",
  CLOSED: "Đóng",
  CANCELLED: "Đã hủy",
};

export const TicketStatusColors: Record<TicketStatus, string> = {
  OPEN: "default",
  IN_PROGRESS: "processing",
  RESOLVED: "success",
  CLOSED: "default",
  CANCELLED: "error",
};

export const TicketTypeLabels: Record<TicketType, string> = {
  MAINTENANCE: "Sửa chữa",
  COMPLAINT: "Khiếu nại",
  REQUEST: "Yêu cầu",
  OTHER: "Khác",
};

export const TicketPriorityLabels: Record<TicketPriority, string> = {
  low: "Thấp",
  normal: "Bình thường",
  high: "Cao",
  urgent: "Khẩn cấp",
};

export const TicketPriorityColors: Record<TicketPriority, string> = {
  low: "default",
  normal: "blue",
  high: "orange",
  urgent: "red",
};

// ─────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────

export interface TicketUser {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface TicketProperty {
  id: number;
  name: string;
}

export interface TicketRoom {
  id: number;
  name: string;
}

export interface TicketMedia {
  id: number;
  url: string;
  file_name: string;
  mime_type: string;
}

export interface Ticket {
  id: number;
  title: string;
  description?: string;
  status: TicketStatus;
  type: TicketType;
  priority: TicketPriority;
  created_by?: TicketUser;
  assigned_to?: TicketUser;
  property?: TicketProperty;
  room?: TicketRoom;
  media?: TicketMedia[];
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketFilters {
  status?: TicketStatus;
  type?: TicketType;
  priority?: TicketPriority;
  sort?: string;
  page?: number;
  per_page?: number;
}

// ─────────────────────────────────────────────────────────
// Zod Schemas
// ─────────────────────────────────────────────────────────

export const TicketFormSchema = z.object({
  title: z.string().min(5, "Tiêu đề phải ít nhất 5 ký tự"),
  description: z.string().optional(),
  type: z.enum(["MAINTENANCE", "COMPLAINT", "REQUEST", "OTHER"]),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  media_uuids: z.array(z.string()).optional(),
});

export type TicketFormValues = z.infer<typeof TicketFormSchema>;

export const TicketStatusUpdateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"]),
  note: z.string().optional(),
});
