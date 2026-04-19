export interface Property {
  id: string;
  code: string;
  name: string;
  address: string;
  area: number | null;
  shared_area: number | null;
  note: string | null;
  default_billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  default_due_day: number;
  default_cutoff_day: number;
  default_rent_price_per_m2?: number;
  default_deposit_months?: number;
  bank_accounts: any[];
  rooms_count?: number;
  floors_count?: number;
  roomCount?: number;
  staffCount?: number;
  status: 'active' | 'maintenance' | 'inactive';
  default_services?: any[];
  floors?: any[];
  stats?: {
    total_floors: number;
    total_rooms: number;
    occupied_rooms: number;
    vacant_rooms: number;
    occupancy_rate: number;
  };
}
