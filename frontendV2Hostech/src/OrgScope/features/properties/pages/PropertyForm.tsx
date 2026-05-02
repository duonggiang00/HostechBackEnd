import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePropertyActions, usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import { useServices } from '@/PropertyScope/features/services/hooks/useServices';
import type { Property } from '@/OrgScope/features/properties/hooks/useProperties';
import { useAuth } from '@/shared/features/auth/hooks/useAuth';
import { 
  Save, Loader2, Building2, MapPin, Hash, 
  Ruler, FileText, Settings, CreditCard, Users, CheckCircle2, PlusCircle
} from 'lucide-react';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';

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
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const fieldBase =
    'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white outline-none transition-all placeholder:text-slate-600 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20';
  const labelCls = 'text-sm font-bold text-slate-300 ml-1';

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <PageBackButton className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-slate-300 hover:bg-white/10" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {isEdit ? 'Chỉnh sửa cơ sở' : 'Đăng ký cơ sở mới'}
            </h1>
            <p className="mt-1 text-slate-500">
              {isEdit ? 'Cập nhật thông tin tài sản.' : 'Thêm tài sản mới vào danh mục của bạn.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 md:col-span-2">
          <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="flex items-center gap-3 border-b border-white/10 pb-2">
              <Building2 className="h-5 w-5 text-emerald-400" />
              <h2 className="font-bold text-white">Thông tin cơ bản</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className={labelCls}>Tên cơ sở</label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Building2 className="h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                  </div>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`${fieldBase} pl-11`}
                    placeholder="Grand Plaza"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelCls}>Mã cơ sở</label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Hash className="h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                  </div>
                  <input
                    required
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className={`${fieldBase} pl-11`}
                    placeholder="GP-001"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Địa chỉ</label>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <MapPin className="h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                </div>
                <input
                  required
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`${fieldBase} pl-11`}
                  placeholder="123 Harmony St, Central District"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className={labelCls}>Tổng diện tích (m²)</label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Ruler className="h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                  </div>
                  <input
                    type="number"
                    value={formData.area || 0}
                    onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                    className={`${fieldBase} pl-11`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelCls}>Diện tích lối đi chung (m²)</label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Users className="h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                  </div>
                  <input
                    type="number"
                    value={formData.shared_area || 0}
                    onChange={(e) => setFormData({ ...formData, shared_area: Number(e.target.value) })}
                    className={`${fieldBase} pl-11`}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="flex items-center gap-3 border-b border-white/10 pb-2">
              <Settings className="h-5 w-5 text-emerald-400" />
              <h2 className="font-bold text-white">Cài đặt vận hành</h2>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="col-span-2 space-y-2">
                <label className={labelCls}>Chu kỳ thanh toán mặc định</label>
                <select
                  value={formData.default_billing_cycle}
                  onChange={(e) => setFormData({ ...formData, default_billing_cycle: e.target.value as any })}
                  className={`${fieldBase} appearance-none`}
                >
                  <option value="monthly">Hàng tháng</option>
                  <option value="quarterly">Hàng quý</option>
                  <option value="yearly">Hàng năm</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className={labelCls}>Ngày đến hạn (trong tháng)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.default_due_day}
                  onChange={(e) => setFormData({ ...formData, default_due_day: Number(e.target.value) })}
                  className={fieldBase}
                />
              </div>

              <div className="space-y-2">
                <label className={labelCls}>Ngày chốt dữ liệu</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.default_cutoff_day}
                  onChange={(e) => setFormData({ ...formData, default_cutoff_day: Number(e.target.value) })}
                  className={fieldBase}
                />
              </div>
            </div>
          </section>

          <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-3">
                <PlusCircle className="h-5 w-5 text-emerald-400" />
                <h2 className="font-bold text-white">Dịch vụ mặc định của tòa nhà</h2>
              </div>
              <span className="rounded-lg bg-emerald-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Kế thừa tự động
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {servicesList.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-white/15 py-8 text-center">
                  <p className="text-sm font-medium text-slate-500">Chưa có dịch vụ nào trong tổ chức.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/property-scope/services/create')}
                    className="mt-2 text-sm font-bold text-emerald-400 hover:underline"
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
                      const next = isSelected ? current.filter((sid) => sid !== service.id) : [...current, service.id];
                      setFormData({ ...formData, default_services: next });
                    }}
                    className={`group relative cursor-pointer select-none rounded-2xl border-2 p-4 transition-all ${
                      isSelected
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-xl border p-2 transition-colors ${
                          isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <CheckCircle2 className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-bold ${isSelected ? 'text-emerald-200' : 'text-white'}`}>
                          {service.name}
                        </p>
                        <p className="text-xs font-medium text-slate-500">{service.unit}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute right-2 top-2 flex gap-1">
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-500">
              Lưu ý: Dịch vụ được chọn sẽ tự động áp dụng cho tất cả phòng thuộc tòa nhà này, trừ khi được ghi đè thủ công.
            </p>
          </section>
        </div>

        <div className="space-y-6">
          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="flex items-center gap-2 font-bold text-white">
              <FileText className="h-4 w-4 text-emerald-400" />
              Ghi chú
            </h3>
            <textarea
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className={`${fieldBase} h-32 resize-none text-sm`}
              placeholder="Ghi chú nội bộ cho ban quản lý..."
            />
          </section>

          <section className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.07] p-6 ring-1 ring-emerald-500/10">
            <div className="space-y-1">
              <h3 className="flex items-center gap-2 font-bold text-white">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                Tài khoản ngân hàng
              </h3>
              <p className="text-xs text-slate-500">Dùng cho hóa đơn tự động</p>
            </div>
            <p className="text-sm text-slate-500">Tính năng cấu hình ngân hàng đang được phát triển.</p>
          </section>

          <div className="space-y-3">
            <button
              disabled={isSaving}
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-black text-white shadow-xl shadow-emerald-500/25 transition-all hover:bg-emerald-400 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isSaving ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Save className="h-6 w-6" />
                  {isEdit ? 'Cập nhật tòa nhà' : 'Lưu tòa nhà'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/org/properties')}
              className="w-full py-4 font-bold text-slate-500 transition-colors hover:text-slate-300"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
