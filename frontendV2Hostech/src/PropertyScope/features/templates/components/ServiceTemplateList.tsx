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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Mẫu Dịch Vụ</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý các dịch vụ tiêu chuẩn cho khu trọ (điện, nước, rác...)
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm mẫu dịch vụ</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tên mẫu dịch vụ</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Đơn giá</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900 dark:text-white">{template.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {template.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Intl.NumberFormat('vi-VN').format(template.unit_price)}đ / {template.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 max-w-xs" title={template.description}>
                      {template.description || '--'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
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
            <p className="text-gray-500 dark:text-gray-400 mb-4">Chưa có mẫu dịch vụ nào</p>
            <button
              onClick={handleCreate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all active:scale-95"
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
