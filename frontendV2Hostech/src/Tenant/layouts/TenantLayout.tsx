import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { useSessionBootstrap } from '@/shared/features/auth/hooks/useSessionBootstrap';
import { useTenantFinanceRealtime, useTenantMeterRealtime } from '@/shared/features/billing/hooks/useFinanceRealtime';
import { useTenantTicketRealtime } from '@/PropertyScope/features/tickets/hooks/useTicketRealtime';
import Sidebar from '@/shared/components/ui/Sidebar';
import { useNavigation } from '@/shared/hooks/useNavigation';
import Breadcrumbs from '@/shared/components/ui/Breadcrumbs';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import NotificationCenter from '@/shared/features/messaging/components/NotificationCenter';
import { useUnreadNotificationCount } from '@/shared/features/messaging/hooks/useNotifications';

interface TenantLayoutProps {
  children: ReactNode;
}

const getPageTitle = (pathname: string) => {
  if (pathname.includes('/transfer-requests')) return 'Yêu cầu chuyển phòng';
  if (pathname.includes('/billing/transactions')) return 'Giao dịch & biên lai';
  if (pathname.includes('/contracts')) return 'Hợp đồng thuê';
  if (pathname.includes('/billing')) return 'Hóa đơn và thanh toán';
  if (pathname.includes('/tickets') || pathname.includes('/requests'))
    return 'Sự cố & yêu cầu';
  if (pathname.includes('/messages')) return 'Tin nhắn';
  if (pathname.includes('/building-overview')) return 'Sơ đồ tòa nhà';
  if (pathname.includes('/profile')) return 'Tài khoản cư dân';
  return 'Tổng quan cư dân';
};

const getPageDescription = (pathname: string) => {
  if (pathname.includes('/transfer-requests'))
    return 'Theo dõi các đề nghị chuyển sang phòng khác trong cùng tòa nhà.';
  if (pathname.includes('/billing/transactions'))
    return 'Xem chứng từ đã gửi và biên lai sau khi ban quản lý xác nhận thanh toán.';
  if (pathname.includes('/contracts')) return 'Đọc nhanh điều khoản chính và ký điện tử khi sẵn sàng.';
  if (pathname.includes('/billing')) return 'Xem các khoản đến hạn và đi thẳng tới bước thanh toán.';
  if (pathname.includes('/tickets') || pathname.includes('/requests'))
    return 'Báo sự cố, đính kèm hình ảnh và trao đổi 2 chiều với ban quản lý.';
  if (pathname.includes('/messages')) return 'Theo dõi các thông báo quan trọng từ ban quản lý.';
  if (pathname.includes('/building-overview')) return 'Bố cục mặt bằng thực tế của các tầng và phòng tại nơi bạn ở.';
  if (pathname.includes('/profile')) return 'Cập nhật thông tin cá nhân và kiểm tra dữ liệu cư dân.';
  return 'Bắt đầu từ những việc quan trọng nhất trong hôm nay.';
};

export default function TenantLayout({ children }: TenantLayoutProps) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  useSessionBootstrap();
  useTenantFinanceRealtime(user?.id);
  useTenantMeterRealtime(user?.id);
  useTenantTicketRealtime(user?.id);

  const { menuSections, scopeLabel } = useNavigation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count ?? 0;

  return (
    <>
      <div className="flex min-h-screen bg-[#f5f5f9] font-sans text-[#697a8d] dark:bg-[#232333] dark:text-[#a3b4cc]">
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          menuSections={menuSections}
          scopeLabel={scopeLabel}
          profilePath="/app/profile"
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
            <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
              {/* Hamburger menu — chỉ hiện khi sidebar ẩn (< lg) */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="mt-1 flex shrink-0 items-center justify-center rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
                aria-label="Mở menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
                  Khu cư dân
                </p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white lg:text-3xl">
                  {getPageTitle(location.pathname)}
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                  {getPageDescription(location.pathname)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(true)}
                  className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-colors hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-indigo-400"
                  aria-label="Thông báo"
                >
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="pointer-events-none absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-black text-white dark:border-slate-950">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <ThemeToggle compact />
              </div>
            </div>
          </header>

          <main className="flex-1 pb-20 lg:pb-8">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
              <Breadcrumbs />
              {children}
            </div>
          </main>
        </div>
      </div>

      <NotificationCenter isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
    </>
  );
}