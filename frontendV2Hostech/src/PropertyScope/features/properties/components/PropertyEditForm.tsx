import { useState, useEffect } from 'react';
import { usePropertyActions } from '@/OrgScope/features/properties/hooks/useProperties';
import { useServices } from '@/PropertyScope/features/services/hooks/useServices';
import type { Property } from '@/OrgScope/features/properties/hooks/useProperties';
import { 
  Save, Loader2, Building2, MapPin, Hash, 
  Ruler, Settings, Users, CheckCircle2, PlusCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PropertyEditFormProps {
  property: Property;
  onSuccess?: () => void;
}

export function PropertyEditForm({ property, onSuccess }: PropertyEditFormProps) {
  const { updateProperty } = usePropertyActions();
  const { data: allServices } = useServices({ per_page: 100 });
  
  const servicesList = Array.isArray(allServices) ? allServices : (allServices as any)?.data || [];

  const [formData, setFormData] = useState<Partial<Property>>({
    name: '',
    code: '',
    address: '',
    area: 0,
    shared_area: 0,
    note: '',
    default_billing_cycle: 'monthly',
    default_due_day: 5,
    default_cutoff_day: 30,
    status: 'active',
    default_services: []
  });

  useEffect(() => {
    if (property) {
      setFormData({
        ...property,
        default_services: property.default_services?.map((s: any) => s.id || s) || []
      });
    }
  }, [property]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProperty.mutateAsync({ id: property.id, data: formData });
      toast.success('Cập nhật thông tin tòa nhà thành công!');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi cập nhật tòa nhà');
    }
  };

  const isSaving = updateProperty.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-50 dark:border-slate-800">
              <Building2 className="w-5 h-5 text-indigo-500" />
              <h2 className="font-bold text-slate-800 dark:text-white">Thông tin cơ bản</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Tên tòa nhà</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium dark:text-white"
                    placeholder="Grand Plaza"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Mã tòa nhà</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Hash className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    required
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium dark:text-white"
                    placeholder="GP-001"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Địa chỉ</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  required
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium dark:text-white"
                  placeholder="123 Harmony St, Central District"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Tổng diện tích (m²)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Ruler className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="number"
                    value={formData.area || 0}
                    onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Diện tích dùng chung (m²)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Users className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="number"
                    value={formData.shared_area || 0}
                    onChange={(e) => setFormData({ ...formData, shared_area: Number(e.target.value) })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium dark:text-white"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-50 dark:border-slate-800">
              <Settings className="w-5 h-5 text-indigo-500" />
              <h2 className="font-bold text-slate-800 dark:text-white">Cài đặt vận hành</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2 col-span-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Chu kỳ thanh toán mặc định</label>
                <select 
                  value={formData.default_billing_cycle}
                  onChange={(e) => setFormData({ ...formData, default_billing_cycle: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 outline-none font-medium appearance-none dark:text-white"
                >
                  <option value="monthly">Hàng tháng</option>
                  <option value="quarterly">Hàng quý</option>
                  <option value="yearly">Hàng năm</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Ngày đến hạn (trong tháng)</label>
                <input
                  type="number"
                  min="1" max="31"
                  value={formData.default_due_day}
                  onChange={(e) => setFormData({ ...formData, default_due_day: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 outline-none font-medium dark:text-white"
                />
              </div>

               <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Ngày chốt dữ liệu</label>
                <input
                  type="number"
                   min="1" max="31"
                  value={formData.default_cutoff_day}
                  onChange={(e) => setFormData({ ...formData, default_cutoff_day: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 outline-none font-medium dark:text-white"
                />
              </div>
            </div>
          </section>

          {/* Default Services Section */}
          <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <PlusCircle className="w-5 h-5 text-indigo-500" />
                <h2 className="font-bold text-slate-800 dark:text-white">Dịch vụ mặc định</h2>
              </div>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg font-bold uppercase tracking-wider">
                Kế thừa tự động
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {servicesList.length === 0 && (
                <div className="col-span-full py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-slate-400 text-sm font-medium">Chưa có dịch vụ nào.</p>
                </div>
              )}
              {servicesList.map((service: any) => {
                const isSelected = formData.default_services?.includes(service.id);
                return (
                  <div 
                    key={service.id}
                    onClick={() => {
                      const current = formData.default_services || [];
                      const next = isSelected 
                        ? current.filter(sid => sid !== service.id)
                        : [...current, service.id];
                      setFormData({ ...formData, default_services: next });
                    }}
                    className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/30' 
                        : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl border transition-colors ${
                        isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                      }`}>
                        <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-300 dark:text-slate-600'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {service.name}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">{service.unit}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
           <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" />
              Ghi chú
            </h3>
            <textarea
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 outline-none text-sm resize-none font-medium dark:text-white"
              placeholder="Ghi chú nội bộ..."
            />
          </section>

          <div className="sticky top-24 space-y-3">
            <button
              disabled={isSaving}
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isSaving ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  Cập nhật tòa nhà
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
