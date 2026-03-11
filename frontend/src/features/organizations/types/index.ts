export interface Organization {
  id: string;
  name: string;
  logo: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
  timezone: string;
  currency: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrgCreatePayload {
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  timezone?: string;
  currency?: string;
}

export interface OrgUpdatePayload extends OrgCreatePayload {}
