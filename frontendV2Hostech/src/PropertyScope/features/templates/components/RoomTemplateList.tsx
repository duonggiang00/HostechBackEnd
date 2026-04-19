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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate pr-2" title={template.name}>
                {template.name}
              </h3>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-50 dark:bg-slate-700/50 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Giá thuê (Tháng)</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {Intl.NumberFormat('vi-VN').format(template.base_price)}đ
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Diện tích</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {template.area ? `${template.area} m²` : '--'}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Số người ở tối đa</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {template.capacity ? `${template.capacity} người` : '--'}
                </span>
              </div>

              {template.description && (
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 mb-4">Chưa có mẫu phòng nào</p>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all active:scale-95"
          >
            + Tạo mẫu đầu tiên
          </button>
        </div>
      )}
    </div>
  );
}
