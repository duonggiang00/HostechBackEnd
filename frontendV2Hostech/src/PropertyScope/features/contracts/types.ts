import type { Property } from '@/OrgScope/features/properties/types';
import type { Room } from '@/PropertyScope/features/rooms/types';
import type { User } from '@/shared/features/auth/types';

export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'PENDING_TERMINATION'
  | 'PENDING_SETTLEMENT'
  | 'ENDED'
  | 'TERMINATED'
  | 'CANCELLED'
  | 'EXPIRED';
export type ContractMemberStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'LEFT';

export type ContractCancellationParty = 'LANDLORD' | 'TENANT' | 'MUTUAL' | 'SYSTEM';

export type TerminationBillingMode = 'combined' | 'split';

/** GET /contracts/{id}/termination/liquidation-preview — `data` payload */
export interface LiquidationPreviewDebtRow {
  invoice_id: string;
  period_start?: string | null;
  outstanding: number;
}

export interface LiquidationPreviewInvoiceItemRow {
  type: string;
  description: string;
  quantity?: number;
  unit_price?: number;
  amount: number;
}

export interface LiquidationPreviewData {
  tong_tien_coc: number;
  no_cu: LiquidationPreviewDebtRow[];
  tong_no_cu: number;
  phi_thanh_ly_cuoi: number;
  items: LiquidationPreviewInvoiceItemRow[];
  so_du_sau_quyet_toan: number;
  kich_ban: 'A' | 'B' | 'C';
  hoan_tra_du_kien: number;
  /** Luôn 0 — hoàn thỏa thuận nhập qua dòng biên lai trên wizard, không còn trường goodwill riêng. */
  hoan_tra_goodwill_du_kien: number;
  tong_hoan_tra_du_kien: number;
  con_phai_thu: number;
  billing_mode: TerminationBillingMode;
  existing_monthly_invoice_id: string | null;
  is_early_termination: boolean;
  /** `pipeline_estimate` khi gọi liquidation-preview. */
  preview_source?: 'pipeline_estimate' | 'linked_invoice_db';
  final_invoice_id?: string;
}

export interface TerminationHandoverPersisted {
  id: string;
  org_id?: string;
  contract_id: string;
  room_id?: string;
  note?: string | null;
  document_scan_urls?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface TerminationHandoverItemRow {
  id?: string;
  room_asset_id: string;
  name?: string | null;
  condition?: 'OK' | 'MISSING' | 'DAMAGED' | string | null;
  note?: string | null;
  sort_order?: number;
  condition_photo_urls?: unknown[];
}

export interface TerminationHandoverStateResponse {
  persisted: boolean;
  handover: TerminationHandoverPersisted | null;
  default_handover_note: string | null;
  items: TerminationHandoverItemRow[];
}

export interface TerminationManualInvoiceLine {
  description: string;
  amount: number;
}

export interface TerminationRefundReceiptLine {
  description: string;
  amount: number;
}

export interface TerminationSyncPayload {
  termination_date?: string;
  cancellation_party?: ContractCancellationParty;
  cancellation_reason?: string;
  waive_penalty?: boolean;
  damage_fee_total?: number;
  billing_mode?: TerminationBillingMode;
  mid_month_rent_credit?: number;
  additional_invoice_lines?: TerminationManualInvoiceLine[];
}

export interface TerminationPreviewQuery extends TerminationSyncPayload {}

export interface FinalizeTerminationData {
  refund_receipt_lines?: TerminationRefundReceiptLine[];
  /** Khi true và sau cấn trừ vẫn có khoản hoàn — không tạo biên lai hoàn, ghi nhận thu hồi (FORFEIT). */
  forfeit_remaining_deposit?: boolean;
}

export interface FinalizeTerminationResult {
  scenario: 'A' | 'B' | 'C' | 'FORFEIT' | null;
  final_invoice_id: string;
  contract_status: string;
  refund_receipt_id: string | null;
  refund_amount: number | null;
  deposit_refund_portion: number | null;
  final_payment_request_id: string | null;
  amount_due: number | null;
  /** Khi tổ chức bật `termination_require_supplemental_invoice_for_outstanding` và kịch B — hóa đơn phát hành để thu nợ còn lại. */
  supplemental_invoice_id?: string | null;
  /** Hóa đơn thanh lý (sau điều chỉnh CREDIT nếu có nhánh bổ sung). */
  termination_final_invoice_id?: string | null;
  /** Kịch FORFEIT — tổng ghi nhận thu hồi (không phát hành biên lai hoàn). */
  forfeited_amount?: number | null;
}

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

export type ContractStatusEventType =
  | 'STATUS_CHANGE'
  | 'CONTRACT_CREATED'
  | 'SIGNATURE_TENANT'
  | 'SIGNATURE_MANAGER'
  | 'HANDOVER_SUBMITTED'
  | 'FINAL_INVOICE_GENERATED'
  | 'DEBT_RECONCILIATION'
  | 'SETTLEMENT_PAYMENT_REQUESTED'
  | 'SETTLEMENT_RESOLVED'
  | 'ROOM_TRANSFER';

export interface ContractStatusHistoryUserRef {
  id: string;
  full_name?: string | null;
  email?: string | null;
}

export interface ContractStatusHistory {
  id: string;
  contract_id: string;
  event_type: ContractStatusEventType;
  from_status: ContractStatus | null;
  to_status: ContractStatus | null;
  notes: string | null;
  payload: Record<string, any> | null;
  created_at: string;
  changed_by_user?: ContractStatusHistoryUserRef | null;
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
  email?: string | null;
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

  /** Khớp ContractResource khi load `members` — chủ hợp đồng để hiển thị. */
  tenant?: {
    id: string;
    name?: string | null;
    full_name?: string | null;
    email?: string | null;
  } | null;

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
  TERMINATED: number;
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

export type PendingRequestType = 'ROOM_TRANSFER' | 'ADD_MEMBER' | 'TERMINATION' | 'RENEWAL';

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

  /** TERMINATION — ngày dời đi tenant đã gửi */
  expected_move_out_date?: string | null;
  /** RENEWAL — ngày kết thúc mới tenant đề nghị */
  requested_end_date?: string | null;
}

export interface PendingRequestsMeta {
  total: number;
  transfer_count: number;
  add_member_count: number;
  termination_count: number;
  renewal_count: number;
}

export interface PendingRequestsResponse {
  data: PendingRequest[];
  meta: PendingRequestsMeta;
}
