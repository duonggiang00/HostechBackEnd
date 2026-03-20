import type { Property } from '@/OrgScope/features/properties/types';
import type { Room } from '@/PropertyScope/features/rooms/types';
import type { User } from '@/shared/features/auth/types';

export type ContractStatus = 'DRAFT' | 'PENDING_SIGNATURE' | 'PENDING_PAYMENT' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
export type ContractMemberStatus = 'pending' | 'active' | 'left';

export interface RoomContract {
  id: string;
  status: ContractStatus;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit_amount: number;
  billing_cycle?: 'monthly' | 'quarterly';
  tenant?: {
    id: string;
    name: string;
  };
  members?: Array<{ 
    id: string; 
    full_name: string; 
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
  due_day: number | null;
  cutoff_day: number | null;
  rent_price: number | null;
  deposit_amount: number | null;
  join_code: string | null;
  join_code_expires_at: string | null;
  join_code_revoked_at: string | null;
  signed_at: string | null;
  terminated_at: string | null;
  base_rent: number | null;
  fixed_services_fee: number | null;
  total_rent: number | null;
  cycle_months: number | null;
  created_by_user_id: string | null;
  meta: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Relations
  room?: Room;
  property?: Property;
  members?: ContractMember[];
  createdBy?: User;
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
  ENDED: number;
  CANCELLED: number;
  expiring: number;
}

export interface ContractListResponse {
  data: Contract[];
  status_counts: StatusCounts;
}

// ─── Payload Types (khớp ContractStoreRequest) ────────────────────────────────

export type ContractMemberRole = 'TENANT' | 'ROOMMATE' | 'GUARANTOR';

export interface CreateContractMemberPayload {
  user_id?: string;
  full_name: string;
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
  rent_price: number;
  deposit_amount?: number;
  billing_cycle?: 'MONTHLY' | 'QUARTERLY';
  due_day?: number;
  cutoff_day?: number;
  status?: ContractStatus;
  members?: CreateContractMemberPayload[];
  meta?: Record<string, any>;
}
