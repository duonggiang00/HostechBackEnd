import { useMemo, useState } from 'react';
import { ExternalLink, FileText, Loader2, Receipt, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTenantPayments } from '@/shared/features/billing/hooks/usePaymentVerification';
import type { Payment } from '@/shared/features/billing/types';
import { TenantInvoiceDetailModal } from '../components/TenantInvoiceDetailModal';
import { paymentMethodLabelVi } from '@/shared/utils/paymentMethodLabelVi';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN');
};

const methodLabel = (p: Payment) =>
  p.method_label ?? paymentMethodLabelVi(p.method);

const statusLabel = (status: string) => {
  switch (String(status).toUpperCase()) {
    case 'PENDING':
      return 'Chờ duyệt';
    case 'APPROVED':
      return 'Đã xác nhận';
    case 'REJECTED':
      return 'Từ chối';
    default:
      return status;
  }
};

const statusClasses = (status: string) => {
  switch (String(status).toUpperCase()) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300';
    case 'APPROVED':
      return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  }
};

export default function TenantPaymentsPage() {
  const [page, setPage] = useState(1);
  const [invoiceModalId, setInvoiceModalId] = useState<string | null>(null);

  const { data, isLoading, isError } = useTenantPayments({ page, per_page: 15 });

  const payments: Payment[] = data?.data ?? [];
  const meta = data?.meta as
    | { current_page?: number; last_page?: number; total?: number; per_page?: number }
    | undefined;

  const lastPage = meta?.last_page ?? 1;
  const total = meta?.total;

  const empty = useMemo(() => !isLoading && payments.length === 0, [isLoading, payments.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Các khoản bạn đã thanh toán hoặc đang chờ ban quản lý xác nhận. Biên lai PDF có sau khi giao dịch được duyệt.
        </p>
        <Link
          to="/app/billing"
          className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
        >
          ← Về danh sách hóa đơn
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center rounded-[28px] border border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : isError ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50/80 p-6 text-sm font-medium text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          Không tải được danh sách giao dịch. Vui lòng thử lại sau.
        </div>
      ) : empty ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 dark:border-slate-600 dark:bg-slate-900">
          <Receipt className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 font-bold text-slate-700 dark:text-slate-300">Chưa có giao dịch nào</p>
          <p className="mt-1 text-sm">Thanh toán từ trang hóa đơn sẽ hiển thị tại đây.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const inv = p.allocations?.[0]?.invoice;
            return (
              <article
                key={p.id}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{p.id.slice(0, 8)}…</span>
                      <span
                        className={`inline-flex rounded-2xl px-3 py-1 text-xs font-black ${statusClasses(p.status)}`}
                      >
                        {statusLabel(p.status)}
                      </span>
                    </div>
                    <p className="text-lg font-black text-slate-950 dark:text-white">{formatCurrency(p.amount)}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {methodLabel(p)}
                      {p.property?.name ? ` · ${p.property.name}` : ''}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Tạo lúc {formatDateTime(p.created_at)}
                      {p.approved_at ? ` · Duyệt: ${formatDateTime(p.approved_at)}` : ''}
                    </p>
                    {inv?.id ? (
                      <button
                        type="button"
                        onClick={() => setInvoiceModalId(inv.id)}
                        className="text-sm font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        Hóa đơn {inv.code ?? inv.id.slice(0, 8)}
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:flex-col lg:items-end">
                    {p.proof_receipt?.url ? (
                      <a
                        href={p.proof_receipt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <FileText className="h-4 w-4" />
                        Chứng từ đã gửi
                      </a>
                    ) : null}
                    {p.receipt?.url ? (
                      <a
                        href={p.receipt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Biên lai (PDF)
                      </a>
                    ) : p.status === 'APPROVED' ? (
                      <span className="text-xs text-slate-400">Biên lai đang được tạo…</span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!empty && lastPage > 1 ? (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((x) => Math.max(1, x - 1))}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold disabled:opacity-40 dark:border-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </button>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Trang {page} / {lastPage}
            {total != null ? ` (${total} giao dịch)` : ''}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((x) => Math.min(lastPage, x + 1))}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold disabled:opacity-40 dark:border-slate-700"
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <TenantInvoiceDetailModal invoiceId={invoiceModalId} onClose={() => setInvoiceModalId(null)} />
    </div>
  );
}
