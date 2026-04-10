import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useCreateService } from '../hooks/useServices';
import ServiceForm from '../components/ServiceForm';
import { toast } from 'react-hot-toast';
import type { ServiceFormData } from '../types';

export default function ServiceCreatePage() {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
  const createMutation = useCreateService();

  const handleSubmit = async (data: ServiceFormData) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Dịch vụ đã được tạo thành công');
      navigate(`/properties/${propertyId}/services`);
    } catch {
      toast.error('Có lỗi xảy ra khi tạo dịch vụ');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-[#4B5563]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#111827] dark:text-white">
              Thêm dịch vụ mới
            </h1>
            <p className="text-sm text-[#4B5563] dark:text-slate-400 mt-1">
              Định nghĩa cấu hình dịch vụ và bảng giá mới
            </p>
          </div>
        </div>
        
        <button
          type="submit"
          form="service-form"
          disabled={createMutation.isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F59E0B] text-white rounded-lg hover:bg-[#D97706] shadow-sm transition-all focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2 disabled:opacity-50 font-semibold"
        >
          <Save className="w-5 h-5" />
          {createMutation.isPending ? 'Đang lưu...' : 'Lưu dịch vụ'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl">
        <ServiceForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
