export interface PropertyUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  roles?: string[];
  is_active: boolean;
  avatar_url?: string | null;
  created_at: string;
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
