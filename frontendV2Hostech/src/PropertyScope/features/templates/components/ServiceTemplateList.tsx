import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useServiceTemplates, useServiceTemplateActions } from '../hooks/useTemplates';
import { ServiceTemplateModal } from './ServiceTemplateModal';
import type { ServiceTemplate } from '../types';

interface ServiceTemplateListProps {
  propertyId: string;
}

export function ServiceTemplateList({ propertyId }: ServiceTemplateListProps) {
  const { data: templates = [], isLoading } = useServiceTemplates(propertyId);
  const { deleteTemplate } = useServiceTemplateActions(propertyId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ServiceTemplate | null>(null);

  const handleEdit = (template: ServiceTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa mẫu dịch vụ này?')) {
      deleteTemplate.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mẫu Dịch Vụ</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý các dịch vụ tiêu chuẩn cho khu trọ (điện, nước, rác...)
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm mẫu dịch vụ</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate" title={template.name}>
                  {template.name}
                </h3>
                <span className="inline-block mt-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  {template.type}
                </span>
              </div>
              <div className="flex gap-2">
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

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Đơn giá</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {Intl.NumberFormat('vi-VN').format(template.unit_price)}đ / {template.unit}
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

        {templates.length === 0 && (
          <div className="col-span-full p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 mb-4">Chưa có mẫu dịch vụ nào</p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
            >
              + Tạo mẫu đầu tiên
            </button>
          </div>
        )}
      </div>

      <ServiceTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        propertyId={propertyId}
        template={editingTemplate}
      />
    </div>
  );
}
