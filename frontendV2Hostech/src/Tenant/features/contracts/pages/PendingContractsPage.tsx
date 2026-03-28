import { format } from 'date-fns';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  FileSignature,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMyPendingContracts } from '@/PropertyScope/features/contracts/hooks/useContracts';

export default function PendingContractsPage() {
  const { data: contracts, isLoading, isError } = useMyPendingContracts();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Không thể tải danh sách hợp đồng</h3>
        <p className="mt-2 text-sm text-slate-500">Đã có lỗi xảy ra, vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="relative overflow-hidden rounded-[32px] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-900/10 lg:p-8">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.35),_transparent_65%)]" />
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 text-amber-300">
              <FileSignature className="h-7 w-7" />
            </div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.35em] text-slate-400">Ký hợp đồng điện tử</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight lg:text-4xl">Hợp đồng chờ ký được ưu tiên hiển thị ở đây.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Kiểm tra kỹ điều khoản, tiền thuê, tiền cọc, file đính kèm và thông tin thành viên trước khi ký điện tử.
            </p>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:p-7">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Quy trình xử lý</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Thứ tự bắt buộc</h2>
          <div className="mt-6 space-y-3">
            <div className="rounded-[24px] bg-amber-50 p-4 dark:bg-amber-500/10">
              <p className="text-sm font-black text-amber-800 dark:text-amber-200">1. Ký điện tử hợp đồng</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-sm font-black text-slate-700 dark:text-slate-200">2. Hệ thống tạo hóa đơn đầu kỳ</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-sm font-black text-slate-700 dark:text-slate-200">3. Thanh toán để tự động kích hoạt hợp đồng</p>
            </div>
          </div>
        </div>
      </section>

      {!contracts || contracts.length === 0 ? (
        <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Không có việc chờ ký</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Hiện tại bạn không có hợp đồng nào cần xác nhận. Khi có hợp đồng mới, hệ thống sẽ ưu tiên đưa lên đầu màn hình này.
          </p>
        </section>
      ) : (
        <section className="space-y-5">
          <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/10">
            <p className="text-sm font-black text-amber-800 dark:text-amber-200">
              Ưu tiên xử lý: các hợp đồng này cần được ký trước để hệ thống phát sinh hóa đơn ban đầu và hoàn tất kích hoạt thuê phòng.
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {contracts.map((contract) => (
              <button
                type="button"
                key={contract.id}
                onClick={() => navigate(`/app/contracts/${contract.id}`)}
                className="group relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="absolute left-0 top-0 h-full w-1.5 bg-indigo-500" />

                <div className="ml-2 flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    Chờ chữ ký
                  </span>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    Tạo ngày {format(new Date(contract.created_at), 'dd/MM/yyyy')}
                  </span>
                </div>

                <div className="ml-2 mt-5 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-slate-950 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">
                        {contract.property?.name || 'Cơ sở'} - {contract.room?.name || 'Phòng'}
                      </h3>
                      <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                        <Building2 className="h-4 w-4" />
                        Mã hợp đồng: {contract.id.substring(0, 8).toUpperCase()}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-500 dark:group-hover:bg-indigo-500/10 dark:group-hover:text-indigo-300">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-800">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Ngày bắt đầu</p>
                      <p className="mt-2 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                        <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        {contract.start_date ? format(new Date(contract.start_date), 'dd/MM/yyyy') : '---'}
                      </p>
                    </div>

                    <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-800">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Tiền thuê 1 tháng</p>
                      <p className="mt-2 text-sm font-black text-indigo-600 dark:text-indigo-300">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.rent_price || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
