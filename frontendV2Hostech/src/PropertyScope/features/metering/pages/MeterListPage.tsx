import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useMeters, useMeterActions, type Meter } from '../hooks/useMeters';
import { useScopeStore } from '@/shared/stores/useScopeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/shared/hooks/useDebounce';
// @ts-expect-error - Module resolution issue with auto-created component
import MeterFormModal from '../components/MeterFormModal';

const METER_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  ELECTRIC: {
    label: 'Điện',
    icon: <Zap className="w-4 h-4" />,
    color: 'bg-yellow-50 text-yellow-700',
  },
  WATER: {
    label: 'Nước',
    icon: <Droplet className="w-4 h-4" />,
    color: 'bg-blue-50 text-blue-700',
  },
};

export default function MeterListPage() {
  const navigate = useNavigate();
  const { propertyId } = useScopeStore();

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

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch statistics
  useEffect(() => {
    if (!propertyId) return;

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const response = await fetch(
          `/api/properties/${propertyId}/meters/statistics`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [propertyId]);

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
  const { meters, isLoading } = useMeters(propertyId, {
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

  // Calculate pagination info
  const totalItems = Array.isArray(meters) && meters.length > 0 ? meters.length : 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

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
        <p className="text-slate-500">Vui lòng chọn tòa nhà</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý Đồng hồ</h1>
          <p className="text-slate-500 mt-2 font-medium">Theo dõi và quản lý đồng hồ điện, nước của tòa nhà</p>
        </div>
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500 font-medium">Tổng số</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total_meters}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500 font-medium">Đang hoạt động</p>
            <p className="text-2xl font-black text-green-600 mt-1">{stats.active_meters}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500 font-medium">Master</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{stats.master_meters}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500 font-medium">Đồng hồ Điện</p>
            <p className="text-2xl font-black text-yellow-600 mt-1">{stats.electric_meters}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500 font-medium">Đồng hồ Nước</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{stats.water_meters}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500 font-medium">Tổng Tiêu thụ</p>
            <div className="mt-1 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-yellow-600 font-semibold">⚡ {stats.total_electric_reading?.toLocaleString('vi-VN') || '0'} kWh</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-600 font-semibold">💧 {stats.total_water_reading?.toLocaleString('vi-VN') || '0'} m³</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm mã đồng hồ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Meters Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-slate-500">Đang tải...</p>
            </div>
          </div>
        ) : sortedMeters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Chưa có đồng hồ nào</p>
            <p className="text-slate-400 text-sm mt-1">Hãy thêm đồng hồ đầu tiên để bắt đầu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 w-12">STT</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Mã đồng hồ</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Loại</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Master</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phòng</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Tổng</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <AnimatePresence>
                  {sortedMeters.map((meter, index) => (
                    <motion.tr
                      key={meter.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* STT */}
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">
                        {(page - 1) * itemsPerPage + index + 1}
                      </td>

                      {/* Code */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{meter.code}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{meter.id}</p>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm ${
                            METER_TYPE_LABELS[meter.type]?.color || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {METER_TYPE_LABELS[meter.type]?.icon}
                          {METER_TYPE_LABELS[meter.type]?.label || meter.type}
                        </div>
                      </td>

                      {/* Master */}
                      <td className="px-6 py-4">
                        {meter.is_master ? (
                          <div className="flex items-center gap-1 text-purple-600">
                            <Crown className="w-4 h-4" />
                            <span className="text-xs font-semibold">Có</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Không</span>
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
                          <div>
                            <p className="font-medium text-slate-900">{meter.room.code}</p>
                            <p className="text-xs text-slate-500">{meter.room.name}</p>
                          </div>
                        ) : (
                          <p className="text-slate-400 text-sm">-</p>
                        )}
                      </td>

                      {/* Total (Base Reading) */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {meter.base_reading ? (
                            <p className="font-semibold text-slate-900">{meter.base_reading.toLocaleString('vi-VN')}</p>
                          ) : (
                            <p className="text-slate-400">-</p>
                          )}
                          <p className="text-xs text-slate-500 mt-0.5">{meter.type === 'ELECTRIC' ? 'kWh' : 'm³'}</p>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/properties/${propertyId}/meters/${meter.id}`)}
                            className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(meter)}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <div className="relative group">
                            <button
                              onClick={() => setShowDeleteConfirm(meter.id)}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Delete Confirmation */}
                            {showDeleteConfirm === meter.id && (
                              <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50 min-w-max">
                                <p className="text-sm font-semibold text-slate-900 mb-3">Xóa đồng hồ này?</p>
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
                                    className="px-3 py-1.5 bg-slate-200 text-slate-900 text-sm font-semibold rounded-lg hover:bg-slate-300 transition-colors"
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
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-sm text-slate-600">
            Trang <span className="font-semibold text-slate-900">{page}</span> / <span className="font-semibold text-slate-900">{totalPages}</span> 
            <span className="ml-4">Tổng: <span className="font-semibold text-slate-900">{totalItems}</span> mục</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || isLoading}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    </div>
  );
}
