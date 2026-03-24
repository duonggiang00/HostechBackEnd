import { Building2 } from 'lucide-react';
import type { NavItem } from '../../types/nav';

export const propertyNav = (propertyId: string): NavItem => ({
  id: 'properties',
  icon: Building2,
  label: 'Bất động sản',
  path: `/property/${propertyId}/properties`,
});
