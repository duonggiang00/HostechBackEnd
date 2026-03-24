import { useState } from 'react';
import { 
  X, Box, Maximize2, Coins, Plus, Trash2, Users, Zap, Gauge, Check, Loader2, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RoomTemplate, RoomTemplateAsset, RoomTemplateMeter } from '../../types';
import { ActionButton } from '@/shared/components/ui/ActionButton';
import { formatNumber, parseNumber } from '@/lib/utils';

interface RoomTemplateDialogProps {
  initialData?: RoomTemplate | null;
  propertyId: string;
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving?: boolean;
}

const ROOM_TYPES = ['standard', 'studio', 'duplex', 'penthouse'] as const;

export function RoomTemplateDialog({ initialData, propertyId, onClose, onSave, isSaving }: RoomTemplateDialogProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    room_type: initialData?.room_type ?? 'standard',
    area: initialData?.area ?? 25,
    capacity: initialData?.capacity ?? 2,
    base_price: initialData?.base_price ?? 0,
    description: initialData?.description ?? '',
    amenities: initialData?.amenities ?? [],
    utilities: initialData?.utilities ?? [],
  });

  const [assets, setAssets] = useState<RoomTemplateAsset[]>(initialData?.assets ?? []);
  const [meters, setMeters] = useState<RoomTemplateMeter[]>(initialData?.meters ?? [
    { type: 'ELECTRIC' },
    { type: 'WATER' }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Tên mẫu không được để trống';
    if (formData.area <= 0) newErrors.area = 'Diện tích phải lớn hơn 0';
    if (formData.capacity <= 0) newErrors.capacity = 'Sức chứa phải ít nhất 1';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setStep(1);
      return;
    }

    onSave({
      ...formData,
      property_id: propertyId,
      assets,
      meters
    });
  };

  const addAsset = () => setAssets([...assets, { name: '' }]);
  const removeAsset = (idx: number) => setAssets(assets.filter((_, i) => i !== idx));
  const updateAsset = (idx: number, name: string) => {
    const newAssets = [...assets];
    newAssets[idx].name = name;
    setAssets(newAssets);
  };

  const toggleMeter = (type: 'ELECTRIC' | 'WATER') => {
    if (meters.some(m => m.type === type)) {
      setMeters(meters.filter(m => m.type !== type));
    } else {
      setMeters([...meters, { type }]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* Dialog */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl dark:shadow-black/50 w-full max-w-4xl overflow-hidden border border-transparent dark:border-white/10"
      >
        {/* Header */}
        <div className="px-10 pt-10 pb-6 flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50">
          <div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
              {initialData ? 'Chỉnh sửa mẫu' : 'Tạo mẫu cấu hình'}
            </h3>
            <div className="flex gap-4 mt-2">
              {[1, 2].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${step >= s ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s ? 'text-indigo-500' : 'text-slate-400'}`}>
                    Bước {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 pr-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-8">
                    {/* Name */}
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tên biểu mẫu</label>
                      <div className="relative group">
                        <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          autoFocus
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ví dụ: Căn hộ Studio cao cấp"
                          className={`w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none font-bold text-slate-900 dark:text-white transition-all ${
                            errors.name ? 'border-rose-500/50 ring-4 ring-rose-500/5' : 'border-slate-100 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Type */}
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Loại phòng</label>
                        <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                          <select
                            value={formData.room_type}
                            onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-900 dark:text-white capitalize focus:border-indigo-500"
                          >
                            {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Giá thuê mặc định</label>
                        <div className="relative group">
                          <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                          <input
                            value={formatNumber(formData.base_price)}
                            onChange={(e) => setFormData({ ...formData, base_price: Number(parseNumber(e.target.value)) || 0 })}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Area */}
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Diện tích (m²)</label>
                        <div className="relative group">
                          <Maximize2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                          <input
                            type="number"
                            value={formData.area}
                            onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) || 0 })}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-900 dark:text-white focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Capacity */}
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Sức chứa tối đa</label>
                        <div className="relative group">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                          <input
                            type="number"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) || 0 })}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-900 dark:text-white focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Regulation */}
                  <div className="lg:col-span-4">
                    <div className="bg-indigo-50 shadow-sm border border-indigo-100 rounded-[32px] p-6 space-y-6 sticky top-0">
                      <div className="flex items-center gap-3 text-indigo-600">
                        <ShieldAlert className="w-5 h-5" />
                        <h4 className="font-black text-xs uppercase tracking-wider">Quy định diện tích</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 shrink-0">1</div>
                          <p className="text-[11px] font-bold text-slate-600 leading-relaxed">Phòng tối thiểu <span className="text-indigo-600">10 m²</span>.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 shrink-0">2</div>
                          <div className="space-y-3">
                            <p className="text-[11px] font-bold text-slate-600">Số người ở tối đa:</p>
                            <div className="grid grid-cols-1 gap-1.5 opacity-80">
                              {[
                                { area: '10-20 m²', max: '2' },
                                { area: '20-30 m²', max: '3' },
                                { area: '30-60 m²', max: '5' },
                                { area: 'Trên 60 m²', max: '6' },
                              ].map((rule, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white border border-indigo-50">
                                  <span className="text-[10px] font-black text-slate-400 uppercase">{rule.area}</span>
                                  <span className="text-[10px] font-black text-indigo-600 uppercase">{rule.max} người</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Assets */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Danh sách nội thất</label>
                    <button type="button" onClick={addAsset} className="text-[10px] font-black uppercase text-indigo-500 flex items-center gap-1 hover:underline">
                      <Plus className="w-3 h-3" /> Thêm nội thất
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {assets.map((asset, idx) => (
                      <div key={idx} className="flex gap-3 items-center group">
                        <div className="relative flex-1">
                          <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                          <input
                            value={asset.name}
                            onChange={(e) => updateAsset(idx, e.target.value)}
                            placeholder="Tên nội thất (ví dụ: Điều hòa Inverter)"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl outline-none font-bold text-sm text-slate-900 dark:text-white focus:border-violet-500"
                          />
                        </div>
                        <ActionButton 
                          variant="glass" 
                          size="sm" 
                          icon={Trash2}
                          label=""
                          onClick={() => removeAsset(idx)} 
                          className="text-rose-500 hover:bg-rose-50" 
                        />
                      </div>
                    ))}
                    {assets.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl">
                        <p className="text-xs font-bold text-slate-400 italic">Chưa có nội thất nào được thêm</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Meters */}
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Công tơ & Tiện ích</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => toggleMeter('ELECTRIC')}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        meters.some(m => m.type === 'ELECTRIC')
                          ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Gauge className="w-5 h-5" />
                        <span className="font-black text-sm uppercase">Công tơ điện</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 p-0.5 flex items-center justify-center ${meters.some(m => m.type === 'ELECTRIC') ? 'border-amber-500 bg-amber-500' : 'border-slate-200'}`}>
                        {meters.some(m => m.type === 'ELECTRIC') && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleMeter('WATER')}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        meters.some(m => m.type === 'WATER')
                          ? 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Gauge className="w-5 h-5" />
                        <span className="font-black text-sm uppercase">Công tơ nước</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 p-0.5 flex items-center justify-center ${meters.some(m => m.type === 'WATER') ? 'border-blue-500 bg-blue-500' : 'border-slate-200'}`}>
                        {meters.some(m => m.type === 'WATER') && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Actions */}
          <div className="pt-10 flex gap-4 pr-4">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 px-8 py-5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
              >
                Quay lại
              </button>
            )}
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-2 px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-indigo-900/30 active:scale-95"
              >
                Tiếp tục
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className="flex-2 flex items-center justify-center gap-3 px-8 py-5 bg-emerald-500 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 dark:shadow-emerald-900/30 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Check className="w-6 h-6" /> Hoàn tất</>}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
