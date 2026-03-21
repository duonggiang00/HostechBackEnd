import { useParams } from 'react-router-dom';
import { usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import { PropertyHeader } from '../components/PropertyHeader';
import { PropertyOverview } from '../components/PropertyOverview';
import { PropertyBillingPolicy } from '../components/PropertyBillingPolicy';
import { PropertyTemplateConfig } from '../components/PropertyTemplateConfig';
import { PropertyFloorsList } from '../components/PropertyFloorsList';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { data: property, isLoading } = usePropertyDetail(propertyId);

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
        <Skeleton className="h-[200px] w-full rounded-[2.5rem]" />
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

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-8"
      >
        {/* Row 1: Key Stats */}
        <PropertyOverview property={property} />

        {/* Row 2: Default Config & Services */}
        <PropertyTemplateConfig property={property} />

        {/* Row 3: Billing Policies */}
        <PropertyBillingPolicy property={property} />

        {/* Row 4: Floors Overview */}
        <PropertyFloorsList property={property} />
      </motion.div>
    </motion.div>
  );
}
