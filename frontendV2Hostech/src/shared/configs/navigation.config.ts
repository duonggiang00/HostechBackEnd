import { 
  LayoutDashboard, 

  Building2, 
  Users, 
  BarChart3, 
  Receipt,
  Layers,
  DoorOpen,
  DollarSign,
  ScrollText,
  Gauge,
  CreditCard,
  User,
  Ticket,

  Info,
  LayoutTemplate,
  ClipboardList,
  FileSignature,
  LayoutList,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SidebarDropdownItem } from '@/shared/components/ui/SidebarDropdownSection';

export interface NavigationSection {
  id: string;
  label: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  path?: string;
  items: NavigationItem[];
}

export interface NavigationItem extends SidebarDropdownItem {
  roles?: string[];
  badgeKey?: string; // Key để map với dữ liệu badge từ API
}

/**
 * Cổng Tổ Chức (Organization Scope)
 */
export const ORG_NAVIGATION: NavigationSection[] = [
  {
    id: 'overview',
    label: 'Tổng quan',
    defaultOpen: true,
    items: [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Bảng điều khiển', path: '/org/dashboard', exact: true, roles: ['Admin', 'Owner', 'Staff'] },
      { id: 'properties', icon: Building2, label: 'Danh sách cơ sở', path: '/org/properties', exact: true },
    ],
  },
  {
    id: 'operations',
    label: 'Điều hành',
    items: [
      { id: 'staff', icon: Users, label: 'Nhân sự hệ hệ thống', path: '/org/staff', roles: ['Admin', 'Owner', 'Staff'] },
      { id: 'invoices', icon: Receipt, label: 'Quản lý hóa đơn', path: '/org/invoices', roles: ['Admin', 'Owner', 'Staff'] },
    ],
  },
  {
    id: 'analytics',
    label: 'Báo cáo',
    items: [
      { id: 'finance', icon: BarChart3, label: 'Tài chính tổng quát', path: '/org/finance', roles: ['Admin', 'Owner', 'Staff'] },
    ],
  },
];

/**
 * Cổng Tòa Nhà (Property Scope)
 * :propertyId sẽ được replace động trong hook useNavigation
 */
export const PROPERTY_NAVIGATION: NavigationSection[] = [
  {
    id: 'property_core',
    label: 'Cơ Sở & Vận Hành',
    icon: Building2,
    defaultOpen: true,
    items: [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Bảng điều khiển', path: '/properties/:propertyId/dashboard', exact: true },
      { id: 'floorplan', icon: Layers, label: 'Mặt bằng tòa nhà', path: '/properties/:propertyId/building-view' },
      { id: 'rooms', icon: DoorOpen, label: 'Danh sách phòng', path: '/properties/:propertyId/rooms' },
      { id: 'building_info', icon: Info, label: 'Thông tin chi tiết', path: '/properties/:propertyId/building-info', exact: true },
      { id: 'room_templates', icon: LayoutTemplate, label: 'Mẫu thiết lập phòng', path: '/properties/:propertyId/room-templates', exact: true },
    ],
  },
  {
    id: 'service_metering',
    label: 'Dịch Vụ & Chỉ Số',
    icon: Gauge,
    defaultOpen: true,
    items: [
      { id: 'services', icon: DollarSign, label: 'Bảng giá dịch vụ', path: '/properties/:propertyId/services', exact: true },
      { 
        id: 'meters', 
        icon: Gauge, 
        label: 'Chỉ số điện nước', 
        path: '/properties/:propertyId/meters',
        exact: true,
      },
      {
        id: 'meter-history',
        icon: LayoutList,
        label: 'Lịch sử chốt số',
        path: '/properties/:propertyId/meters/history',
      },
    ],
  },
  {
    id: 'finance_business',
    label: 'Tài Chính & Hợp Đồng',
    icon: CreditCard,
    defaultOpen: true,
    items: [
      { 
        id: 'contracts', 
        icon: ScrollText, 
        label: 'Quản lý hợp đồng', 
        path: '/properties/:propertyId/contracts',
        badgeKey: 'contractAttention'
      },
      { 
        id: 'invoices', 
        icon: CreditCard, 
        label: 'Hóa đơn & Thu tiền', 
        path: '/properties/:propertyId/billing',
        badgeKey: 'issuedInvoices'
      },
    ],
  },
  {
    id: 'people_support',
    label: 'Cư Dân & Hỗ Trợ',
    icon: Users,
    defaultOpen: true,
    items: [
      { id: 'users', icon: User, label: 'Danh sách cư dân', path: '/properties/:propertyId/users' },
      { 
        id: 'tickets', 
        icon: Ticket, 
        label: 'Yêu cầu hỗ trợ', 
        path: '/properties/:propertyId/tickets',
        badgeKey: 'openTickets'
      },
    ],
  },
];

/**
 * Cổng Cư Dân (Tenant Scope)
 */
export const TENANT_NAVIGATION: NavigationSection[] = [
  {
    id: 'residence',
    label: 'Chỗ ở',
    defaultOpen: true,
    items: [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan', path: '/app/dashboard', exact: true },
      { id: 'my-room', icon: DoorOpen, label: 'Phòng của tôi', path: '/app/my-room' },
      { id: 'contracts', icon: FileSignature, label: 'Hợp đồng', path: '/app/contracts/pending' },
      { id: 'building-overview', icon: Layers, label: 'Sơ đồ tòa nhà', path: '/app/building-overview' },
    ],
  },
  {
    id: 'services',
    label: 'Tài chính và hỗ trợ',
    items: [
      { id: 'billing', icon: CreditCard, label: 'Hóa đơn', path: '/app/billing' },
      { id: 'requests', icon: ClipboardList, label: 'Yêu cầu', path: '/app/requests' },
    ],
  },
];

// Helper để lấy nhãn Breadcrumbs từ path
export const getBreadcrumbLabel = (path: string): string => {
  const staticLabels: Record<string, string> = {
    '/org': 'Tổ chức',
    '/properties': 'Tòa nhà',
    '/app': 'Cư dân',
    '/org/dashboard': 'Bảng điều khiển',
    '/org/properties': 'Danh sách cơ sở',
  };

  if (staticLabels[path]) return staticLabels[path];

  const allItems = [
    ...ORG_NAVIGATION.flatMap(s => s.items),
    ...PROPERTY_NAVIGATION.flatMap(s => s.items),
    ...TENANT_NAVIGATION.flatMap(s => s.items)
  ];
  
  const match = allItems.find(item => {
    const pattern = item.path.replace(/:[^\s/]+/g, '[^/]+');
    return new RegExp(`^${pattern}$`).test(path);
  });
  
  const label = match?.label || '';
  return label;
};
