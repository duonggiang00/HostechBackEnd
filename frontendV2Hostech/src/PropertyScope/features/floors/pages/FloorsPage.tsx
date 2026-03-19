import { useParams, useNavigate } from 'react-router-dom';
import { useFloors } from '@/PropertyScope/features/floors/hooks/useFloors';
import { usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import FloorCard from '@/PropertyScope/features/floors/components/FloorCard';
import { Plus, Loader2, ChevronLeft, Building2, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FloorsPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { data: floors, isLoading, error } = useFloors(propertyId);
  const { data: property } = usePropertyDetail(propertyId);

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
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors group px-4 py-2 rounded-xl hover:bg-slate-100 w-fit"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Quay lại
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-2 bg-indigo-50 px-3 py-1 rounded-full w-fit border border-indigo-100">
            <Building2 className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">{property?.name || 'Tài sản'}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Tầng & Khu vực</h1>
          <p className="text-slate-500 font-medium mt-1">Chọn một tầng để quản lý phòng, cư dân và bản đồ trực quan.</p>
        </div>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-3 text-slate-600 bg-white border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all">
                <LayoutGrid className="w-5 h-5" />
                Dạng chồng
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                <Plus className="w-5 h-5" />
                Thêm tầng
            </button>
        </div>
      </div>

      {!floors?.length ? (
        <div className="p-20 text-center bg-white border border-slate-200 rounded-[3rem] shadow-xl shadow-slate-200/50">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Chưa có tầng nào</h3>
            <p className="text-slate-400 mt-2 font-medium">Tài sản này hiện chưa được thiết lập các tầng.</p>
            <button className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">
                Tạo nhanh tầng đầu tiên
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            {floors.map((floor, i) => (
            <motion.div
                key={floor.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
            >
                <FloorCard 
                    name={floor.name}
                    floorNumber={floor.floor_number}
                    roomsCount={floor.rooms_count || 0}
                    vacantCount={floor.vacant_rooms_count || 0}
                    onClick={() => navigate(`/admin/properties/${propertyId}/floors/${floor.id}/rooms`)}
                />
            </motion.div>
            ))}
        </div>
      )}
    </div>
  );
}
