import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Box } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { roomTemplatesApi } from '../api/roomTemplatesApi';
import { RoomTemplateForm, type RoomTemplateFormData } from '../components/templates/RoomTemplateForm';
import { usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';

export function RoomTemplateCreatePage() {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
  const queryClient = useQueryClient();

  // Get current property to display total area context in the form
  const { data: property, isLoading: isPropertyLoading } = usePropertyDetail(propertyId);

  const createMutation = useMutation({
    mutationFn: (data: any) => roomTemplatesApi.createTemplate({
      ...data,
      property_id: propertyId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-templates', propertyId] });
      toast.success('Đã tạo mẫu phòng thành công');
      navigate(`/properties/${propertyId}/templates`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể tạo mẫu phòng');
    }
  });

  const handleSave = (data: RoomTemplateFormData) => {
    createMutation.mutate(data);
  };

  const handleBack = () => {
    navigate(`/properties/${propertyId}/templates`);
  };

  if (isPropertyLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full mb-4" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-slate-50/50 dark:bg-slate-900/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6"
        >
          <div className="space-y-4">
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors group"
            >
              <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600">
                <ArrowLeft className="w-4 h-4" />
              </div>
              Quay lại danh sách
            </button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl">
                <Box className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Tạo mẫu phòng mới
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                  <span>Khu trọ: <strong className="text-slate-700 dark:text-slate-300">{property?.name || '...'}</strong></span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <RoomTemplateForm 
            propertyArea={property?.area} 
            onSave={handleSave} 
            isSaving={createMutation.isPending} 
          />
        </motion.div>

      </div>
    </div>
  );
}
