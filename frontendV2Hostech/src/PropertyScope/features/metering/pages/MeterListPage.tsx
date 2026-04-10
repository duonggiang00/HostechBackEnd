import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search,
  Loader2,
  Zap,
  Droplet,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ClipboardList,
  Plus,
  Eye,
} from 'lucide-react';
import { useMeters, usePendingReadingsCount, type Meter } from '../hooks/useMeters';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/shared/hooks/useDebounce';

import { BulkApproveReadingsModal } from '../components/BulkApproveReadingsModal';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

export default function MeterListPage() {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
  const hasRole = useAuthStore((state) => state.hasRole);
  const isManager = hasRole(['Manager', 'Owner']);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [showBulkApprove, setShowBulkApprove] = useState(false);

  // Pending readings badge - optimized count-only hook
  const { data: pendingCount = 0 } = usePendingReadingsCount(propertyId);

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch Meters
  const { meters, pagination, isLoading } = useMeters(propertyId, {
    search: debouncedSearch,
    page,
    perPage: itemsPerPage,
  });

  // Group meters by Room for the UI (Logic Protection)
  const roomGroups = useMemo(() => {
    const list = meters || [];
    const map = new Map<string, any>();
    
    list.forEach((meter: Meter) => {
      const roomId = meter.room?.id;
      if (!roomId) return;
      
      if (!map.has(roomId)) {
        map.set(roomId, {
          ...meter.room,
          meters: []
        });
      }
      map.get(roomId).meters.push(meter);
    });
    
    return Array.from(map.values());
  }, [meters]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setPage(1);
  };

  const totalItems = pagination?.total || 0;
  const totalPages = pagination?.last_page || 1;
  const roomData = roomGroups; 

  if (!propertyId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-500 dark:text-slate-400">Vui lòng chọn tòa nhà</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Quản lý Đồng hồ</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Theo dõi chỉ số theo từng phòng trong tòa nhà</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isManager && pendingCount > 0 && (
            <button
              onClick={() => setShowBulkApprove(true)}
              className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-[8px] text-sm font-semibold hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all shadow-sm active:scale-95"
            >
              <ClipboardList className="w-5 h-5" />
              Duyệt chốt số
              <span className="ml-1 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full">
                {pendingCount}
              </span>
            </button>
          )}
          <button
            onClick={() => navigate(`/properties/${propertyId}/meters/quick`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-[#1E3A8A] border border-slate-200 dark:border-slate-700 rounded-[8px] text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
          >
            <Zap className="w-4 h-4 text-[#F59E0B]" />
            Chốt số nhanh
          </button>
          
          <button
            onClick={() => {/* Open Form Modal */}}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F59E0B] text-white rounded-[8px] text-sm font-semibold hover:bg-[#D97706] transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Thêm đồng hồ
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[12px] p-4 shadow-sm flex flex-col justify-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Tổng số</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{pagination?.total ?? meters.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[12px] p-4 shadow-sm flex flex-col justify-center border-l-4 border-l-[#10B981]">
          <p className="text-sm text-slate-500 dark:text-slate-400">Đang hoạt động</p>
          <p className="text-2xl font-bold text-[#10B981] dark:text-[#10B981] mt-1">{meters.filter((m: any) => m.is_active !== false).length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[12px] p-4 shadow-sm flex flex-col justify-center border-l-4 border-l-[#1E3A8A]">
          <p className="text-sm text-slate-500 dark:text-slate-400">Đồng hồ Điện</p>
          <p className="text-2xl font-bold text-[#1E3A8A] dark:text-blue-400 mt-1">{meters.filter((m: any) => m.type === 'ELECTRIC').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[12px] p-4 shadow-sm flex flex-col justify-center border-l-4 border-l-blue-400">
          <p className="text-sm text-slate-500 dark:text-slate-400">Đồng hồ Nước</p>
          <p className="text-2xl font-bold text-blue-500 dark:text-blue-400 mt-1">{meters.filter((m: any) => m.type === 'WATER').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[12px] p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm mã phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] focus:outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A] text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
          />
        </div>
        <button
          onClick={handleClearFilters}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-[8px] text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          Xóa bộ lọc
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[12px] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin mx-auto mb-3" />
              <p className="text-slate-500">Đang tải danh sách phòng...</p>
            </div>
          </div>
        ) : roomData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Không tìm thấy dữ liệu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300 w-12">STT</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300">Phòng</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300">Đồng hồ điện</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300">Số điện dùng</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300">Đồng hồ nước</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300">Số nước dùng</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900 dark:text-slate-300">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                <AnimatePresence>
                  {roomData.map((room, index) => {
                    const electricMeters = room.meters?.filter((m: any) => m.type === 'ELECTRIC') || [];
                    const waterMeters = room.meters?.filter((m: any) => m.type === 'WATER') || [];
                    const electricMeter = electricMeters.find((m: any) => m.is_master) || electricMeters[0];
                    const waterMeter = waterMeters.find((m: any) => m.is_master) || waterMeters[0];

                    return (
                      <motion.tr
                        key={room.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-slate-600 dark:text-slate-400">
                            {(page - 1) * itemsPerPage + index + 1}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white">{room.name}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{room.code}</span>
                          </div>
                        </td>

                        {/* Điện */}
                        <td className="px-6 py-4">
                          {electricMeter ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <Zap className={`w-3.5 h-3.5 ${electricMeter.is_active ? 'text-yellow-500' : 'text-slate-300'}`} />
                                <span className="font-semibold text-slate-900 dark:text-white uppercase">{electricMeter.code}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-bold uppercase ring-1 ring-blue-500/10">CHỈ SỐ</span>
                                <span className="font-mono text-slate-700 dark:text-slate-300">{electricMeter.latest_reading?.toLocaleString('vi-VN')}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {electricMeter?.last_read_at ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-[#1E3A8A] dark:text-blue-400">
                                {(electricMeter.consumption || 0).toLocaleString('vi-VN')}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase font-medium">kWh</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Chưa chốt</span>
                          )}
                        </td>

                        {/* Nước */}
                        <td className="px-6 py-4">
                          {waterMeter ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <Droplet className={`w-3.5 h-3.5 ${waterMeter.is_active ? 'text-blue-500' : 'text-slate-300'}`} />
                                <span className="font-semibold text-slate-900 dark:text-white uppercase">{waterMeter.code}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full font-bold uppercase ring-1 ring-teal-500/10">CHỈ SỐ</span>
                                <span className="font-mono text-slate-700 dark:text-slate-300">{waterMeter.latest_reading?.toLocaleString('vi-VN')}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {waterMeter?.last_read_at ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                {(waterMeter.consumption || 0).toLocaleString('vi-VN')}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase font-medium">m³</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Chưa chốt</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => navigate(`/properties/${propertyId}/rooms/${room.id}`)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors group"
                            title="Chi tiết phòng"
                          >
                            <Eye className="w-5 h-5 text-slate-400 group-hover:text-[#1E3A8A]" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
          <p className="text-sm text-slate-500">
            Hiển thị <span className="font-semibold">{(page - 1) * itemsPerPage + 1}</span> đến <span className="font-semibold">{Math.min(page * itemsPerPage, totalItems)}</span> trong số <span className="font-semibold">{totalItems}</span> phòng
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = page;
                if (totalPages > 5) {
                  if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                } else {
                  pageNum = i + 1;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-semibold transition-all ${
                      page === pageNum
                        ? 'bg-[#1E3A8A] text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <BulkApproveReadingsModal
        isOpen={showBulkApprove}
        onClose={() => setShowBulkApprove(false)}
        propertyId={propertyId}
      />
    </div>
  );
}
