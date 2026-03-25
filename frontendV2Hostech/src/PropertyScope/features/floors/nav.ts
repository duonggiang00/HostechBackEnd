import { Layers } from 'lucide-react';
import type { NavItem } from '../../types/nav';

export const floorNav = (propertyId: string): NavItem => ({
  id: 'floors',
  icon: Layers,
  label: 'Tầng',
  path: `/properties/${propertyId}/floors`,
});
