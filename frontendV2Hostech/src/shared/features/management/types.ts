export interface Organization {
  id: string;
  name: string;
  code: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  role_name: string;
  org_id?: string;
  expires_at: string;
  registered_at?: string;
  created_at: string;
  org?: {
    id: string;
    name: string;
  };
}

export interface InvitationValidation {
  email: string;
  role_name: string;
  org: {
    id: string;
    name: string;
  } | null;
  requires_org_creation: boolean;
}
