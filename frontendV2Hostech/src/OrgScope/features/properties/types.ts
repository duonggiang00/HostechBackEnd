export interface Property {
  id: string;
  code: string;
  name: string;
  address: string;
  area: number | null;
  shared_area: number | null;
  note: string | null;
  use_floors: boolean;
  default_billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  default_due_day: number;
  default_cutoff_day: number;
  bank_accounts: any[];
  rooms_count?: number;
  floors_count?: number;
  roomCount?: number;
  staffCount?: number;
  status: 'active' | 'maintenance' | 'inactive';
}
