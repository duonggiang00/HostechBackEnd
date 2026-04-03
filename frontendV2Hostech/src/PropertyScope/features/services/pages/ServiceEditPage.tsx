import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useServiceDetail, useUpdateService } from '../hooks/useServices';
import ServiceForm from '../components/ServiceForm';
import { toast } from 'react-hot-toast';
import type { ServiceFormData } from '../types';

export default function ServiceEditPage() {
  const navigate = useNavigate();
  const { propertyId, serviceId } = useParams<{ propertyId: string; serviceId: string }>();
  
  const { data: service, isLoading } = useServiceDetail(serviceId || '');
  const updateMutation = useUpdateService();

  const handleSubmit = async (data: ServiceFormData) => {
    if (!serviceId) return;
    try {
      await updateMutation.mutateAsync({ id: serviceId, data });
      toast.success('Dịch vụ đã được cập nhật thành công');
      navigate(`/properties/${propertyId}/services`);
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật dịch vụ');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Không tìm thấy dịch vụ cần sửa.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Cập nhật dịch vụ
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {service.name} ({service.code})
            </p>
          </div>
        </div>
        
        <button
          type="submit"
          form="service-form"
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 font-medium"
        >
          <Save className="w-5 h-5" />
          {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      <ServiceForm 
        initialData={service} 
        onSubmit={handleSubmit} 
      />
    </div>
  );
}
