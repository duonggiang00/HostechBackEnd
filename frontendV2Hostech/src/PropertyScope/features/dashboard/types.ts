export interface DashboardStats {
  totalTenants: number;
  totalRooms: number;
  vacantRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  pendingTickets: number;
  unresolvedTickets: number;
  /** Giữ trong API; không hiển thị trên card dashboard tòa nhà */
  unpaidInvoices?: number;
  activeContracts: number;
  thisMonthRevenue: number;
  revenueTrendValue: number;
  tenantTrendValue: number;
  /** Số hợp đồng đang có hóa đơn OVERDUE */
  overdueContractCount: number;
  /** Tổng số tiền chưa thu của các hóa đơn nợ */
  totalOutstandingDebt: number;
}


export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export interface PropertyDashboardData {
  stats: DashboardStats;
  revenueTrend: RevenueDataPoint[];
}
