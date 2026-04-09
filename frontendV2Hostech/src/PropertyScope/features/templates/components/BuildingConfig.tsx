import { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Ruler, 
  Combine, 
  Layers, 
  Save,
  Loader2,
  AlertCircle,
  Info
} from 'lucide-react';
import { usePropertyDetail, usePropertyActions } from '@/OrgScope/features/properties/hooks/useProperties';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';

interface BuildingConfigProps {
  propertyId: string;
}

export function BuildingConfig({ propertyId }: BuildingConfigProps) {
  const { data: property, isLoading, isError } = usePropertyDetail(propertyId);
  const { updateProperty } = usePropertyActions();
  
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || '',
        code: property.code || '',
        address: property.address || '',
        note: property.note || '',
        area: property.area || 0,
        shared_area: property.shared_area || 0,
        use_floors: property.use_floors ?? false,
        default_rent_price_per_m2: property.default_rent_price_per_m2 || 0,
        default_deposit_months: property.default_deposit_months || 0,
        default_due_day: property.default_due_day || 5,
        default_cutoff_day: property.default_cutoff_day || 1,
      });
    }
  }, [property]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Đang tải thông tin tòa nhà...</p>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-3xl flex items-center gap-4">
        <AlertCircle className="w-6 h-6 text-red-600" />
        <p className="text-red-700 dark:text-red-400 font-medium">Không thể tải thông tin tòa nhà. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!formData || isSaving) return;
    
    setIsSaving(true);
    try {
      await updateProperty.mutateAsync({
        id: propertyId,
        data: formData
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const toggleUseFloors = () => {
    setFormData((prev: any) => ({
      ...prev,
      use_floors: !prev.use_floors
    }));
  };

  const SectionHeader = ({ icon: Icon, title, description, colorClass }: any) => (
    <div className="flex items-start gap-4 mb-6">
      <div className={`p-3 ${colorClass} rounded-2xl`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
        <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Action Header */}
      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-white dark:border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{formData?.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-[10px] uppercase">
                {formData?.code || property.code}
              </Badge>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {formData?.address?.split(',')[0]}
              </span>
            </div>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl px-6 py-6 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-105 active:scale-95 gap-2"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          LƯU CẤU HÌNH
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl"
        >
          <SectionHeader 
            icon={Info} 
            title="Thông tin cơ bản" 
            description="Tên, mã định danh và địa chỉ chính thức" 
            colorClass="bg-blue-500/10 text-blue-600"
          />

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên tòa nhà</label>
                <Input 
                  name="name" 
                  value={formData?.name} 
                  onChange={handleChange}
                  className="rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-indigo-500/20 font-bold h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã quản lý</label>
                <Input 
                  name="code" 
                  value={formData?.code} 
                  onChange={handleChange}
                  className="rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-indigo-500/20 font-bold h-12 uppercase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ tòa nhà</label>
              <div className="relative">
                <Input 
                  name="address" 
                  value={formData?.address} 
                  onChange={handleChange}
                  className="rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-indigo-500/20 font-bold h-12 pl-10"
                />
                <MapPin className="w-5 h-5 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ghi chú vận hành</label>
              <textarea 
                name="note" 
                value={formData?.note} 
                onChange={handleChange as any}
                rows={3}
                className="w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-indigo-500/20 font-bold p-4 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </motion.div>

        {/* Area Configuration */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl"
        >
          <SectionHeader 
            icon={Ruler} 
            title="Diện tích & Định dạng" 
            description="Quản lý quy mô và phương thức tính toán" 
            colorClass="bg-emerald-500/10 text-emerald-600"
          />

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Ruler className="w-3 h-3" /> Tổng diện tích
                </label>
                <div className="relative">
                  <Input 
                    type="number"
                    name="area" 
                    value={formData?.area} 
                    onChange={handleChange}
                    className="rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-indigo-500/20 font-bold h-12 pr-12 text-lg"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">m²</span>
                </div>
              </div>
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Combine className="w-3 h-3" /> Diện tích chung (Shared)
                </label>
                <div className="relative">
                  <Input 
                    type="number"
                    name="shared_area" 
                    value={formData?.shared_area} 
                    onChange={handleChange}
                    className="rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-indigo-500/20 font-bold h-12 pr-12 text-lg"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">m²</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 rounded-xl">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Ngữ cảnh giới hạn diện tích</span>
                  </div>
                </div>
                <div 
                  onClick={toggleUseFloors}
                  className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${formData?.use_floors ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${formData?.use_floors ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div 
                  key={formData?.use_floors ? 'floor' : 'building'}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-start gap-4"
                >
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-full">
                    <AlertCircle className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                    {formData?.use_floors 
                      ? "Đang sử dụng [GIỚI HẠN THEO TẦNG]. Tổng diện tích từng tầng sẽ được dùng để kiểm tra tính hợp lệ khi tạo phòng mới."
                      : "Đang sử dụng [GIỚI HẠN THEO TÒA NHÀ]. Toàn bộ diện tích tòa nhà (trừ diện tích chung) sẽ được dùng làm tổng mức giới hạn cho tất cả phòng."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>


      </div>
    </div>
  );
}
