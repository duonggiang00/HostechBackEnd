import { Layout, ClipboardList, Building2 } from 'lucide-react';
import type { NavItem } from '../../types/nav';

export const propertyNav = (propertyId: string): NavItem => ({
  id: 'properties',
  icon: Building2,
  label: 'Bất động sản',
  path: `/properties/${propertyId}/dashboard`,
});

export const propertySettingsNav = (propertyId: string): NavItem[] => [
  {
    id: 'config-info',
    icon: Building2,
    label: 'Thông tin tòa nhà',
    path: `/properties/${propertyId}/building-info`,
  },
  {
    id: 'config-services',
    icon: ClipboardList,
    label: 'Loại dịch vụ',
    path: `/properties/${propertyId}/services`,
  },
  {
    id: 'config-rooms',
    icon: Layout,
    label: 'Phòng mẫu',
    path: `/properties/${propertyId}/room-templates`,
  },
];
