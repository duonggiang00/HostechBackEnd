import { useState, useCallback } from 'react';
import { Plus, Minus, Eye, Trash2, ChevronDown, Layers } from 'lucide-react';
import type { BuildingFloor, BuildingRoom, RoomTemplateOption } from '../types';
import type { RoomStatus } from '@/PropertyScope/features/rooms/types';

interface BuildingOverviewProps {
  floors: BuildingFloor[];
  templates?: RoomTemplateOption[];
  isEditMode?: boolean;
  isLoading?: boolean;
  onRoomSelect?: (room: BuildingRoom | null) => void;
  selectedRoom?: BuildingRoom | null;
  // Edit Mode callbacks — state lives in Page
  onFloorsChange?: (floors: BuildingFloor[]) => void;
}

export function BuildingOverview({
  floors,
  templates = [],
  isEditMode = false,
  isLoading = false,
  onRoomSelect,
  onFloorsChange,
}: BuildingOverviewProps) {
  const [hoveredDivider, setHoveredDivider] = useState<number | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [hoveredFloorAdd, setHoveredFloorAdd] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Calculate max columns for uniform grid (based on actual occupancy, not count)
  const maxColumns = Math.max(4, ...floors.map(f => 
    f.rooms.reduce((max, r) => Math.max(max, (r.layout?.column ?? 0) + (r.layout?.col_span ?? 1)), 0)
  ));

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleAddFloor = useCallback(() => {
    if (!onFloorsChange) return;
    const newFloorNumber = Math.max(0, ...floors.map(f => f.floor_number)) + 1;
    const newFloor: BuildingFloor = {
      id: `floor-temp-${Date.now()}`,
      temp_id: `temp-floor-${Date.now()}`,
      name: `Tầng ${newFloorNumber}`,
      floor_number: newFloorNumber,
      rooms: [],
      isDraft: true,
    };
    onFloorsChange([...floors, newFloor]);
  }, [floors, onFloorsChange]);

  const handleRemoveFloor = useCallback((floorId: string) => {
    if (!onFloorsChange) return;
    const floor = floors.find(f => f.id === floorId);
    if (floor && floor.rooms.length > 0) {
      alert(`Không thể xóa "${floor.name}" vì tầng vẫn còn chứa phòng. Vui lòng xóa hoặc di chuyển phòng trước.`);
      return;
    }
    onFloorsChange(floors.filter(f => f.id !== floorId));
  }, [floors, onFloorsChange]);

  const handleAddRoom = useCallback((floorId: string, floorNumber: number) => {
    if (!onFloorsChange) return;
    const floor = floors.find(f => f.id === floorId);
    if (!floor) return;

    const nextColumn = floor.rooms.reduce((max, r) => 
      Math.max(max, (r.layout?.column ?? 0) + (r.layout?.col_span ?? 1)), 0
    );
    
    const roomSequence = floor.rooms.length + 1;
    const roomSuffix = roomSequence < 10 ? `0${roomSequence}` : `${roomSequence}`;
    const roomTempId = `temp-room-${Date.now()}`;
    
    const newRoom: BuildingRoom = {
      id: roomTempId,
      temp_id: roomTempId,
      code: `${floorNumber}${roomSuffix}`, // E.g., 101, 102, 201...
      floor_id: floorId,
      status: 'available' as RoomStatus,
      area: 25,
      base_price: 3000000,
      template_id: selectedTemplate || undefined,
      isDraft: true,
      layout: {
        column: nextColumn,
        row: 0,
        col_span: 1,
        row_span: 1,
      },
    };
    onFloorsChange(floors.map(f =>
      f.id === floorId ? { ...f, rooms: [...f.rooms, newRoom] } : f
    ));
  }, [floors, onFloorsChange, selectedTemplate]);

  const handleRemoveRoom = useCallback((roomId: string) => {
    if (!onFloorsChange) return;
    
    // Find the room first to check status
    let roomToDelete: BuildingRoom | undefined;
    floors.forEach(f => {
      const r = f.rooms.find(rm => rm.id === roomId);
      if (r) roomToDelete = r;
    });

    if (roomToDelete && roomToDelete.status === 'occupied') {
      alert(`Không thể xóa phòng "${roomToDelete.code}" vì đang có người ở (Occupied).`);
      return;
    }

    onFloorsChange(floors.map(floor => ({
      ...floor,
      rooms: floor.rooms.filter(r => r.id !== roomId),
    })));
  }, [floors, onFloorsChange]);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const getStatusColor = (status: RoomStatus, isDraft?: boolean) => {
    if (isDraft) return 'bg-slate-50 border-dashed border-slate-300 text-slate-400';
    switch (status) {
      case 'occupied':    return 'bg-blue-100 border-blue-400 text-blue-900 hover:bg-blue-200';
      case 'available':   return 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100';
      case 'maintenance': return 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100';
      case 'reserved':    return 'bg-purple-50 border-purple-300 text-purple-900 hover:bg-purple-100';
      case 'draft':       return 'bg-slate-50 border-slate-300 text-slate-400 hover:bg-slate-100';
      default:            return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  // ─── Skeleton ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center p-8">
        <div className="max-w-4xl w-full space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 bg-slate-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  const floorsDesc = [...floors].sort((a, b) => b.floor_number - a.floor_number);

  return (
    <div className="flex-1 flex flex-col items-center p-8 bg-gray-50/50 overflow-auto">
      <div className="max-w-4xl w-full translate-y-4">

        {/* Template Selector — chỉ trong Edit Mode */}
        {isEditMode && templates.length > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-indigo-100 shadow-sm">
            <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Template phòng:</span>
            <div className="relative flex-1">
              <select
                value={selectedTemplate}
                onChange={e => setSelectedTemplate(e.target.value)}
                className="w-full appearance-none bg-indigo-50 border border-indigo-200 text-slate-700 text-xs font-semibold rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
              >
                <option value="">— Không dùng template —</option>
                {templates.map(tpl => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} {tpl.area ? `· ${tpl.area}m²` : ''} {tpl.base_price ? `· ${tpl.base_price.toLocaleString('vi-VN')}₫` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400" />
            </div>
            {selectedTemplate && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full whitespace-nowrap">
                ✓ Sẽ tạo đồng hồ từ template
              </span>
            )}
            {!selectedTemplate && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full whitespace-nowrap">
                ⚡ Tự động tạo 2 đồng hồ Điện+Nước
              </span>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-6 mb-6 justify-center items-center bg-white py-3 px-6 rounded-lg shadow-sm border border-slate-100 w-fit mx-auto">
          {[
            { color: 'bg-emerald-50 border-emerald-300', label: 'Trống' },
            { color: 'bg-blue-100 border-blue-400',     label: 'Đã thuê' },
            { color: 'bg-amber-50 border-amber-300',    label: 'Bảo trì' },
            { color: 'bg-purple-50 border-purple-300',  label: 'Đã cọc' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${color} border`} />
              <span className="text-xs text-slate-600 font-medium whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>

        {/* Building Grid */}
        <div className="relative">
          <div className="border-[3px] border-slate-300 bg-white rounded-lg shadow-lg overflow-hidden">

            {/* Roof area (click to Add Floor) */}
            <div
              className={`relative h-8 bg-slate-100 border-b-2 border-slate-300 transition-colors flex items-center justify-center ${isEditMode ? 'hover:bg-indigo-50 cursor-pointer' : ''}`}
              onMouseEnter={() => isEditMode && setHoveredDivider(-1)}
              onMouseLeave={() => isEditMode && setHoveredDivider(null)}
              onClick={() => isEditMode && handleAddFloor()}
            >
              {isEditMode && (
                <div className={`transition-all duration-300 ${hoveredDivider === -1 ? 'scale-100 opacity-100' : 'opacity-20 scale-90'}`}>
                  <div className="bg-indigo-600 text-white rounded-full p-1 shadow-lg">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>

            {floorsDesc.map((floorData) => (
              <div key={floorData.id}>
                <div className="flex">
                  {/* Floor label */}
                  <div className="w-20 flex flex-col items-center justify-center bg-slate-50/80 border-r-2 border-slate-300 py-6">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Tầng</span>
                    <span className={`text-slate-800 text-xl font-black leading-none ${floorData.isDraft ? 'text-indigo-400' : ''}`}>
                      {floorData.floor_number}
                    </span>
                    {floorData.isDraft && (
                      <span className="text-[8px] text-indigo-400 font-bold mt-0.5">MỚI</span>
                    )}
                  </div>

                  {/* Rooms area */}
                  <div className="flex-1 flex items-center p-4 relative h-36 bg-white">
                    <div
                      className="grid gap-4 items-stretch"
                      style={{
                        gridTemplateColumns: `repeat(${Math.max(4, maxColumns + (isEditMode ? 1 : 0))}, 1fr)`,
                        width: '100%',
                        height: '100%',
                      }}
                    >
                      {floorData.rooms.map(room => (
                        <div
                          key={room.id}
                          className="relative group/room"
                          onMouseEnter={() => setHoveredRoom(room.id)}
                          onMouseLeave={() => setHoveredRoom(null)}
                          style={{
                            gridColumn: `span ${room.layout?.col_span ?? 1}`,
                            gridRow:    `span ${room.layout?.row_span ?? 1}`,
                          }}
                        >
                          <div
                            className={`w-full h-full rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${getStatusColor(room.status, room.isDraft)}`}
                            onClick={() => onRoomSelect?.(room)}
                          >
                            <span className="text-base font-bold leading-none">{room.code}</span>
                            <span className="text-[9px] mt-1 opacity-60 font-semibold uppercase tracking-tighter leading-none">
                              {room.isDraft ? 'Chưa lưu' :
                                room.status === 'occupied' ? 'Đã thuê' :
                              room.status === 'available' ? 'Trống' :
                              room.status === 'draft' ? 'Nháp/Chưa duyệt' : 'Bảo trì'}
                            </span>
                          </div>

                          {/* Hover action buttons */}
                          {hoveredRoom === room.id && (
                            <div className="absolute top-1 right-1 flex gap-1 z-20 animate-in fade-in zoom-in duration-150">
                              {!room.isDraft && (
                                <button
                                  onClick={e => { e.stopPropagation(); onRoomSelect?.(room); }}
                                  className="p-1.5 rounded-md shadow-sm transition-all hover:scale-105 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                  title="Xem nhanh"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                              )}
                              {isEditMode && (
                                <button
                                  onClick={e => { e.stopPropagation(); handleRemoveRoom(room.id); }}
                                  className="bg-rose-50 text-rose-500 p-1.5 rounded-md shadow-sm border border-rose-100 hover:bg-rose-500 hover:text-white transition-all hover:scale-105"
                                  title="Xóa phòng"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add room cell — ONLY in Edit Mode */}
                      {isEditMode && (
                        <div
                          className="h-full flex items-center justify-center cursor-pointer p-1"
                          onMouseEnter={() => setHoveredFloorAdd(floorData.floor_number)}
                          onMouseLeave={() => setHoveredFloorAdd(null)}
                          onClick={() => handleAddRoom(floorData.id, floorData.floor_number)}
                        >
                          <div className={`w-full h-full border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-300 ${
                            hoveredFloorAdd === floorData.floor_number
                              ? 'bg-emerald-50 border-emerald-300'
                              : 'bg-slate-50/20 border-slate-200'
                          }`}>
                            <Plus className={`w-6 h-6 transition-all duration-300 ${
                              hoveredFloorAdd === floorData.floor_number ? 'text-emerald-600' : 'text-slate-300'
                            }`} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delete floor button — ONLY in Edit Mode */}
                  {isEditMode && (
                    <div className="flex items-center px-2 bg-slate-50/80 border-l-2 border-slate-200">
                      <button
                        onClick={() => handleRemoveFloor(floorData.id)}
                        className="p-1.5 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                        title="Xóa tầng"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Divider between floors */}
                <div className="relative h-2 bg-slate-100 border-y border-slate-200" />
              </div>
            ))}

            {floors.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <span className="text-sm font-medium">Tòa nhà chưa có tầng nào</span>
                {isEditMode && (
                  <span className="text-xs mt-1">Nhấp vào thanh mái để thêm tầng</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
