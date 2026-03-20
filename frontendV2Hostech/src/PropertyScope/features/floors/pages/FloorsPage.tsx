import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFloors, useFloorActions } from '@/PropertyScope/features/floors/hooks/useFloors';
import { usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import FloorCard from '@/PropertyScope/features/floors/components/FloorCard';
import FloorListItem from '@/PropertyScope/features/floors/components/FloorListItem';
import { Plus, Loader2, ChevronLeft, Building2, LayoutGrid, List, Trash2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import FloorForm from '@/PropertyScope/features/floors/components/FloorForm';

type ViewMode = 'grid' | 'list';

export default function FloorsPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showTrash, setShowTrash] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: floors, isLoading, error } = useFloors(propertyId, showTrash);
  const { data: property } = usePropertyDetail(propertyId);
  const { restoreFloor, forceDeleteFloor } = useFloorActions();

  const handleRestore = (id: string) => {
    restoreFloor.mutate(id, {
      onSuccess: () => toast.success('Đã khôi phục tầng thành công'),
      onError: () => toast.error('Khôi phục thất bại')
    });
  };

  const handleForceDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tầng này? Hành động này không thể hoàn tác.')) {
      forceDeleteFloor.mutate(id, {
        onSuccess: () => toast.success('Đã xóa vĩnh viễn tầng'),
        onError: () => toast.error('Xóa thất bại')
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-3xl m-8">
        <h3 className="text-xl font-bold mb-2">Lỗi khi tải danh sách tầng</h3>
        <p>Đã xảy ra lỗi khi lấy dữ liệu tầng cho tài sản này.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors group px-4 py-2 rounded-xl hover:bg-slate-100 w-fit"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Quay lại
        </button>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button 
                onClick={() => setShowTrash(false)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!showTrash ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-indigo-600'}`}
            >
                Hoạt động
            </button>
            <button 
                onClick={() => setShowTrash(true)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${showTrash ? 'bg-white text-rose-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-rose-600'}`}
            >
                <Trash2 className="w-3.5 h-3.5" />
                Thùng rác
            </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-2 bg-indigo-50 px-3 py-1 rounded-full w-fit border border-indigo-100">
            <Building2 className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">{property?.name || 'Tài sản'}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            {showTrash ? 'Thùng rác Tầng' : 'Tầng & Khu vực'}
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {showTrash 
                ? 'Danh sách các tầng đã bị xóa tạm thời. Bạn có thể khôi phục hoặc xóa vĩnh viễn.'
                : 'Chọn một tầng để quản lý phòng, cư dân và bản đồ trực quan.'
            }
          </p>
        </div>
        
        <div className="flex gap-3">
            {!showTrash && (
                <div className="flex bg-slate-100 p-1 rounded-2xl mr-2">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Dạng lưới"
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Dạng danh sách"
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            )}
            
            {!showTrash && (
                <button 
                  onClick={() => setIsFormOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Thêm tầng
                </button>
            )}

            {showTrash && floors && floors.length > 0 && (
                <button 
                    onClick={() => setShowTrash(false)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Quay về danh sách
                </button>
            )}
        </div>
      </div>

      {!floors?.length ? (
        <div className="p-20 text-center bg-white border border-slate-200 rounded-[3rem] shadow-xl shadow-slate-200/50">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${showTrash ? 'bg-rose-50' : 'bg-slate-50'}`}>
                {showTrash ? (
                    <Trash2 className="w-10 h-10 text-rose-200" />
                ) : (
                    <Plus className="w-10 h-10 text-slate-200" />
                )}
            </div>
            <h3 className="text-2xl font-black text-slate-900">
                {showTrash ? 'Thùng rác trống' : 'Chưa có tầng nào'}
            </h3>
            <p className="text-slate-400 mt-2 font-medium">
                {showTrash 
                    ? 'Không có tầng nào bị xóa gần đây.' 
                    : 'Tài sản này hiện chưa được thiết lập các tầng.'
                }
            </p>
            {!showTrash && (
                <button 
                  onClick={() => setIsFormOpen(true)}
                  className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
                >
                    Tạo nhanh tầng đầu tiên
                </button>
            )}
            {showTrash && (
                <button 
                    onClick={() => setShowTrash(false)}
                    className="mt-8 px-8 py-3 border-2 border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                >
                    Xem danh sách hoạt động
                </button>
            )}
        </div>
      ) : (
        <div className={viewMode === 'grid' && !showTrash ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8" : "flex flex-col gap-4 mt-8"}>
            <AnimatePresence mode="popLayout">
                {floors.map((floor, i) => (
                    <motion.div
                        key={floor.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        {viewMode === 'grid' && !showTrash ? (
                            <FloorCard 
                                name={floor.name}
                                floorNumber={floor.floor_number}
                                roomsCount={floor.rooms_count || 0}
                                vacantCount={floor.vacant_rooms_count || 0}
                                onClick={() => navigate(`/properties/${propertyId}/floors/${floor.id}/rooms`)}
                            />
                        ) : (
                            <FloorListItem 
                                name={floor.name}
                                floorNumber={floor.floor_number}
                                roomsCount={floor.rooms_count || 0}
                                vacantCount={floor.vacant_rooms_count || 0}
                                isTrash={showTrash}
                                onRestore={() => handleRestore(floor.id)}
                                onForceDelete={() => handleForceDelete(floor.id)}
                                onClick={() => navigate(`/properties/${propertyId}/floors/${floor.id}/rooms`)}
                            />
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {isFormOpen && propertyId && (
          <FloorForm 
            propertyId={propertyId}
            onClose={() => setIsFormOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

