import type { Property } from '@/OrgScope/features/properties/types';
import type { Room } from '@/PropertyScope/features/rooms/types';
import type { User } from '@/shared/features/auth/types';

export type ContractStatus = 'DRAFT' | 'PENDING_SIGNATURE' | 'PENDING_PAYMENT' | 'ACTIVE' | 'PENDING_TERMINATION' | 'ENDED' | 'TERMINATED' | 'CANCELLED' | 'EXPIRED';
export type ContractMemberStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'LEFT';

export type ContractCancellationParty = 'LANDLORD' | 'TENANT' | 'MUTUAL';

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
  monthly_rent: number;
  deposit_amount: number;
  billing_cycle?: string | number;
  tenant?: {
    id: string;
    name: string;
  };
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
  role: string;
  status: ContractMemberStatus;
  is_primary: boolean;
  joined_at: string | null;
  signed_at: string | null;
  left_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  user?: User;
}

export interface Contract {
  id: string;
  org_id: string;
  property_id: string;
  room_id: string;
  status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  billing_cycle: string;
  billing_cycle_months?: number;
  due_day: number | null;
  cutoff_day: number | null;
  rent_price: number | null;
  deposit_amount: number | null;
  deposit_status?: 'PENDING' | 'HELD' | 'REFUND_PENDING' | 'REFUNDED' | 'PARTIAL_REFUND' | 'FORFEITED';
  refunded_amount?: number;
  forfeited_amount?: number;
  join_code: string | null;
  join_code_expires_at: string | null;
  join_code_revoked_at: string | null;
  signed_at: string | null;
  terminated_at: string | null;

  // Termination fields
  cancellation_party?: ContractCancellationParty | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  notice_days?: number;
  notice_given_at?: string | null;

  base_rent: number | null;
  fixed_services_fee: number | null;
  total_rent: number | null;
  cycle_months: number | null;
  created_by_user_id: string | null;
  meta: Record<string, any> | null;
  document_url: string | null;
  signed_document_url: string | null;
  initial_invoice?: {
    id: string;
    status: string;
    total_amount: number;
    paid_amount: number;
    due_date: string | null;
  } | null;
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

export interface ContractQueryParams {
  property_id?: string;
  room_id?: string;
  status?: string; // ContractStatus
  search?: string;
  sort?: string;
  include?: string;
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
}

export interface ContractListResponse {
  data: Contract[];
  status_counts: StatusCounts;
}

// ─── Payload Types (khớp ContractStoreRequest) ────────────────────────────────

export type ContractMemberRole = 'TENANT' | 'ROOMMATE' | 'GUARANTOR';

export interface CreateContractMemberPayload {
  user_id: string;
  full_name?: string;
  phone?: string;
  identity_number?: string;
  role?: ContractMemberRole;
  is_primary?: boolean;
  joined_at?: string;
}

export interface CreateContractPayload {
  property_id: string;
  room_id: string;
  start_date: string;
  end_date?: string;
  rent_price?: number;
  deposit_amount?: number;
  billing_cycle?: number;
  due_day?: number;
  cutoff_day?: number;
  status?: ContractStatus;
  members?: CreateContractMemberPayload[];
  meta?: Record<string, any>;
}

export interface ScanContractResponse {
  tenant_name?: string;
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

