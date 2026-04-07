import { BuildingOverview } from '@/PropertyScope/features/building-overview/components/BuildingOverview';
import { useTenantBuildingOverview } from '../hooks/useTenantBuildingOverview';
import { Loader2, Layers } from 'lucide-react';

/**
 * Tenant Building Overview Page
 * 
 * Provides a read-only visual representation of the resident's building structure.
 * Editing features and links to room details are restricted for residents.
 */
export default function TenantBuildingOverviewPage() {
  const { data, isLoading, error } = useTenantBuildingOverview();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="animate-pulse font-medium">Đang tải sơ đồ tòa nhà...</p>
      </div>
    );
  }

  if (error || !data || !data.floors) {
    const errorMessage = (error as any)?.response?.data?.message 
      || (!data?.floors ? 'Không tìm thấy thông tin mặt bằng cho tòa nhà này.' : null)
      || 'Bạn hiện không có hợp đồng thuê nhà nào đang hoạt động để hiển thị sơ đồ.';

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 rounded-[2.5rem] border border-dashed border-slate-200 bg-white p-12 text-center shadow-xl shadow-slate-200/30 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none font-sans">
          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-slate-50 text-slate-400 ring-8 ring-slate-50/50 dark:bg-slate-900 dark:text-slate-500 dark:ring-slate-900/40">
            <Layers className="h-10 w-10" />
          </div>
          <div className="max-w-md space-y-3">
            <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Không tìm thấy thông tin tòa nhà
            </h3>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              { errorMessage }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <div className="overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white shadow-xl shadow-slate-200/30 dark:border-slate-800/60 dark:bg-slate-950 dark:shadow-none">
        <div className="p-1 sm:p-2 lg:p-4">
          <BuildingOverview
            floors={data.floors}
            templates={data.templates}
            isEditMode={false}
            // Explicitly disable interaction for tenants
            onRoomSelect={undefined}
            onFloorsChange={undefined}
          />
        </div>
      </div>
      
      <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-6 dark:border-blue-900/30 dark:bg-blue-950/20">
        <div className="flex gap-4">
          <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Layers className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">Hướng dẫn xem sơ đồ</h4>
            <p className="text-xs leading-relaxed text-blue-700/80 dark:text-blue-400/80">
              Sơ đồ hiển thị bố cục thực tế của các tầng và phòng trong tòa nhà bạn đang ở. 
              Các phòng được đánh dấu bằng mã số và trạng thái tương ứng. 
              Màu xanh biểu thị phòng trống, màu xám biểu thị phòng đã có người ở.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
