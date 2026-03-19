import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Layers,
  LayoutGrid,
  History,
  ArrowDownUp,
} from 'lucide-react';
import { useRooms, useRoomActions } from '../hooks/useRooms';
import { useFloors } from '../../floors/hooks/useFloors';
import { useScopeStore } from '@/shared/stores/useScopeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatNumber, parseNumber } from '@/lib/utils';
import type { RoomStatus } from '../types';
import toast from 'react-hot-toast';

import { useDebounce } from '@/shared/hooks/useDebounce';

const ROOM_TYPES = ['standard', 'studio', 'duplex', 'penthouse'] as const;

const ROOM_TYPE_LABELS: Record<string, string> = {
  standard: 'Tiêu chuẩn',
  studio: 'Phòng Studio',
  duplex: 'Phòng Duplex',
  penthouse: 'Penthouse',
};

const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  available: 'Sẵn có',
  occupied: 'Đã thuê',
  maintenance: 'Bảo trì',
  reserved: 'Đã đặt',
  draft: 'Nháp',
};

export default function RoomListPage() {
  const { propertyId } = useScopeStore();
  const navigate = useNavigate();
  // Search state (Kept separate and debounced for real-time responsiveness)
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Grouped Filter State (Updates immediately for UI responsiveness)
  const [pendingFilters, setPendingFilters] = useState({
    floorId: '',
    status: '' as RoomStatus | '',
    type: '',
    priceMin: '' as number | '',
    priceMax: '' as number | '',
    areaMin: '' as number | '',
    areaMax: '' as number | '',
    capacityMin: '' as number | '',
    capacityMax: '' as number | '',
  });

  // Applied Filter State (Actual filters sent to API)
  const [appliedFilters, setAppliedFilters] = useState(pendingFilters);

  const sort = '-created_at';
  const [showTrashed, setShowTrashed] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { data: rooms, isLoading } = useRooms({
    property_id: propertyId || undefined,
    floor_id: appliedFilters.floorId || undefined,
    status: appliedFilters.status || undefined,
    type: appliedFilters.type || undefined,
    search: debouncedSearch || undefined,
    sort: sort || undefined,
    with_trashed: showTrashed,
    page,
    per_page: 50,
    price_min: appliedFilters.priceMin || undefined,
    price_max: appliedFilters.priceMax || undefined,
    area_min: appliedFilters.areaMin || undefined,
    area_max: appliedFilters.areaMax || undefined,
    capacity_min: (appliedFilters.capacityMin as number) || undefined,
    capacity_max: (appliedFilters.capacityMax as number) || undefined,
  });

  const handleApplyFilters = () => {
    setAppliedFilters(pendingFilters);
    setPage(1); // Reset to first page when applying new filters
  };

  const handleClearFilters = () => {
    const cleared = {
      floorId: '',
      status: '' as RoomStatus | '',
      type: '',
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
    setPage(1);
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
      available: rooms.filter(r => r.status === 'available').length,
      occupied: rooms.filter(r => r.status === 'occupied').length,
      maintenance: rooms.filter(r => r.status === 'maintenance').length,
    };
  }, [rooms]);

  const toggleSelectAll = () => {
    if (!rooms) return;
    if (selectedIds.length === rooms.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rooms.map(r => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    
    const occupiedRooms = rooms?.filter(r => selectedIds.includes(r.id) && r.status === 'occupied') || [];
    
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
      case 'available': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'occupied': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'maintenance': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'reserved': return 'bg-purple-50 text-purple-600 border-purple-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
           <p className="text-slate-400 font-medium animate-pulse text-sm">Đang tải danh sách phòng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Danh mục phòng</h1>
          <p className="text-slate-500 mt-1 font-medium">Quản lý và kiểm kê tất cả các phòng qua các tầng.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <Layers className="w-5 h-5" />
            Tạo nhanh
          </button>
          <button 
            onClick={() => navigate(`/admin/properties/${propertyId}/rooms/create`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Thêm phòng
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Tổng cộng</p>
            <p className="text-xl font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">Sẵn có</p>
            <p className="text-xl font-black text-emerald-600">{stats.available}</p>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Đã thuê</p>
            <p className="text-xl font-black text-blue-600">{stats.occupied}</p>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest mb-1">Bảo trì</p>
            <p className="text-xl font-black text-amber-600">{stats.maintenance}</p>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[300px] flex items-center gap-3 px-4 py-2.5 border border-slate-100 rounded-2xl bg-slate-50 group focus-within:bg-white focus-within:border-indigo-100 transition-all">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên hoặc mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Floor Filter */}
          <select 
            className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-100"
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
            className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-100"
            value={pendingFilters.status}
            onChange={(e) => setPendingFilters(prev => ({ ...prev, status: e.target.value as RoomStatus }))}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select 
            className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-100"
            value={pendingFilters.type}
            onChange={(e) => setPendingFilters(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="">Tất cả loại phòng</option>
            {ROOM_TYPES.map(t => (
              <option key={t} value={t}>{ROOM_TYPE_LABELS[t] || t}</option>
            ))}
          </select>

          {/* Trashed Toggle */}
          <button 
            onClick={() => setShowTrashed(!showTrashed)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-2xl text-sm font-bold transition-all ${
              showTrashed 
                ? 'bg-rose-50 text-rose-600 border-rose-100' 
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            {showTrashed ? 'Đang hiện thùng rác' : 'Hiện thùng rác'}
          </button>

          {/* Advanced Filter Toggle */}
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-2xl text-sm font-bold transition-all ${
              showAdvancedFilters 
                ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ArrowDownUp className="w-4 h-4" />
            Lọc nâng cao
          </button>

          {/* Apply/Clear Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button 
              onClick={handleClearFilters}
              className="px-4 py-2.5 text-slate-400 hover:text-rose-500 text-sm font-black uppercase tracking-widest transition-colors flex items-center gap-2"
              title="Xóa tất cả bộ lọc"
            >
              <Trash2 className="w-4 h-4" />
              Xóa lọc
            </button>
            <button 
              onClick={handleApplyFilters}
              disabled={!isFilterChanged}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                isFilterChanged 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 active:scale-95' 
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Khoảng giá (VNĐ)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Tối thiểu"
                      value={formatNumber(pendingFilters.priceMin)}
                      onChange={(e) => {
                        const val = parseNumber(e.target.value);
                        setPendingFilters(prev => ({ ...prev, priceMin: val === '' ? '' : Number(val) }));
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-100 outline-none"
                    />
                    <span className="text-slate-300">-</span>
                    <input 
                      type="text" 
                      placeholder="Tối đa"
                      value={formatNumber(pendingFilters.priceMax)}
                      onChange={(e) => {
                        const val = parseNumber(e.target.value);
                        setPendingFilters(prev => ({ ...prev, priceMax: val === '' ? '' : Number(val) }));
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-100 outline-none"
                    />
                  </div>
                </div>

                {/* Area Range */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Diện tích (m²)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Tối thiểu"
                      value={formatNumber(pendingFilters.areaMin)}
                      onChange={(e) => {
                        const val = parseNumber(e.target.value);
                        setPendingFilters(prev => ({ ...prev, areaMin: val === '' ? '' : Number(val) }));
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-100 outline-none"
                    />
                    <span className="text-slate-300">-</span>
                    <input 
                      type="text" 
                      placeholder="Tối đa"
                      value={formatNumber(pendingFilters.areaMax)}
                      onChange={(e) => {
                        const val = parseNumber(e.target.value);
                        setPendingFilters(prev => ({ ...prev, areaMax: val === '' ? '' : Number(val) }));
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-100 outline-none"
                    />
                  </div>
                </div>

                {/* Capacity Range */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Số người ở</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Tối thiểu"
                      value={formatNumber(pendingFilters.capacityMin)}
                      onChange={(e) => {
                        const val = parseNumber(e.target.value);
                        setPendingFilters(prev => ({ ...prev, capacityMin: val === '' ? '' : Number(val) }));
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-100 outline-none"
                    />
                    <span className="text-slate-300">-</span>
                    <input 
                      type="text" 
                      placeholder="Tối đa"
                      value={formatNumber(pendingFilters.capacityMax)}
                      onChange={(e) => {
                        const val = parseNumber(e.target.value);
                        setPendingFilters(prev => ({ ...prev, capacityMax: val === '' ? '' : Number(val) }));
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-100 outline-none"
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
              <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <p className="text-sm font-bold text-indigo-700 ml-2">
                  Đã chọn {selectedIds.length} phòng
                </p>
                <div className="flex items-center gap-2">
                  {showTrashed ? (
                    <>
                      <button 
                        onClick={handleBatchRestore}
                        className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Khôi phục đã chọn
                      </button>
                      <button 
                        onClick={handleBatchForceDelete}
                        className="flex items-center gap-2 px-4 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-all shadow-md active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa vĩnh viễn đã chọn
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={handleBatchDelete}
                      className="flex items-center gap-2 px-4 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-all shadow-md active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa đã chọn
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedIds([])}
                    className="px-4 py-1.5 text-indigo-600 font-bold text-xs hover:underline"
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
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-bottom border-slate-100">
                <th className="p-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={rooms && rooms.length > 0 && selectedIds.length === rooms.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Mã phòng
                </th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Tên phòng
                </th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Tầng</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Loại
                </th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Giá
                </th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Trạng thái
                </th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rooms?.map((room) => (
                <motion.tr 
                  layout
                  key={room.id} 
                  className={`group hover:bg-slate-50/80 transition-colors ${selectedIds.includes(room.id) ? 'bg-indigo-50/30' : ''}`}
                >
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(room.id)}
                      onChange={() => toggleSelect(room.id)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                       <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase border border-slate-200">
                         {room.code}
                       </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col cursor-pointer group/row" onClick={() => navigate(`/admin/properties/${propertyId}/rooms/${room.id}`)}>
                      <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {room.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{room.area} m² • {room.capacity} slots</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                       <Layers className="w-3 h-3 text-slate-300" />
                       {room.floor_name || room.floor?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-500 capitalize">
                    {ROOM_TYPE_LABELS[room.type] || room.type}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                       <span className="text-sm font-black text-rose-600">
                         {formatCurrency(room.base_price)}
                       </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(room.status)}`}>
                       {ROOM_STATUS_LABELS[room.status] || room.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4">
                      {room.deleted_at ? (
                        <>
                          <button 
                            onClick={() => restoreRoom.mutate(room.id)}
                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
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
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa vĩnh viễn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => navigate(`/admin/properties/${propertyId}/rooms/${room.id}/edit`)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-hover"
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
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all shadow-hover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button className="p-2 text-slate-300 hover:text-slate-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {rooms?.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                          <LayoutGrid className="w-8 h-8 text-slate-200" />
                       </div>
                       <div>
                           <p className="text-lg font-bold text-slate-600">Không tìm thấy phòng nào</p>
                           <p className="text-sm text-slate-400">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                       </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Improved Pagination */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-xs font-black text-slate-700">
                    {rooms?.length || 0}
                 </div>
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-nowrap">Tổng kết quả</span>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <button 
                className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors" 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
              >
                 <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                 <span className="text-sm font-black text-slate-900 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm min-w-[3rem] text-center">
                    {page}
                 </span>
              </div>
              <button 
                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" 
                onClick={() => setPage(p => p + 1)}
              >
                 <ChevronRight className="w-5 h-5" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
