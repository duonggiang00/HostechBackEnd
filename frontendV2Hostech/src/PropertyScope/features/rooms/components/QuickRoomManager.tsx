import { useState } from 'react';
import { Plus, Loader2, Zap, Hash, Type } from 'lucide-react';
import { useRoomActions } from '@/PropertyScope/features/rooms/hooks/useRooms';
import { toast } from 'react-hot-toast';

interface QuickRoomManagerProps {
  propertyId: string;
  floorId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function QuickRoomManager({ propertyId, floorId, onSuccess, onCancel }: QuickRoomManagerProps) {
  const { batchCreateRooms } = useRoomActions();
  const [count, setCount] = useState(5);
  const [prefix, setPrefix] = useState('Room');
  const [startNumber, setStartNumber] = useState(1);

  const handleBatchCreate = () => {
    batchCreateRooms.mutate({
      property_id: propertyId,
      floor_id: floorId,
      count,
      prefix,
      start_number: startNumber
    }, {
      onSuccess: () => {
        toast.success(`Đã xếp hàng ${count} phòng để khởi tạo thành công`);
        onSuccess?.();
      },
      onError: () => toast.error('Tạo nhanh thất bại')
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3">
        <Zap className="w-5 h-5 text-indigo-500 shrink-0" />
        <div>
            <p className="text-xs font-bold text-indigo-900">Tạo lô phòng thần kỳ</p>
            <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
              Ngay lập tức điền vào tầng của bạn với nhiều phòng. Chúng sẽ được tạo dưới dạng <span className="font-black">Bản nháp</span> để tinh chỉnh thêm.
            </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số lượng phòng</label>
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số bắt đầu</label>
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="number"
              value={startNumber}
              onChange={(e) => setStartNumber(Number(e.target.value))}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiền tố tên</label>
        <div className="relative">
          <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm"
            placeholder="VD: Phòng, Căn hộ, Apartment"
          />
        </div>
        <p className="text-[9px] text-slate-400 font-medium ml-1">Sẽ tạo: {prefix} {startNumber}, {prefix} {startNumber + 1}...</p>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button 
          onClick={onCancel}
          className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
        >
          Hủy
        </button>
        <button 
          onClick={handleBatchCreate}
          disabled={batchCreateRooms.isPending}
          className="flex-1 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {batchCreateRooms.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Tạo {count} Phòng
        </button>
      </div>
    </div>
  );
}
