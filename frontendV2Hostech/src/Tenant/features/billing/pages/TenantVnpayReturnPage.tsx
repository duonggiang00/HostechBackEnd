import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, CreditCard, Home, Loader2, XCircle } from 'lucide-react';
import { CONTRACTS_KEY, CONTRACT_KEY, PENDING_CONTRACTS_KEY } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { INVOICES_QUERY_KEY, useInvoice } from '@/shared/features/billing/hooks/useInvoice';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

export default function TenantVnpayReturnPage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { useVerifyVnpayReturn } = useInvoice();

  const searchParams = new URLSearchParams(location.search);
  const txnRef = searchParams.get('vnp_TxnRef') || searchParams.get('txn_ref') || undefined;
  const { data, isLoading, isError } = useVerifyVnpayReturn(txnRef, location.search);

  useEffect(() => {
    if (!data) return;

    queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [CONTRACTS_KEY] });
    queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY] });
    queryClient.invalidateQueries({ queryKey: [PENDING_CONTRACTS_KEY] });
  }, [data, queryClient]);

  if (!txnRef) {
    return (
      <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200/80 bg-white/90 p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <XCircle className="mx-auto h-16 w-16 text-rose-500" />
        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Thiếu thông tin giao dịch</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Hệ thống không nhận được mã giao dịch từ VNPay. Bạn có thể quay lại danh sách hóa đơn để kiểm tra trạng thái thanh toán.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/app/billing"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <CreditCard className="h-4 w-4" />
            Về trang hóa đơn
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200/80 bg-white/90 p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <Loader2 className="mx-auto h-16 w-16 animate-spin text-indigo-500" />
        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Đang xác minh thanh toán</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Hệ thống đang kiểm tra kết quả giao dịch từ VNPay và cập nhật hóa đơn, hợp đồng của bạn.
        </p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200/80 bg-white/90 p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <XCircle className="mx-auto h-16 w-16 text-rose-500" />
        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Không thể xác minh giao dịch</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Kết quả trả về từ VNPay chưa được xác nhận. Bạn có thể kiểm tra lại trong mục hóa đơn hoặc thử lại sau ít phút.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/app/billing"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <CreditCard className="h-4 w-4" />
            Về trang hóa đơn
          </Link>
        </div>
      </div>
    );
  }

  const isSuccess = data.success;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:p-10">
        <div className="text-center">
          {isSuccess ? (
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          ) : (
            <XCircle className="mx-auto h-16 w-16 text-rose-500" />
          )}

          <p className="mt-6 text-xs font-black uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Kết quả thanh toán VNPay</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white lg:text-4xl">
            {isSuccess ? 'Thanh toán thành công' : 'Thanh toán chưa thành công'}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {isSuccess
              ? 'Hệ thống đã ghi nhận thanh toán, cập nhật hóa đơn và sẽ tự kích hoạt hợp đồng nếu đây là khoản thanh toán đầu kỳ.'
              : 'Giao dịch chưa được xác nhận thành công. Bạn có thể quay lại danh sách hóa đơn để kiểm tra hoặc thực hiện lại thanh toán.'}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] bg-slate-50 p-5 text-center dark:bg-slate-800">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Mã giao dịch</p>
            <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{data.payment_id}</p>
          </div>
          <div className="rounded-[24px] bg-slate-50 p-5 text-center dark:bg-slate-800">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Số tiền</p>
            <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{formatCurrency(data.amount)}</p>
          </div>
          <div className="rounded-[24px] bg-slate-50 p-5 text-center dark:bg-slate-800">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Trạng thái</p>
            <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">
              {isSuccess ? 'Đã xác nhận' : data.provider_status || data.status}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/app/billing"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <CreditCard className="h-4 w-4" />
            Xem hóa đơn
          </Link>
          <Link
            to="/app/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
          >
            <Home className="h-4 w-4" />
            Về trang tổng quan
          </Link>
          {isSuccess && (
            <Link
              to="/app/contracts/pending"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
            >
              Kiểm tra hợp đồng
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
