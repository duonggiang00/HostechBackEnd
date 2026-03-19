export interface DashboardStats {
  totalTenants: number;
  totalRooms: number;
  vacantRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  pendingTickets: number;
  unresolvedTickets: number;
  unpaidInvoices: number;
  thisMonthRevenue: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export interface PropertyDashboardData {
  stats: DashboardStats;
  revenueTrend: RevenueDataPoint[];
}
