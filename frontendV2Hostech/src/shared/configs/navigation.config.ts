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
  Wallet,
  BookOpen,
  Inbox,
  Info,

  LayoutTemplate,
  ClipboardList,
  FileSignature,
  LayoutList,
  ClipboardCheck,
  ArrowLeftRight,
  Sun,
  Shield,
  Settings,
  Briefcase,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SidebarDropdownItem } from '@/shared/components/ui/SidebarDropdownSection';

export interface NavigationSection {
  id: string;
  label: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  path?: string;
  /** Nếu có, chỉ các role này thấy cả nhóm trong sidebar. */
  roles?: string[];
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
      { id: 'dashboard', icon: LayoutDashboard, label: 'Bảng điều khiển', path: '/org/dashboard', exact: true, roles: ['Admin', 'Owner', 'Manager'] },
      { id: 'properties', icon: Building2, label: 'Danh sách cơ sở', path: '/org/properties', exact: true },
    ],
  },
  {
    id: 'operations',
    label: 'Điều hành',
    items: [
      { id: 'rooms', icon: DoorOpen, label: 'Danh sách phòng', path: '/org/rooms', exact: true, roles: ['Admin', 'Owner', 'Manager'] },
      { id: 'staff', icon: Users, label: 'Nhân sự hệ hệ thống', path: '/org/staff', roles: ['Admin', 'Owner', 'Manager'] },
      { id: 'invoices', icon: Receipt, label: 'Quản lý hóa đơn', path: '/org/invoices', roles: ['Admin', 'Owner', 'Manager'] },
    ],
  },
  {
    id: 'analytics',
    label: 'Báo cáo',
    items: [
      { id: 'finance', icon: BarChart3, label: 'Tài chính tổng quát', path: '/org/finance', roles: ['Admin', 'Owner', 'Manager'] },
    ],
  },
  {
    id: 'governance',
    label: 'Tuân thủ & cấu hình',
    defaultOpen: false,
    roles: ['Admin', 'Owner'],
    items: [
      { id: 'compliance', icon: Shield, label: 'Tuân thủ & nhật ký', path: '/org/compliance', exact: true, roles: ['Admin', 'Owner'] },
      { id: 'org_settings', icon: Settings, label: 'Cấu hình tổ chức', path: '/org/organization-settings', exact: true, roles: ['Admin', 'Owner'] },
    ],
  },
];

/**
 * Cổng Tòa Nhà (Property Scope)
 * :propertyId sẽ được replace động trong hook useNavigation
 */
export const PROPERTY_NAVIGATION: NavigationSection[] = [
  {
    id: 'staff_today',
    label: 'Hôm nay',
    icon: Sun,
    defaultOpen: true,
    roles: ['Staff'],
    items: [
      {
        id: 'staff_home',
        icon: ClipboardList,
        label: 'Tác vụ hôm nay',
        path: '/properties/:propertyId/staff-home',
        exact: true,
      },
    ],
  },
  {
    id: 'property_core',
    label: 'Cơ sở vật chất',
    icon: Building2,
    defaultOpen: true,
    items: [
      {
        id: 'dashboard',
        icon: LayoutDashboard,
        label: 'Bảng điều khiển',
        path: '/properties/:propertyId/dashboard',
        exact: true,
        roles: ['Admin', 'Owner', 'Manager'],
      },
      { id: 'building_info', icon: Info, label: 'Thông tin chi tiết', path: '/properties/:propertyId/building-info', exact: true },
      { id: 'floorplan', icon: Layers, label: 'Mặt bằng tòa nhà', path: '/properties/:propertyId/building-view' },
      { id: 'rooms', icon: DoorOpen, label: 'Danh sách phòng', path: '/properties/:propertyId/rooms' },
      { id: 'room_templates', icon: LayoutTemplate, label: 'Mẫu thiết lập phòng', path: '/properties/:propertyId/room-templates', exact: true },
    ],
  },
  {
    id: 'service_metering',
    label: 'Vận hành tòa nhà',
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
      { 
        id: 'contracts', 
        icon: ScrollText, 
        label: 'Quản lý hợp đồng', 
        path: '/properties/:propertyId/contracts',
        badgeKey: 'contractAttention'
      },
      {
        id: 'handovers',
        icon: ClipboardCheck,
        label: 'Biên bản bàn giao phòng',
        path: '/properties/:propertyId/handovers',
      },
    ],
  },
  {
    id: 'people_support',
    label: 'Cư Dân & Hỗ Trợ',
    icon: Users,
    defaultOpen: true,
    items: [
      {
        id: 'tenants',
        icon: User,
        label: 'Người thuê & cư dân',
        path: '/properties/:propertyId/tenants',
      },
      {
        id: 'property_staff',
        icon: Briefcase,
        label: 'Nhân viên tòa nhà',
        path: '/properties/:propertyId/staff',
        roles: ['Owner', 'Manager'],
      },
      { 
        id: 'tickets', 
        icon: Ticket, 
        label: 'Yêu cầu hỗ trợ', 
        path: '/properties/:propertyId/tickets',
        badgeKey: 'openTickets'
      },
      {
        id: 'pending-requests',
        icon: Inbox,
        label: 'Yêu cầu cư dân',
        path: '/properties/:propertyId/requests',
        roles: ['Owner', 'Manager'],
        badgeKey: 'pendingRequests',
      },
    ],
  },
  {
    id: 'finance_ledger',
    label: 'Kế Toán / Sổ Quỹ',
    icon: Wallet,
    defaultOpen: false,
    items: [
      {
        id: 'finance-ledger',
        icon: BookOpen,
        label: 'Sổ Cái',
        path: '/properties/:propertyId/finance/ledger',
        roles: ['Owner', 'Manager'],
      },
      {
        id: 'invoices',
        icon: Receipt,
        label: 'Hóa đơn',
        path: '/properties/:propertyId/billing',
        activeExcludePathIncludes: ['/billing/payment-verifications'],
        badgeKey: 'issuedInvoices',
      },

      {
        id: 'finance-payments',
        icon: Wallet,
        label: 'Biên lai',
        path: '/properties/:propertyId/finance/payments',
        roles: ['Owner', 'Manager', 'Staff'],
      },
      {
        id: 'payment-verifications',
        icon: ClipboardCheck,
        label: 'Xét duyệt thanh toán',
        path: '/properties/:propertyId/billing/payment-verifications',
        roles: ['Owner', 'Manager', 'Staff'],
        badgeKey: 'pendingVerifications',
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
      {
        id: 'billing',
        icon: CreditCard,
        label: 'Hóa đơn',
        path: '/app/billing',
        activeExcludePathIncludes: ['/billing/transactions'],
      },
      {
        id: 'billing-transactions',
        icon: ScrollText,
        label: 'Giao dịch & biên lai',
        path: '/app/billing/transactions',
      },
      {
        id: 'transfer-requests',
        icon: ArrowLeftRight,
        label: 'Yêu cầu chuyển phòng',
        path: '/app/transfer-requests',
      },
      { id: 'tickets', icon: ClipboardList, label: 'Sự cố', path: '/app/tickets' },
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
    '/org/rooms': 'Danh sách phòng',
    '/org/compliance': 'Tuân thủ & nhật ký',
    '/org/organization-settings': 'Cấu hình tổ chức',
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
