export interface Meta {
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: Meta;
}

export interface PropertyUser {
  id: string;
  org_id?: string;
  role: string;
  full_name: string;
  email: string;
  phone?: string | null;
  identity_number?: string | null;
  identity_issued_date?: string | null;
  identity_issued_place?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  avatar_url?: string | null;
  is_active: boolean | string;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  last_login_at?: string | null;
  mfa_enabled?: boolean | string;
  mfa_method?: string | null;
  two_factor_enabled?: boolean;
  roles?: any;
  permissions?: any;
  properties?: any;
  assigned_rooms?: { id: string; name: string; code: string }[];
  created_at: string;
  updated_at?: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  role_name: string;
  org_id?: string | null;
  invited_by: string;
  expires_at: string;
  registered_at: string | null;
  created_at: string;
  inviter?: {
    id: string;
    name: string;
    email: string;
  };
}
