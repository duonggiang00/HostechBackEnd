import { Settings } from 'lucide-react';
import type { NavItem } from '../../types/nav';

export const templatesNav = (propertyId: string): NavItem => ({
  id: 'settings-templates',
  icon: Settings,
  label: 'Cấu hình hệ thống',
  path: `/property/${propertyId}/settings/templates`,
});
