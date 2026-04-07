import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import { useDashboard, useGenerateMonthlyBilling } from '../../dashboard/hooks/useDashboard';
import { PropertyDashboardView } from '../../dashboard/components/PropertyDashboardView';
import { Skeleton } from '@/shared/components/ui/skeleton';
import toast from 'react-hot-toast';
import { LayoutDashboard, Layers, Home } from 'lucide-react';
import { FeatureTabbedLayout } from '../../../components/FeatureTabbedLayout';

import BuildingOverviewPage from '../../building-overview/pages/BuildingOverviewPage';
import RoomListPage from '../../rooms/pages/RoomListPage';

interface PropertyDetailPageProps {
  defaultTab?: 'dashboard' | 'layout' | 'rooms';
}

export default function PropertyDetailPage({ defaultTab = 'dashboard' }: PropertyDetailPageProps) {
  const { propertyId } = useParams<{ propertyId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo(() => {
    if (location.pathname.endsWith('/dashboard')) return 'dashboard';
    if (location.pathname.endsWith('/building-view')) return 'layout';
    if (location.pathname.endsWith('/rooms')) return 'rooms';
    return defaultTab;
  }, [location.pathname, defaultTab]);

  const tabs = [
    { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard },
    { id: 'layout', label: 'Sơ đồ', icon: Layers },
    { id: 'rooms', label: 'Phòng', icon: Home },
  ] as const;

  const handleTabChange = (tab: 'dashboard' | 'layout' | 'rooms') => {
    const pathMap = {
      dashboard: `/properties/${propertyId}/dashboard`,
      layout: `/properties/${propertyId}/building-view`,
      rooms: `/properties/${propertyId}/rooms`,
    };
    navigate(pathMap[tab]);
  };

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

  const isLoading = isPropertyLoading || (activeTab === 'dashboard' && isDashboardLoading);

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
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
        <div className="flex justify-center">
          <Skeleton className="h-12 w-64 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[60vh]">
         <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-10 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl text-center max-w-md">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Tòa nhà không tồn tại</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Chúng tôi không thể tìm thấy thông tin tòa nhà bạn yêu cầu. Vui lòng kiểm tra lại ID hoặc liên hệ quản trị viên.</p>
         </div>
      </div>
    );
  }

  return (
    <FeatureTabbedLayout
      tabs={tabs as any}
      activeTab={activeTab}
      onTabChange={handleTabChange as any}
      maxWidth="max-w-[1600px]"
    >
      {activeTab === 'dashboard' && dashboardView}
      {activeTab === 'layout' && <BuildingOverviewPage />}
      {activeTab === 'rooms' && <RoomListPage />}
    </FeatureTabbedLayout>
  );
}
