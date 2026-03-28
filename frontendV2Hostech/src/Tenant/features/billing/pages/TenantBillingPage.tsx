import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Filter,
  Loader2,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useInvoice } from '@/shared/features/billing/hooks/useInvoice';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import type { Invoice } from '@/shared/features/billing/types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const getOutstandingAmount = (invoice: Invoice) => Math.max(0, Number(invoice.debt ?? invoice.total - invoice.paid_amount));

export default function TenantBillingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { useInvoices, createVnpayPayment } = useInvoice();
  const { data: invoicesResponse, isLoading } = useInvoices();

  const invoices = invoicesResponse?.data || [];

  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    const keyword = searchTerm.trim().toLowerCase();
    const matchesSearch =
      keyword.length === 0 ||
      invoice.code.toLowerCase().includes(keyword) ||
      (invoice.property?.name || '').toLowerCase().includes(keyword) ||
      (invoice.room?.name || '').toLowerCase().includes(keyword);
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20';
      case 'ISSUED':
        return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/20';
      case 'OVERDUE':
        return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-500/10 dark:border-rose-500/20';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'ISSUED':
        return <Clock className="h-4 w-4" />;
      case 'OVERDUE':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

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

    if (!invoice.org_id) {
      toast.error('Thiếu thông tin tổ chức của hóa đơn.');
      return;
    }

    if (!invoice.property_id) {
      toast.error('Thiếu thông tin cơ sở của hóa đơn.');
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.8fr)]">
        <div className="relative overflow-hidden rounded-[32px] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-900/10 lg:p-8">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.35),_transparent_65%)]" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Thanh toán và công nợ</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight lg:text-4xl">
              Các khoản cần thanh toán được gom rõ ràng theo từng hóa đơn.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Sau khi hợp đồng được ký đầy đủ, hóa đơn đầu kỳ sẽ xuất hiện ở đây để bạn thanh toán qua VNPay.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-300">Tổng công nợ</p>
                <p className="mt-3 text-3xl font-black">{formatCurrency(totalOutstanding)}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-300">Hóa đơn mở</p>
                <p className="mt-3 text-3xl font-black">{outstandingInvoices.length}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm sm:col-span-2 xl:col-span-1">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-300">Đến hạn gần nhất</p>
                <p className="mt-3 text-2xl font-black">
                  {nearestInvoice?.due_date ? format(new Date(nearestInvoice.due_date), 'dd/MM/yyyy') : 'Chưa có'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:p-7">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Việc cần làm</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {nearestInvoice ? `Ưu tiên hóa đơn ${nearestInvoice.code}` : 'Chưa có hóa đơn đến hạn'}
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {nearestInvoice?.due_date
              ? `Hạn thanh toán gần nhất là ngày ${format(new Date(nearestInvoice.due_date), 'dd/MM/yyyy')}. Bạn nên xử lý sớm để tránh chuyển sang quá hạn.`
              : 'Khi hệ thống phát sinh hóa đơn mới, phần này sẽ tự động đưa lên đầu để bạn thao tác nhanh.'}
          </p>

          <div className="mt-6 rounded-[24px] bg-amber-50 p-5 dark:bg-amber-500/10">
            <p className="text-sm font-black text-amber-800 dark:text-amber-200">Thanh toán thường dùng</p>
            <p className="mt-2 text-sm leading-6 text-amber-700 dark:text-amber-300">
              Bấm “Thanh toán VNPay” trên từng hóa đơn để đi thẳng tới cổng thanh toán mà không cần thao tác thêm.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Bộ lọc hóa đơn</p>
            <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white">Tìm và xử lý nhanh</h3>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px] xl:min-w-[640px]">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
              <input
                type="text"
                placeholder="Tìm theo mã hóa đơn, cơ sở hoặc phòng..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-8 text-sm font-bold text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ISSUED">Chờ thanh toán</option>
                <option value="PAID">Đã thanh toán</option>
                <option value="OVERDUE">Quá hạn</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">Đang tải danh sách hóa đơn...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center p-14 text-center text-slate-500 dark:text-slate-400">
            <CreditCard className="mb-4 h-12 w-12 opacity-25" />
            <p className="text-base font-bold">Chưa có hóa đơn phù hợp với bộ lọc hiện tại</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredInvoices.map((invoice: Invoice, index: number) => {
              const outstandingAmount = getOutstandingAmount(invoice);
              const isPaying = processingInvoiceId === invoice.id && createVnpayPayment.isPending;

              return (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="grid gap-5 p-5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/60 lg:grid-cols-[minmax(0,1fr)_190px_240px]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                      <CreditCard className="h-6 w-6" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-base font-black text-slate-950 dark:text-white">Hóa đơn {invoice.code}</h4>
                        <div className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          {getStatusLabel(invoice.status)}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        Hạn thanh toán: {invoice.due_date ? format(new Date(invoice.due_date), 'dd/MM/yyyy') : '---'}
                      </p>
                      {(invoice.property?.name || invoice.room?.name) && (
                        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                          {invoice.property?.name || 'Cơ sở'}{invoice.room?.name ? ` • ${invoice.room.name}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-800/80">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Số tiền còn lại</p>
                    <p className="mt-2 text-xl font-black text-slate-950 dark:text-white">
                      {formatCurrency(outstandingAmount)}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      Tổng hóa đơn: {formatCurrency(invoice.total)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    <button
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                      title="Tải hóa đơn"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    {['ISSUED', 'OVERDUE'].includes(invoice.status) && outstandingAmount > 0 && (
                      <button
                        onClick={() => handlePayInvoice(invoice)}
                        disabled={isPaying}
                        className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                      >
                        {isPaying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                        {isPaying ? 'Đang chuyển sang VNPay' : 'Thanh toán VNPay'}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
