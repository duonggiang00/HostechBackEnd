import { ArrowRight, CreditCard, FileSignature, Receipt, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import MaintenanceReportModal from '@/shared/features/tickets/components/MaintenanceReportModal';
import TenantMeterModal from '@/PropertyScope/features/metering/components/TenantMeterModal';
import { useMyPendingContracts, useMyContracts } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { useInvoice } from '@/shared/features/billing/hooks/useInvoice';
import toast from 'react-hot-toast';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa có';
  return new Date(value).toLocaleDateString('vi-VN');
};

export default function TenantDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);

  const { data: pendingContracts = [] } = useMyPendingContracts();
  const { data: myContracts = [] } = useMyContracts();
  
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
    .sort((a: any, b: any) => new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime())[0];

  const firstName = user?.full_name?.trim().split(/\s+/).slice(-1)[0] || 'cư dân';

  const tasks = [
    {
      id: 'contracts',
      icon: FileSignature,
      title: 'Ký hợp đồng',
      description:
        pendingContracts.length > 0
          ? `${pendingContracts.length} hợp đồng đang chờ ký điện tử.`
          : 'Hiện chưa có hợp đồng nào cần xác nhận.',
      actionLabel: pendingContracts.length > 0 ? 'Mở hợp đồng' : 'Xem danh sách',
      onClick: () => navigate('/app/contracts/pending'),
      tone: pendingContracts.length > 0 ? 'amber' : 'slate',
    },
    {
      id: 'billing',
      icon: CreditCard,
      title: 'Thanh toán hóa đơn',
      description:
        outstandingInvoices.length > 0
          ? `${formatCurrency(totalOutstanding)} cần xử lý${nearestInvoice ? ` trước ${formatDate(nearestInvoice.due_date)}` : ''}.`
          : 'Hiện chưa có hóa đơn đang chờ thanh toán.',
      actionLabel: 'Mở hóa đơn',
      onClick: () => {
        if (myContracts.length === 0) {
          toast.error('Tính năng không khả dụng do chưa có hợp đồng.');
          return;
        }
        navigate('/app/billing');
      },
      tone: outstandingInvoices.length > 0 ? 'rose' : 'slate',
    },
    {
      id: 'requests',
      icon: Wrench,
      title: 'Báo sự cố',
      description: 'Gửi yêu cầu mới khi phòng cần hỗ trợ hoặc bảo trì.',
      actionLabel: 'Tạo yêu cầu',
      onClick: () => {
        if (myContracts.length === 0) {
          toast.error('Tính năng không khả dụng do chưa có hợp đồng.');
          return;
        }
        setIsReportModalOpen(true);
      },
      tone: 'blue',
    },
  ] as const;

  const toneClasses: Record<string, string> = {
    amber: 'border-amber-200 bg-amber-50/80 dark:border-amber-500/20 dark:bg-amber-500/10',
    rose: 'border-rose-200 bg-rose-50/80 dark:border-rose-500/20 dark:bg-rose-500/10',
    blue: 'border-sky-200 bg-sky-50/80 dark:border-sky-500/20 dark:bg-sky-500/10',
    slate: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80',
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <MaintenanceReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
      <TenantMeterModal isOpen={isMeterModalOpen} onClose={() => setIsMeterModalOpen(false)} />

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
          Hôm nay
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          Chào {firstName}, bắt đầu từ 3 việc chính.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Mở hợp đồng nếu cần ký, vào hóa đơn nếu có khoản đến hạn, hoặc tạo yêu cầu mới khi cần hỗ trợ.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-800/80">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Hợp đồng chờ ký</p>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{pendingContracts.length}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-800/80">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Công nợ hiện tại</p>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(totalOutstanding)}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-800/80">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Hạn gần nhất</p>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{formatDate(nearestInvoice?.due_date)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_320px]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Việc cần làm</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white">Ưu tiên theo thứ tự thao tác</h3>

          <div className="mt-5 space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`rounded-3xl border p-4 ${toneClasses[task.tone]}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                    <task.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-base font-black text-slate-950 dark:text-white">{task.title}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{task.description}</p>
                      </div>
                      <button
                        onClick={task.onClick}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                      >
                        {task.actionLabel}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Thao tác nhanh</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white">Một chạm để xử lý</h3>

          <div className="mt-5 space-y-3">
            <button
              onClick={() => {
                if (myContracts.length === 0) {
                  toast.error('Tính năng không khả dụng do chưa có hợp đồng.');
                  return;
                }
                navigate('/app/billing');
              }}
              className="flex w-full items-center justify-between rounded-3xl border border-slate-200 px-4 py-4 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10"
            >
              <div>
                <p className="text-sm font-black text-slate-950 dark:text-white">Thanh toán ngay</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Mở danh sách hóa đơn đang chờ xử lý.</p>
              </div>
              <CreditCard className="h-5 w-5 text-slate-400" />
            </button>

            <button
              onClick={() => {
                if (myContracts.length === 0) {
                  toast.error('Tính năng không khả dụng do chưa có hợp đồng.');
                  return;
                }
                setIsReportModalOpen(true);
              }}
              className="flex w-full items-center justify-between rounded-3xl border border-slate-200 px-4 py-4 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10"
            >
              <div>
                <p className="text-sm font-black text-slate-950 dark:text-white">Tạo yêu cầu hỗ trợ</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Báo sự cố hoặc gửi phản ánh mới.</p>
              </div>
              <Wrench className="h-5 w-5 text-slate-400" />
            </button>

            <button
              onClick={() => {
                if (myContracts.length === 0) {
                  toast.error('Tính năng không khả dụng do chưa có hợp đồng.');
                  return;
                }
                setIsMeterModalOpen(true);
              }}
              className="flex w-full items-center justify-between rounded-3xl border border-slate-200 px-4 py-4 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10"
            >
              <div>
                <p className="text-sm font-black text-slate-950 dark:text-white">Gửi chỉ số</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Cập nhật điện, nước khi cần.</p>
              </div>
              <Receipt className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Khoản cần thanh toán</p>
        <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white">
          {outstandingInvoices.length > 0 ? 'Danh sách cần xử lý trước' : 'Hiện chưa có hóa đơn mở'}
        </h3>

        {outstandingInvoices.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Khi phát sinh hóa đơn mới, phần này sẽ hiển thị khoản gần nhất để bạn mở và thanh toán nhanh.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {outstandingInvoices.slice(0, 3).map((invoice: any) => (
              <button
                key={invoice.id}
                onClick={() => navigate('/app/billing')}
                className="flex w-full flex-col gap-3 rounded-3xl border border-slate-200 px-4 py-4 text-left transition-colors hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-indigo-500 dark:hover:bg-slate-800/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">Hóa đơn {invoice.code}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Hạn thanh toán {formatDate(invoice.due_date)}
                  </p>
                </div>
                <div className="text-sm font-black text-rose-600 dark:text-rose-300">
                  {formatCurrency(Math.max(0, (invoice.total || 0) - (invoice.paid_amount || 0)))}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}