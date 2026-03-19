export interface Contract {
  id: string;
  room_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'pending' | 'draft' | 'expired' | 'terminated';
  monthly_rent: number;
  deposit_amount: number;
  billing_cycle: 'monthly' | 'quarterly';
  tenant?: {
    id: string;
    name: string;
    email: string;
  };
  members?: Array<{
    id: string;
    full_name: string;
    phone?: string;
    identity_number?: string;
    [key: string]: any;
  }>;
  room?: {
    id: string;
    name: string;
  };
}
