// ─── Enums ────────────────────────────────────────────────────────────────────

export type TicketStatus =
  | 'OPEN'
  | 'RECEIVED'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'DONE'
  | 'CANCELLED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TicketEventType = 'CREATED' | 'STATUS_CHANGED' | 'COMMENT';

export type TicketCostPayer = 'OWNER' | 'TENANT';

// ─── Sub-models ───────────────────────────────────────────────────────────────

export interface TicketActor {
  id: string;
  full_name: string;
  email?: string;
}

export interface TicketEvent {
  id: string;
  type: TicketEventType;
  message: string | null;
  meta: Record<string, any> | null;
  actor: TicketActor;
  created_at: string;
}

export interface TicketCost {
  id: string;
  amount: number;
  payer: TicketCostPayer;
  note: string | null;
  created_by: TicketActor;
  created_at: string;
}

export interface TicketRoom {
  id: string;
  name: string;
  code: string;
}

export interface TicketProperty {
  id: string;
  name: string;
}

// ─── Main Model ───────────────────────────────────────────────────────────────

export interface Ticket {
  id: string;
  org_id: string;
  property_id: string;
  room_id: string;
  contract_id: string | null;
  created_by_user_id: string;
  assigned_to_user_id: string | null;
  category: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  due_at: string | null;
  closed_at: string | null;
  property: TicketProperty;
  room: TicketRoom;
  created_by: TicketActor;
  assigned_to: TicketActor | null;
  events?: TicketEvent[];
  costs?: TicketCost[];
  created_at: string;
  updated_at: string;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateTicketPayload {
  property_id: string;
  room_id: string;
  category?: string;
  priority?: TicketPriority;
  description: string;
  due_at?: string;
  assigned_to_user_id?: string;
}

export interface UpdateTicketPayload {
  category?: string;
  priority?: TicketPriority;
  description?: string;
  due_at?: string;
  assigned_to_user_id?: string | null;
}

export interface UpdateTicketStatusPayload {
  status: TicketStatus;
}

export interface CreateTicketEventPayload {
  message: string;
}

export interface CreateTicketCostPayload {
  amount: number;
  payer: TicketCostPayer;
  note?: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface TicketQueryParams {
  property_id?: string;
  room_id?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
  page?: number;
  per_page?: number;
}

// ─── Paginated Response ───────────────────────────────────────────────────────

export interface PaginatedTickets {
  data: Ticket[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
