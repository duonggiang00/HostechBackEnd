import { useParams } from 'react-router-dom';
import { FileText, ExternalLink, Loader2 } from 'lucide-react';
import { usePayment } from '../hooks/useFinance';
import { paymentMethodLabelVi } from '@/shared/utils/paymentMethodLabelVi';
import { PaymentStatusBadge } from '../components/PaymentStatusBadge';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';

function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export default function PaymentDetailPage() {
  const { paymentId, propertyId } = useParams<{ paymentId: string; propertyId: string }>();
  const { data: payment, isLoading, isError } = usePayment(paymentId ?? null);

  const receiptUrl = payment?.receipt?.url ?? null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (isError || !payment) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <PageBackButton to={`/properties/${propertyId}/finance/payments`} />
        <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-6 text-rose-700">
          Không tải được chi tiết biên lai.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <PageBackButton to={`/properties/${propertyId}/finance/payments`} />
        <PaymentStatusBadge status={payment.status} />
      </div>

      <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Chi tiết biên lai</h1>
            <p className="text-xs text-slate-500">Mã giao dịch: #{payment.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <InfoCard label="Số tiền" value={fmtVND(payment.amount)} />
          <InfoCard
            label="Phương thức"
            value={payment.method_label ?? paymentMethodLabelVi(payment.method)}
          />
          <InfoCard label="Ngày nhận" value={fmtDate(payment.received_at)} />
          <InfoCard label="Tham chiếu" value={payment.reference || '—'} />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <InfoCard label="Tòa nhà" value={payment.property?.name ?? '—'} />
          <InfoCard label="Người trả" value={payment.payer?.full_name ?? '—'} />
          <InfoCard label="Người nhận" value={payment.received_by?.full_name ?? '—'} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Phân bổ công nợ</h2>
        {payment.allocations?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-100 dark:border-slate-700">
                  <th className="py-2 font-bold text-slate-500">Hóa đơn</th>
                  <th className="py-2 font-bold text-slate-500">Kỳ</th>
                  <th className="py-2 font-bold text-slate-500">Trạng thái</th>
                  <th className="py-2 font-bold text-slate-500 text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {payment.allocations.map((alloc) => (
                  <tr key={alloc.id} className="border-b border-slate-50 dark:border-slate-700/50">
                    <td className="py-2 font-mono text-xs">#{alloc.invoice_id.slice(0, 8).toUpperCase()}</td>
                    <td className="py-2 text-slate-600 dark:text-slate-300">
                      {alloc.invoice?.period_start && alloc.invoice?.period_end
                        ? `${alloc.invoice.period_start} → ${alloc.invoice.period_end}`
                        : '—'}
                    </td>
                    <td className="py-2 text-slate-600 dark:text-slate-300">
                      {alloc.invoice?.status ?? alloc.invoice_status ?? '—'}
                    </td>
                    <td className="py-2 text-right font-bold">{fmtVND(alloc.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Biên lai chưa có phân bổ hóa đơn.</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Bản mềm biên lai</h2>
          {receiptUrl && (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Mở tab mới
            </a>
          )}
        </div>

        {receiptUrl ? (
          <div className="mt-4 h-[70vh] rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <iframe src={receiptUrl} className="w-full h-full border-0" title="Bản mềm biên lai" />
          </div>
        ) : (
          <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
            Biên lai này chưa có file PDF bản mềm.
          </p>
        )}
      </div>
    </div>
  );
}

