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

export interface ContractMemberPrefill {
  full_name: string | null;
  phone: string | null;
  identity_number: string | null;
  date_of_birth: string | null;
  license_plate: string | null;
  address: string | null;
  has_identity_documents: boolean;
}

export interface InvitationValidation {
  email: string;
  role_name: string;
  org: {
    id: string;
    name: string;
  } | null;
  requires_org_creation: boolean;
  contract_member_prefill?: ContractMemberPrefill | null;
}
