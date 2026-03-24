import { Settings } from 'lucide-react';
import type { NavItem } from '../../types/nav';

export const templatesNav = (propertyId: string): NavItem => ({
  id: 'settings-templates',
  icon: Settings,
  label: 'Thiết lập tòa nhà',
  path: `/properties/${propertyId}/templates`,
});
