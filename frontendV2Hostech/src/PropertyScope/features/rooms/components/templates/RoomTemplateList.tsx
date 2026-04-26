import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, LayoutGrid, Search, Loader2, ScrollText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { roomTemplatesApi } from '../../api/roomTemplatesApi';
import { RoomTemplateCard } from './RoomTemplateCard';
import { RoomTemplateDialog } from './RoomTemplateDialog';
import type { RoomTemplate } from '../../types';
import { toast } from 'react-hot-toast';

interface RoomTemplateListProps {
  propertyId: string;
}

export function RoomTemplateList({ propertyId }: RoomTemplateListProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RoomTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['room-templates', propertyId],
    queryFn: () => roomTemplatesApi.getTemplates(propertyId),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => roomTemplatesApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-templates', propertyId] });
      toast.success('Tạo mẫu thành công');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể tạo mẫu');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => roomTemplatesApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-templates', propertyId] });
      toast.success('Cập nhật mẫu thành công');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật mẫu');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roomTemplatesApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-templates', propertyId] });
      toast.success('Đã xóa mẫu');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể xóa mẫu');
    }
  });

  const handleOpenDialog = (template?: RoomTemplate) => {
    setEditingTemplate(template || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleSave = (data: any) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.room_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* List Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-500/10 rounded-3xl">
            <LayoutGrid className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Danh sách mẫu phòng</h3>
            <p className="text-sm font-bold text-slate-400 mt-1 italic">Thiết lập cấu hình mẫu để tạo phòng nhanh chóng</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm mẫu..."
              className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => handleOpenDialog()}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            THÊM MẪU MỚI
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Đang tải danh sách mẫu...</p>
        </div>
      ) : filteredTemplates.length > 0 ? (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredTemplates.map((template) => (
              <RoomTemplateCard
                key={template.id}
                template={template}
                onEdit={handleOpenDialog}
                onDelete={(id) => {
                  if (window.confirm('Bạn có chắc chắn muốn xóa mẫu này?')) {
                    deleteMutation.mutate(id);
                  }
                }}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
          <ScrollText className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" />
          <p className="text-xl font-black text-slate-300 uppercase tracking-widest">Chưa có mẫu nào được tạo</p>
          <button
            onClick={() => handleOpenDialog()}
            className="mt-6 text-indigo-500 font-black uppercase text-sm hover:underline"
          >
            Bắt đầu bằng cách tạo mẫu đầu tiên của bạn
          </button>
        </div>
      )}

      {/* Dialog Rendering */}
      <AnimatePresence>
        {isDialogOpen && (
          <RoomTemplateDialog
            propertyId={propertyId}
            initialData={editingTemplate}
            onClose={handleCloseDialog}
            onSave={handleSave}
            isSaving={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
