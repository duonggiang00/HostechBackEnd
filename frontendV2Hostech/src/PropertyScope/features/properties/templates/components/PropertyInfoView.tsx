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
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm ${fullWidth ? 'col-span-full' : ''}`}>
      <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 border-b border-gray-50 dark:border-gray-800/60 pb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children}
      </div>
    </div>
  );

  const InfoItem = ({ icon: Icon, label, value, colorClass = "bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-400" }: any) => (
    <div className="flex gap-4 group">
      <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="font-bold text-gray-900 dark:text-white truncate">{value || '---'}</p>
      </div>
    </div>
  );

  const SectionHeader = ({ title, description }: { title: string, description: string }) => (
    <div className="mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
      <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{title}</h3>
      <p className="text-xs text-gray-500 font-medium mt-1">{description}</p>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-900 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-none">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">
                {property.name} <span className="text-blue-900 dark:text-blue-400 text-lg align-top ml-2">#{property.code}</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-500 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-900 dark:text-blue-400" /> {property.address}
                </span>
              </div>
            </div>
          </div>
          <Button 
            onClick={() => setIsEditing(true)}
            variant="default"
            className="bg-blue-900 hover:bg-black text-white font-black uppercase tracking-widest rounded-xl h-12 px-8 gap-3 shadow-xl shadow-blue-900/10 transition-all active:scale-95"
          >
            <Edit3 className="w-5 h-5" />
            Điều chỉnh thông tin
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
                    <div key={index} className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-800 transition-all hover:shadow-md shadow-sm group">
                      <div className="shrink-0 w-12 h-12 bg-white dark:bg-gray-700 text-blue-900 dark:text-blue-400 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">
                          {account.bank_name || account.bank || 'Ngân hàng'}
                        </p>
                        <p className="text-xl font-black text-blue-900 dark:text-blue-400 my-1">
                          {account.account_number || account.account || '---'}
                        </p>
                        { (account.account_holder || account.holder || account.name) && (
                          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            {account.account_holder || account.holder || account.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ));
                }

                return (
                  <div className="col-span-full p-12 bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <Wallet className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Chưa có thông tin tài khoản</p>
                    <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest max-w-[200px] leading-relaxed">Cần thiết lập để khách hàng thanh toán chuyển khoản nhanh chóng</p>
                  </div>
                );
              })()}
            </div>
          </InfoSection>

          {property.note && (
            <div className="col-span-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 p-8 rounded-2xl shadow-inner relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Info className="w-24 h-24" />
               </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                  <Info className="w-4 h-4 text-blue-900 dark:text-blue-400" />
                </div>
                <h4 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Ghi chú vận hành</h4>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium italic relative z-10">{property.note}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Edit Mode (Based on BuildingConfig)
  return (
    <div className="space-y-6 max-w-6xl pb-20 animate-in slide-in-from-right-4 duration-300">
      {/* Action Header */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsEditing(false)}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </Button>
          <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Cấu hình: {formData?.name}</h2>
            <p className="text-[10px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest">Đang trong chế độ chỉnh sửa</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setIsEditing(false)}
            className="font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl border-gray-200 dark:border-gray-800"
          >
            Hủy bỏ
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-blue-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl gap-3 shadow-xl shadow-blue-900/10"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />}
            Lưu cấu hình
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <SectionHeader 
            title="Thông tin cơ bản" 
            description="Tên, mã định danh và địa chỉ chính thức của tòa nhà" 
          />

          <div className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Tên tòa nhà</label>
                <Input 
                  name="name" 
                  value={formData?.name} 
                  onChange={handleChange}
                  placeholder="Ví dụ: Hostech Building"
                  className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 focus:ring-blue-900 focus:border-blue-900 h-12 font-bold transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Mã quản lý</label>
                <Input 
                  name="code" 
                  value={formData?.code} 
                  onChange={handleChange}
                  placeholder="Ví dụ: HT01"
                  className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 h-12 font-black text-blue-900 dark:text-blue-400 uppercase tracking-tighter"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Địa chỉ tòa nhà</label>
              <div className="relative group">
                <Input 
                  name="address" 
                  value={formData?.address} 
                  onChange={handleChange}
                  className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 focus:ring-blue-900 focus:border-blue-900 h-12 font-medium pl-11 transition-all"
                />
                <MapPin className="w-5 h-5 text-gray-400 group-focus-within:text-blue-900 absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Ghi chú vận hành</label>
              <textarea 
                name="note" 
                value={formData?.note} 
                onChange={handleChange as any}
                rows={4}
                className="w-full text-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900/50 font-medium p-4 text-gray-900 dark:text-gray-100 outline-none transition-all placeholder:text-gray-300"
                placeholder="Nhập ghi chú quan trọng về việc vận hành tòa nhà..."
              />
            </div>
          </div>
        </div>

        {/* Area & Operational Configuration */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <SectionHeader 
            title="Quy chuẩn vận hành" 
            description="Thiết lập các tham số tài chính và đo lường cơ bản" 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Ruler className="w-3.5 h-3.5 text-blue-900 dark:text-blue-400" /> Tổng diện tích
              </label>
              <div className="relative">
                <Input 
                  type="number"
                  name="area" 
                  value={formData?.area} 
                  onChange={handleChange}
                  className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 focus:ring-blue-900 h-12 font-bold pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest">m²</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Combine className="w-3.5 h-3.5 text-blue-900 dark:text-blue-400" /> Chung/Hành lang
              </label>
              <div className="relative">
                <Input 
                  type="number"
                  name="shared_area" 
                  value={formData?.shared_area} 
                  onChange={handleChange}
                  className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 focus:ring-blue-900 h-12 font-bold pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest">m²</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Coins className="w-3.5 h-3.5 text-blue-900 dark:text-blue-400" /> Đơn giá / m²
              </label>
              <div className="relative">
                <Input 
                  type="number"
                  name="default_rent_price_per_m2" 
                  value={formData?.default_rent_price_per_m2} 
                  onChange={handleChange}
                  className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 focus:ring-blue-900 h-12 font-black text-blue-900 dark:text-blue-400 pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">đ</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-900 dark:text-blue-400" /> Số tháng cọc
              </label>
              <Input 
                type="number"
                name="default_deposit_months" 
                value={formData?.default_deposit_months} 
                onChange={handleChange}
                className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 focus:ring-blue-900 h-12 font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-blue-900 dark:text-blue-400" /> Ngày thu tiền
              </label>
              <div className="relative">
                <Input 
                  type="number"
                  min="1"
                  max="31"
                  name="default_due_day" 
                  value={formData?.default_due_day} 
                  onChange={handleChange}
                  className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 focus:ring-blue-900 h-12 font-bold pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Hàng tháng</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5 text-blue-900 dark:text-blue-400" /> Ngày chốt số
              </label>
              <div className="relative">
                <Input 
                  type="number"
                  min="1"
                  max="31"
                  name="default_cutoff_day" 
                  value={formData?.default_cutoff_day} 
                  onChange={handleChange}
                  className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 focus:ring-blue-900 h-12 font-bold pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Cuối kỳ</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
