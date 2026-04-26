import { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoomTemplates, useRoomTemplateActions } from '../hooks/useTemplates';
import { RoomTemplateWizard } from './RoomTemplateWizard';
import { Button } from '@/shared/components/ui/button';
import type { RoomTemplate } from '../types';

interface RoomTemplateListProps {
  propertyId: string;
}

export function RoomTemplateList({ propertyId }: RoomTemplateListProps) {
  const { data: templates = [], isLoading } = useRoomTemplates(propertyId);
  const { deleteTemplate } = useRoomTemplateActions(propertyId);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RoomTemplate | null>(null);
  const navigate = useNavigate();

  const handleEdit = (template: RoomTemplate) => {
    setSelectedTemplate(template);
    setShowWizard(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setShowWizard(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa mẫu phòng này?')) {
      deleteTemplate.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;
  }

  if (showWizard) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-500">
        <div className="flex items-center gap-5 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowWizard(false)}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Button>
          <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center shadow-lg">
             <Plus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
              {selectedTemplate ? 'Cập nhật mẫu phòng' : 'Tạo mẫu phòng mới'}
            </h2>
            <p className="text-[10px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest">Cấu hình mẫu thiết kế phòng chuẩn</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <RoomTemplateWizard 
            propertyId={propertyId}
            initialData={selectedTemplate}
            onSuccess={() => setShowWizard(false)}
            onCancel={() => setShowWizard(false)}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 max-w-6xl p-1 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-900 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-none">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">Mẫu Thiết Lập</h1>
            <p className="text-sm font-bold text-gray-500 mt-1">
              Quản lý các loại phòng để tạo phòng nhanh chóng & nhất quán
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-blue-900 hover:bg-black text-white font-black uppercase tracking-widest rounded-xl h-12 px-8 gap-3 shadow-xl shadow-blue-900/10 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Thêm mẫu phòng
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden border-t-4 border-t-blue-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest min-w-[250px]">Chi tiết mẫu phòng</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Giá thuê cơ sở</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Diện tích</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sức chứa</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Quản lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="font-bold text-gray-900 dark:text-white tracking-tight">
                      {template.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {Intl.NumberFormat('vi-VN').format(template.base_price)}đ
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {template.area ? `${template.area} m²` : '--'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {template.capacity ? `${template.capacity} người` : '--'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2 pr-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/properties/${propertyId}/room-templates/${template.id}`)}
                        className="h-10 w-10 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                        className="h-10 w-10 text-gray-400 hover:text-blue-900 dark:hover:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template.id)}
                        className="h-10 w-10 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {templates.length === 0 && (
          <div className="p-20 text-center bg-gray-50/50 dark:bg-gray-900/50">
            <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <Plus className="w-10 h-10 text-gray-200" />
            </div>
            <p className="text-gray-400 font-black uppercase tracking-widest mb-6">Chưa có mẫu thiết kế nào</p>
            <Button
              onClick={handleCreate}
              className="bg-blue-900 hover:bg-black text-white font-black uppercase tracking-widest rounded-xl h-12 px-8 shadow-lg shadow-blue-900/10"
            >
              + Tạo mẫu đầu tiên
            </Button>
          </div>
        )}
      </div>

      <div />
    </div>
  );
}
