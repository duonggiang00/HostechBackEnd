export interface AdminDashboard {
  filter: { from: string; to: string };
  organizations: {
    total: number;
    new_in_range: number;
    growth_last_6_months: { month: string; count: number }[];
  };
  users: {
    total: number;
    by_role: { owner: number; manager: number; staff: number; tenant: number };
  };
  properties: {
    total_properties: number;
    total_rooms: number;
    occupied_rooms: number;
    available_rooms: number;
    occupancy_rate: number;
  };
}

export interface OwnerDashboard {
  filter: { from: string; to: string };
  revenue: {
    current_period: number;
    previous_period: number;
    change_percent: number;
  };
  properties: {
    total_properties: number;
    total_rooms: number;
    occupied_rooms: number;
    available_rooms: number;
    occupancy_rate: number;
    list: {
      id: string;
      code: string;
      name: string;
      address: string;
      rooms_count: number;
      occupied_rooms_count: number;
      available_rooms_count: number;
    }[];
  };
  staff: { managers: number; staff: number; total: number };
  contracts: {
    total_active: number;
    expiring_in_30_days: number;
    new_in_range: number;
  };
}

export interface ManagerDashboard {
  filter: { from: string; to: string };
  tenants: { active: number; new_in_range: number };
  revenue: { total: number; rent: number; service: number };
  contracts: {
    total_active: number;
    expiring_in_30_days: number;
    overdue: number;
  };
  tickets: {
    pending: number;
    in_progress: number;
    done: number;
    cancelled: number;
    total: number;
    mttr_hours: number;
    by_status: Record<string, number>;
  };
  properties: {
    total_properties: number;
    total_rooms: number;
    occupied_rooms: number;
    available_rooms: number;
    occupancy_rate: number;
  };
}

export type DashboardData = AdminDashboard | OwnerDashboard | ManagerDashboard;

export interface DashboardResponse {
  role: 'admin' | 'owner' | 'manager' | 'staff';
  data: DashboardData;
}
