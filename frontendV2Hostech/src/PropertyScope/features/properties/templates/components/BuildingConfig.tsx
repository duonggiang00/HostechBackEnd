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
      });
    }
  }, [property]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-blue-900 dark:text-blue-500 animate-spin" />
        <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Đang tải thông tin tòa nhà...</p>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <p className="text-sm text-red-700 dark:text-red-400 font-medium">Không thể tải thông tin tòa nhà. Vui lòng thử lại sau.</p>
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
      <div className={`p-2.5 ${colorClass} rounded-lg`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">{title}</h3>
        <p className="text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Action Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0 transition-colors">
            <Building2 className="w-6 h-6 text-blue-900 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 transition-colors">{formData?.name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-medium text-xs transition-colors">
                {formData?.code || property.code}
              </Badge>
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 flex items-center gap-1 transition-colors">
                <MapPin className="w-3.5 h-3.5" /> {formData?.address?.split(',')[0]}
              </span>
            </div>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-6 py-2 shadow-sm transition-colors w-full sm:w-auto"
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu cấu hình
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors"
        >
          <SectionHeader
            icon={Info}
            title="Thông tin cơ bản"
            description="Tên, mã định danh và địa chỉ chính thức"
            colorClass="bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-400 transition-colors"
          />

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 transition-colors">
                  Tên tòa nhà
                </label>
                <Input
                  name="name"
                  value={formData?.name}
                  onChange={handleChange}
                  className="rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-blue-900/20 focus:border-blue-900 font-medium h-10 w-full transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 transition-colors">
                  Mã quản lý
                </label>
                <Input
                  name="code"
                  value={formData?.code}
                  onChange={handleChange}
                  className="rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-blue-900/20 focus:border-blue-900 font-medium h-10 w-full uppercase transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 transition-colors">
                Địa chỉ tòa nhà
              </label>
              <div className="relative">
                <Input
                  name="address"
                  value={formData?.address}
                  onChange={handleChange}
                  className="rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-blue-900/20 focus:border-blue-900 font-medium h-10 pl-9 w-full transition-colors"
                />
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 transition-colors">
                Ghi chú vận hành
              </label>
              <textarea
                name="note"
                value={formData?.note}
                onChange={handleChange as any}
                rows={4}
                className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-blue-900/20 focus:border-blue-900 focus:outline-none focus:ring-2 font-normal p-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-colors"
                placeholder="Nhập ghi chú hoặc quy định nội bộ..."
              />
            </div>
          </div>
        </motion.div>

        {/* Area Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors"
        >
          <SectionHeader
            icon={Ruler}
            title="Diện tích & Định dạng"
            description="Quản lý quy mô và phương thức tính toán"
            colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 transition-colors"
          />

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors">
                  <Ruler className="w-3.5 h-3.5 text-gray-400" /> Tổng diện tích
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    name="area"
                    value={formData?.area}
                    onChange={handleChange}
                    className="rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-blue-900/20 focus:border-blue-900 font-medium h-10 pr-10 w-full transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 transition-colors">m²</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors">
                  <Combine className="w-3.5 h-3.5 text-gray-400" /> Diện tích chung
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    name="shared_area"
                    value={formData?.shared_area}
                    onChange={handleChange}
                    className="rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-blue-900/20 focus:border-blue-900 font-medium h-10 pr-10 w-full transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 transition-colors">m²</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-slate-800/80 rounded-lg border border-gray-100 dark:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-700 rounded-md border border-gray-200 dark:border-slate-600 shadow-sm transition-colors">
                    <Layers className="w-4 h-4 text-blue-900 dark:text-blue-400" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white transition-colors">Kiểm soát diện tích</span>
                  </div>
                </div>
                <div
                  onClick={toggleUseFloors}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${formData?.use_floors ? 'bg-blue-900 dark:bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${formData?.use_floors ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={formData?.use_floors ? 'floor' : 'building'}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                  className="flex items-start gap-2.5 mt-2 transition-colors"
                >
                  <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${formData?.use_floors ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  <p className="text-sm font-normal text-gray-600 dark:text-gray-400 leading-relaxed transition-colors">
                    {formData?.use_floors
                      ? "Đang giới hạn diện tích theo tầng. Tổng diện tích các phòng trên một tầng không được phép vượt quá diện tích tầng đó."
                      : "Đang giới hạn diện tích theo tòa nhà. Tổng diện tích cá nhân của các phòng sẽ được kiểm tra với diện tích khả dụng của cả tòa nhà."}
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
