import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Edit2,
  RefreshCw,
  LayoutGrid,
  History,
  ArrowDownUp,
  Zap,
  X
} from 'lucide-react';
import { useRooms, useRoomActions, useTrashRooms } from '../hooks/useRooms';
import { ActionButton } from '@/shared/components/ui/ActionButton';
import { useFloors } from '@/PropertyScope/hooks/useFloors';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatNumber, parseNumber } from '@/lib/utils';
import type { RoomStatus } from '../types';
import toast from 'react-hot-toast';
import QuickRoomManager from '../components/QuickRoomManager';

import { useDebounce } from '@/shared/hooks/useDebounce';

const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  available: 'Sẵn có',
  occupied: 'Đã thuê',
  maintenance: 'Bảo trì',
  reserved: 'Đã đặt',
  draft: 'Nháp',
};

interface RoomListPageProps {
  hideHeader?: boolean;
}

export default function RoomListPage({ hideHeader = false }: RoomListPageProps) {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  // Helper to parse numbers safely from URL
  const getNumberParam = (key: string) => {
    const val = searchParams.get(key);
    return val ? Number(val) : '';
  };

  // Search state (Kept separate and debounced for real-time responsiveness)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchTerm, 500);

  type RoomFiltersState = {
    floorId: string;
    status: RoomStatus | '';
    priceMin: number | '';
    priceMax: number | '';
    areaMin: number | '';
    areaMax: number | '';
    capacityMin: number | '';
    capacityMax: number | '';
  };

  // Grouped Filter State (Updates immediately for UI responsiveness)
  const [pendingFilters, setPendingFilters] = useState<RoomFiltersState>({
    floorId: searchParams.get('floor_id') || '',
    status: (searchParams.get('status') as RoomStatus) || '',
    priceMin: getNumberParam('price_min'),
    priceMax: getNumberParam('price_max'),
    areaMin: getNumberParam('area_min'),
    areaMax: getNumberParam('area_max'),
    capacityMin: getNumberParam('capacity_min'),
    capacityMax: getNumberParam('capacity_max'),
  });

  // Applied Filter State (Actual filters sent to API)
  const [appliedFilters, setAppliedFilters] = useState<RoomFiltersState>(pendingFilters);

  const [sort, setSort] = useState(searchParams.get('sort') || '-created_at');
  const [showTrashed, setShowTrashed] = useState(searchParams.get('trashed') === 'true');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(
    !!(pendingFilters.priceMin || pendingFilters.priceMax || pendingFilters.areaMin || pendingFilters.areaMax || pendingFilters.capacityMin || pendingFilters.capacityMax)
  );

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (appliedFilters.floorId) params.set('floor_id', appliedFilters.floorId);
    if (appliedFilters.status) params.set('status', appliedFilters.status);
    if (appliedFilters.priceMin) params.set('price_min', appliedFilters.priceMin.toString());
    if (appliedFilters.priceMax) params.set('price_max', appliedFilters.priceMax.toString());
    if (appliedFilters.areaMin) params.set('area_min', appliedFilters.areaMin.toString());
    if (appliedFilters.areaMax) params.set('area_max', appliedFilters.areaMax.toString());
    if (appliedFilters.capacityMin) params.set('capacity_min', appliedFilters.capacityMin.toString());
    if (appliedFilters.capacityMax) params.set('capacity_max', appliedFilters.capacityMax.toString());
    if (sort !== '-created_at') params.set('sort', sort);
    if (page > 1) params.set('page', page.toString());
    if (showTrashed) params.set('trashed', 'true');

    setSearchParams(params, { replace: true });
  }, [debouncedSearch, appliedFilters, sort, page, showTrashed, setSearchParams]);

  const queryParams = {
    property_id: propertyId || undefined,
    floor_id: appliedFilters.floorId || undefined,
    status: (appliedFilters.status as RoomStatus) || undefined,
    search: debouncedSearch || undefined,
    sort: sort || undefined,
    page,
    per_page: 50,
    price_min: (appliedFilters.priceMin as number) || undefined,
    price_max: (appliedFilters.priceMax as number) || undefined,
    area_min: (appliedFilters.areaMin as number) || undefined,
    area_max: (appliedFilters.areaMax as number) || undefined,
    capacity_min: (appliedFilters.capacityMin as number) || undefined,
    capacity_max: (appliedFilters.capacityMax as number) || undefined,
  };

  const { data: regularRooms, isLoading: isRegularLoading } = useRooms(queryParams, { enabled: !showTrashed });
  const { data: trashRooms, isLoading: isTrashLoading } = useTrashRooms(queryParams, { enabled: showTrashed });

  const rooms = showTrashed ? trashRooms : regularRooms;
  const isLoading = showTrashed ? isTrashLoading : isRegularLoading;

  const handleApplyFilters = () => {
    setAppliedFilters(pendingFilters);
    setPage(1); // Reset to first page when applying new filters
  };

  const handleClearFilters = () => {
    const cleared = {
      floorId: '',
      status: '' as RoomStatus | '',
      priceMin: '' as number | '',
      priceMax: '' as number | '',
      areaMin: '' as number | '',
      areaMax: '' as number | '',
      capacityMin: '' as number | '',
      capacityMax: '' as number | '',
    };
    setPendingFilters(cleared);
    setAppliedFilters(cleared);
    setSearchTerm('');
    setSort('-created_at');
    setPage(1);
  };

  const toggleSort = (field: string) => {
    setSort(prev => prev === field ? `-${field}` : field);
  };

  const isFilterChanged = useMemo(() => {
    return JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters);
  }, [pendingFilters, appliedFilters]);

  const { data: floors } = useFloors(propertyId || undefined);

  const { 
    deleteRoom, 
    restoreRoom, 
    forceDeleteRoom,
    batchDeleteRooms, 
    batchRestoreRooms,
    batchForceDeleteRooms
  } = useRoomActions();

  // Optimized Derived Data
  const stats = useMemo(() => {
    if (!rooms) return null;
    return {
      total: rooms.length,
      available: rooms.filter((r: any) => r.status === 'available').length,
      occupied: rooms.filter((r: any) => r.status === 'occupied').length,
      maintenance: rooms.filter((r: any) => r.status === 'maintenance').length,
    };
  }, [rooms]);

  const toggleSelectAll = () => {
    if (!rooms) return;
    if (selectedIds.length === rooms.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rooms.map((r: any) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    
    const occupiedRooms = rooms?.filter((r: any) => selectedIds.includes(r.id) && r.status === 'occupied') || [];
    
    if (occupiedRooms.length > 0) {
      toast.error(`Không thể xóa ${occupiedRooms.length} phòng đang có người thuê. Vui lòng thanh lý hợp đồng trước khi thực hiện.\n\nDanh sách: ${occupiedRooms.map(r => r.name).join(', ')}`, {
        duration: 5000,
      });
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn XÓA TẠM THỜI ${selectedIds.length} phòng đã chọn? Các phòng này sẽ được chuyển vào thùng rác.`)) {
      try {
        await batchDeleteRooms.mutateAsync(selectedIds);
        toast.success(`Đã xóa tạm thời ${selectedIds.length} phòng.`);
        setSelectedIds([]);
      } catch (error) {
        toast.error('Có lỗi xảy ra khi xóa hàng loạt. Vui lòng thử lại sau.');
      }
    }
  };

  const handleBatchRestore = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Khôi phục ${selectedIds.length} phòng đã chọn về danh sách hoạt động?`)) {
      try {
        await batchRestoreRooms.mutateAsync(selectedIds);
        toast.success(`Đã khôi phục ${selectedIds.length} phòng.`);
        setSelectedIds([]);
      } catch (error) {
        toast.error('Có lỗi xảy ra khi khôi phục hàng loạt. Vui lòng thử lại sau.');
      }
    }
  };

  const handleBatchForceDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`⚠️ CẢNH BÁO: XÓA VĨNH VIỄN ${selectedIds.length} phòng đã chọn? \n\nHành động này KHÔNG THỂ hoàn tác và toàn bộ dữ liệu liên quan sẽ bị mất vĩnh viễn.`)) {
      try {
        await batchForceDeleteRooms.mutateAsync(selectedIds);
        toast.success(`Đã xóa vĩnh viễn ${selectedIds.length} phòng.`);
        setSelectedIds([]);
      } catch (error) {
        toast.error('Có lỗi xảy ra khi xóa vĩnh viễn hàng loạt. Vui lòng thử lại sau.');
      }
    }
  };


  const getStatusStyle = (status: RoomStatus) => {
    switch (status) {
      case 'available': return 'bg-green-50 text-green-700 border-green-200';
      case 'occupied': return 'bg-red-50 text-red-700 border-red-200';
      case 'maintenance': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'reserved': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="w-10 h-10 text-blue-900 animate-spin" />
           <p className="text-gray-400 dark:text-gray-500 font-medium animate-pulse text-sm">Đang tải danh sách phòng...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="rooms-page" className="space-y-6 pb-20">
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-none">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Danh sách phòng
              </h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">Quản lý và kiểm kê tất cả tài sản phòng qua các phân khu (tầng).</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsQuickCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-[6px] font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-[13px] outline-none focus:ring-2 focus:ring-blue-900/50"
            >
              <Zap className="w-5 h-5 text-amber-500" />
              Tạo nhanh
            </button>
            <ActionButton 
              onClick={() => navigate(`/properties/${propertyId}/rooms/create`)}
              label="Thêm phòng"
              icon={Plus}
              size="md"
              glow={false}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-lg px-6 py-2.5 font-semibold shadow-sm border-none transition-all active:scale-95"
            />
          </div>
        </div>
      )}

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Tổng cộng</p>
              <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                <LayoutGrid className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{stats.total}</p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase text-emerald-400 tracking-widest">Sẵn có</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">{stats.available}</p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase text-blue-400 tracking-widest">Đã thuê</p>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-900 dark:text-blue-400">
                <Plus className="w-4 h-4 rotate-45" />
              </div>
            </div>
            <p className="text-3xl font-black text-blue-900 dark:text-blue-400">{stats.occupied}</p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase text-amber-400 tracking-widest">Bảo trì</p>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{stats.maintenance}</p>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-[12px] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[300px] flex items-center gap-3 px-4 py-2.5 border border-gray-100 dark:border-gray-800/60 rounded-[8px] bg-gray-50 dark:bg-gray-800/30 group focus-within:bg-white dark:focus-within:bg-gray-900 focus-within:border-blue-100 dark:focus-within:border-blue-500/50 transition-all">
            <Search className="w-4 h-4 text-gray-400 group-focus-within:text-blue-900" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-gray-400 font-medium dark:text-white"
            />
          </div>

          {/* Floor Filter */}
          <select 
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/60 rounded-[8px] text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-blue-100 dark:focus:border-blue-500/50"
            value={pendingFilters.floorId}
            onChange={(e) => setPendingFilters(prev => ({ ...prev, floorId: e.target.value }))}
          >
            <option value="">Tất cả tầng</option>
            {floors?.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select 
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/60 rounded-[8px] text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-blue-100 dark:focus:border-blue-500/50"
            value={pendingFilters.status}
            onChange={(e) => setPendingFilters(prev => ({ ...prev, status: e.target.value as RoomStatus }))}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* Trashed Toggle */}
          <button 
            onClick={() => setShowTrashed(!showTrashed)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-[8px] text-sm font-bold transition-all ${
              showTrashed 
                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/30' 
                : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <History className="w-4 h-4" />
            {showTrashed ? 'Đang hiện thùng rác' : 'Hiện thùng rác'}
          </button>

          {/* Advanced Filter Toggle */}
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-[8px] text-sm font-bold transition-all ${
              showAdvancedFilters 
                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-900 dark:text-blue-400 border-blue-100 dark:border-blue-500/30' 
                : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <ArrowDownUp className="w-4 h-4" />
            Lọc nâng cao
          </button>

          {/* Apply/Clear Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button 
              onClick={handleClearFilters}
              className="px-4 py-2.5 text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 text-sm font-black uppercase tracking-widest transition-colors flex items-center gap-2"
              title="Xóa tất cả bộ lọc"
            >
              <Trash2 className="w-4 h-4" />
              Xóa lọc
            </button>
            <button 
              onClick={handleApplyFilters}
              disabled={!isFilterChanged}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-[8px] text-sm font-black uppercase tracking-widest transition-all ${
                isFilterChanged 
                  ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-100 dark:shadow-none active:scale-95' 
                  : 'bg-gray-100 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${isFilterChanged ? 'group-hover:rotate-180' : ''}`} />
              Áp dụng
            </button>
          </div>
        </div>

        {/* Advanced Filter Row */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-50 dark:border-gray-800/60">
                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">Khoảng giá (VNĐ)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Tối thiểu"
                      value={formatNumber(pendingFilters.priceMin)}
                      onChange={(e) => {
                        const val = parseNumber(e.target.value);
                        setPendingFilters(prev => ({ ...prev, priceMin: val === '' ? '' : Number(val) }));
                      }}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-[6px] text-xs font-bold focus:bg-white dark:focus:bg-gray-900 focus:border-blue-100 dark:focus:border-blue-500/50 outline-none dark:text-white"
                    />
                    <span className="text-gray-300 dark:text-gray-600">-</span>
                    <input 
                      type="text" 
                      placeholder="Tối đa"
                      value={formatNumber(pendingFilters.priceMax)}
                      onChange={(e) => {
                        const val = parseNumber(e.target.value);
                        setPendingFilters(prev => ({ ...prev, priceMax: val === '' ? '' : Number(val) }));
                      }}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-[6px] text-xs font-bold focus:bg-white dark:focus:bg-gray-900 focus:border-blue-100 dark:focus:border-blue-500/50 outline-none dark:text-white"
                    />
                  </div>
                </div>

                {/* Area Range */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">Diện tích (m²)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Tối thiểu"
                      value={formatNumber(pendingFilters.areaMin)}
                      onChange={(e) => {
                        const val = parseNumber(e.target.value);
                        setPendingFilters(prev => ({ ...prev, areaMin: val === '' ? '' : Number(val) }));
                      }}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-[6px] text-xs font-bold focus:bg-white dark:focus:bg-gray-900 focus:border-blue-100 dark:focus:border-blue-500/50 outline-none dark:text-white"
                    />
                    <span className="text-gray-300 dark:text-gray-600">-</span>
                    <input 
                      type="text" 
                      placeholder="Tối đa"
                      value={formatNumber(pendingFilters.areaMax)}
                      onChange={(e) => {
                        const val = parseNumber(e.target.value);
                        setPendingFilters(prev => ({ ...prev, areaMax: val === '' ? '' : Number(val) }));
                      }}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-[6px] text-xs font-bold focus:bg-white dark:focus:bg-gray-900 focus:border-blue-100 dark:focus:border-blue-500/50 outline-none dark:text-white"
                    />
                  </div>
                </div>

                {/* Capacity Range */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">Số người ở</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Tối thiểu"
                      value={formatNumber(pendingFilters.capacityMin)}
                      onChange={(e) => {
                        const val = parseNumber(e.target.value);
                        setPendingFilters(prev => ({ ...prev, capacityMin: val === '' ? '' : Number(val) }));
                      }}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-[6px] text-xs font-bold focus:bg-white dark:focus:bg-gray-900 focus:border-blue-100 dark:focus:border-blue-500/50 outline-none dark:text-white"
                    />
                    <span className="text-gray-300 dark:text-gray-600">-</span>
                    <input 
                      type="text" 
                      placeholder="Tối đa"
                      value={formatNumber(pendingFilters.capacityMax)}
                      onChange={(e) => {
                        const val = parseNumber(e.target.value);
                        setPendingFilters(prev => ({ ...prev, capacityMax: val === '' ? '' : Number(val) }));
                      }}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-[6px] text-xs font-bold focus:bg-white dark:focus:bg-gray-900 focus:border-blue-100 dark:focus:border-blue-500/50 outline-none dark:text-white"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <button 
                  onClick={handleClearFilters}
                  className="text-xs font-black uppercase text-rose-500 hover:text-rose-600 transition-colors tracking-widest flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Xóa tất cả bộ lọc
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Batch Actions */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-[8px]">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-300 ml-2">
                  Đã chọn {selectedIds.length} phòng
                </p>
                <div className="flex items-center gap-2">
                  {showTrashed ? (
                    <>
                      <button 
                        onClick={handleBatchRestore}
                        className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 text-white rounded-[6px] text-xs font-bold hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Khôi phục đã chọn
                      </button>
                      <button 
                        onClick={handleBatchForceDelete}
                        className="flex items-center gap-2 px-4 py-1.5 bg-rose-500 text-white rounded-[6px] text-xs font-bold hover:bg-rose-600 transition-all shadow-md active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa vĩnh viễn đã chọn
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={handleBatchDelete}
                      className="flex items-center gap-2 px-4 py-1.5 bg-rose-500 text-white rounded-[6px] text-xs font-bold hover:bg-rose-600 transition-all shadow-md active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa đã chọn
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedIds([])}
                    className="px-4 py-1.5 text-blue-900 font-bold text-xs hover:underline"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[12px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800/60">
                <th className="p-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={rooms && rooms.length > 0 && selectedIds.length === rooms.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900/50 text-blue-900 focus:ring-blue-500"
                  />
                </th>
                <th 
                  className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest cursor-pointer hover:text-blue-900 transition-colors"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Tên phòng
                    {sort.includes('name') && (
                      <ArrowDownUp className={`w-3 h-3 ${sort.startsWith('-') ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest">Tầng</th>
                <th 
                  className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest cursor-pointer hover:text-blue-900 transition-colors"
                  onClick={() => toggleSort('base_price')}
                >
                  <div className="flex items-center gap-1">
                    Giá
                    {sort.includes('base_price') && (
                      <ArrowDownUp className={`w-3 h-3 ${sort.startsWith('-') ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th 
                  className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest cursor-pointer hover:text-blue-900 transition-colors"
                  onClick={() => toggleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Trạng thái
                    {sort.includes('status') && (
                      <ArrowDownUp className={`w-3 h-3 ${sort.startsWith('-') ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {rooms?.map((room: any) => (
                <motion.tr 
                  layout
                  key={room.id} 
                  className={`group hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors ${selectedIds.includes(room.id) ? 'bg-blue-50/30 dark:bg-blue-500/10' : ''}`}
                >
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(room.id)}
                      onChange={() => toggleSelect(room.id)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900/50 text-blue-900 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col cursor-pointer group/row" onClick={() => navigate(`/properties/${propertyId}/rooms/${room.id}`)}>
                      <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">
                        {room.name}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{formatNumber(room.area)} m² • {formatNumber(room.capacity)} chỗ</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 font-bold">
                       <LayoutGrid className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                       {room.floor_name || room.floor?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                       <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                         {formatCurrency(room.base_price)}
                       </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusStyle(room.status)}`}>
                       {ROOM_STATUS_LABELS[room.status as RoomStatus] || room.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1  group-hover:opacity-100 transition-all transform group-hover:translate-x-0">
                      {room.deleted_at ? (
                        <>
                          <button 
                            onClick={() => restoreRoom.mutate(room.id)}
                            className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Khôi phục phòng"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`⚠️ XÓA VĨNH VIỄN ${room.name}? Hành động này KHÔNG THỂ hoàn tác.`)) {
                                forceDeleteRoom.mutate(room.id);
                              }
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Xóa vĩnh viễn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => navigate(`/properties/${propertyId}/rooms/${room.id}/edit`)}
                            className="p-2 text-gray-400 hover:text-blue-900 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all shadow-hover"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => { 
                              if (room.status === 'occupied') {
                                toast.error(`Không thể xóa phòng ${room.name} đang có người thuê. Vui lòng thanh lý hợp đồng trước khi xóa.`);
                                return;
                              }
                              if (confirm(`Bạn có chắc chắn muốn xóa ${room.name}?`)) {
                                await deleteRoom.mutateAsync(room.id); 
                                toast.success(`Đã xóa phòng ${room.name}.`);
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all shadow-hover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button className="p-2 text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {rooms?.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center">
                          <LayoutGrid className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                       </div>
                       <div>
                           <p className="text-lg font-bold text-gray-600 dark:text-gray-300">Không tìm thấy phòng nào</p>
                           <p className="text-sm text-gray-400 dark:text-gray-500">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                       </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Improved Pagination */}
        <div className="p-6 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center text-xs font-black text-gray-700 dark:text-gray-300">
                    {rooms?.length || 0}
                 </div>
                 <span className="text-xs font-black uppercase text-gray-400 tracking-widest text-nowrap">Tổng kết quả</span>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <button 
                className="p-2 text-gray-400 hover:text-blue-900 disabled:opacity-30 transition-colors" 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
              >
                 <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                 <span className="text-sm font-black text-gray-900 dark:text-white px-4 py-2 bg-white dark:bg-gray-900 rounded-[6px] border border-gray-200 dark:border-gray-800 shadow-sm min-w-12 text-center">
                    {page}
                 </span>
              </div>
              <button 
                className="p-2 text-gray-400 hover:text-blue-900 transition-colors" 
                onClick={() => setPage(p => p + 1)}
              >
                 <ChevronRight className="w-5 h-5" />
              </button>
           </div>
        </div>
      </div>
      {/* Quick Room Manager Modal */}
      {isQuickCreateOpen && propertyId && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm" onClick={() => setIsQuickCreateOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-[16px] shadow-2xl w-full max-w-lg p-8 space-y-6 overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Thêm nhanh phòng</h3>
                <p className="text-xs text-gray-500 font-medium">Khởi tạo nhanh danh sách phòng dự thảo cho dự án</p>
              </div>
              <button onClick={() => setIsQuickCreateOpen(false)} className="p-2 rounded-[8px] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <QuickRoomManager 
              propertyId={propertyId} 
              floorId={appliedFilters.floorId === 'all' ? '' : appliedFilters.floorId} 
              onSuccess={() => setIsQuickCreateOpen(false)}
              onCancel={() => setIsQuickCreateOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
