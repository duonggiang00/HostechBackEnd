import { useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import {
  Building2,
  DoorOpen,
  Layers,
  Bell,
  Search,
  Menu,
  Gauge,
  User,
  CreditCard,
  LayoutDashboard,
  Ticket,
  DollarSign,
  ArrowLeftCircle,
  LayoutGrid,
  LayoutTemplate,
  ScrollText,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import PropertySwitcher from '@/OrgScope/features/properties/components/PropertySwitcher';
import { useScopeExitPath } from '@/shared/hooks/useDashboardHomePath';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import type { SidebarDropdownItem } from '@/shared/components/ui/SidebarDropdownSection';
import { useTickets } from '../features/tickets/hooks/useTickets';
import { useContracts } from '../features/contracts/hooks/useContracts';
import { usePropertyInvoices } from '../features/billing/hooks/usePropertyInvoices';
import NotificationCenter from '@/shared/features/messaging/components/NotificationCenter';
import { Link } from 'react-router-dom';
import Sidebar from '@/shared/components/ui/Sidebar';


interface PropertyScopeLayoutProps {
  children: ReactNode;
}

interface SidebarSection {
  id: string;
  label: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  items: SidebarDropdownItem[];
  path?: string;
}

export default function PropertyScopeLayout({ children }: PropertyScopeLayoutProps) {
  const { user } = useAuthStore();
  const { propertyId } = useParams<{ propertyId: string }>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);


  const { data: openTicketsData } = useTickets({ property_id: propertyId, status: 'OPEN', per_page: 1 });
  const openCount = openTicketsData?.meta.total || 0;

  const { data: contractData } = useContracts(
    { property_id: propertyId, per_page: 1, page: 1 },
    { enabled: !!propertyId, staleTime: 45_000 },
  );
  const pendingSignatureCount = contractData?.status_counts?.PENDING_SIGNATURE ?? 0;
  const pendingPaymentCount = contractData?.status_counts?.PENDING_PAYMENT ?? 0;
  const contractAttentionCount = pendingSignatureCount + pendingPaymentCount;

  const { data: invoiceIssuedData } = usePropertyInvoices(propertyId ?? '', {
    status: 'ISSUED',
    per_page: 1,
    page: 1,
  });
  const issuedInvoiceCount = invoiceIssuedData?.meta?.total ?? 0;

  const menuSections: SidebarSection[] = [
    {
      id: 'overview',
      label: '', // Không hiển thị nhãn sẽ khiến Trang Chủ hiển thị ở cấp thư mục gốc (Root)
      defaultOpen: true,
      path: `/properties/${propertyId}/dashboard`,
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Trang chủ', path: `/properties/${propertyId}/dashboard`, exact: true },
      ],
    },
    {
      id: 'spaces',
      label: 'Không Gian Cho Thuê',
      icon: LayoutGrid,
      defaultOpen: true,
      items: [
        { id: 'floorplan', icon: Layers, label: 'Mặt bằng tòa nhà', path: `/properties/${propertyId}/building-view` },
        { id: 'rooms', icon: DoorOpen, label: 'Danh sách phòng', path: `/properties/${propertyId}/rooms` },
        { id: 'details', icon: Building2, label: 'Thông tin chung', path: `/properties/${propertyId}/templates/building`, exact: true },
      ],
    },
    {
      id: 'finance_business',
      label: 'Tài Chính & Kinh Doanh',
      icon: DollarSign,
      defaultOpen: true,
      items: [
        { 
          id: 'contracts', 
          icon: ScrollText, 
          label: 'Quản lý hợp đồng', 
          path: `/properties/${propertyId}/contracts`,
          badge: contractAttentionCount > 0 ? contractAttentionCount : undefined,
        },
        { 
          id: 'meters', 
          icon: Gauge, 
          label: 'Chỉ số điện nước', 
          path: `/properties/${propertyId}/meters`,
        },
        { 
          id: 'invoices', 
          icon: CreditCard, 
          label: 'Hóa đơn & Thu tiền', 
          path: `/properties/${propertyId}/billing`,
          badge: issuedInvoiceCount > 0 ? issuedInvoiceCount : undefined,
        },
        { id: 'services', icon: DollarSign, label: 'Bảng giá dịch vụ', path: `/properties/${propertyId}/services`, exact: true },
      ],
    },
    {
      id: 'operations',
      label: 'Cư dân & Vận Hành',
      icon: Building2,
      defaultOpen: true,
      items: [
        { id: 'users', icon: User, label: 'Danh sách cư dân', path: `/properties/${propertyId}/users` },
        { 
          id: 'tickets', 
          icon: Ticket, 
          label: 'Yêu cầu hỗ trợ', 
          path: `/properties/${propertyId}/tickets`,
          badge: openCount > 0 ? openCount : undefined,
        },
      ],
    },
    {
      id: 'settings',
      label: 'Cài Đặt Tòa nhà',
      icon: Settings,
      items: [
        { id: 'details', icon: Settings, label: 'Thông tin tòa nhà', path: `/properties/${propertyId}/templates/building`, exact: true },
      ],
    },
  ];

  // Removed quickActions as they are now integrated into dropdowns above.

  const scopeExitPath = useScopeExitPath();

  const exitLink = null;

  const extraContent = null;

  return (
    <div className="flex min-h-screen bg-[#f5f5f9] font-sans text-[#697a8d] dark:bg-[#232333] dark:text-[#a3b4cc]">
      {/* Desktop Sidebar */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuSections={propertyId ? menuSections : []}
        extraContent={extraContent}
        profilePath={`/properties/${propertyId}/profile`}
        exitLink={exitLink}
        scopeLabel="Phạm vi tòa nhà"
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-700/50 px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-all duration-300">
          <div className="flex items-center gap-3 md:gap-6 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center gap-3">
                <Building2 className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Vận Hành</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden md:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text" 
                hidden
                placeholder="Tìm kiếm nhanh..."
                className="pl-12 pr-6 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-2xl outline-none focus:border-indigo-200 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-sm font-bold w-48 lg:w-64 shadow-inner text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div 
              onClick={() => setIsNotificationOpen(true)}
              className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer border border-slate-100 dark:border-slate-600 relative group"
            >
              <Bell className="w-5 h-5" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800 group-hover:scale-110 transition-transform" />
            </div>

            <div className="h-8 w-px bg-slate-100 dark:bg-slate-700 mx-1 hidden md:block" />

            <div className="hidden md:block w-[180px] lg:w-[220px]">
              <PropertySwitcher variant="header" />
            </div>

            <ThemeToggle compact={true} />
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-700">{children}</div>
        </main>
      </div>

      <NotificationCenter isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
    </div>
  );
}

