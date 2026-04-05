import { LayoutDashboard } from 'lucide-react';
import type { NavItem } from '../../types/nav';

export const buildingOverviewNav = (propertyId: string): NavItem => ({
  id: 'building-overview',
  icon: LayoutDashboard,
  label: 'Mặt bằng tòa nhà',
  path: `/properties/${propertyId}/building-view`,
});
