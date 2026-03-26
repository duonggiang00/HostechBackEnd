import { useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import { useDashboard, useGenerateMonthlyBilling } from '../../dashboard/hooks/useDashboard';
import { PropertyHeader } from '../components/PropertyHeader';
import { PropertyBillingPolicy } from '../components/PropertyBillingPolicy';
import { PropertyTemplateConfig } from '../components/PropertyTemplateConfig';
import { PropertyFloorsList } from '../components/PropertyFloorsList';
import { PropertyTabSwitcher } from '../components/PropertyTabSwitcher';
import { PropertyDashboardView } from '../../dashboard/components/PropertyDashboardView';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface PropertyDetailPageProps {
  defaultTab?: 'dashboard' | 'info';
}

export default function PropertyDetailPage({ defaultTab = 'dashboard' }: PropertyDetailPageProps) {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'info'>(defaultTab);
  
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

  const detailView = useMemo(() => {
    if (!property) return null;
    return (
      <div className="space-y-8">
        <PropertyTemplateConfig property={property} />
        <PropertyBillingPolicy property={property} />
        <PropertyFloorsList property={property} />
      </div>
    );
  }, [property]);

  if (isLoading && !property) {
    return (
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
        <Skeleton className="h-[200px] w-full rounded-[2.5rem]" />
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8 max-w-[1600px] mx-auto pb-20"
    >
      <PropertyHeader property={property} />

      <div className="flex justify-center sticky top-4 z-50">
        <PropertyTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <motion.div 
        key={activeTab}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? dashboardView : detailView}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
