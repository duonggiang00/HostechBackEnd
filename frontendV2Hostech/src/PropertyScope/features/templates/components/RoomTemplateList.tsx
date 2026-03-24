import { useState } from 'react';
import { Plus, Edit2, Trash2, Zap, ArrowLeft } from 'lucide-react';
import { useRoomTemplates, useRoomTemplateActions } from '../hooks/useTemplates';
import { RoomTemplateWizard } from './RoomTemplateWizard';
import { BulkRoomCreateModal } from '../../rooms/components/BulkRoomCreateModal';
import type { RoomTemplate } from '../types';

interface RoomTemplateListProps {
  propertyId: string;
}

export function RoomTemplateList({ propertyId }: RoomTemplateListProps) {
  const { data: templates = [], isLoading } = useRoomTemplates(propertyId);
  const { deleteTemplate } = useRoomTemplateActions(propertyId);
  const [showWizard, setShowWizard] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RoomTemplate | null>(null);

  const handleEdit = (template: RoomTemplate) => {
    setSelectedTemplate(template);
    setShowWizard(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setShowWizard(true);
  };

  const handleBulkCreate = (template: RoomTemplate) => {
    setSelectedTemplate(template);
    setIsBulkModalOpen(true);
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mẫu Phòng</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý các loại phòng để tạo phòng nhanh chóng
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
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

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => handleBulkCreate(template)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                Tạo nhanh phòng
              </button>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full p-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 mb-4">Chưa có mẫu phòng nào</p>
            <button
              onClick={handleCreate}
              className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:shadow-md transition-all active:scale-95"
            >
              + Tạo mẫu đầu tiên
            </button>
          </div>
        )}
      </div>

      <BulkRoomCreateModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        propertyId={propertyId}
        template={selectedTemplate}
      />
    </div>
  );
}
