import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePropertyActions, usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import { useServices } from '@/PropertyScope/features/services/hooks/useServices';
import type { Property } from '@/OrgScope/features/properties/hooks/useProperties';
import { useAuth } from '@/shared/features/auth/hooks/useAuth';
import { 
  ArrowLeft, Save, Loader2, Building2, MapPin, Hash, 
  Ruler, FileText, Settings, CreditCard, Users, CheckCircle2, PlusCircle
} from 'lucide-react';

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { user } = useAuth();
  const currentOrgId = user?.org_id;
  
  const { data: existingProperty, isLoading: isFetching } = usePropertyDetail(id);
  const { createProperty, updateProperty } = usePropertyActions();
  const { data: allServices } = useServices({ per_page: 100 });
  
  const servicesList = Array.isArray(allServices) ? allServices : (allServices as any)?.data || [];

  const [formData, setFormData] = useState<Partial<Property> & { org_id?: string }>({
    name: '',
    code: '',
    address: '',
    org_id: '',
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
    if (!isEdit && currentOrgId) {
      setFormData(prev => ({ ...prev, org_id: currentOrgId }));
    }
  }, [isEdit, currentOrgId]);

  useEffect(() => {
    if (existingProperty) {
      setFormData({
        ...existingProperty,
        default_services: existingProperty.default_services?.map((s: any) => s.id || s) || []
      });
    }
  }, [existingProperty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateProperty.mutateAsync({ id: id!, data: formData });
      } else {
        await createProperty.mutateAsync(formData);
      }
      navigate('/org/properties');
    } catch (error) {
      console.error('Failed to save property:', error);
    }
  };

  const isSaving = createProperty.isPending || updateProperty.isPending;

  if (isEdit && isFetching) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {isEdit ? 'Edit Property' : 'Register New Property'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isEdit ? 'Update details for your asset.' : 'Add a new asset to your portfolio.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
              <Building2 className="w-5 h-5 text-indigo-500" />
              <h2 className="font-bold text-slate-800">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Property Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                    placeholder="Grand Plaza"
                  />
                </div>
              </div>


              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Property Code</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Hash className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    required
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                    placeholder="GP-001"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  required
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                  placeholder="123 Harmony St, Central District"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Total area (m²)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Ruler className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="number"
                    value={formData.area || 0}
                    onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Shared area (m²)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Users className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="number"
                    value={formData.shared_area || 0}
                    onChange={(e) => setFormData({ ...formData, shared_area: Number(e.target.value) })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
              <Settings className="w-5 h-5 text-indigo-500" />
              <h2 className="font-bold text-slate-800">Cài đặt vận hành</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 col-span-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Chu kỳ thanh toán mặc định</label>
                <select 
                  value={formData.default_billing_cycle}
                  onChange={(e) => setFormData({ ...formData, default_billing_cycle: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none font-medium appearance-none"
                >
                  <option value="monthly">Hàng tháng</option>
                  <option value="quarterly">Hàng quý</option>
                  <option value="yearly">Hàng năm</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Ngày đến hạn (trong tháng)</label>
                <input
                  type="number"
                  min="1" max="31"
                  value={formData.default_due_day}
                  onChange={(e) => setFormData({ ...formData, default_due_day: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none font-medium"
                />
              </div>

               <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Ngày chốt dữ liệu</label>
                <input
                  type="number"
                   min="1" max="31"
                  value={formData.default_cutoff_day}
                  onChange={(e) => setFormData({ ...formData, default_cutoff_day: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none font-medium"
                />
              </div>
            </div>
          </section>

          {/* Default Services Section */}
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <PlusCircle className="w-5 h-5 text-indigo-500" />
                <h2 className="font-bold text-slate-800">Dịch vụ mặc định của tòa nhà</h2>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-bold uppercase tracking-wider">
                Kế thừa tự động
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {servicesList.length === 0 && (
                <div className="col-span-full py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm font-medium">Chưa có dịch vụ nào trong tổ chức.</p>
                  <button 
                    type="button"
                    onClick={() => navigate('/property-scope/services/create')}
                    className="mt-2 text-indigo-600 text-sm font-bold hover:underline"
                  >
                    + Tạo dịch vụ chung
                  </button>
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
                        : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl border transition-colors ${
                        isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                          {service.name}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">{service.unit}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
              Lưu ý: Dịch vụ được chọn sẽ tự động áp dụng cho tất cả phòng thuộc tòa nhà này, trừ khi được ghi đè thủ công.
            </p>
          </section>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
           <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Ghi chú
            </h3>
            <textarea
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none text-sm resize-none font-medium"
              placeholder="Ghi chú nội bộ cho ban quản lý..."
            />
          </section>

          <section className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-lg space-y-6">
             <div className="space-y-1">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  Tài khoản ngân hàng
                </h3>
                <p className="text-slate-500 text-xs">Dùng cho hóa đơn tự động</p>
             </div>
             <p className="text-slate-400 text-sm italic">Tính năng cấu hình ngân hàng đang được phát triển.</p>
          </section>

          <div className="space-y-3">
            <button
              disabled={isSaving}
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isSaving ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  {isEdit ? 'Cập nhật tòa nhà' : 'Lưu tòa nhà'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/org/properties')}
              className="w-full py-4 text-slate-500 font-bold hover:text-slate-700 transition-colors"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
