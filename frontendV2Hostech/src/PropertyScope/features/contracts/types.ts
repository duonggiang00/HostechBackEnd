import type { Property } from '@/OrgScope/features/properties/types';
import type { Room } from '@/PropertyScope/features/rooms/types';
import type { User } from '@/shared/features/auth/types';

export type ContractStatus = 'DRAFT' | 'PENDING_SIGNATURE' | 'PENDING_PAYMENT' | 'ACTIVE' | 'PENDING_TERMINATION' | 'ENDED' | 'TERMINATED' | 'CANCELLED' | 'EXPIRED';
export type ContractMemberStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'LEFT';

export type ContractCancellationParty = 'LANDLORD' | 'TENANT' | 'MUTUAL';

export interface ContractOutstandingInvoice {
  id: string;
  status: string;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  debt: number;
  is_overdue: boolean;
}

export interface ContractInvoiceDebt {
  has_debt: boolean;
  total_outstanding: number;
  overdue_count: number;
  invoices: ContractOutstandingInvoice[];
}

export interface ContractStatusHistory {
  id: string;
  contract_id: string;
  old_status: ContractStatus | null;
  new_status: ContractStatus;
  reason: string | null;
  comment: string | null;
  created_at: string;
  changedBy?: User;
}

export interface RoomContract {
  id: string;
  status: ContractStatus;
  start_date: string;
  end_date: string;
  expected_move_out_date?: string | null;
  monthly_rent: number;
  base_rent: number;
  fixed_services_fee: number;
  total_rent: number;
  rent_price: number;
  deposit_amount: number;
  /** Số tháng cọc — backend lưu cột `deposit_months`. */
  deposit_months?: number;
  due_day?: number;
  tenant_full_name?: string;
  members?: Array<{ 
    id: string; 
    user_id?: string;
    full_name: string; 
    phone?: string;
    role: 'TENANT' | 'ROOMMATE' | string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
    is_primary?: boolean;
  }>;
}

export interface ContractMember {
  id: string;
  org_id: string;
  contract_id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  identity_number: string | null;
  date_of_birth: string | null;
  license_plate: string | null;
  permanent_address?: string | null;
  role: string;
  status: ContractMemberStatus;
  is_primary: boolean;
  joined_at: string | null;
  signed_at: string | null;
  left_at: string | null;
  created_at: string;
  updated_at: string;

  identity_front_url?: string | null;
  identity_back_url?: string | null;

  // Relations
  user?: User;
}

export interface Contract {
  id: string;
  org_id: string;
  property_id: string;
  room_id: string;
  status: ContractStatus;
  /** Còn ít nhất một hóa đơn chưa thanh toán đủ */
  has_invoice_debt?: boolean;
  start_date: string | null;
  end_date: string | null;
  billing_cycle: string;
  billing_cycle_months?: number;
  due_day: number | null;
  cutoff_day: number | null;
  rent_price: number | null;
  deposit_amount: number | null;
  /** Số tháng cọc — minh bạch hoá công thức cọc = (rent + fixed_services_fee) × deposit_months. */
  deposit_months?: number | null;
  deposit_status?: 'PENDING' | 'HELD' | 'REFUND_PENDING' | 'REFUNDED' | 'PARTIAL_REFUND' | 'FORFEITED';
  refunded_amount?: number;
  forfeited_amount?: number;
  join_code: string | null;
  join_code_expires_at: string | null;
  join_code_revoked_at: string | null;
  signed_at: string | null;
  terminated_at: string | null;
  custom_content: string | null;

  // Termination fields
  cancellation_party?: ContractCancellationParty | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  notice_days?: number;
  notice_given_at?: string | null;
  expected_move_out_date?: string | null;

  base_rent: number | null;
  fixed_services_fee: number | null;
  total_rent: number | null;
  cycle_months: number | null;
  created_by_user_id: string | null;
  meta: Record<string, any> | null;
  document_url: string | null;
  document_path: string | null;
  document_type: 'PDF' | 'DOCX' | null;
  signed_document_url: string | null;
  initial_invoice?: {
    id: string;
    code?: string;
    status: string;
    total_amount: number;
    paid_amount: number;
    debt?: number;
    due_date: string | null;
  } | null;
  /** Các hóa đơn đang nợ (khi API load invoices) */
  invoice_debt?: ContractInvoiceDebt | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Relations
  room?: Room;
  property?: Property;
  members?: ContractMember[];
  createdBy?: User;
  statusHistories?: ContractStatusHistory[];
}

/** POST /contracts/{id}/request-termination */
export interface RequestTerminationNoticeResponse {
  message: string;
  warnings: string[];
  is_early_termination: boolean;
  contract: {
    id: string;
    status: ContractStatus;
    expected_move_out_date: string | null;
    end_date: string | null;
  };
}

export interface ContractQueryParams {
  property_id?: string;
  room_id?: string;
  status?: string; // ContractStatus
  search?: string;
  sort?: string;
  with_trashed?: boolean;
  page?: number;
  per_page?: number;
}

export interface StatusCounts {
  total: number;
  DRAFT: number;
  PENDING_SIGNATURE: number;
  PENDING_PAYMENT: number;
  ACTIVE: number;
  PENDING_TERMINATION: number;
  ENDED: number;
  CANCELLED: number;
  EXPIRED: number;
  expiring: number;
  /** Số hợp đồng còn hóa đơn chưa thanh toán đủ */
  invoice_debt?: number;
}

export interface ContractListResponse {
  data: Contract[];
  status_counts: StatusCounts;
}

// ─── Payload Types (khớp ContractStoreRequest) ────────────────────────────────

export type ContractMemberRole = 'TENANT' | 'ROOMMATE' | 'GUARANTOR';

export interface CreateContractMemberPayload {
  user_id?: string;
  email?: string;
  full_name?: string;
  phone?: string;
  identity_number?: string;
  date_of_birth?: string;
  license_plate?: string;
  permanent_address?: string;
  role?: ContractMemberRole;
  is_primary?: boolean;
  joined_at?: string;
  /** Bắt buộc khi thành viên ≥18 tuổi (hoặc chủ hợp đồng); có thể bỏ qua nếu dưới 18 — khớp backend */
  identity_front_media_id?: string;
  identity_back_media_id?: string;
}

export interface CreateContractPayload {
  property_id: string;
  room_id: string;
  start_date: string;
  end_date?: string;
  rent_price?: number;
  deposit_amount?: number;
  /** Số tháng cọc (1..24) — backend lưu cột `deposit_months` minh bạch hoá công thức cọc. */
  deposit_months?: number;
  billing_cycle?: number;
  due_day?: number;
  cutoff_day?: number;
  status?: ContractStatus;
  custom_content?: string;
  members?: CreateContractMemberPayload[];
  meta?: Record<string, any>;
}

export interface ScanContractResponse {
  tenant_full_name?: string;
  tenant_phone?: string;
  tenant_id_number?: string;
  room_code?: string;
  rent_price?: number;
  deposit_amount?: number;
  start_date?: string;
  end_date?: string;
  billing_cycle?: string | number;
  file_path?: string;
  user_id?: string;
  _db_user_found?: boolean;
}

// ─── Pending Requests (Aggregated Manager View) ───────────────────────────────

export type PendingRequestType = 'ROOM_TRANSFER' | 'ADD_MEMBER' | 'TERMINATION';

export interface PendingRequest {
  type: PendingRequestType;
  contract_id: string;
  room_name?: string;
  requested_at: string;

  // ROOM_TRANSFER
  from_room?: string;
  from_room_id?: string;
  to_room?: string;
  to_room_id?: string;
  request_index?: number;
  tenant_full_name?: string;
  reason?: string;

  // ADD_MEMBER
  member_id?: string;
  member_full_name?: string;
  member_phone?: string;
  member_role?: string;
  requester_full_name?: string;
}

export interface PendingRequestsMeta {
  total: number;
  transfer_count: number;
  add_member_count: number;
  termination_count: number;
}

export interface PendingRequestsResponse {
  data: PendingRequest[];
  meta: PendingRequestsMeta;
}
