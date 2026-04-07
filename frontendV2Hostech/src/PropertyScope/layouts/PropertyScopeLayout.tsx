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
  Settings,
  Ticket,
  DollarSign,
  ArrowLeftCircle,
  LayoutGrid,
  LayoutTemplate,
  ScrollText,
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
      id: 'building_overview',
      label: 'Vận hành Tòa nhà',
      defaultOpen: true,
      path: `/properties/${propertyId}/dashboard`,
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Trang chủ', path: `/properties/${propertyId}/dashboard`, exact: true },
        { id: 'floorplan', icon: Layers, label: 'Sơ đồ', path: `/properties/${propertyId}/building-view` },
        { id: 'rooms', icon: DoorOpen, label: 'Phòng', path: `/properties/${propertyId}/rooms` },
      ],
    },
    {
      id: 'building_config',
      label: 'Cấu hình & Thiết lập',
      path: `/properties/${propertyId}/templates/building`,
      items: [
        { id: 'details', icon: Settings, label: 'Chi tiết tòa nhà', path: `/properties/${propertyId}/templates/building`, exact: true },
        { id: 'services', icon: DollarSign, label: 'Dịch vụ', path: `/properties/${propertyId}/templates/services`, exact: true },
        { id: 'templates', icon: LayoutTemplate, label: 'Phòng Mẫu', path: `/properties/${propertyId}/templates/rooms`, exact: true },
      ],
    },

    {
      id: 'building_ops',
      label: 'Vận hành tòa nhà',
      items: [
        { 
          id: 'meters', 
          icon: Gauge, 
          label: 'Đồng hồ', 
          path: `/properties/${propertyId}/meters`,
          children: [
            { id: 'meters-list', label: 'Quản lý chỉ số', path: `/properties/${propertyId}/meters`, exact: true },
            { id: 'meters-quick', label: 'Nhập chỉ số nhanh', path: `/properties/${propertyId}/meters/quick` }
          ]
        },
        { 
          id: 'contracts', 
          icon: ScrollText, 
          label: 'Hợp đồng', 
          path: `/properties/${propertyId}/contracts`,
          badge: contractAttentionCount > 0 ? contractAttentionCount : undefined,
          children: [
            { id: 'contracts-list', label: 'Danh sách hợp đồng', path: `/properties/${propertyId}/contracts`, exact: true },
            { id: 'contracts-create', label: 'Tạo hợp đồng nhanh', path: `/properties/${propertyId}/contracts/create` }
          ]
        },
        { 
          id: 'invoices', 
          icon: CreditCard, 
          label: 'Hóa đơn', 
          path: `/properties/${propertyId}/billing`,
          badge: issuedInvoiceCount > 0 ? issuedInvoiceCount : undefined,
        },
      ],
    },
    {
      id: 'user_management',
      label: 'Nhóm người dùng',
      items: [
        { id: 'users', icon: User, label: 'Người dùng', path: `/properties/${propertyId}/users` },
        { 
          id: 'tickets', 
          icon: Ticket, 
          label: 'Ticket', 
          path: `/properties/${propertyId}/tickets`,
          badge: openCount > 0 ? openCount : undefined,
        },
      ],
    },
  ];

  // Removed quickActions as they are now integrated into dropdowns above.

  const scopeExitPath = useScopeExitPath();

  const exitLink = (
    <div className="px-2 pb-2">
      <Link
        to={scopeExitPath}
        className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 shadow-sm hover:shadow-indigo-100 dark:hover:shadow-none bg-white dark:bg-slate-900"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-500 dark:group-hover:bg-indigo-900/30 dark:group-hover:text-indigo-400">
          {user?.role === 'Owner' ? <ArrowLeftCircle className="h-4.5 w-4.5" /> : <LayoutGrid className="h-4.5 w-4.5" />}
        </div>
        <span className="text-left leading-tight">
          {user?.role === 'Owner' ? 'Về Dashboard Tổ chức' : 'Đổi cơ sở làm việc'}
        </span>
      </Link>
    </div>
  );

  const extraContent = null;

  return (
    <div className="flex min-h-screen bg-[#f5f5f9] font-sans text-[#697a8d] dark:bg-[#232333] dark:text-[#a3b4cc]">
      {/* Desktop Sidebar */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuSections={propertyId ? menuSections : []}
        switcher={<PropertySwitcher variant="sidebar" />}
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

            <ThemeToggle />
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

