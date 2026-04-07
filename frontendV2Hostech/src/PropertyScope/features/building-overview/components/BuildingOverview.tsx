import { useState, useCallback } from 'react';
import { Plus, Minus, Trash2, Layers, X, Info } from 'lucide-react';
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
  floors = [],
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
  const maxColumns = Math.max(4, ...(floors || []).map(f => 
    (f.rooms || []).reduce((max, r) => Math.max(max, (r.layout?.column ?? 0) + (r.layout?.col_span ?? 1)), 0)
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
    
    const template = templates.find(t => t.id === selectedTemplate);
    
    const newRoom: BuildingRoom = {
      id: roomTempId,
      temp_id: roomTempId,
      code: `${floorNumber}${roomSuffix}`, // E.g., 101, 102, 201...
      floor_id: floorId,
      status: 'available' as RoomStatus,
      area: template?.area || 25,
      base_price: template?.base_price || 3000000,
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
  }, [floors, onFloorsChange, selectedTemplate, templates]);

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

        {/* Template Selector — Premium Design */}
        {isEditMode && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center gap-2">
              <div className="flex items-center gap-3 pl-4 pr-2 py-2 border-r border-slate-100 dark:border-slate-800">
                <div className={`p-2 rounded-xl transition-colors ${selectedTemplate ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Quy tắc vẽ</span>
                  <span className="text-xs font-black text-slate-800 dark:text-white whitespace-nowrap">
                    {selectedTemplate ? 'Chế độ vẽ tự động' : 'Chế độ thủ công'}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex items-center gap-2 px-2">
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  className="flex-1 bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer py-2"
                >
                  <option value="">— Chọn mẫu phòng để vẽ nhanh —</option>
                  {templates.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.area}m² · {tpl.base_price?.toLocaleString('vi-VN')}₫)
                    </option>
                  ))}
                </select>
                
                {selectedTemplate && (
                  <button 
                    onClick={() => setSelectedTemplate('')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="pr-2">
                {selectedTemplate ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Tự động: Bật</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Thủ công</span>
                  </div>
                )}
              </div>
            </div>
            
            {selectedTemplate && (
              <div className="mt-2 ml-6 flex items-center gap-2 text-[10px] text-slate-400 font-bold italic animate-in fade-in duration-700">
                <Info className="w-3 h-3 text-indigo-400" />
                Giá thuê, diện tích & dịch vụ sẽ được tự động kế thừa vào mỗi ô phòng bạn vẽ.
              </div>
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
                            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover/room:opacity-100 transition-opacity rounded-lg pointer-events-none" />
                            <span className="text-base font-bold leading-none z-10">{room.code}</span>
                            <span className="text-[9px] mt-1 opacity-60 font-semibold uppercase tracking-tighter leading-none z-10">
                              {room.isDraft ? 'Draft' :
                                room.status === 'occupied' ? 'Đã thuê' :
                              room.status === 'available' ? 'Trống' :
                              room.status === 'draft' ? 'Nháp/Chưa duyệt' : 'Bảo trì'}
                            </span>
                            {room.template_id && isEditMode && (
                              <div className="absolute bottom-1 right-1">
                                <Layers className="w-2.5 h-2.5 text-indigo-400" />
                              </div>
                            )}
                          </div>

                          {/* Hover action buttons */}
                          {hoveredRoom === room.id && (
                            <div className="absolute top-1 right-1 flex gap-1 z-20 animate-in fade-in zoom-in duration-150">
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
