import { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Ruler, 
  Combine, 
  Coins, 
  ShieldCheck, 
  Calendar,
  Save,
  Loader2,
  AlertCircle,
  Info,
  Edit3,
  Square,
  Share2,
  CreditCard,
  Gauge,
  Wallet,
  Key,
  ChevronLeft
} from 'lucide-react';
import { usePropertyDetail, usePropertyActions } from '@/OrgScope/features/properties/hooks/useProperties';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

interface PropertyInfoViewProps {
  propertyId: string;
}

export function PropertyInfoView({ propertyId }: PropertyInfoViewProps) {
  const { data: property, isLoading, isError } = usePropertyDetail(propertyId);
  const { updateProperty } = usePropertyActions();
  
  const [isEditing, setIsEditing] = useState(false);
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
        default_rent_price_per_m2: property.default_rent_price_per_m2 || 0,
        default_deposit_months: property.default_deposit_months || 0,
        default_due_day: property.default_due_day || 5,
        default_cutoff_day: property.default_cutoff_day || 1,
      });
    }
  }, [property]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-5xl">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-4">
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
      setIsEditing(false);
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

  // UI Components inside for better modularity
  const InfoSection = ({ title, children, fullWidth = false }: { title: string; children: React.ReactNode; fullWidth?: boolean }) => (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm ${fullWidth ? 'col-span-full' : ''}`}>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6 border-b border-slate-50 dark:border-slate-800 pb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children}
      </div>
    </div>
  );

  const InfoItem = ({ icon: Icon, label, value, colorClass = "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" }: any) => (
    <div className="flex gap-4 group">
      <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="font-bold text-slate-900 dark:text-white truncate">{value || '---'}</p>
      </div>
    </div>
  );

  const SectionHeader = ({ title, description }: { title: string, description: string }) => (
    <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </div>
  );

  const billingCycleLabels: Record<string, string> = {
    monthly: "Hàng tháng",
    quarterly: "Hàng quý",
    yearly: "Hàng năm",
  };

  // View Mode
  if (!isEditing) {
    return (
      <div className="space-y-6 max-w-6xl pb-20 animate-in fade-in duration-500">
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{property.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-black uppercase">
                  {property.code}
                </span>
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 ml-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {property.address}
                </span>
              </div>
            </div>
          </div>
          <Button 
            onClick={() => setIsEditing(true)}
            variant="default"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg h-11 px-6 gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Edit3 className="w-4 h-4" />
            CHỈNH SỬA THÔNG TIN
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoSection title="Thông tin cơ bản">
            <InfoItem icon={Building2} label="Tên tòa nhà" value={property.name} />
            <InfoItem icon={MapPin} label="Địa chỉ đầy đủ" value={property.address} />
            <InfoItem icon={Square} label="Tổng diện tích" value={property.area ? `${property.area.toLocaleString('vi-VN')} m²` : '---'} />
            <InfoItem icon={Share2} label="Diện tích chung" value={property.shared_area ? `${property.shared_area.toLocaleString('vi-VN')} m²` : '---'} />
          </InfoSection>

          <InfoSection title="Chu kỳ & Ngày hạn">
            <InfoItem 
              icon={Calendar} 
              label="Kỳ hạn thanh toán" 
              value={billingCycleLabels[property.default_billing_cycle] || property.default_billing_cycle}
              colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
            />
            <InfoItem 
              icon={CreditCard} 
              label="Hạn thanh toán" 
              value={`Ngày ${property.default_due_day} hàng tháng`}
              colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
            />
            <InfoItem 
              icon={Gauge} 
              label="Ngày chốt số" 
              value={`Ngày ${property.default_cutoff_day} hàng tháng`}
              colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
            />
            <InfoItem 
              icon={Key} 
              label="Số tháng tiền cọc" 
              value={`${property.default_deposit_months} tháng`}
              colorClass="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
            />
          </InfoSection>

          <InfoSection title="Tài khoản thanh toán" fullWidth>
            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                let accounts: any[] = [];
                try {
                  if (Array.isArray(property.bank_accounts)) {
                    accounts = property.bank_accounts;
                  } else if (typeof property.bank_accounts === 'string') {
                    accounts = JSON.parse(property.bank_accounts);
                  }
                } catch (e) {
                  console.error('API Error Parsing Accounts:', e);
                }

                if (Array.isArray(accounts) && accounts.length > 0) {
                  return accounts.map((account: any, index: number) => (
                    <div key={index} className="flex gap-4 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm">
                      <div className="shrink-0 w-12 h-12 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shadow-sm">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                          {account.bank_name || account.bank || 'Ngân hàng'}
                        </p>
                        <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 my-1">
                          {account.account_number || account.account || '---'}
                        </p>
                        { (account.account_holder || account.holder || account.name) && (
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {account.account_holder || account.holder || account.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ));
                }

                return (
                  <div className="col-span-full p-8 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-center">
                    <Wallet className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-400">CHƯA CÓ THÔNG TIN TÀI KHOẢN</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Cần thiết lập để khách hàng thanh toán chuyển khoản</p>
                  </div>
                );
              })()}
            </div>
          </InfoSection>

          {property.note && (
            <div className="col-span-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-8 rounded-xl shadow-inner">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                  <Info className="w-4 h-4 text-indigo-600" />
                </div>
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Ghi chú vận hành</h4>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic">{property.note}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Edit Mode (Based on BuildingConfig)
  return (
    <div className="space-y-6 pb-20 max-w-6xl animate-in slide-in-from-right-4 duration-300">
      {/* Action Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsEditing(false)}
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </Button>
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cấu hình: {formData?.name}</h2>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Đang trong chế độ chỉnh sửa</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setIsEditing(false)}
            className="font-bold rounded-lg px-6"
          >
            HỦY BỎ
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg px-6 h-10 gap-2 shadow-lg shadow-indigo-500/20"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            LƯU CẤU HÌNH
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <SectionHeader 
            title="Thông tin cơ bản" 
            description="Tên, mã định danh và địa chỉ chính thức" 
          />

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Tên tòa nhà</label>
                <Input 
                  name="name" 
                  value={formData?.name} 
                  onChange={handleChange}
                  className="rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-indigo-500/20 font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Mã quản lý</label>
                <Input 
                  name="code" 
                  value={formData?.code} 
                  onChange={handleChange}
                  className="rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-indigo-500/20 font-medium uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Địa chỉ tòa nhà</label>
              <div className="relative">
                <Input 
                  name="address" 
                  value={formData?.address} 
                  onChange={handleChange}
                  className="rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-indigo-500/20 font-medium pl-9"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Ghi chú vận hành</label>
              <textarea 
                name="note" 
                value={formData?.note} 
                onChange={handleChange as any}
                rows={3}
                className="w-full text-sm rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-indigo-500/20 font-medium p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500/50 transition-colors"
                placeholder="Nhập ghi chú quan trọng về việc vận hành tòa nhà..."
              />
            </div>
          </div>
        </div>

        {/* Area & Operational Configuration */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <SectionHeader 
            title="Diện tích & Tiêu chuẩn vận hành" 
            description="Quản lý quy mô và các giá trị tự động áp dụng khi tạo phòng mới" 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5 flex items-center gap-1.5">
                <Ruler className="w-3 h-3 text-slate-400" /> Tổng diện tích
              </label>
              <div className="relative">
                <Input 
                  type="number"
                  name="area" 
                  value={formData?.area} 
                  onChange={handleChange}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-indigo-500/20 font-medium pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">m²</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5 flex items-center gap-1.5">
                <Combine className="w-3 h-3 text-slate-400" /> DT chung
              </label>
              <div className="relative">
                <Input 
                  type="number"
                  name="shared_area" 
                  value={formData?.shared_area} 
                  onChange={handleChange}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-indigo-500/20 font-medium pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">m²</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5 flex items-center gap-1.5">
                <Coins className="w-3 h-3 text-slate-400" /> Đơn giá / m²
              </label>
              <div className="relative">
                <Input 
                  type="number"
                  name="default_rent_price_per_m2" 
                  value={formData?.default_rent_price_per_m2} 
                  onChange={handleChange}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-indigo-500/20 font-medium pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-slate-400" /> Số tháng cọc
              </label>
              <Input 
                type="number"
                name="default_deposit_months" 
                value={formData?.default_deposit_months} 
                onChange={handleChange}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-indigo-500/20 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-400" /> Ngày thu tiền
              </label>
              <div className="relative">
                <Input 
                  type="number"
                  min="1"
                  max="31"
                  name="default_due_day" 
                  value={formData?.default_due_day} 
                  onChange={handleChange}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-indigo-500/20 font-medium pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase italic">Tháng</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-400" /> Ngày chốt
              </label>
              <div className="relative">
                <Input 
                  type="number"
                  min="1"
                  max="31"
                  name="default_cutoff_day" 
                  value={formData?.default_cutoff_day} 
                  onChange={handleChange}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-indigo-500/20 font-medium pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase italic">Tháng</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
