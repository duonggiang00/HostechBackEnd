import { useState } from 'react';
import { Plus, Trash2, Loader2, Layers, CopyPlus, FileImage } from 'lucide-react';
import { useFloors, useFloorActions, type Floor } from '@/PropertyScope/features/floors/hooks/useFloors';
import { useScopeStore } from '@/shared/stores/useScopeStore';
import { toast } from 'react-hot-toast';

interface FloorManagerProps {
    onFloorSelect?: (floor: Floor | null) => void;
    selectedFloorId?: string | null;
}

export default function FloorManager({ onFloorSelect, selectedFloorId }: FloorManagerProps) {
  const { propertyId } = useScopeStore();
  const { data: floors, isLoading } = useFloors(propertyId || undefined);
  const { createFloor, deleteFloor, uploadFloorPlan } = useFloorActions();
  
  const [isAdding, setIsAdding] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [floorCount, setFloorCount] = useState(1);
  const [newFloorName, setNewFloorName] = useState('');

  const handleAddFloor = () => {
    if (!newFloorName || !propertyId) return;
    createFloor.mutate({ 
        name: newFloorName, 
        code: `F${newFloorName.replace(/\s+/g, '')}`.toUpperCase(),
        property_id: propertyId,
        floor_number: (floors?.length || 0) + 1 
    }, {
      onSuccess: () => {
        setNewFloorName('');
        setIsAdding(false);
        toast.success('Đã thêm tầng thành công');
      }
    });
  };

  const handleAutoGenerate = async () => {
    if (!floorCount || !propertyId) return;
    setIsAutoGenerating(false);
    
    let successCount = 0;
    const currentCount = floors?.length || 0;
    
    const toastId = toast.loading('Đang khởi tạo các tầng...');
    
    try {
        for (let i = 1; i <= floorCount; i++) {
            await createFloor.mutateAsync({
                name: `Tầng ${currentCount + i}`,
                code: `F${currentCount + i}`,
                property_id: propertyId,
                floor_number: currentCount + i
            });
            successCount++;
        }
        toast.success(`Đã khởi tạo thành công ${successCount} tầng`, { id: toastId });
    } catch (error) {
        toast.error('Khởi tạo một số tầng thất bại', { id: toastId });
    } finally {
        setFloorCount(1);
    }
  };

  const handleFileUpload = (floorId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        uploadFloorPlan.mutate({ id: floorId, file }, {
            onSuccess: () => toast.success('Đã tải lên sơ đồ tầng'),
            onError: () => toast.error('Tải lên thất bại')
        });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          <span className="font-bold text-slate-800">Cấu trúc tầng</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => { setIsAutoGenerating(true); setIsAdding(false); }}
            className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
            title="Tự động tạo tầng"
          >
            <CopyPlus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => { setIsAdding(true); setIsAutoGenerating(false); }}
            className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {isAdding && (
          <div className="p-3 bg-white border-2 border-indigo-500 rounded-2xl shadow-lg ring-4 ring-indigo-500/5 animate-in slide-in-from-top-2">
            <input 
              placeholder="VD: Tầng 1, Tầng hầm"
              autoFocus
              value={newFloorName}
              onChange={(e) => setNewFloorName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFloor()}
              className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border-none rounded-xl outline-none"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400"
              >
                Hủy
              </button>
              <button 
                onClick={handleAddFloor}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100"
              >
                Tạo
              </button>
            </div>
          </div>
        )}

        {isAutoGenerating && (
          <div className="p-3 bg-white border-2 border-indigo-500 rounded-2xl shadow-lg ring-4 ring-indigo-500/5 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2">
              <CopyPlus className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-bold text-slate-700">Tự động khởi tạo tầng</span>
            </div>
            <input 
              type="number"
              min="1"
              max="50"
              placeholder="Số lượng tầng"
              autoFocus
              value={floorCount}
              onChange={(e) => setFloorCount(parseInt(e.target.value) || 1)}
              onKeyDown={(e) => e.key === 'Enter' && handleAutoGenerate()}
              className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border-none rounded-xl outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-2 font-medium px-1">
              Will generate names like "Tầng { (floors?.length || 0) + 1 }", "Tầng { (floors?.length || 0) + 2 }"
            </p>
            <div className="flex justify-end gap-2 mt-3">
              <button 
                onClick={() => setIsAutoGenerating(false)}
                className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600"
              >
                Hủy
              </button>
              <button 
                onClick={handleAutoGenerate}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-95"
              >
                Khởi tạo
              </button>
            </div>
          </div>
        )}

        {floors?.map((floor) => (
          <div 
            key={floor.id}
            onClick={() => onFloorSelect?.(floor)}
            className={`
              group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer
              ${selectedFloorId === floor.id 
                ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100 -translate-y-0.5' 
                : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5'}
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                ${selectedFloorId === floor.id ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-indigo-50'}
              `}>
                <span className={`text-sm font-black ${selectedFloorId === floor.id ? 'text-white' : 'text-slate-600'}`}>
                    {floor.floor_number}
                </span>
              </div>
              <div>
                <p className={`text-sm font-bold ${selectedFloorId === floor.id ? 'text-white' : 'text-slate-800'}`}>
                  {floor.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-black uppercase tracking-wider ${selectedFloorId === floor.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {floor.rooms_count || 0} Phòng
                    </span>
                    {floor.floor_plan_image && (
                        <div className={`w-1 h-1 rounded-full ${selectedFloorId === floor.id ? 'bg-indigo-200' : 'bg-emerald-400'}`} />
                    )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="p-2 text-slate-400 hover:text-indigo-500 cursor-pointer">
                    <FileImage className={`w-4 h-4 ${selectedFloorId === floor.id ? 'text-white' : ''}`} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(floor.id, e)} />
                </label>
                <button className="p-2 text-slate-400 hover:text-rose-500">
                    <Trash2 
                        className={`w-4 h-4 ${selectedFloorId === floor.id ? 'text-white' : ''}`} 
                        onClick={(e) => {
                            e.stopPropagation();
                            if(confirm('Xóa tầng này và tất cả các phòng thuộc tầng này?')) deleteFloor.mutate(floor.id);
                        }}
                    />
                </button>
            </div>
          </div>
        ))}

        {!isLoading && floors?.length === 0 && !isAdding && (
          <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-[2rem]">
            <p className="text-xs font-bold text-slate-400">Chưa có tầng nào được thiết lập</p>
          </div>
        )}
      </div>
    </div>
  );
}
