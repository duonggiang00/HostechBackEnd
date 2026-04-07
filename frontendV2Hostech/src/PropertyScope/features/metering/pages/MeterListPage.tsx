import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Loader2,
  Trash2,
  Edit2,
  Eye,
  Zap,
  Droplet,
  Crown,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  ClipboardList,
} from 'lucide-react';
import { useMeters, useMeterActions, usePropertyReadings, type Meter } from '../hooks/useMeters';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import MeterFormModal from '../components/MeterFormModal';

import { BulkApproveReadingsModal } from '../components/BulkApproveReadingsModal';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

const METER_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  ELECTRIC: {
    label: 'Điện',
    icon: <Zap className="w-4 h-4" />,
    color: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  },
  WATER: {
    label: 'Nước',
    icon: <Droplet className="w-4 h-4" />,
    color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
};

export default function MeterListPage() {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
  const hasRole = useAuthStore((state) => state.hasRole);
  const isManager = hasRole(['Manager', 'Owner']);

  // Search state (Kept separate and debounced for real-time responsiveness)
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Pending filters (Updates immediately for UI responsiveness)
  const [pendingFilters, setPendingFilters] = useState({
    type: '' as 'ELECTRIC' | 'WATER' | '',
    is_active: '' as boolean | '',
  });

  // Applied filters (Actual filters sent to API)
  const [appliedFilters, setAppliedFilters] = useState(pendingFilters);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBulkApprove, setShowBulkApprove] = useState(false);

  // Pending readings badge
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd   = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  const { data: pendingReadingsData } = usePropertyReadings(propertyId, {
    status: 'SUBMITTED',
    period_start: monthStart,
    period_end: monthEnd,
  });
  const pendingCount = pendingReadingsData?.meta?.total ?? pendingReadingsData?.data?.length ?? 0;

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate if filters have changed
  const isFilterChanged = useMemo(() => {
    return JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters);
  }, [pendingFilters, appliedFilters]);

  // Build filter object from applied filters
  const filterObject = useMemo(() => {
    const filters: Record<string, any> = {};
    if (appliedFilters.type) filters.type = appliedFilters.type;
    if (appliedFilters.is_active !== '') filters.is_active = appliedFilters.is_active;
    return filters;
  }, [appliedFilters]);

  // Fetch meters with applied filters (React Query handles caching automatically)
  const { meters, pagination, isLoading } = useMeters(propertyId, {
    filters: filterObject,
    search: debouncedSearch,
    page,
    perPage: itemsPerPage,
  });

  const { deleteMeter, isDeleting, updateMeter, isUpdating } = useMeterActions(propertyId);

  // Sort meters: is_master true first, then by created_at
  const sortedMeters = useMemo(() => {
    if (!meters || meters.length === 0) return [];
    return [...meters].sort((a, b) => {
      if (a.is_master && !b.is_master) return -1;
      if (!a.is_master && b.is_master) return 1;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [meters]);

  // Use pagination data from API
  const totalItems = pagination?.total || 0;
  const totalPages = pagination?.last_page || 1;

  // Handlers
  const handleApplyFilters = () => {
    setAppliedFilters(pendingFilters);
    setPage(1); // Reset to first page when applying new filters
  };

  const handleClearFilters = () => {
    const cleared = {
      type: '' as 'ELECTRIC' | 'WATER' | '',
      is_active: '' as boolean | '',
    };
    setPendingFilters(cleared);
    setAppliedFilters(cleared);
    setSearchTerm('');
    setPage(1);
  };

  const handleEdit = (meter: Meter) => {
    setEditingMeter(meter);
    setShowFormModal(true);
  };

  const handleDelete = (meterId: string) => {
    deleteMeter(meterId);
    setTimeout(() => setShowDeleteConfirm(null), 500);
  };

  const handleToggleActive = (meter: Meter) => {
    updateMeter({
      meterId: meter.id,
      data: { is_active: !meter.is_active },
    });
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingMeter(null);
  };

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
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Theo dõi và quản lý đồng hồ điện, nước của tòa nhà</p>
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
          <button
            onClick={() => {
              setEditingMeter(null);
              setShowFormModal(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Thêm đồng hồ
          </button>
        </div>
      </div>

      {/* Stats Cards - derived from meter list */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Tổng số</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{pagination?.total ?? meters.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Đang hoạt động</p>
          <p className="text-2xl font-black text-green-600 dark:text-green-400 mt-1">{meters.filter((m: any) => m.is_active !== false).length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Đồng hồ Điện</p>
          <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400 mt-1">{meters.filter((m: any) => m.type === 'ELECTRIC').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Đồng hồ Nước</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{meters.filter((m: any) => m.type === 'WATER').length}</p>
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
              placeholder="Tìm kiếm mã đồng hồ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={pendingFilters.type}
            onChange={(e) =>
              setPendingFilters({
                ...pendingFilters,
                type: (e.target.value as 'ELECTRIC' | 'WATER' | '') || '',
              })
            }
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
          >
            <option value="">Loại - Tất cả</option>
            <option value="ELECTRIC">Điện</option>
            <option value="WATER">Nước</option>
          </select>

          {/* Active Filter */}
          <select
            value={
              pendingFilters.is_active === ''
                ? ''
                : pendingFilters.is_active
                ? 'true'
                : 'false'
            }
            onChange={(e) => {
              setPendingFilters({
                ...pendingFilters,
                is_active:
                  e.target.value === ''
                    ? ''
                    : e.target.value === 'true',
              });
            }}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
          >
            <option value="">Trạng thái - Tất cả</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Không hoạt động</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleApplyFilters}
            disabled={!isFilterChanged}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <Filter className="w-4 h-4" />
            Áp dụng
          </button>
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Meters Table */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-slate-500">Đang tải...</p>
            </div>
          </div>
        ) : sortedMeters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Chưa có đồng hồ nào</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Hãy thêm đồng hồ đầu tiên để bắt đầu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/40 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 w-12">STT</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Mã đồng hồ</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Loại</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Master</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Mã phòng</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Chỉ số hiện tại</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                <AnimatePresence>
                  {sortedMeters.map((meter, index) => (
                    <motion.tr
                      key={meter.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      {/* STT */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-8 text-center">
                            {(page - 1) * itemsPerPage + index + 1}
                          </span>
                          <span className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[160px]" title={meter.room?.name || 'Không có phòng'}>
                            {meter.room?.name || 'Không có phòng'}
                          </span>
                        </div>
                      </td>

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
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
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
            <span className="ml-4">Tổng: <span className="font-semibold text-slate-900 dark:text-white">{totalItems}</span> mục</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Trang trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  disabled={isLoading}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                    page === p
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || isLoading}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Trang sau"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      {showFormModal && (
        <MeterFormModal
          meter={editingMeter}
          onClose={handleCloseFormModal}
          propertyId={propertyId}
        />
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
