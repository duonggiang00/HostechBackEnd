import type { PropertyDashboardData } from '../types';

export const dashboardApi = {
  getDashboardData: async (_propertyId: string): Promise<PropertyDashboardData> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      stats: {
        totalTenants: 124,
        totalRooms: 150,
        vacantRooms: 12,
        occupiedRooms: 138,
        occupancyRate: 92,
        pendingTickets: 8,
        unresolvedTickets: 15,
        unpaidInvoices: 4,
        thisMonthRevenue: 245000,
      },
      revenueTrend: [
        { month: 'Oct', revenue: 210000 },
        { month: 'Nov', revenue: 215000 },
        { month: 'Dec', revenue: 230000 },
        { month: 'Jan', revenue: 225000 },
        { month: 'Feb', revenue: 240000 },
        { month: 'Mar', revenue: 245000 },
      ],
    };
  },
};
