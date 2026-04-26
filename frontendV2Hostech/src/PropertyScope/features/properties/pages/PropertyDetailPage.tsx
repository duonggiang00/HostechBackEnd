import { useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import { useDashboard, useGenerateMonthlyBilling } from '../../dashboard/hooks/useDashboard';
import { PropertyDashboardView } from '../../dashboard/components/PropertyDashboardView';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>();

  const { data: property, isLoading: isPropertyLoading } = usePropertyDetail(propertyId);
  const { data: dashboard, isLoading: isDashboardLoading, refetch: refetchDashboard } = useDashboard(propertyId);
  
  const generateMonthlyMutation = useGenerateMonthlyBilling();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateBilling = async () => {
    if (!propertyId) {
      toast.error('Thiếu mã tài sản');
      return;
    }
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    if (window.confirm(`Xác nhận tạo hóa đơn gốc tự động cho tháng ${currentMonth}?`)) {
      setIsGenerating(true);
      try {
        await generateMonthlyMutation.mutateAsync({ propertyId, month: currentMonth });
        toast.success(`Đã tạo hóa đơn định kỳ cho tháng ${currentMonth} thành công!`);
        refetchDashboard();
      } catch (error: any) {
        toast.error(error.message || 'Lỗi khi tạo hóa đơn');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const isLoading = isPropertyLoading || isDashboardLoading;

  const dashboardView = useMemo(() => {
    if (!dashboard || !propertyId) return null;
    return (
      <PropertyDashboardView 
        dashboard={dashboard}
        isGenerating={isGenerating}
        onGenerateBilling={handleGenerateBilling}
      />
    );
  }, [dashboard, isGenerating, propertyId]);


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

      {dashboardView}
    </div>
  );
}

