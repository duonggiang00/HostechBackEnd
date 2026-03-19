import { useParams } from 'react-router-dom';
import { useProperty } from '../hooks/useProperty';
import { useScopeStore } from '@/shared/stores/useScopeStore';
import { PropertyHeader } from '../components/PropertyHeader';
import { PropertyOverview } from '../components/PropertyOverview';
import { PropertyBillingPolicy } from '../components/PropertyBillingPolicy';
import { PropertyBankAccounts } from '../components/PropertyBankAccounts';
import { motion } from 'framer-motion';

export default function PropertyDetailPage() {
  const { propertyId: urlPropertyId } = useParams<{ propertyId: string }>();
  const { propertyId: scopePropertyId } = useScopeStore();
  const propertyId = urlPropertyId || scopePropertyId || undefined;
  
  const { data: property, isLoading, error } = useProperty(propertyId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20 min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse text-sm">Đang tải thông tin tòa nhà...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="text-center py-20 px-6">
        <div className="bg-red-50 dark:bg-red-500/10 text-red-600 p-8 rounded-3xl max-w-lg mx-auto border border-red-100 dark:border-red-900/30">
          <h2 className="text-xl font-black mb-2">Không tìm thấy thông tin</h2>
          <p className="text-slate-500 dark:text-slate-400">Vui lòng kiểm tra lại ID tòa nhà hoặc quyền truy cập của bạn.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto pb-20"
    >
      <PropertyHeader property={property} />
      
      <div className="space-y-8">
        <PropertyOverview property={property} />
        
        <div className="grid grid-cols-1 gap-8">
          <PropertyBillingPolicy property={property} />
          <PropertyBankAccounts property={property} />
        </div>
        
        {/* Placeholder for Note/Assigned Staff */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Ghi chú quản lý</h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed italic">
            {property.note || "Chưa có ghi chú nào cho tòa nhà này."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
