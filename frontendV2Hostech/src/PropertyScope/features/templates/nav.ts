import { Layout, ClipboardList, Building2 } from 'lucide-react';
import type { NavItem } from '../../types/nav';

export const templatesNav = (propertyId: string): NavItem[] => [
  {
    id: 'config-building',
    icon: Building2,
    label: 'Chi tiết tòa nhà',
    path: `/properties/${propertyId}/templates/building`,
  },
  {
    id: 'config-services',
    icon: ClipboardList,
    label: 'Loại dịch vụ',
    path: `/properties/${propertyId}/templates/services`,
  },
  {
    id: 'config-rooms',
    icon: Layout,
    label: 'Phòng mẫu',
    path: `/properties/${propertyId}/templates/rooms`,
  },
];
