import { useState, useMemo } from 'react';
import {
    Info, Calendar, Users, History, DollarSign, Package, Zap,
    FilePenLine, X, ImageIcon, Trash2, Maximize2, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRoomActions } from '../hooks/useRooms';
import RoomLifecycleTimeline from './RoomLifecycleTimeline';
import PriceHistoryManager from '@/OrgScope/features/finance/components/PriceHistoryManager';
import AssetManager from '@/PropertyScope/features/operations/components/AssetManager';
import UtilityManager from '@/PropertyScope/features/operations/components/UtilityManager';
import ServiceManager from './ServiceManager';
import RoomImageGallery from './RoomImageGallery';
import LeaseManager from '@/PropertyScope/features/contracts/components/LeaseManager';
import InvoiceManager from '@/PropertyScope/features/billing/components/InvoiceManager';
import type { Room } from '../types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface RoomDetailContentProps {
  room: Room;
  isLoading?: boolean;
  propertyId: string | undefined;
  onClose?: () => void;
  onOpenManagement?: (mode: 'contract' | 'edit') => void;
  isFullPage?: boolean;
}

export default function RoomDetailContent({
  room,
  isLoading,
  propertyId,
  onClose,
  onOpenManagement,
  isFullPage = false
}: RoomDetailContentProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'lifecycle' | 'price' | 'assets' | 'utilities' | 'lease' | 'services' | 'images' | 'billing'>('info');
  const { deleteRoom, restoreRoom } = useRoomActions();

  const formattedPrice = useMemo(() => formatCurrency(room.base_price || 0), [room.base_price]);
  const formattedDate = useMemo(() => formatDate(room.created_at || new Date().toISOString()), [room.created_at]);

  return (
    <div className={`relative min-h-full ${isFullPage ? 'p-0' : 'p-8'}`}>
      {!isFullPage && (
        <>
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-8 right-8 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>
          ) || (
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
              <button
                onClick={() => navigate(-1)}
                className="group flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Về trang trước
              </button>
            </div>
          )}

          <div className="mb-8 mt-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase border border-indigo-100">
                {room.code}
              </span>
              {room.deleted_at && (
                <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase border border-rose-100 flex items-center gap-1.5">
                  <Trash2 className="w-3 h-3" />
                  Đã xóa
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-1">{room.name}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {room.type} • {room.floor_name || (room.floor ? `Tầng ${room.floor.floor_number ?? room.floor.name}` : 'Không có tầng')}
                </p>
              </div>
              <button
                onClick={() => navigate(`/admin/properties/${propertyId}/rooms/${room.id}`)}
                className="group flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Toàn trang
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border inline-block ${
                room.status === 'occupied' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                room.status === 'available' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {room.status === 'occupied' ? 'Đã thuê' :
                room.status === 'available' ? 'Sẵn có' :
                room.status === 'maintenance' ? 'Bảo trì' :
                room.status === 'reserved' ? 'Đã đặt' :
                room.status}
              </span>
              <span className="text-lg font-black text-rose-600">
                {formattedPrice}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Tabs Navigation */}
      <div className="flex gap-1 p-1 bg-slate-50 rounded-2xl border border-slate-100 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'info', label: 'Tổng quan', icon: Info },
          { id: 'lease', label: 'Hợp đồng', icon: FilePenLine },
          { id: 'billing', label: 'Hóa đơn', icon: DollarSign },
          { id: 'utilities', label: 'Đồng hồ', icon: Zap },
          { id: 'price', label: 'Giá thuê', icon: DollarSign },
          { id: 'assets', label: 'Tài sản', icon: Package },
          { id: 'services', label: 'Dịch vụ', icon: Zap },
          { id: 'images', label: 'Ảnh', icon: ImageIcon },
          { id: 'lifecycle', label: 'Lịch sử', icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all min-w-[100px] ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">Diện tích & Sức chứa</p>
                      <div className="flex items-center justify-between">
                          <span className="text-xl font-black text-slate-900">{room.area} <span className="text-sm font-bold text-slate-400 lowercase">m²</span></span>
                          <span className="text-xl font-black text-slate-900">{room.capacity} <span className="text-sm font-bold text-slate-400 lowercase">chỗ</span></span>
                      </div>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">Tòa nhà</p>
                      <p className="text-lg font-black text-slate-900 truncate">{room.property?.name || 'N/A'}</p>
                  </div>
              </div>

              {room.description && (
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">Thông tin chi tiết</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">{room.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Khách thuê hiện tại</p>
                    <p className="text-base font-black text-slate-900">
                      {room.status === 'occupied' 
                        ? (room.contracts?.[0]?.members?.[0]?.full_name || 'Đang ở') 
                        : 'Trống'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ngày tạo</p>
                    <p className="text-base font-black text-slate-900">
                      {formattedDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-8 grid grid-cols-2 gap-4 border-t border-slate-100">
                  {room.deleted_at ? (
                      <button 
                          onClick={() => restoreRoom.mutate(room.id)}
                          className="col-span-2 px-8 py-4 bg-emerald-600 text-white rounded-[2rem] font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-100"
                      >
                          <RefreshCw className={`w-5 h-5 ${restoreRoom.isPending ? 'animate-spin' : ''}`} />
                          Khôi phục phòng
                      </button>
                  ) : (
                      <>
                          <button 
                              onClick={() => {
                                  if (onOpenManagement) onOpenManagement('edit');
                                  else navigate(`/admin/properties/${propertyId}/floors/${room.floor_id}/rooms/${room.id}/edit`);
                              }}
                              className="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                          >
                              <FilePenLine className="w-5 h-5" />
                              Chỉnh sửa thông tin
                          </button>
                          <button 
                              onClick={() => {
                                  if (room.status === 'occupied') {
                                      alert(`Không thể xóa phòng ${room.name} đang có người ở. Vui lòng chấm dứt hợp đồng trước.`);
                                      return;
                                  }
                                  if (confirm(`Bạn có chắc chắn muốn xóa ${room.name}?`)) {
                                      deleteRoom.mutate(room.id, { onSuccess: () => onClose?.() });
                                  }
                              }}
                              className="px-8 py-4 bg-white text-rose-500 border border-rose-200 rounded-[2rem] font-bold hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                          >
                              <Trash2 className="w-5 h-5" />
                              Xóa phòng
                          </button>
                      </>
                  )}
              </div>
            </motion.div>
          )}

          {activeTab === 'assets' && (
            <motion.div key="assets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AssetManager 
                roomId={room.id as string} 
                data={room.assets} 
                isLoading={isLoading}
              />
            </motion.div>
          )}

          {activeTab === 'utilities' && (
            <motion.div key="utilities" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UtilityManager 
                propertyId={propertyId!} 
                roomId={room.id} 
                data={room.meters}
                isLoading={isLoading}
              />
            </motion.div>
          )}

          {activeTab === 'price' && (
            <motion.div key="price" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PriceHistoryManager 
                roomId={room.id} 
                data={room.price_histories}
                isLoading={isLoading}
              />
            </motion.div>
          )}

          {activeTab === 'lifecycle' && (
            <motion.div key="lifecycle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RoomLifecycleTimeline 
                data={room.status_histories}
                isLoading={isLoading}
              />
            </motion.div>
          )}

          {activeTab === 'lease' && (
            <motion.div key="lease" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LeaseManager 
                roomId={room.id as string} 
                propertyId={propertyId!} 
                data={room.contracts}
                isLoading={isLoading}
                onOpenWizard={() => onOpenManagement?.('contract')}
              />
            </motion.div>
          )}

          {activeTab === 'services' && (
            <motion.div key="services" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ServiceManager 
                roomId={room.id}
                data={room.room_services}
                isLoading={isLoading}
              />
            </motion.div>
          )}

          {activeTab === 'images' && (
            <motion.div key="images" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RoomImageGallery 
                roomId={room.id}
                images={room.images}
              />
            </motion.div>
          )}
          {activeTab === 'billing' && (
            <motion.div key="billing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <InvoiceManager 
                roomId={room.id}
                data={room.invoices}
                isLoading={isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
