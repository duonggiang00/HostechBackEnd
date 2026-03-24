import { LayoutDashboard } from 'lucide-react';
import type { NavItem } from '../../types/nav';

export const dashboardNav = (propertyId: string): NavItem => ({
  id: 'dashboard',
  icon: LayoutDashboard,
  label: 'Bảng điều khiển',
  path: `/property/${propertyId}/dashboard`,
});
