import { useMyContracts } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { Loader2, Home, AlertCircle } from 'lucide-react';
import RoomDetailPage from '@/PropertyScope/features/rooms/pages/RoomDetailPage';
import { Link } from 'react-router-dom';

export default function MyRoomPage() {
  const { data: contracts, isLoading, error } = useMyContracts();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Đang tải thông tin phòng của bạn...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="mt-6 text-xl font-black tracking-tight text-slate-900 dark:text-white">
          Đã có lỗi xảy ra
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Không thể lấy thông tin hợp đồng vào lúc này. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  // Tìm hợp đồng đang hoạt động (ACTIVE)
  const activeContract = contracts?.find(c => c.status === 'ACTIVE');

  if (!activeContract || !activeContract.room_id) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <Home className="h-10 w-10" />
        </div>
        <h3 className="mt-8 text-2xl font-black tracking-tight text-slate-900 dark:text-white lg:text-3xl">
          Bạn chưa có phòng hoạt động
        </h3>
        <p className="mt-4 max-w-md text-base leading-7 text-slate-500">
          Hiện tại bạn không có hợp đồng thuê phòng nào đang hoạt động. 
          Nếu bạn vừa ký hợp đồng, vui lòng đợi quản lý kích hoạt hoặc kiểm tra mục "Hợp đồng" để hoàn tất thủ tục.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/app/contracts/pending"
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 dark:shadow-none"
          >
            Kiểm tra hợp đồng chờ ký
          </Link>
          <Link
            to="/app/dashboard"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return <RoomDetailPage forceId={activeContract.room_id} />;
}
