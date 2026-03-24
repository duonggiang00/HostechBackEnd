import { useState } from 'react';
import { Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { useContractTemplates, useContractTemplateActions } from '../hooks/useTemplates';
// import { ContractTemplateModal } from './ContractTemplateModal'; 
import type { ContractTemplate } from '../types';

interface ContractTemplateListProps {
  propertyId: string;
}

export function ContractTemplateList({ propertyId }: ContractTemplateListProps) {
  const { data: templates = [], isLoading } = useContractTemplates(propertyId);
  const { deleteTemplate } = useContractTemplateActions(propertyId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);

  const handleEdit = (template: ContractTemplate) => {
    // setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    // setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa mẫu hợp đồng này?')) {
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mẫu Hợp Đồng</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý các mẫu hợp đồng cho thuê
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm mẫu hợp đồng</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3 truncate">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate" title={template.name}>
                  {template.name}
                </h3>
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
              {template.is_default && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Mặc định
                </span>
              )}
              
              {template.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">
                  {template.description}
                </p>
              )}
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 mb-4">Chưa có mẫu hợp đồng nào</p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
            >
              + Tạo mẫu đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Placeholder for Modal until created */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
             <h3 className="text-xl font-bold mb-4">Thông báo</h3>
             <p className="mb-6">Tính năng chỉnh sửa nội dung hợp đồng đang được hoàn thiện.</p>
             <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full py-2 bg-indigo-600 text-white rounded-xl font-medium"
             >
                Đóng
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
