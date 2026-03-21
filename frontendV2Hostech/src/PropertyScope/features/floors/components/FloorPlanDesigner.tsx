import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Trash2, 
  MousePointer2, 
  Move, 
  MapPin, 
  Plus, 
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  LayoutGrid
} from 'lucide-react';

interface Pin {
  id: string;
  roomId: string;
  name: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // in pixels
  height: number; // in pixels
}

interface Room {
  id: string;
  name: string;
  status?: string;
  floor_plan_node?: any;
}

interface FloorPlanDesignerProps {
  initialPins?: Pin[];
  onSave?: (pins: Pin[]) => void;
  availableRooms?: Room[];
}

export default function FloorPlanDesigner({ 
  initialPins = [], 
  onSave, 
  availableRooms = [] 
}: FloorPlanDesignerProps) {
  const [pins, setPins] = useState<Pin[]>(initialPins);
  const [selectedPinIds, setSelectedPinIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter rooms that are not currently placed on the map
  const unplacedRooms = useMemo(() => {
    const placedRoomIds = new Set(pins.map(p => p.roomId));
    return availableRooms.filter(r => !placedRoomIds.has(r.id))
      .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [availableRooms, pins, searchTerm]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target !== containerRef.current && !(e.target as HTMLElement).classList.contains('canvas-area')) return;
    
    // Clear selection if clicking on blank canvas
    if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
        setSelectedPinIds([]);
    }
  };

  const placeRoom = (room: Room) => {
    // Default position at center
    const newPin: Pin = {
      id: `pin-${room.id}-${Date.now()}`,
      roomId: room.id,
      name: room.name,
      x: 50,
      y: 50,
      width: 120,
      height: 100,
    };

    setPins([...pins, newPin]);
    setSelectedPinIds([newPin.id]);
  };

  const updatePinPosition = (id: string, x: number, y: number) => {
    setPins(pins.map(p => p.id === id ? { ...p, x, y } : p));
  };

  const deleteSelection = () => {
    const occupiedPins = pins.filter(p => selectedPinIds.includes(p.id) && availableRooms.find(r => r.id === p.roomId)?.status === 'occupied');
    
    if (occupiedPins.length > 0) {
      alert(`Không thể xóa ${occupiedPins.length} ghim phòng đang có người thuê.`);
      return;
    }

    setPins(pins.filter(p => !selectedPinIds.includes(p.id)));
    setSelectedPinIds([]);
  };

  const selectedPins = pins.filter(p => selectedPinIds.includes(p.id));
  const selectedPin = selectedPins.length === 1 ? selectedPins[0] : null;

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Thiết kế Sơ đồ tầng</h3>
            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">Công cụ Ánh xạ Không gian Trực quan</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
               <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-600">Đã ghim {pins.length}</span>
               </div>
               <div className="w-px h-4 bg-slate-200" />
               <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-600">Chưa ghim {unplacedRooms.length}</span>
               </div>
            </div>
            
            <button 
              onClick={() => onSave?.(pins)}
              className="group flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:shadow-indigo-300 active:scale-95"
            >
              <Save className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Lưu sơ đồ ánh xạ
            </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 bg-slate-100/50">
        {/* Left Sidebar: Room List */}
        <div className="w-80 border-r border-slate-200 flex flex-col bg-white">
          <div className="p-5 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Tìm phòng chưa đặt..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Phòng chưa được đặt trên bản đồ</h4>
             
             {unplacedRooms.length === 0 ? (
               <div className="py-12 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-200 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-400">Tất cả phòng đã được đặt</p>
               </div>
             ) : (
               unplacedRooms.map(room => (
                 <div 
                   key={room.id}
                   draggable
                   onDragEnd={(_e) => {
                      // Simple implementation: if dropped on canvas area
                      placeRoom(room);
                   }}
                   className="group p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-md transition-all cursor-grab active:cursor-grabbing flex items-center justify-between"
                 >
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-indigo-50 transition-colors">
                          <MapPin className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                       </div>
                       <span className="text-sm font-bold text-slate-700">{room.name}</span>
                    </div>
                    <button 
                      onClick={() => placeRoom(room)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                 </div>
               ))
             )}
          </div>
        </div>

        {/* Center: Canvas Area */}
        <div 
          ref={containerRef}
          onClick={handleCanvasClick}
          className="flex-1 relative overflow-hidden cursor-crosshair canvas-area group select-none"
          style={{ 
            backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', 
            backgroundSize: '30px 30px',
            backgroundColor: '#f8fafc'
          }}
        >
          {/* Instructions Overlay */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
            <div className="px-6 py-2.5 bg-white/90 backdrop-blur-md border border-slate-200 rounded-full text-xs font-black text-slate-600 uppercase tracking-[0.15em] shadow-xl flex items-center gap-3">
               <Move className="w-3 h-3 text-indigo-500" />
               Kéo thả ID phòng từ danh sách bên trái hoặc click vào canvas
            </div>
          </div>

          <AnimatePresence>
            {pins.map((pin) => {
              const isSelected = selectedPinIds.includes(pin.id);
              const room = availableRooms.find(r => r.id === pin.roomId);
              
              return (
                <motion.div
                  key={pin.id}
                  drag
                  dragMomentum={false}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onDragEnd={(_, info) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    
                    const newX = ((info.point.x - rect.left) / rect.width) * 100;
                    const newY = ((info.point.y - rect.top) / rect.height) * 100;
                    updatePinPosition(pin.id, Math.min(Math.max(newX, 0), 100), Math.min(Math.max(newY, 0), 100));
                  }}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-20 ${
                    isSelected ? 'z-30' : ''
                  }`}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    if (ev.shiftKey || ev.metaKey || ev.ctrlKey) {
                      setSelectedPinIds(prev => prev.includes(pin.id) ? prev.filter(id => id !== pin.id) : [...prev, pin.id]);
                    } else {
                      setSelectedPinIds([pin.id]);
                    }
                  }}
                >
                  <div className="relative group/pin">
                    {/* Shadow/Glow when selected */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-indigo-400/20 blur-xl rounded-full scale-150 animate-pulse" />
                    )}
                    
                    <div className={`
                      flex flex-col items-center gap-2 p-1.5 transition-all
                      ${isSelected ? 'scale-110' : 'hover:scale-105'}
                    `}>
                      <div className={`
                        relative w-12 h-12 rounded-2xl flex items-center justify-center border-[3px] shadow-2xl transition-all
                        ${isSelected 
                          ? 'bg-indigo-600 border-white text-white rotate-0' 
                          : 'bg-white border-slate-200 text-indigo-600 rotate-3 group-hover/pin:rotate-0'}
                      `}>
                        <MapPin className="w-6 h-6" />
                        
                        {/* Status Dot */}
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                          room?.status === 'occupied' ? 'bg-indigo-600' : 
                          room?.status === 'available' ? 'bg-emerald-500' :
                          room?.status === 'maintenance' ? 'bg-amber-500' :
                          room?.status === 'reserved' ? 'bg-rose-500' :
                          'bg-slate-400'
                        }`} />
                      </div>
                      
                      <div className={`
                        px-3 py-1 rounded-xl text-[11px] font-black transition-all whitespace-nowrap shadow-xl border
                        ${isSelected 
                          ? 'bg-indigo-600 text-white border-indigo-500' 
                          : 'bg-white border-slate-200 text-slate-700'}
                      `}>
                        {pin.name}
                      </div>
                    </div>

                    {/* Resize handle mock or Quick Delete Button */}
                    {isSelected && (
                       <button 
                         onClick={(e) => { e.stopPropagation(); deleteSelection(); }}
                         className="absolute -top-3 -right-3 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
                       >
                         <X className="w-4 h-4" />
                       </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Right Sidebar: Properties */}
        <div className="w-80 border-l border-slate-200 p-6 flex flex-col gap-6 bg-white overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Thuộc tính Ghim</h4>
            {selectedPins.length > 0 && (
               <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-lg">
                 ĐÃ CHỌN {selectedPins.length}
               </span>
            )}
          </div>
          
          <AnimatePresence mode="wait">
            {selectedPins.length > 1 ? (
              <motion.div
                key="multi"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl text-center">
                   <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                     <span className="text-2xl font-black text-indigo-600">{selectedPins.length}</span>
                   </div>
                   <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">Chế độ Chọn nhiều</h5>
                   <p className="text-xs text-slate-500 mt-2 font-medium">Bạn có thể di chuyển nhiều ghim cùng lúc hoặc xóa hàng loạt.</p>
                </div>

                <button 
                  onClick={deleteSelection}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 text-rose-600 font-black text-xs bg-rose-50 border border-rose-100 rounded-2xl hover:bg-rose-100 transition-all shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  XÓA TẤT CẢ ĐÃ CHỌN
                </button>
              </motion.div>
            ) : selectedPin ? (
              <motion.div
                key={selectedPin.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nhãn Ghim</label>
                  <input 
                    type="text" 
                    value={selectedPin.name}
                    onChange={(e) => setPins(pins.map(p => p.id === selectedPin.id ? { ...p, name: e.target.value } : p))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tọa độ Trực quan</label>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">X Pos</p>
                        <p className="text-sm font-black text-slate-900">{selectedPin.x.toFixed(1)}%</p>
                     </div>
                     <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Y Pos</p>
                        <p className="text-sm font-black text-slate-900">{selectedPin.y.toFixed(1)}%</p>
                     </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Kích thước (PX)</label>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="p-4 bg-white border border-slate-200 rounded-2xl group focus-within:border-indigo-500 transition-all">
                        <p className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-400 uppercase mb-1">Chiều rộng</p>
                        <input 
                          type="number"
                          value={selectedPin.width}
                          onChange={(e) => setPins(pins.map(p => p.id === selectedPin.id ? { ...p, width: parseInt(e.target.value) || 0 } : p))}
                          className="w-full text-xs font-black text-slate-900 outline-none"
                        />
                     </div>
                     <div className="p-4 bg-white border border-slate-200 rounded-2xl group focus-within:border-indigo-500 transition-all">
                        <p className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-400 uppercase mb-1">Chiều cao</p>
                        <input 
                          type="number"
                          value={selectedPin.height}
                          onChange={(e) => setPins(pins.map(p => p.id === selectedPin.id ? { ...p, height: parseInt(e.target.value) || 0 } : p))}
                          className="w-full text-xs font-black text-slate-900 outline-none"
                        />
                     </div>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                   <button 
                     onClick={() => {
                        const newX = Math.random() * 80 + 10;
                        const newY = Math.random() * 80 + 10;
                        updatePinPosition(selectedPin.id, newX, newY);
                     }}
                     className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all"
                   >
                     <Move className="w-3 h-3" />
                     Ngẫu nhiên vị trí
                   </button>
                   
                   <button 
                     onClick={deleteSelection}
                     className="w-full flex items-center justify-center gap-2 px-4 py-4 text-rose-600 font-black text-xs bg-white border border-rose-100 rounded-2xl hover:bg-rose-50 transition-all"
                   >
                     <Trash2 className="w-4 h-4" />
                     GỠ KHỎI SƠ ĐỒ
                   </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center text-slate-400 opacity-60">
                <div className="w-16 h-16 rounded-3xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                  <MousePointer2 className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Chưa chọn ghim</p>
                    <p className="text-xs font-medium leading-relaxed px-4 mt-2">
                      Chọn một ghim trên bản đồ để chỉnh sửa thông số hoặc kéo một phòng mới từ cột bên trái.
                    </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

