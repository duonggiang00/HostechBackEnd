import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search,
  Loader2,
  Eye,
  Zap,
  Droplet,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ClipboardList,
} from 'lucide-react';
import { useMeters, usePendingReadingsCount, type Meter } from '../hooks/useMeters';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useMemo } from 'react';

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
  const itemsPerPage = 20; // Tăng số lượng để group được nhiều phòng hơn

  // Lấy danh sách Meters trực tiếp (thay vì Rooms)
  const { meters, pagination, isLoading } = useMeters(propertyId, {
    search: debouncedSearch,
    page,
    perPage: itemsPerPage,
  });

  // Group meters by Room for the UI
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
      <div className="flex items-center justify-between pt-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Quản lý Đồng hồ</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Theo dõi chỉ số theo từng phòng trong tòa nhà</p>
        </div>
        <div className="flex items-center gap-3">
          {isManager && pendingCount > 0 && (
            <button
              onClick={() => setShowBulkApprove(true)}
              className="relative inline-flex items-center gap-2 px-5 py-3 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-xl font-semibold hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all shadow-sm active:scale-95"
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
          >
            <Zap className="w-5 h-5 text-yellow-500" />
            Chốt số nhanh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm mã phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
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
            <table className="w-full text-left">
              <thead className="bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/40 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 w-12 text-center">STT</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 w-48">Tên phòng</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Đồng hồ điện</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Số điện dùng</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Đồng hồ nước</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Số nước dùng</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Hành động</th>
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
                        <td className="px-6 py-4 text-center bg-slate-50 dark:bg-slate-800/30">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-400">
                            {(page - 1) * itemsPerPage + index + 1}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 dark:text-white">{room.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{room.code}</p>
                        </td>

                        {/* Điện */}
                        <td className="px-6 py-4 border-l border-slate-100 dark:border-slate-700/50">
                          {electricMeter ? (
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {electricMeter.is_active ? (
                                  <Zap className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                )}
                                <span className="font-medium text-slate-800 dark:text-slate-200">{electricMeter.code}</span>
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400 flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 focus:outline-hidden">
                                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${!electricMeter.last_read_at ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                                    {!electricMeter.last_read_at ? 'Khởi tạo' : 'Hiện tại'}
                                  </span>
                                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {electricMeter.latest_reading.toLocaleString('vi-VN')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                         <td className="px-6 py-4">
                          {electricMeter?.last_read_at ? (
                            <div className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {(electricMeter.consumption || 0).toLocaleString('vi-VN')}
                              <span className="text-xs font-normal text-indigo-400/70 ml-1">kWh</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm italic font-light">Chưa có bản chốt</span>
                          )}
                        </td>

                        {/* Nước */}
                        <td className="px-6 py-4 border-l border-slate-100 dark:border-slate-700/50">
                          {waterMeter ? (
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {waterMeter.is_active ? (
                                  <Droplet className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                )}
                                <span className="font-medium text-slate-800 dark:text-slate-200">{waterMeter.code}</span>
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400 flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 focus:outline-hidden">
                                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${!waterMeter.last_read_at ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                                    {!waterMeter.last_read_at ? 'Khởi tạo' : 'Hiện tại'}
                                  </span>
                                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {waterMeter.latest_reading.toLocaleString('vi-VN')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                         <td className="px-6 py-4">
                          {waterMeter?.last_read_at ? (
                            <div className="font-semibold text-teal-600 dark:text-teal-400">
                              {(waterMeter.consumption || 0).toLocaleString('vi-VN')}
                              <span className="text-xs font-normal text-teal-400/70 ml-1">m³</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm italic font-light">Chưa có bản chốt</span>
                          )}
                        </td>

                        <td className="px-6 py-4 border-l border-slate-100 dark:border-slate-700/50">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => navigate(`/properties/${propertyId}/meters/room/${room.id}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors font-medium text-sm w-full md:w-auto justify-center"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                              Chi tiết
                            </button>
                          </div>
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
        <div className="flex items-center justify-between bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Trang <span className="font-semibold text-slate-900 dark:text-white">{page}</span> / <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span> 
            <span className="ml-4">Tổng: <span className="font-semibold text-slate-900 dark:text-white">{totalItems}</span> phòng</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || isLoading}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {showBulkApprove && (
        <BulkApproveReadingsModal
          propertyId={propertyId}
          isOpen={showBulkApprove}
          onClose={() => setShowBulkApprove(false)}
        />
      )}
    </div>
  );
}
