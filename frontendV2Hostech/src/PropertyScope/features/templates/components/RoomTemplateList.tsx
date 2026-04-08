import { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import { useRoomTemplates, useRoomTemplateActions } from '../hooks/useTemplates';
import { RoomTemplateWizard } from './RoomTemplateWizard';
import type { RoomTemplate } from '../types';

interface RoomTemplateListProps {
  propertyId: string;
}

export function RoomTemplateList({ propertyId }: RoomTemplateListProps) {
  const { data: templates = [], isLoading } = useRoomTemplates(propertyId);
  const { deleteTemplate } = useRoomTemplateActions(propertyId);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RoomTemplate | null>(null);

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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowWizard(false)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {selectedTemplate ? 'Cập nhật mẫu phòng' : 'Tạo mẫu phòng mới'}
            </h2>
          </div>
        </div>
        
        <RoomTemplateWizard 
          propertyId={propertyId}
          initialData={selectedTemplate}
          onSuccess={() => setShowWizard(false)}
          onCancel={() => setShowWizard(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Mẫu Phòng</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý các loại phòng để tạo phòng nhanh chóng
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm mẫu phòng</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mẫu phòng</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Giá thuê</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Diện tích</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sức chứa</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center">
                        {template.media && template.media.length > 0 ? (
                          <img 
                            src={template.media[0].original_url} 
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400 font-medium uppercase">No Img</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{template.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[200px]">
                          {template.description || 'Không có mô tả'}
                        </div>
                      </div>
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
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {templates.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Chưa có mẫu phòng nào</p>
            <button
              onClick={handleCreate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all active:scale-95"
            >
              + Tạo mẫu đầu tiên
            </button>
          </div>
        )}
      </div>

      <div />
    </div>
  );
}
