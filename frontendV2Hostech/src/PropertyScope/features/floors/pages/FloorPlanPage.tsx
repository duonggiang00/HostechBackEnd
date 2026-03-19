import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FloorPlanViewer from '@/PropertyScope/features/floors/components/FloorPlanViewer';
import FloorPlanDesigner from '@/PropertyScope/features/floors/components/FloorPlanDesigner';
import FloorManager from '@/PropertyScope/features/floors/components/FloorManager';
import RoomForm from '@/PropertyScope/features/rooms/components/RoomForm';
import QuickRoomManager from '@/PropertyScope/features/rooms/components/QuickRoomManager';
import RoomDetailDrawer from '@/PropertyScope/features/floors/components/RoomDetailDrawer';
import ManagementModal from '@/shared/features/management/components/ManagementModal';
import ContractWizard from '@/PropertyScope/features/contracts/components/ContractWizard';
import { 
  ChevronLeft, Layout, FilePenLine,
  Loader2, Plus, AlertCircle, Zap, Info
} from 'lucide-react';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { PermissionGate } from '@/shared/features/auth/components/PermissionGate';
import { useRooms, useRoomActions } from '@/PropertyScope/features/rooms/hooks/useRooms';
import { useFloorDetail } from '@/PropertyScope/features/floors/hooks/useFloors';
import type { Floor } from '@/PropertyScope/features/floors/types';

import { isUuid } from '@/lib/utils';

export default function FloorPlanPage() {
  const { propertyId, floorId: floorIdParam } = useParams<{ propertyId: string; floorId?: string }>();
  const navigate = useNavigate();

  const floorId = useMemo(() => {
    if (isUuid(floorIdParam)) return floorIdParam as string;
    return undefined;
  }, [floorIdParam]);

  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined | null>();
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [managementMode, setManagementMode] = useState<'edit' | 'quick' | 'individual' | 'contract'>('edit');
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
 
  const { data: floorData, isLoading: isLoadingFloor } = useFloorDetail(floorId);
  const { data: allRooms = [], isLoading, error } = useRooms({ 
    property_id: propertyId
  });

  // Sync floorData with selectedFloor state to ensure consistency on initial load
  useEffect(() => {
      if (floorData) {
          setSelectedFloor(floorData);
      }
  }, [floorData]);

  // RoomDetail data logging preserved for debugging (the drawer will handle its own fetching)
  console.log('💎 FloorPlanPage: Room Selected ID:', selectedRoomId);

  const rooms = useMemo(() => {
    const targetFloorId = floorId || selectedFloor?.id;
    if (!targetFloorId) return [];
    return allRooms.filter(r => r.floor_id === targetFloorId);
  }, [allRooms, floorId, selectedFloor]);
  console.log('🔍 FloorPlanPage: Current PropertyId:', propertyId);
  console.log('🔍 FloorPlanPage: Rooms Data:', rooms);

  const selectedRoom = useMemo(() => rooms.find(r => r.id === selectedRoomId), [rooms, selectedRoomId]);

  const { user } = useAuthStore();
  const organizationId = user?.org_id;
  const { batchSetFloorPlan } = useRoomActions();

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Handle Role-based Empty States
  if (!propertyId || (user?.role === 'Admin' && !organizationId)) {
    let title = "Chưa chọn tòa nhà";
    let message = "Vui lòng chọn một tòa nhà từ danh sách để quản lý phòng.";
    
    if (user?.role === 'Admin' && !organizationId) {
      title = "Chọn tổ chức";
      message = "Vui lòng chọn Tổ chức trước để xem danh sách tòa nhà và phòng.";
    } else if (user?.role === 'Admin' && organizationId && !propertyId) {
      title = "Chọn tòa nhà";
      message = `Đã tìm thấy các tòa nhà của Tổ chức: ${organizationId.split('-')[0]}... Vui lòng chọn một cái.`;
    } else if (user?.role === 'Owner' && !propertyId) {
       title = "Chọn tòa nhà đang hoạt động";
       message = "Vui lòng chọn một trong các tòa nhà của bạn để xem sơ đồ phòng.";
    }

    return (
      <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-[3rem] m-8 shadow-xl shadow-slate-200/50">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Info className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">{title}</h3>
        <p className="max-w-md mx-auto text-slate-500 font-medium leading-relaxed">{message}</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button 
            onClick={() => navigate('/org/properties')}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            Đến danh sách tòa nhà
          </button>
          <button 
            onClick={() => navigate('/system')}
            className="px-8 py-3 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all"
          >
            Bảng điều khiển
          </button>
        </div>
      </div>
    );
  }

  if (error) {
     return (
        <div className="p-12 text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-3xl m-8">
           <AlertCircle className="w-12 h-12 mx-auto mb-4" />
           <h3 className="text-xl font-bold mb-2">Lỗi khi tải danh sách phòng</h3>
           <p>{error.message || 'Đã xảy ra lỗi khi lấy dữ liệu phòng.'}</p>
        </div>
     );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/properties/${propertyId}/floors`)}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                {floorData?.name || selectedFloor?.name || 'Chọn tầng'}
            </h1>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
              Mã tòa nhà: {propertyId?.slice(0, 8)}... • {rooms.length} Phòng {selectedFloor ? 'trên tầng này' : 'Tổng cộng'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
               <button 
                 onClick={() => setIsDesignMode(false)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                   !isDesignMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                 }`}
               >
                 <Layout className="w-4 h-4" />
                 Chế độ xem
               </button>
            </div>

            {!isDesignMode && (
              <div className="flex items-center gap-2">
                <PermissionGate role={['Admin', 'Owner', 'Manager']}>
                  <button 
                    onClick={() => setIsDesignMode(true)}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    <FilePenLine className="w-4 h-4" />
                    Chỉnh sửa sơ đồ
                  </button>
                </PermissionGate>
                
                <button 
                  onClick={() => {
                    setManagementMode('quick');
                    setIsManagementOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100"
                >
                  <Zap className="w-4 h-4" />
                  Tạo nhanh
                </button>
                <button 
                  onClick={() => {
                    if (selectedRoom) {
                       navigate(`/properties/${propertyId}/floors/${selectedRoom.floor_id}/rooms/${selectedRoom.id}/edit`);
                    } else if (selectedFloor) {
                       navigate(`/properties/${propertyId}/floors/${selectedFloor.id}/rooms/create`);
                    } else {
                       setManagementMode('individual');
                       setIsManagementOpen(true);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Thêm phòng
                </button>
              </div>
            )}
        </div>
      </div>

      {isDesignMode ? (
        <div className="h-[750px] -mx-4 sm:-mx-6 lg:-mx-8">
          <FloorPlanDesigner 
            key={`designer-${selectedFloor?.id || floorId}`}
            availableRooms={rooms}
            initialPins={rooms.filter(r => r.floor_plan_node).map(r => ({
              id: `room-${r.id}`,
              roomId: r.id,
              name: r.name,
              x: Number(r.floor_plan_node!.x),
              y: Number(r.floor_plan_node!.y),
              width: Number(r.floor_plan_node!.width || 120),
              height: Number(r.floor_plan_node!.height || 100),
            }))}
            onSave={(pins) => {
              const nodesData = pins.filter(p => p.roomId).map(p => ({
                room_id: p.roomId,
                x: p.x,
                y: p.y,
                width: p.width || 120,
                height: p.height || 100
              }));
              
              if (nodesData.length > 0) {
                 batchSetFloorPlan.mutate(nodesData, {
                   onSuccess: () => {
                       setIsDesignMode(false);
                   }
                 });
              } else {
                 setIsDesignMode(false);
              }
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
          <div className="border-r border-slate-100 pr-4 lg:col-span-3">
             <FloorManager 
                selectedFloorId={selectedFloor?.id || floorId} 
                onFloorSelect={(floor) => {
                    setSelectedFloor(floor);
                    if (floor && floor.id !== floorId) {
                        navigate(`/properties/${propertyId}/floors/${floor.id}/rooms`);
                    }
                }} 
             />
          </div>
          <div className="lg:col-span-9">
            {!(selectedFloor || floorData) && !isLoadingFloor ? (
                <div className="flex flex-col items-center justify-center h-[500px] bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 text-center px-12">
                   <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
                      <Layout className="w-10 h-10 text-indigo-500" />
                   </div>
                   <h3 className="text-xl font-black text-slate-900 mb-2">Vui lòng chọn tầng</h3>
                   <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs">
                      Chọn một tầng từ cấu trúc dọc để bắt đầu quản lý vị trí phòng và sơ đồ tầng.
                   </p>
                </div>
            ) : (
            <div>
                <FloorPlanViewer 
                    rooms={rooms.map((r, i) => {
                      // Auto-grid layout for rooms without saved pin positions
                      const COLS = 4;
                      const CELL_W = 175;
                      const CELL_H = 125;
                      const PAD = 20;
                      const hasPin = r.floor_plan_node?.x != null && r.floor_plan_node?.y != null;
                      return {
                        id: r.id,
                        name: r.name,
                        status: r.status,
                        x: hasPin ? Number(r.floor_plan_node!.x) : PAD + (i % COLS) * (CELL_W + PAD),
                        y: hasPin ? Number(r.floor_plan_node!.y) : PAD + Math.floor(i / COLS) * (CELL_H + PAD),
                        width: hasPin ? Number(r.floor_plan_node!.width) : CELL_W - PAD,
                        height: hasPin ? Number(r.floor_plan_node!.height) : CELL_H - PAD,
                      };
                    })}
                    selectedRoomId={selectedRoomId as string} 
                    onRoomSelect={(id) => setSelectedRoomId(id)}
                />
            </div>
            )}
          </div>
        </div>
      )}


      <ManagementModal 
        isOpen={isManagementOpen}
        onClose={() => {
            setIsManagementOpen(false);
            setSelectedRoomId(null);
        }}
        roomName={selectedRoom?.name || ''}
        title={
          managementMode === 'edit' ? `Quản lý ${selectedRoom?.name}` :
          managementMode === 'quick' ? 'Tạo phòng nhanh' : 'Chi tiết phòng mới'
        }
      >
        {managementMode === 'edit' && selectedRoom && (
            <RoomForm 
                initialData={selectedRoom}
                propertyId={propertyId}
                floorId={selectedFloor?.id}
                onSuccess={() => setIsManagementOpen(false)}
                onCancel={() => setIsManagementOpen(false)}
            />
        )}
        {managementMode === 'individual' && (
            <RoomForm 
                propertyId={propertyId}
                floorId={selectedFloor?.id}
                onSuccess={() => setIsManagementOpen(false)}
                onCancel={() => setIsManagementOpen(false)}
            />
        )}
        {managementMode === 'quick' && selectedFloor && (
            <QuickRoomManager 
                propertyId={propertyId}
                floorId={selectedFloor.id}
                onSuccess={() => setIsManagementOpen(false)}
                onCancel={() => setIsManagementOpen(false)}
            />
        )}
        {managementMode === 'quick' && !selectedFloor && (
            <div className="py-8 text-center">
                <p className="text-sm font-bold text-rose-500">Vui lòng chọn một tầng trước khi sử dụng tính năng tạo nhanh.</p>
            </div>
        )}
        {managementMode === 'contract' && selectedRoom && (
            <ContractWizard 
                roomId={selectedRoom.id}
                onSuccess={() => {
                  setIsManagementOpen(false);
                }}
                onCancel={() => setIsManagementOpen(false)}
            />
        )}
      </ManagementModal>

      <RoomDetailDrawer 
        roomId={selectedRoomId || undefined}
        onClose={() => setSelectedRoomId(null)}
        propertyId={propertyId}
        onOpenManagement={(mode) => {
          setManagementMode(mode);
          setIsManagementOpen(true);
          setSelectedRoomId(null);
        }}
      />
    </div>
  );
}
