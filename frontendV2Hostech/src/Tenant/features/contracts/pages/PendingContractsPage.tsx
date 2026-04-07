import { format } from 'date-fns';
import { AlertCircle, ArrowRight, Calendar, CheckCircle, FileSignature, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMyContracts } from '@/PropertyScope/features/contracts/hooks/useContracts';

export default function PendingContractsPage() {
  const { data: contracts, isLoading, isError } = useMyContracts();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Không thể tải danh sách hợp đồng</h3>
        <p className="mt-2 text-sm text-slate-500">Đã có lỗi xảy ra, vui lòng thử lại sau.</p>
      </div>
    );
  }

  const contractCount = contracts?.length ?? 0;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
          Hợp đồng
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          {contractCount > 0 ? `Bạn đang có ${contractCount} hợp đồng` : 'Không có hợp đồng nào'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Danh sách các hợp đồng của bạn. Nhấn vào từng hợp đồng để xem chi tiết, ký xác nhận hoặc in ấn.
        </p>
      </section>

      {contractCount === 0 ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Thật gọn gàng</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Hiện tại bạn chưa được gán vào hợp đồng nào.
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          {contracts?.map((contract) => (
            <button
              type="button"
              key={contract.id}
              onClick={() => navigate(`/app/contracts/${contract.id}`)}
              className="w-full rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500 dark:hover:bg-slate-800/70"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {contract.status === 'PENDING_SIGNATURE' ? (
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      <FileSignature className="h-4 w-4" />
                      Chờ chữ ký
                    </div>
                  ) : contract.status === 'PENDING_PAYMENT' ? (
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                      <AlertCircle className="h-4 w-4" />
                      Chờ thanh toán
                    </div>
                  ) : contract.status === 'ACTIVE' ? (
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <CheckCircle className="h-4 w-4" />
                      Đang có hiệu lực
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <AlertCircle className="h-4 w-4" />
                      {contract.status}
                    </div>
                  )}
                  <h3 className="mt-3 text-lg font-black text-slate-950 dark:text-white">
                    {contract.property?.name || 'Cơ sở'} - {contract.room?.name || 'Phòng'}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span>Mã: {contract.id.substring(0, 8).toUpperCase()}</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {contract.start_date ? format(new Date(contract.start_date), 'dd/MM/yyyy') : 'Chưa cập nhật ngày bắt đầu'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                  <p className="text-base font-black text-indigo-600 dark:text-indigo-300">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.rent_price || 0)}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
                    Xem chi tiết
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}