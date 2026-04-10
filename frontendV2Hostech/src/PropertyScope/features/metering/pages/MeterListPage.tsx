import { useState, useMemo } from 'react';
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
  Plus,
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

      {/* Stats Cards - Derived from meter list with tuanlc style */}
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

      {/* Filters with tuanlc style */}
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
          <button
            onClick={handleClearFilters}
<<<<<<< HEAD
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 whitespace-nowrap"
||||||| 4c04b2bb
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
=======
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-[8px] text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
>>>>>>> origin/tuanlc
          >
            <RotateCcw className="w-4 h-4" />
            Xóa bộ lọc
          </button>
        </div>
      </div>

<<<<<<< HEAD
      {/* Table */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
||||||| 4c04b2bb
      {/* Meters Table */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
=======
      {/* Meters Table */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[12px] shadow-sm overflow-hidden">
>>>>>>> origin/tuanlc
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
<<<<<<< HEAD
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-slate-500">Đang tải danh sách phòng...</p>
||||||| 4c04b2bb
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-slate-500">Đang tải...</p>
=======
              <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin mx-auto mb-3" />
              <p className="text-slate-500">Đang tải...</p>
>>>>>>> origin/tuanlc
            </div>
          </div>
        ) : roomData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Không tìm thấy dữ liệu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
<<<<<<< HEAD
            <table className="w-full text-left">
              <thead className="bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/40 border-b border-slate-200 dark:border-slate-700">
||||||| 4c04b2bb
            <table className="w-full">
              <thead className="bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/40 border-b border-slate-200 dark:border-slate-700">
=======
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
>>>>>>> origin/tuanlc
                <tr>
<<<<<<< HEAD
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 w-12 text-center">STT</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 w-48">Tên phòng</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Đồng hồ điện</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Số điện dùng</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Đồng hồ nước</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Số nước dùng</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Hành động</th>
||||||| 4c04b2bb
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 w-12">STT</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Mã đồng hồ</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Loại</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Master</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Mã phòng</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Chỉ số hiện tại</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Hành động</th>
=======
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300 w-12">STT</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300">Mã đồng hồ</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300">Loại</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300">Master</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300">Trạng thái</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300">Phòng</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300">Chỉ số hiện tại</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900 dark:text-slate-300">Hành động</th>
>>>>>>> origin/tuanlc
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

<<<<<<< HEAD
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
||||||| 4c04b2bb
                      {/* Code */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{meter.code}</p>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm ${
                            METER_TYPE_LABELS[meter.type]?.color || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {METER_TYPE_LABELS[meter.type]?.icon}
                          {METER_TYPE_LABELS[meter.type]?.label || meter.type}
                        </div>
                      </td>

                      {/* Master */}
                      <td className="px-6 py-4">
                        {meter.is_master ? (
                          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                            <Crown className="w-4 h-4" />
                            <span className="text-xs font-semibold">Có</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">Không</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(meter)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all hover:opacity-80 disabled:opacity-50"
                          title={meter.is_active ? 'Nhấp để vô hiệu hóa' : 'Nhấp để kích hoạt'}
                        >
                          {meter.is_active ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-green-700">Hoạt động</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              <span className="text-red-700">Vô hiệu</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Room */}
                      <td className="px-6 py-4">
                        {meter.room ? (
                          <p className="font-medium text-slate-900 dark:text-slate-200">{meter.room.code}</p>
                        ) : (
                          <p className="text-slate-400 dark:text-slate-500 text-sm">-</p>
                        )}
                      </td>

                      {/* Current Reading */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {(meter.last_reading !== undefined && meter.last_reading !== null) || (meter.base_reading !== undefined && meter.base_reading !== null) ? (
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {(meter.last_reading ?? meter.base_reading ?? 0).toLocaleString('vi-VN')}
                            </p>
                          ) : (
                            <p className="text-slate-400 dark:text-slate-500">-</p>
                          )}
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{meter.type === 'ELECTRIC' ? 'kWh' : 'm³'}</p>
                          {meter.last_reading_date && (
                            <p className="text-xs text-slate-400 mt-1" title="Ngày chốt gần nhất">
                              {new Date(meter.last_reading_date).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/properties/${propertyId}/meters/${meter.id}`)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(meter)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <div className="relative group">
                            <button
                              onClick={() => setShowDeleteConfirm(meter.id)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Delete Confirmation */}
                            {showDeleteConfirm === meter.id && (
                              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 z-50 min-w-max">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Xóa đồng hồ này?</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleDelete(meter.id)}
                                    disabled={isDeleting}
                                    className="px-3 py-1.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                  >
                                    {isDeleting ? 'Đang xóa...' : 'Xóa'}
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                  >
                                    Hủy
                                  </button>
=======
                      {/* Code */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{meter.code}</p>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm ${
                            METER_TYPE_LABELS[meter.type]?.color || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {METER_TYPE_LABELS[meter.type]?.icon}
                          {METER_TYPE_LABELS[meter.type]?.label || meter.type}
                        </div>
                      </td>

                      {/* Master */}
                      <td className="px-6 py-4">
                        {meter.is_master ? (
                          <div className="flex items-center gap-1 text-[#F59E0B] dark:text-[#F59E0B]">
                            <Crown className="w-4 h-4" />
                            <span className="text-xs font-semibold">Có</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">Không</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(meter)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all hover:opacity-80 disabled:opacity-50"
                          title={meter.is_active ? 'Nhấp để vô hiệu hóa' : 'Nhấp để kích hoạt'}
                        >
                          {meter.is_active ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-green-700">Hoạt động</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              <span className="text-red-700">Vô hiệu</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Room */}
                      <td className="px-6 py-4">
                        {meter.room ? (
                          <p className="font-medium text-slate-900 dark:text-slate-200">{meter.room.code}</p>
                        ) : (
                          <p className="text-slate-400 dark:text-slate-500 text-sm">-</p>
                        )}
                      </td>

                      {/* Current Reading */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {(meter.last_reading !== undefined && meter.last_reading !== null) || (meter.base_reading !== undefined && meter.base_reading !== null) ? (
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {(meter.last_reading ?? meter.base_reading ?? 0).toLocaleString('vi-VN')}
                            </p>
                          ) : (
                            <p className="text-slate-400 dark:text-slate-500">-</p>
                          )}
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{meter.type === 'ELECTRIC' ? 'kWh' : 'm³'}</p>
                          {meter.last_reading_date && (
                            <p className="text-xs text-slate-400 mt-1" title="Ngày chốt gần nhất">
                              {new Date(meter.last_reading_date).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/properties/${propertyId}/meters/${meter.id}`)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(meter)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <div className="relative group">
                            <button
                              onClick={() => setShowDeleteConfirm(meter.id)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Delete Confirmation */}
                            {showDeleteConfirm === meter.id && (
                              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 z-50 min-w-max">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Xóa đồng hồ này?</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleDelete(meter.id)}
                                    disabled={isDeleting}
                                    className="px-3 py-1.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
<div className="relative group w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#1E3A8A] transition-colors" />
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

      {/* Meters Table */}
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
                              <span className="font-bold text-teal-600 dark:text-teal-400">
                                {(waterMeter.consumption || 0).toLocaleString('vi-VN')}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase font-medium">m³</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Chưa chốt</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <button
                              onClick={() => navigate(`/properties/${propertyId}/meters/room/${room.id}`)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/10 text-[#1E3A8A] dark:text-blue-400 hover:bg-[#1E3A8A]/10 dark:hover:bg-[#1E3A8A]/20 rounded-[8px] transition-all font-semibold text-sm active:scale-95"
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
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[12px] p-4 shadow-sm">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Hiển thị <span className="font-semibold text-slate-900 dark:text-white">{Math.min(totalItems, (page - 1) * itemsPerPage + 1)}-{Math.min(totalItems, page * itemsPerPage)}</span> trong tổng số <span className="font-semibold text-slate-900 dark:text-white">{totalItems}</span> phòng
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-[8px] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1 px-2">
              <span className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/10 px-3 py-1 rounded-[6px]">
                {page}
              </span>
              <span className="text-sm text-slate-400">/</span>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {totalPages}
              </span>
            </div>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || isLoading}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-[8px] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
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
