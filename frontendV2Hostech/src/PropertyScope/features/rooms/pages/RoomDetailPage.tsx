import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Info,
  Image as ImageIcon,
  FileText,
  Gauge,
  Receipt,
  Users,
  FileEdit,
  Trash2,
  Zap,
  RefreshCw,
  Loader2,
  MapPin,
  Eye,
  Wifi,
  Wind,
  Bed,
  Tv,
  Archive,
  Droplet,
} from 'lucide-react';
import { useRoomDetail, useRoomActions } from '../hooks/useRooms';
import ManagementModal from '@/shared/features/management/components/ManagementModal';
import RoomForm from '../components/RoomForm';
import { PermissionGate } from '@/shared/features/auth/components/PermissionGate';
import UtilityManager from '@/PropertyScope/features/operations/components/UtilityManager';
import RoomImageGallery from '../components/RoomImageGallery';
import InvoiceManager from '@/PropertyScope/features/billing/components/InvoiceManager';
import { formatCurrency } from '@/lib/utils';


// ─── Helpers ──────────────────────────────────────────────────────────────────

type TabId = 'info' | 'tenants' | 'lease' | 'billing' | 'utilities' | 'images';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  occupied:    { label: 'Đang cho thuê', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' },
  available:   { label: 'Trống',         className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30' },
  maintenance: { label: 'Bảo trì',       className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30' },
  reserved:    { label: 'Đã đặt',        className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30' },
  draft:       { label: 'Nháp',          className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
};

const CONTRACT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  active:             { label: 'Đang hiệu lực', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' },
  draft:              { label: 'Nháp',           className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
  pending_signature:  { label: 'Chờ ký',         className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30' },
  pending_payment:    { label: 'Chờ thanh toán', className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30' },
  ended:              { label: 'Hết hạn',        className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' },
  terminated:         { label: 'Đã chấm dứt',   className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' },
  cancelled:          { label: 'Đã hủy',         className: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700' },
};



function getServiceIcon(name: string): React.ElementType {
  const key = name.toLowerCase();
  if (key.includes('wifi') || key.includes('mạng')) return Wifi;
  if (key.includes('điều hòa') || key.includes('ac')) return Wind;
  if (key.includes('nước')) return Droplet;
  if (key.includes('điện')) return Zap;
  if (key.includes('tv') || key.includes('tivi')) return Tv;
  if (key.includes('giường') || key.includes('bed')) return Bed;
  if (key.includes('tủ')) return Archive;
  return Zap;
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'info',      label: 'Thông tin',  icon: Info },
  { id: 'images',    label: 'Hình ảnh',   icon: ImageIcon },
  { id: 'tenants',   label: 'Người thuê', icon: Users },
  { id: 'lease',     label: 'Hợp đồng',  icon: FileText },
  { id: 'utilities', label: 'Đồng hồ',   icon: Gauge },
  { id: 'billing',   label: 'Hóa đơn',   icon: Receipt },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoomDetailPage() {
  const { propertyId, roomId } = useParams<{ propertyId: string; roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: room, isLoading, error, refetch } = useRoomDetail(roomId);
  const { deleteRoom, restoreRoom } = useRoomActions();

  const [activeTab, setActiveTab] = useState<TabId>(location.state?.activeTab || 'info');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleBack = () => {
    if (location.state?.from === 'building-view') {
      navigate(`/properties/${propertyId}/building-view`);
    } else {
      navigate(`/properties/${propertyId}/rooms`);
    }
  };

  const handleDelete = () => {
    if (room?.status === 'occupied') {
      alert(`Không thể xóa phòng ${room.name} đang có người ở. Vui lòng chấm dứt hợp đồng trước.`);
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa ${room?.name}?`)) {
      deleteRoom.mutate(room!.id, { onSuccess: handleBack });
    }
  };

  // ─── Loading / Error ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="m-8 p-12 text-center bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl">
        <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mb-2">Không tải được thông tin phòng</h3>
        <p className="text-rose-500 dark:text-rose-400/70 text-sm mb-4">
          {(error as any)?.message || 'Phòng không tồn tại hoặc bạn không có quyền truy cập.'}
        </p>
        <button
          onClick={handleBack}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[room.status] ?? { label: room.status, className: 'bg-gray-100 text-gray-800 border-gray-200' };

  // Collect all members from all contracts for tenants tab
  const allMembers = (room.contracts ?? []).flatMap(c =>
    (c.members ?? []).map(m => ({ ...m, contractId: c.id, contractStatus: c.status }))
  );
  const activeMembers = allMembers.filter(m => String(m.contractStatus).toLowerCase() === 'active');

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">

      {/* ── Sticky Header ────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={handleBack}
                className="shrink-0 flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Quay lại</span>
              </button>

              <div className="h-5 w-px bg-gray-200 dark:bg-slate-700 shrink-0" />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{room.name}</h1>
                  {room.deleted_at && (
                    <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-md border border-rose-200 dark:border-rose-500/30">
                      Đã xóa
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>{room.property_name || room.property?.name || 'Tòa nhà'}</span>
                  {(room.floor_name || room.floor?.name) && (
                    <><span>•</span><span>{room.floor_name || room.floor?.name}</span></>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${statusInfo.className}`}>
                {statusInfo.label}
              </span>

              <PermissionGate role={['Owner', 'Manager']}>
                <div className="flex items-center gap-2">
                  {room.deleted_at ? (
                    <button
                      onClick={() => restoreRoom.mutate(room.id)}
                      disabled={restoreRoom.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                    >
                      <RefreshCw className={`w-4 h-4 ${restoreRoom.isPending ? 'animate-spin' : ''}`} />
                      Khôi phục
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:border-indigo-300 hover:text-indigo-600 dark:hover:border-indigo-500/50 dark:hover:text-indigo-400 transition-all"
                      >
                        <FileEdit className="w-4 h-4" />
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => navigate(`/properties/${propertyId}/contracts/create?roomId=${room.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-colors"
                      >
                        <Zap className="w-4 h-4" />
                        Tạo hợp đồng
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleteRoom.isPending}
                        className="p-2 text-gray-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all disabled:opacity-60"
                        title="Xóa phòng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </PermissionGate>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Tab Bar ───────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-[73px] z-10">
        <div className="px-6 overflow-x-auto no-scrollbar">
          <div className="flex">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-3.5 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Thông tin ──────────────────────────────────────────────────── */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Thông tin cơ bản */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thông tin cơ bản</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-slate-400">Tên phòng:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{room.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-slate-400">Diện tích:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{room.area} m²</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-slate-400">Giới hạn người:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{room.capacity} người</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-slate-400">Giá thuê:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {formatCurrency(room.base_price || 0)}/tháng
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-600 dark:text-slate-400">Trạng thái:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dịch vụ đi kèm */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dịch vụ đi kèm</h2>
                {room.room_services && room.room_services.length > 0 ? (
                  <div className="space-y-3">
                    {room.room_services.map((rs) => {
                      const ServiceIcon = getServiceIcon(rs.service?.name ?? '');
                      const calcMode = rs.service?.calc_mode;
                      const isFixed = calcMode === 'fixed' || calcMode === 'FIXED';
                      return (
                        <div key={rs.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-50 dark:bg-blue-500/10 p-2 rounded-lg">
                              <ServiceIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <span className="text-sm text-gray-900 dark:text-white">{rs.service?.name}</span>
                              {rs.service?.unit && (
                                <span className="text-xs text-gray-400 dark:text-slate-500 ml-1">({rs.service.unit})</span>
                              )}
                            </div>
                          </div>
                          <span className={`text-sm font-medium ${isFixed ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {isFixed ? 'Theo gói' : `${formatCurrency((rs.service as any)?.price ?? (rs.service as any)?.current_price ?? 0)}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 text-gray-300 dark:text-slate-600">
                    <Zap className="w-8 h-8 mb-1" />
                    <p className="text-xs text-gray-400 dark:text-slate-500">Chưa có dịch vụ</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mô tả */}
            {room.description && (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Mô tả phòng</h2>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                  {room.description}
                </p>
              </div>
            )}

            {/* Tài sản trong phòng */}
            {room.assets && room.assets.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tài sản trong phòng</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-slate-300">STT</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-slate-300">Tên tài sản</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-slate-300">Tình trạng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                      {room.assets.map((asset: any, index: number) => (
                        <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-3 text-gray-400 dark:text-slate-500">{index + 1}</td>
                          <td className="px-6 py-3 text-gray-900 dark:text-white">{asset.asset?.name || asset.name}</td>
                          <td className="px-6 py-3 text-gray-500 dark:text-slate-400 capitalize">{asset.condition || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Hình ảnh ─────────────────────────────────────────────────── */}
        {activeTab === 'images' && (
          <RoomImageGallery
            roomId={room.id}
            images={room.images}
          />
        )}

        {/* ── Người thuê ───────────────────────────────────────────────── */}
        {activeTab === 'tenants' && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
            {activeMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-slate-300">Họ tên</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-slate-300">Số điện thoại</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-slate-300">Vai trò</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-slate-300">Trạng thái</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-900 dark:text-slate-300">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                    {activeMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0">
                              {member.full_name?.charAt(0) ?? '?'}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{member.full_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{member.phone || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded-md border ${
                            member.role === 'TENANT'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30'
                              : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}>
                            {member.role === 'TENANT' ? 'Chủ hợp đồng' : member.role === 'ROOMMATE' ? 'Người ở cùng' : member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded-md border ${
                            member.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                              : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                          }`}>
                            {member.status === 'APPROVED' ? 'Đã xác nhận' : member.status === 'PENDING' ? 'Chờ xác nhận' : member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => navigate(`/properties/${propertyId}/users/${member.user_id || member.id}`, { 
                              state: { from: 'room-detail', roomId: roomId, activeTab: 'tenants' } 
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors text-xs font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-300 dark:text-slate-600">
                <Users className="w-12 h-12 mb-3" />
                <p className="text-sm text-gray-400 dark:text-slate-500">Phòng hiện không có người thuê</p>
              </div>
            )}
          </div>
        )}

        {/* ── Hợp đồng ─────────────────────────────────────────────────── */}
        {activeTab === 'lease' && (
          <div className="space-y-4">
            {room.contracts && room.contracts.length > 0 ? (
              room.contracts.map((contract) => {
                const cs = CONTRACT_STATUS_MAP[contract.status] ?? { label: contract.status, className: 'bg-gray-100 text-gray-600 border-gray-200' };
                return (
                  <div key={contract.id} className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          Hợp đồng #{contract.id.slice(-6).toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                          {contract.start_date
                            ? new Date(contract.start_date).toLocaleDateString('vi-VN')
                            : '—'}
                          {' '}—{' '}
                          {contract.end_date
                            ? new Date(contract.end_date).toLocaleDateString('vi-VN')
                            : 'Không xác định'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${cs.className}`}>
                        {cs.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Tiền thuê/tháng</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {contract.monthly_rent ? formatCurrency(contract.monthly_rent) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Tiền cọc</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {contract.deposit_amount ? formatCurrency(contract.deposit_amount) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Ngày bắt đầu</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {contract.start_date ? new Date(contract.start_date).toLocaleDateString('vi-VN') : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Ngày kết thúc</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {contract.end_date ? new Date(contract.end_date).toLocaleDateString('vi-VN') : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Members preview */}
                    {contract.members && contract.members.length > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        {contract.members.slice(0, 4).map((m) => (
                          <div
                            key={m.id}
                            title={m.full_name}
                            className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold border-2 border-white dark:border-slate-900"
                          >
                            {m.full_name?.charAt(0) ?? '?'}
                          </div>
                        ))}
                        {(contract.members.length > 4) && (
                          <span className="text-xs text-gray-400 dark:text-slate-500">
                            +{contract.members.length - 4} người
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => navigate(`/properties/${propertyId}/contracts/${contract.id}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 flex flex-col items-center justify-center py-16">
                <FileText className="w-12 h-12 text-gray-200 dark:text-slate-700 mb-3" />
                <p className="text-sm text-gray-400 dark:text-slate-500">Chưa có hợp đồng nào</p>
              </div>
            )}
          </div>
        )}

        {/* ── Đồng hồ ──────────────────────────────────────────────────── */}
        {activeTab === 'utilities' && (
          <UtilityManager
            propertyId={propertyId!}
            roomId={room.id}
            data={room.meters}
          />
        )}

        {/* ── Hóa đơn ──────────────────────────────────────────────────── */}
        {activeTab === 'billing' && (
          <InvoiceManager
            roomId={room.id}
            data={room.invoices}
          />
        )}

      </div>

      {/* ── Edit Modal ───────────────────────────────────────────────────── */}
      <ManagementModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        roomName={room.name}
        title={`Chỉnh sửa ${room.name}`}
      >
        <RoomForm
          initialData={room}
          propertyId={propertyId as string}
          floorId={room.floor_id || undefined}
          onSuccess={() => {
            setIsEditOpen(false);
            refetch();
          }}
          onCancel={() => setIsEditOpen(false)}
        />
      </ManagementModal>
    </div>
  );
}
