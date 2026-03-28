import {
  ArrowUpRight,
  Bell,
  CircleAlert,
  CircleCheck,
  CreditCard,
  FileSignature,
  Home,
  Receipt,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import NotificationCenter from '@/shared/features/messaging/components/NotificationCenter';
import MaintenanceReportModal from '@/shared/features/tickets/components/MaintenanceReportModal';
import TenantMeterModal from '@/PropertyScope/features/metering/components/TenantMeterModal';
import { useMyPendingContracts } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { useInvoice } from '@/shared/features/billing/hooks/useInvoice';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa cập nhật';
  return new Date(value).toLocaleDateString('vi-VN');
};

export default function TenantDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);

  const { data: pendingContracts = [] } = useMyPendingContracts();
  const { useInvoices } = useInvoice();
  const { data: invoicesResponse } = useInvoices();

  const invoices = invoicesResponse?.data || [];

  const outstandingInvoices = useMemo(
    () => invoices.filter((invoice: any) => ['ISSUED', 'OVERDUE'].includes(invoice.status)),
    [invoices],
  );

  const totalOutstanding = outstandingInvoices.reduce(
    (total: number, invoice: any) => total + Math.max(0, (invoice.total || 0) - (invoice.paid_amount || 0)),
    0,
  );

  const nearestInvoice = outstandingInvoices
    .slice()
    .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

  const unreadCount = (pendingContracts.length > 0 ? 1 : 0) + (outstandingInvoices.length > 0 ? 1 : 0);
  const firstName = user?.full_name?.trim().split(/\s+/).slice(-1)[0] || 'Cư dân';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <NotificationCenter isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      <MaintenanceReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
      <TenantMeterModal isOpen={isMeterModalOpen} onClose={() => setIsMeterModalOpen(false)} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] bg-[#0f172a] p-7 text-white shadow-2xl shadow-slate-900/10 lg:p-9"
        >
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.42),_transparent_65%)]" />
          <div className="relative">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Bảng điều khiển cư dân</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight lg:text-4xl">
                  {firstName}, các việc quan trọng hôm nay được đưa lên trước.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                  Ký hợp đồng điện tử trước, sau đó thanh toán khoản ban đầu để hệ thống tự kích hoạt thuê phòng.
                </p>
              </div>

              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-300">Hợp đồng chờ ký</p>
                <p className="mt-3 text-3xl font-black">{pendingContracts.length}</p>
                <p className="mt-2 text-sm text-slate-300">Ưu tiên xử lý để phát sinh hóa đơn ban đầu.</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-300">Công nợ hiện tại</p>
                <p className="mt-3 text-3xl font-black">{formatCurrency(totalOutstanding)}</p>
                <p className="mt-2 text-sm text-slate-300">Hiển thị tổng các hóa đơn đang mở hoặc quá hạn.</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-300">Hạn thanh toán gần nhất</p>
                <p className="mt-3 text-2xl font-black">{nearestInvoice ? formatDate(nearestInvoice.due_date) : 'Chưa có'}</p>
                <p className="mt-2 text-sm text-slate-300">{nearestInvoice ? nearestInvoice.code : 'Chưa phát sinh hóa đơn cần thanh toán.'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                Ưu tiên xử lý
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                {pendingContracts.length > 0 ? 'Cần ký hợp đồng trước' : 'Không có hợp đồng chờ ký'}
              </h3>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
              <TriangleAlert className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[26px] bg-amber-50 p-5 dark:bg-amber-500/10">
              <p className="text-sm font-black text-amber-800 dark:text-amber-200">
                {pendingContracts.length > 0
                  ? `Bạn đang có ${pendingContracts.length} hợp đồng chờ ký điện tử.`
                  : 'Hiện không có hợp đồng nào cần chữ ký điện tử.'}
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-700 dark:text-amber-300">
                Sau khi ký xong, hệ thống sẽ tạo hóa đơn đầu kỳ để bạn tiếp tục thanh toán và kích hoạt hợp đồng.
              </p>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
                Hành động đề xuất
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => navigate('/app/contracts/pending')}
                  className="inline-flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  Đi tới ký hợp đồng
                  <ArrowUpRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('/app/billing')}
                  className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                >
                  Kiểm tra hóa đơn
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button
          onClick={() => navigate('/app/contracts/pending')}
          className="group rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <FileSignature className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-black text-slate-950 dark:text-white">Ký hợp đồng</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Kiểm tra điều khoản, xem file đính kèm và ký điện tử ngay trên website.
          </p>
        </button>

        <button
          onClick={() => navigate('/app/billing')}
          className="group rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CreditCard className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-black text-slate-950 dark:text-white">Thanh toán</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Mở hóa đơn đến hạn, kiểm tra công nợ và đi tới bước thanh toán nhanh.
          </p>
        </button>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="group rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
            <Wrench className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-black text-slate-950 dark:text-white">Báo sự cố</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Gửi yêu cầu bảo trì hoặc phản ánh để ban quản lý xử lý nhanh hơn.
          </p>
        </button>

        <button
          onClick={() => setIsMeterModalOpen(true)}
          className="group rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
            <Receipt className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-black text-slate-950 dark:text-white">Gửi chỉ số</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Cập nhật điện, nước và các chỉ số định kỳ ngay trên tài khoản cư dân.
          </p>
        </button>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Tóm tắt nhanh</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                Các đầu việc nổi bật
              </h3>
            </div>
            <Home className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[26px] border border-rose-100 bg-rose-50 p-5 dark:border-rose-500/20 dark:bg-rose-500/10">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-2 text-rose-500 dark:bg-slate-900">
                  <CircleAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-rose-700 dark:text-rose-300">Hợp đồng cần xử lý</p>
                  <p className="mt-2 text-sm leading-6 text-rose-700/90 dark:text-rose-200">
                    {pendingContracts.length > 0
                      ? `Bạn đang có ${pendingContracts.length} hợp đồng chờ ký điện tử.`
                      : 'Hiện không có hợp đồng nào đang chờ ký.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-2 text-emerald-500 dark:bg-slate-900">
                  <CircleCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">Hóa đơn gần nhất</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-700/90 dark:text-emerald-200">
                    {nearestInvoice
                      ? `Hóa đơn ${nearestInvoice.code} đến hạn ngày ${formatDate(nearestInvoice.due_date)}.`
                      : 'Chưa có hóa đơn mở cần thanh toán.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:p-7">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Thông tin hiện tại</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            Tài khoản cư dân
          </h3>

          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Họ tên</p>
              <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{user?.full_name || 'Chưa cập nhật'}</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Số điện thoại</p>
              <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{user?.phone || 'Chưa cập nhật'}</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Email</p>
              <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{user?.email || 'Chưa cập nhật'}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
