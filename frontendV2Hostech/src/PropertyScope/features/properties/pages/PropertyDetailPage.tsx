import { Navigate, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import { useDashboard } from '../../dashboard/hooks/useDashboard';
import { PropertyDashboardView } from '../../dashboard/components/PropertyDashboardView';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Building2, LayoutDashboard, Layers, MapPin, Maximize2 } from 'lucide-react';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

export default function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const hasRole = useAuthStore((s) => s.hasRole);
  const isStaff = hasRole(['Staff']);

  const { data: property, isLoading: isPropertyLoading } = usePropertyDetail(propertyId);
  const { data: dashboard, isLoading: isDashboardLoading } = useDashboard(propertyId, {
    enabled: !isStaff,
  });
  
  const isLoading = isPropertyLoading || isDashboardLoading;

  const dashboardView = useMemo(() => {
    if (!dashboard || !propertyId) return null;
    return (
      <PropertyDashboardView
        dashboard={dashboard}
        propertyId={propertyId}
      />
    );
  }, [dashboard, propertyId]);

  if (isStaff && propertyId) {
    return <Navigate to={`/properties/${propertyId}/staff-home`} replace />;
  }

  if (isLoading && !property) {
    return (
      <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex justify-center">
          <Skeleton className="h-10 w-64 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[60vh]">
         <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center max-w-md">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">Tòa nhà không tồn tại</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">Chúng tôi không thể tìm thấy thông tin tòa nhà bạn yêu cầu. Vui lòng kiểm tra lại ID hoặc liên hệ quản trị viên.</p>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-none">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Bảng điều khiển</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Tổng quan vận hành cho <span className="text-blue-900 dark:text-blue-400 font-bold">{property.name}</span></p>
          </div>
        </div>
      </div>

      {/* Card thông tin tòa nhà */}
      <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center gap-6 px-6 py-4">
          {/* Tên */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
              <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tên tòa nhà</p>
              <p className="truncate text-base font-black text-slate-900 dark:text-white">{property.name}</p>
            </div>
          </div>

          <div className="h-10 w-px shrink-0 bg-slate-100 dark:bg-slate-700" />

          {/* Địa chỉ */}
          {property.address && (
            <>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                  <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Địa chỉ</p>
                  <p className="max-w-xs truncate text-sm font-semibold text-slate-700 dark:text-slate-300">{property.address}</p>
                </div>
              </div>
              <div className="h-10 w-px shrink-0 bg-slate-100 dark:bg-slate-700" />
            </>
          )}

          {/* Diện tích */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10">
              <Maximize2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Diện tích</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {property.area != null ? `${property.area.toLocaleString('vi-VN')} m²` : '—'}
                {property.shared_area != null && property.shared_area > 0 && (
                  <span className="ml-1 text-xs font-medium text-slate-400">(+{property.shared_area} m² chung)</span>
                )}
              </p>
            </div>
          </div>

          <div className="h-10 w-px shrink-0 bg-slate-100 dark:bg-slate-700" />

          {/* Số tầng */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/10">
              <Layers className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Số tầng</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {property.floors_count ?? property.stats?.total_floors ?? '—'}
                {(property.floors_count ?? property.stats?.total_floors) ? ' tầng' : ''}
              </p>
            </div>
          </div>

          <div className="h-10 w-px shrink-0 bg-slate-100 dark:bg-slate-700" />

          {/* Tổng số phòng */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-500/10">
              <LayoutDashboard className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tổng phòng</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {property.rooms_count ?? property.stats?.total_rooms ?? '—'}
                {(property.rooms_count ?? property.stats?.total_rooms) ? ' phòng' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {dashboardView}
    </div>
  );
}

