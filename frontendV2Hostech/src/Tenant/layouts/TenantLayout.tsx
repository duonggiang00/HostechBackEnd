import type { ReactNode } from 'react';
import { Bell, CreditCard, FileSignature } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import TenantNav from '@/shared/features/navigation/components/TenantNav';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

interface TenantLayoutProps {
  children: ReactNode;
}

const getPageTitle = (pathname: string) => {
  if (pathname.includes('/contracts')) return 'Hợp đồng thuê';
  if (pathname.includes('/billing')) return 'Hóa đơn và thanh toán';
  if (pathname.includes('/requests')) return 'Yêu cầu hỗ trợ';
  if (pathname.includes('/messages')) return 'Tin nhắn và thông báo';
  if (pathname.includes('/profile')) return 'Tài khoản cư dân';
  return 'Tổng quan cư dân';
};

const getPageDescription = (pathname: string) => {
  if (pathname.includes('/contracts')) return 'Kiểm tra điều khoản, ký điện tử và theo dõi trạng thái hợp đồng.';
  if (pathname.includes('/billing')) return 'Theo dõi công nợ, kỳ thanh toán và các hóa đơn cần xử lý.';
  if (pathname.includes('/requests')) return 'Gửi yêu cầu nhanh và kiểm tra tiến độ xử lý từ ban quản lý.';
  if (pathname.includes('/messages')) return 'Xem thông báo quan trọng và trao đổi với ban quản lý.';
  if (pathname.includes('/profile')) return 'Cập nhật thông tin cá nhân và kiểm tra dữ liệu cư dân đã đăng ký.';
  return 'Các việc cần làm hôm nay sẽ được ưu tiên hiển thị ở đây để thao tác nhanh hơn.';
};

export default function TenantLayout({ children }: TenantLayoutProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const firstName = user?.full_name?.trim().split(/\s+/).slice(-1)[0] || 'Cư dân';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_52%,_#f8fafc_100%)] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto min-h-screen max-w-[1600px] lg:grid lg:grid-cols-[290px_minmax(0,1fr)]">
        <TenantNav />

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                    Cổng cư dân
                  </p>
                  <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white lg:text-3xl">
                    {getPageTitle(location.pathname)}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                    {getPageDescription(location.pathname)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <ThemeToggle compact />
                  <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-indigo-400">
                    <Bell className="h-5 w-5" />
                  </button>
                  <Link
                    to="/app/contracts/pending"
                    className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                  >
                    <FileSignature className="h-4 w-4" />
                    Hợp đồng cần ký
                  </Link>
                  <Link
                    to="/app/billing"
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    <CreditCard className="h-4 w-4" />
                    Đi tới thanh toán
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200/80 bg-white/85 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:px-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                      Xin chào
                    </p>
                    <p className="mt-2 text-lg font-black tracking-tight text-slate-950 dark:text-white">
                      {firstName}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:flex">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Ưu tiên hôm nay
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                        Ký hợp đồng và thanh toán các khoản đến hạn
                      </p>
                    </div>
                    <div className="rounded-2xl bg-indigo-50 px-4 py-3 dark:bg-indigo-500/10">
                      <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-300">
                        Truy cập nhanh
                      </p>
                      <p className="mt-1 text-sm font-bold text-indigo-700 dark:text-indigo-200">
                        Tất cả tác vụ chính đều nằm ngay ở đầu từng màn hình
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 pb-24 lg:pb-10">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
