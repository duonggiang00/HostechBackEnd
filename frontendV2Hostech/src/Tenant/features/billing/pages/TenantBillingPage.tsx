import { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Loader2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInvoice } from '@/shared/features/billing/hooks/useInvoice';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import type { Invoice } from '@/shared/features/billing/types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa có';
  return new Date(value).toLocaleDateString('vi-VN');
};

const getOutstandingAmount = (invoice: Invoice) => Math.max(0, Number(invoice.debt ?? invoice.total - invoice.paid_amount));

export default function TenantBillingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { useInvoices, createVnpayPayment } = useInvoice();
  const { data: invoicesResponse, isLoading } = useInvoices();

  const invoices = invoicesResponse?.data || [];

  const filteredInvoices = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return invoices.filter((invoice: Invoice) => {
      const matchesSearch =
        keyword.length === 0 ||
        invoice.code.toLowerCase().includes(keyword) ||
        (invoice.property?.name || '').toLowerCase().includes(keyword) ||
        (invoice.room?.name || '').toLowerCase().includes(keyword);

      const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [filterStatus, invoices, searchTerm]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Đã thanh toán';
      case 'ISSUED':
        return 'Chờ thanh toán';
      case 'OVERDUE':
        return 'Quá hạn';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300';
      case 'ISSUED':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
      case 'OVERDUE':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'OVERDUE':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const outstandingInvoices = invoices.filter((invoice: Invoice) => ['ISSUED', 'OVERDUE'].includes(invoice.status));
  const totalOutstanding = outstandingInvoices.reduce((total: number, invoice: Invoice) => total + getOutstandingAmount(invoice), 0);
  const nearestInvoice = outstandingInvoices
    .slice()
    .sort((a: Invoice, b: Invoice) => new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime())[0];

  const handlePayInvoice = (invoice: Invoice) => {
    const outstandingAmount = getOutstandingAmount(invoice);

    if (!user?.id) {
      toast.error('Không xác định được tài khoản thanh toán hiện tại.');
      return;
    }

    if (!invoice.org_id || !invoice.property_id) {
      toast.error('Thiếu dữ liệu để tạo thanh toán.');
      return;
    }

    if (outstandingAmount <= 0) {
      toast.error('Hóa đơn này không còn số dư cần thanh toán.');
      return;
    }

    setProcessingInvoiceId(invoice.id);
    createVnpayPayment.mutate(
      {
        org_id: invoice.org_id,
        property_id: invoice.property_id,
        payer_user_id: user.id,
        method: 'QR',
        amount: outstandingAmount,
        note: `Thanh toán ${invoice.code}`,
        allocations: [
          {
            invoice_id: invoice.id,
            amount: outstandingAmount,
          },
        ],
      },
      {
        onSuccess: (response) => {
          window.location.assign(response.payment_url);
        },
        onError: () => {
          setProcessingInvoiceId(null);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Tổng công nợ</p>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Hóa đơn mở</p>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{outstandingInvoices.length}</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Hạn gần nhất</p>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{formatDate(nearestInvoice?.due_date)}</p>
        </div>
      </section>

      {nearestInvoice ? (
        <section className="rounded-[28px] border border-amber-200 bg-amber-50/80 p-5 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-700 dark:text-amber-300">Ưu tiên thanh toán</p>
              <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">Hóa đơn {nearestInvoice.code}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Còn lại {formatCurrency(getOutstandingAmount(nearestInvoice))} - hạn {formatDate(nearestInvoice.due_date)}
              </p>
            </div>
            <button
              onClick={() => handlePayInvoice(nearestInvoice)}
              disabled={processingInvoiceId === nearestInvoice.id && createVnpayPayment.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {processingInvoiceId === nearestInvoice.id && createVnpayPayment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Thanh toán ngay
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã hóa đơn, cơ sở hoặc phòng"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
            />
          </label>

          <select
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="ISSUED">Chờ thanh toán</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="OVERDUE">Quá hạn</option>
          </select>
        </div>
      </section>

      <section className="space-y-3">
        {isLoading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Đang tải danh sách hóa đơn...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Chưa có hóa đơn phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          filteredInvoices.map((invoice: Invoice) => {
            const outstandingAmount = getOutstandingAmount(invoice);
            const isPaying = processingInvoiceId === invoice.id && createVnpayPayment.isPending;

            return (
              <article
                key={invoice.id}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-950 dark:text-white">Hóa đơn {invoice.code}</h3>
                      <span className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-black ${getStatusClasses(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        {getStatusLabel(invoice.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Hạn thanh toán: {formatDate(invoice.due_date)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {invoice.property?.name || 'Cơ sở'}{invoice.room?.name ? ` - ${invoice.room.name}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="rounded-3xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Còn lại</p>
                      <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{formatCurrency(outstandingAmount)}</p>
                    </div>

                    {['ISSUED', 'OVERDUE'].includes(invoice.status) && outstandingAmount > 0 ? (
                      <button
                        onClick={() => handlePayInvoice(invoice)}
                        disabled={isPaying}
                        className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                      >
                        {isPaying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                        {isPaying ? 'Đang chuyển sang VNPay' : 'Thanh toán'}
                      </button>
                    ) : (
                      <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        Không cần thao tác thêm
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
