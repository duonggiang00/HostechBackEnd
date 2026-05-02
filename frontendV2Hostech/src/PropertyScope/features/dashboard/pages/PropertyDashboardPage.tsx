import { Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, LayoutDashboard } from 'lucide-react';
import { useDashboard, useGenerateMonthlyBilling } from '../hooks/useDashboard';
import { PropertyDashboardView } from '../components/PropertyDashboardView';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-2xl" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded-lg" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-9 w-36 bg-slate-200 rounded-lg" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 p-5 rounded-[12px] shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-28 bg-slate-200 rounded" />
                <div className="h-7 w-20 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-100 rounded" />
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-gray-100 rounded-[12px] shadow-sm h-72" />
        <div className="bg-white border border-gray-100 rounded-[12px] shadow-sm h-72" />
      </div>

      {/* Bottom row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-100 rounded-[12px] shadow-sm h-40" />
        <div className="lg:col-span-2 bg-blue-900/80 rounded-[12px] shadow-sm h-40" />
      </div>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 gap-4 text-center"
    >
      <div className="p-4 bg-rose-50 rounded-3xl">
        <AlertCircle className="w-10 h-10 text-rose-500" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-bold text-slate-900">Không thể tải dữ liệu Dashboard</p>
        <p className="text-sm text-slate-400">Kiểm tra kết nối mạng hoặc thử lại</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Thử lại
      </button>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PropertyDashboardPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const hasRole = useAuthStore((s) => s.hasRole);
  const isStaff = hasRole(['Staff']);
  const { data, isLoading, isError, refetch } = useDashboard(propertyId, { enabled: !isStaff });
  const generateBilling = useGenerateMonthlyBilling();

  if (isStaff && propertyId) {
    return <Navigate to={`/properties/${propertyId}/staff-home`} replace />;
  }

  const handleGenerateBilling = async () => {
    if (!propertyId) return;
    try {
      const res = await generateBilling.mutateAsync({ propertyId });
      const failed = Number((res as any)?.failed ?? 0);
      const ok = Number((res as any)?.count ?? (res as any)?.success ?? 0);
      if (failed > 0) {
        toast(
          `Chốt tháng: đã tạo ${ok} hóa đơn. ${failed} phòng chưa tạo mới (thường do đã có hóa đơn cùng kỳ hoặc chưa chốt số điện/nước).`,
          { duration: 7000, style: { maxWidth: 440 } },
        );
      } else {
        toast.success((res as any)?.message || 'Đã tạo hóa đơn tháng này thành công!');
      }
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi khi tạo hóa đơn.');
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full p-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-slate-900 rounded-2xl text-white">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Tổng quan Tòa nhà</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
            Dashboard · 30 ngày gần nhất
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading && <DashboardSkeleton />}
      {isError && <DashboardError onRetry={refetch} />}
      {data && (
        <PropertyDashboardView
          dashboard={data}
          isGenerating={generateBilling.isPending}
          onGenerateBilling={handleGenerateBilling}
          propertyId={propertyId}
        />
      )}
    </div>
  );
}
