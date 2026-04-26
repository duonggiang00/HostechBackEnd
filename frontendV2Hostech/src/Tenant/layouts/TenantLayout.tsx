import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '@/shared/components/ui/Sidebar';
import { useNavigation } from '@/shared/hooks/useNavigation';
import Breadcrumbs from '@/shared/components/ui/Breadcrumbs';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';

interface TenantLayoutProps {
  children: ReactNode;
}

const getPageTitle = (pathname: string) => {
  if (pathname.includes('/contracts')) return 'Hợp đồng thuê';
  if (pathname.includes('/billing')) return 'Hóa đơn và thanh toán';
  if (pathname.includes('/requests')) return 'Yêu cầu hỗ trợ';
  if (pathname.includes('/messages')) return 'Tin nhắn';
  if (pathname.includes('/building-overview')) return 'Sơ đồ tòa nhà';
  if (pathname.includes('/profile')) return 'Tài khoản cư dân';
  return 'Tổng quan cư dân';
};

const getPageDescription = (pathname: string) => {
  if (pathname.includes('/contracts')) return 'Đọc nhanh điều khoản chính và ký điện tử khi sẵn sàng.';
  if (pathname.includes('/billing')) return 'Xem các khoản đến hạn và đi thẳng tới bước thanh toán.';
  if (pathname.includes('/requests')) return 'Gửi yêu cầu mới hoặc kiểm tra tiến độ xử lý.';
  if (pathname.includes('/messages')) return 'Theo dõi các thông báo quan trọng từ ban quản lý.';
  if (pathname.includes('/building-overview')) return 'Bố cục mặt bằng thực tế của các tầng và phòng tại nơi bạn ở.';
  if (pathname.includes('/profile')) return 'Cập nhật thông tin cá nhân và kiểm tra dữ liệu cư dân.';
  return 'Bắt đầu từ những việc quan trọng nhất trong hôm nay.';
};

export default function TenantLayout({ children }: TenantLayoutProps) {
  const location = useLocation();
  const { menuSections, scopeLabel } = useNavigation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
      <div className="flex min-h-screen bg-[#f5f5f9] font-sans text-[#697a8d] dark:bg-[#232333] dark:text-[#a3b4cc]">
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          menuSections={menuSections}
          scopeLabel={scopeLabel}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
            <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
              <div className="min-w-0">
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

              <ThemeToggle compact />
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
  );
}