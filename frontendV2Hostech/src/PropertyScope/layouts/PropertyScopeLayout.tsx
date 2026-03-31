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
  X,
  Home,
  Gauge,
  User,
  FileText,
  CreditCard,
  Settings,
  Ticket,
} from 'lucide-react';
import PropertySwitcher from '@/OrgScope/features/properties/components/PropertySwitcher';
import PropertyTreeView from '@/OrgScope/features/properties/components/PropertyTreeView';
import { useDashboardHomePath } from '@/shared/hooks/useDashboardHomePath';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import SidebarAccountMenu from '@/shared/components/ui/SidebarAccountMenu';
import SidebarDropdownSection, { type SidebarDropdownItem } from '@/shared/components/ui/SidebarDropdownSection';
import { useTickets } from '../features/tickets/hooks/useTickets';
import { useContracts } from '../features/contracts/hooks/useContracts';
import { usePropertyInvoices } from '../features/billing/hooks/usePropertyInvoices';

interface PropertyScopeLayoutProps {
  children: ReactNode;
}

interface SidebarSection {
  id: string;
  label: string;
  defaultOpen?: boolean;
  items: SidebarDropdownItem[];
}

export default function PropertyScopeLayout({ children }: PropertyScopeLayoutProps) {
  const { user, logout } = useAuthStore();
  const { propertyId } = useParams<{ propertyId: string }>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dashboardPath = useDashboardHomePath(propertyId);

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
      id: 'setup',
      label: 'Thiết lập',
      defaultOpen: true,
      items: [
        { id: 'home', icon: Home, label: 'Tổng quan', path: dashboardPath, exact: true },
        { id: 'floors', icon: Layers, label: 'Tầng và sơ đồ', path: `/properties/${propertyId}/floors` },
        { id: 'rooms', icon: DoorOpen, label: 'Phòng', path: `/properties/${propertyId}/rooms` },
        { id: 'templates', icon: Settings, label: 'Mẫu và cấu hình', path: `/properties/${propertyId}/templates` },
      ],
    },
    {
      id: 'onboarding',
      label: 'Khách thuê',
      items: [
        {
          id: 'contracts',
          icon: FileText,
          label: 'Hợp đồng',
          path: `/properties/${propertyId}/contracts`,
          badge: contractAttentionCount > 0 ? contractAttentionCount : undefined,
          children: [
            { id: 'contracts-list', label: 'Danh sách hợp đồng', path: `/properties/${propertyId}/contracts`, exact: true },
            { id: 'contracts-create', label: 'Tạo hợp đồng nhanh', path: `/properties/${propertyId}/contracts/create` }
          ]
        },
        { id: 'users', icon: User, label: 'Cư dân và nhân sự', path: `/properties/${propertyId}/users` },
      ],
    },
    {
      id: 'operations',
      label: 'Vận hành',
      items: [
        {
          id: 'meters',
          icon: Gauge,
          label: 'Chỉ số điện nước',
          path: `/properties/${propertyId}/meters`,
          children: [
            { id: 'meters-list', label: 'Quản lý chỉ số', path: `/properties/${propertyId}/meters`, exact: true },
            { id: 'meters-quick', label: 'Nhập chỉ số nhanh', path: `/properties/${propertyId}/meters/quick` }
          ]
        },
        {
          id: 'billing',
          icon: CreditCard,
          label: 'Hóa đơn và thu chi',
          path: `/properties/${propertyId}/billing`,
          badge: issuedInvoiceCount > 0 ? issuedInvoiceCount : undefined,
          children: [
            { id: 'billing-list', label: 'Quản lý hóa đơn', path: `/properties/${propertyId}/billing`, exact: true },
            { id: 'billing-review', label: 'Duyệt hóa đơn', path: `/properties/${propertyId}/billing?tab=review` }
          ]
        },
        {
          id: 'tickets',
          icon: Ticket,
          label: 'Sự cố và yêu cầu',
          path: `/properties/${propertyId}/tickets`,
          badge: openCount > 0 ? openCount : undefined,
        },
      ],
    },
  ];

  // Removed quickActions as they are now integrated into dropdowns above.

  const renderSidebarContent = () => (
    <div className="flex h-full w-full flex-col bg-white dark:bg-slate-900">
      <div className="flex shrink-0 items-center justify-between px-6 py-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-indigo-600 dark:bg-indigo-500 shadow-lg shadow-indigo-200 dark:shadow-none">
            <Building2 className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-extrabold text-[#566a7f] dark:text-slate-200 tracking-tight">
            Sneat
          </h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:hidden transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Middle scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pb-4">
        {/* Switcher */}
        <div className="shrink-0 px-4 py-3">
          <PropertySwitcher />
        </div>

        {/* Navigation */}
        <nav className="shrink-0 space-y-3 px-3">
          <div className="mb-3 mt-1 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            Luồng vận hành
          </div>

          {propertyId ? (
            menuSections.map((section) => (
              <SidebarDropdownSection
                key={section.id}
                label={section.label}
                items={section.items}
                defaultOpen={section.defaultOpen}
                onNavigate={() => setIsMobileMenuOpen(false)}
              />
            ))
          ) : (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 text-center text-sm italic text-slate-500 dark:border-slate-700 dark:bg-slate-800">
              Vui lòng chọn cơ sở
            </div>
          )}
        </nav>

        {/* Quick Actions removed - Now integrated via Dropdowns */}

        {/* Tree View */}
        <div className="min-h-[150px] shrink-0 flex-1 px-2 pt-5">
          {propertyId && (
            <div className="relative pt-4">
              <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"></div>
              <div className="px-5 py-4">
                <SidebarDropdownSection label="Sơ đồ tòa nhà">
                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-2 dark:border-slate-700/70 dark:bg-slate-900/40">
                    <PropertyTreeView />
                  </div>
                </SidebarDropdownSection>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer section (Account Menu) - Always visible */}
      <div className="w-full shrink-0 border-t border-slate-200/60 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
        <SidebarAccountMenu
          profilePath={`/properties/${propertyId}/profile`}
          userName={user?.full_name}
          role={user?.role}
          onLogout={() => {
            logout();
            setIsMobileMenuOpen(false);
          }}
          onActionComplete={() => setIsMobileMenuOpen(false)}
        />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f5f5f9] font-sans text-[#697a8d] dark:bg-[#232333] dark:text-[#a3b4cc]">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[260px] flex-col border-r border-[#eceef1] bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex shadow-sm">
        {renderSidebarContent()}
      </aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-white shadow-xl dark:bg-slate-900 lg:hidden"
            >
              {renderSidebarContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-700/50 px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3 md:gap-6 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight hidden xl:block">Quản lý tòa nhà</h2>
            <div className="h-8 w-px bg-slate-100 dark:bg-slate-700 hidden xl:block" />
            <div className="min-w-0">
              <div className="lg:hidden">
                <PropertySwitcher />
              </div>
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
            <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer border border-slate-100 dark:border-slate-600 relative group">
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
    </div>
  );
}

