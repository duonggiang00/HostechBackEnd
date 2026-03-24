import { Home } from 'lucide-react';
import type { NavItem } from '../../types/nav';

export const roomNav = (propertyId: string): NavItem => ({
  id: 'rooms',
  icon: Home,
  label: 'Phòng',
  path: `/property/${propertyId}/rooms`,
});
