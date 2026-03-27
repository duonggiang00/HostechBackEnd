import { useState, useMemo, memo, useEffect } from 'react';
import {
  UserPlus, Home, FileText, CheckCircle, ChevronRight, ChevronLeft,
  Search, Calendar, FileSignature, AlertCircle, Clock, ShieldAlert,
  UploadCloud, FileUp, X
} from 'lucide-react';
import { useContractActions } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { useRoomDetail } from '@/PropertyScope/features/rooms/hooks/useRooms';
import { usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import type { CreateContractPayload, CreateContractMemberPayload } from '@/PropertyScope/features/contracts/types';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ContractWizardProps {
  propertyId: string;
  roomId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface FormErrors {
  tenant_name?: string;
  start_date?: string;
  rent_price?: string;
}

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="text-xs font-bold text-rose-500 mt-1.5 ml-3 flex items-center gap-1.5"
    >
      <AlertCircle className="w-3 h-3" />
      {message}
    </motion.p>
  );
};

export default function ContractWizard({ propertyId, roomId, onSuccess, onCancel }: ContractWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const { createContract, scanContract } = useContractActions();
  const [scanFile, setScanFile] = useState<File | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Thông tin thành viên chính (tenant)
    tenant_name: '',
    tenant_phone: '',
    tenant_identity_number: '',
    // Thời hạn hợp đồng
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    // Tài chính
    rent_price: 0,
    deposit_amount: 0,
    billing_cycle: 'MONTHLY' as 'MONTHLY' | 'QUARTERLY',
    due_day: 5,
    cutoff_day: 1,
  });

  const { data: room } = useRoomDetail(roomId);
  const { data: property } = usePropertyDetail(propertyId);

  // Initialize form with defaults when room/property data is available
  useEffect(() => {
    if (room || property) {
      setFormData(prev => ({
        ...prev,
        // Only set rent_price if it hasn't been touched or is 0
        rent_price: prev.rent_price === 0 ? (room?.base_price || 0) : prev.rent_price,
        billing_cycle: property?.default_billing_cycle 
          ? (property.default_billing_cycle.toUpperCase() as any) 
          : prev.billing_cycle,
        due_day: property?.default_due_day || prev.due_day,
        cutoff_day: property?.default_cutoff_day || prev.cutoff_day,
      }));
    }
  }, [room, property]);

  const [errors, setErrors] = useState<FormErrors>({});

  // ─── Validation ──────────────────────────────────────────────────────────────

  const validateStep = (currentStep: WizardStep): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 2) {
      if (!formData.tenant_name.trim()) {
        newErrors.tenant_name = 'Vui lòng nhập họ tên người thuê';
      }
    }

    if (currentStep === 4) {
      if (!formData.start_date) {
        newErrors.start_date = 'Vui lòng chọn ngày bắt đầu';
      }
      if (formData.rent_price <= 0 && room?.base_price !== 0) {
        newErrors.rent_price = 'Giá thuê phải lớn hơn 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Navigation ──────────────────────────────────────────────────────────────

  const nextStep = () => {
    if (!validateStep(step)) return;
    if (step < 5) setStep((s) => (s + 1) as WizardStep);
  };

  const prevStep = () => {
    if (step > 1) setStep((s) => (s - 1) as WizardStep);
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!validateStep(step)) return;

    const members: CreateContractMemberPayload[] = [
      {
        full_name: formData.tenant_name,
        phone: formData.tenant_phone || undefined,
        identity_number: formData.tenant_identity_number || undefined,
        role: 'TENANT',
        is_primary: true,
      },
    ];

    const payload: CreateContractPayload = {
      property_id: propertyId,
      room_id: roomId,
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      rent_price: formData.rent_price,
      deposit_amount: formData.deposit_amount || undefined,
      billing_cycle: formData.billing_cycle,
      due_day: formData.due_day,
      cutoff_day: formData.cutoff_day,
      status: 'DRAFT',
      members,
    };

    createContract.mutate(payload, {
      onSuccess: () => {
        toast.success('Đã tạo bản nháp hợp đồng thành công!');
        onSuccess?.();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Có lỗi xảy ra khi tạo hợp đồng.';
        toast.error(message);
      },
    });
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const updateField = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (key in errors) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const formatCurrencyVND = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// ─── Step Indicator (Memoized) ──────────────────────────────────────────────

const StepIndicator = memo(({ step }: { step: WizardStep }) => {
  const indicatorSteps = useMemo(() => [
    { num: 1, label: 'Scan HĐ', icon: FileUp },
    { num: 2, label: 'Khách', icon: UserPlus },
    { num: 3, label: 'Phòng', icon: Home },
    { num: 4, label: 'Điều khoản', icon: FileText },
    { num: 5, label: 'Hoàn tất', icon: CheckCircle },
  ], []);

  return (
    <div className="flex items-center justify-between relative mb-12 px-4 select-none">
      <div className="absolute left-8 right-8 top-5 h-0.5 bg-slate-100/50 z-0" />
      <motion.div
        className="absolute left-8 top-5 h-0.5 bg-linear-to-r from-indigo-500 to-indigo-400 z-0"
        initial={{ width: 0 }}
        animate={{ width: `calc(${((step - 1) / 4) * 100}% - 16px)` }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      />

      {indicatorSteps.map((s) => {
        const isActive = step >= s.num;
        const isCurrent = step === s.num;

        return (
          <div key={s.num} className="relative z-10 flex flex-col items-center gap-3">
            <motion.div
              animate={{
                scale: isCurrent ? 1.15 : 1,
                backgroundColor: isActive ? '#4f46e5' : '#ffffff',
                borderColor: isActive ? '#4f46e5' : '#f1f5f9',
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all shadow-sm ${
                isActive ? 'text-white' : 'text-slate-300'
              } ${isCurrent ? 'shadow-lg shadow-indigo-100 ring-4 ring-indigo-500/10' : ''}`}
            >
              <s.icon className={`w-4 h-4 ${isCurrent ? 'animate-pulse' : ''}`} />
            </motion.div>
            <span
              className={`text-xs font-black uppercase tracking-widest transition-colors duration-200 ${
                isCurrent ? 'text-indigo-600' : isActive ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
});

StepIndicator.displayName = 'StepIndicator';

  return (
    <div className="flex flex-col h-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-5xl overflow-hidden shadow-2xl shadow-indigo-100/20 dark:shadow-none border border-white/40 dark:border-slate-800 p-6 md:p-10 relative transition-colors">
      {/* Decorative background elements */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase transition-colors">Tạo Hợp Đồng</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-md">Bản nháp</span>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Bước {step} / 5</p>
            </div>
          </div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-white dark:border-slate-700 shadow-sm transition-colors"
          >
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl shadow-inner text-indigo-500 dark:text-indigo-400 transition-colors">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none transition-colors">Phòng đang chọn</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1 uppercase tracking-tighter transition-colors">ID: {roomId.substring(0, 8)}</p>
            </div>
          </motion.div>
        </div>

        <StepIndicator step={step} />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative px-1">
        <AnimatePresence mode="wait">
          {/* ─────── STEP 2 (KHÁCH) ─────── */}
          {step === 2 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-8"
            >
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Tìm khách hàng cũ từ dữ liệu hệ thống..."
                  className="w-full pl-16 pr-8 py-5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-100 dark:border-slate-700 rounded-4xl outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-8 focus:ring-indigo-500/5 font-bold transition-all text-sm shadow-sm placeholder:text-slate-300 dark:placeholder:text-slate-600 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700 transition-colors" />
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 shrink-0 transition-colors">Thông tin khách mới</span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700 transition-colors" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                    Họ và Tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={formData.tenant_name}
                    onChange={(e) => updateField('tenant_name', e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className={`w-full px-6 py-5 bg-white dark:bg-slate-800 dark:text-slate-100 border rounded-3xl outline-none focus:ring-8 transition-all text-sm font-black shadow-sm ${
                      errors.tenant_name 
                        ? 'border-rose-100 dark:border-rose-900 bg-rose-50/10 focus:ring-rose-500/5 focus:border-rose-400' 
                        : 'border-slate-100 dark:border-slate-700 focus:ring-indigo-500/5 focus:border-indigo-400 dark:focus:border-indigo-500'
                    }`}
                  />
                  <FieldError message={errors.tenant_name} />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                    Số Điện Thoại
                  </label>
                  <input
                    value={formData.tenant_phone}
                    onChange={(e) => updateField('tenant_phone', e.target.value)}
                    placeholder="09xx xxx xxx"
                    className="w-full px-6 py-5 bg-white dark:bg-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-3xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all text-sm font-black shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Mã số định danh (CCCD / Passport)
                </label>
                <div className="relative">
                  <FileText className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-500 transition-colors" />
                  <input
                    value={formData.tenant_identity_number}
                    onChange={(e) => updateField('tenant_identity_number', e.target.value)}
                    placeholder="Nhập 12 số CCCD..."
                    className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-3xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all text-sm font-black shadow-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ─────── STEP 3 (PHÒNG) ─────── */}
          {step === 3 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-6"
            >
              <div className="relative overflow-hidden group">
                <div className="absolute inset-0 bg-linear-to-br from-indigo-600/5 to-emerald-600/5 transition-opacity pointer-events-none" />
                <div className="relative p-8 border border-slate-100 dark:border-slate-700 rounded-4xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-xl transition-all">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-full md:w-48 aspect-square bg-slate-50 dark:bg-slate-800/80 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:border-indigo-100 dark:group-hover:border-indigo-500/30 transition-colors">
                      <Home className="w-8 h-8 text-slate-300 dark:text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Ảnh thực tế</span>
                    </div>
                    
                    <div className="flex-1 space-y-4 w-full text-left">
                      <div>
                        <span className="inline-block bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-black text-[9px] uppercase tracking-widest mb-3 rounded-lg px-2.5 py-1 transition-colors">Trạng thái: Trống</span>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none transition-colors">THÔNG TIN PHÒNG HIỆN TẠI</h3>
                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-tight transition-colors">Hệ thống đang liên kết với ID: {roomId.substring(0, 12).toUpperCase()}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Loại giao dịch</p>
                          <p className="text-base font-black text-slate-700 dark:text-slate-300 mt-1 uppercase transition-colors">Hợp đồng thuê</p>
                        </div>
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Đơn vị quản lý</p>
                          <p className="text-base font-black text-slate-700 dark:text-slate-300 mt-1 uppercase tracking-tighter transition-colors">HOSTECH ERP</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl flex gap-4 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/50 transition-colors">
                  <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-black text-amber-900 dark:text-amber-100 uppercase tracking-tight transition-colors">Lưu ý chốt hợp đồng</h4>
                  <p className="text-xs font-bold text-amber-700/70 dark:text-amber-500/80 mt-1 leading-relaxed transition-colors">
                    Vui lòng kiểm tra kỹ Mã phòng trước khi tiếp tục. Các chỉ số dịch vụ sẽ được cấu hình ở bước Tài chính tiếp theo.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─────── STEP 4 (ĐIỀU KHOẢN) ─────── */}
          {step === 4 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-1">
                <div className="space-y-2 text-left">
                  <label className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest ml-1 italic transition-colors">
                    Bắt đầu từ ngày
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 dark:text-indigo-500 transition-colors" />
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => updateField('start_date', e.target.value)}
                      className={`w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 border rounded-[1.25rem] outline-none focus:ring-4 transition-all text-sm font-black shadow-sm ${
                        errors.start_date ? 'border-rose-200 dark:border-rose-900/50 ring-rose-50 dark:ring-rose-900/20' : 'border-slate-100 dark:border-slate-700 ring-indigo-50 dark:ring-indigo-500/20'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 transition-colors">
                    Thời hạn dự kiến
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-500 transition-colors" />
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => updateField('end_date', e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-indigo-50/30 dark:focus:ring-indigo-500/20 transition-all text-sm font-black shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-1">
                <div className="space-y-2 text-left">
                  <label className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest ml-1 transition-colors">
                    Giá thuê (VNĐ) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-indigo-500 dark:text-indigo-400 transition-colors">₫</div>
                    <input
                      type="number"
                      value={formData.rent_price || ''}
                      onChange={(e) => updateField('rent_price', Number(e.target.value))}
                      placeholder={room?.base_price === 0 ? "Tự động tính theo diện tích..." : "0"}
                      className={`w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 dark:text-slate-100 border rounded-[1.25rem] outline-none focus:ring-4 transition-all text-lg font-black shadow-sm ${
                        errors.rent_price ? 'border-rose-200 dark:border-rose-900/50 ring-rose-50 dark:ring-rose-900/20' : 'border-slate-100 dark:border-slate-700 ring-indigo-50 dark:ring-indigo-500/20'
                      }`}
                    />
                    {room?.base_price === 0 && formData.rent_price === 0 && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-full border border-indigo-100 dark:border-indigo-500/20">
                        <Clock className="w-3 h-3 text-indigo-500 dark:text-indigo-400 animate-spin-slow" />
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">Auto-calc</span>
                      </div>
                    )}
                  </div>
                  {room?.base_price === 0 && (
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 ml-2 italic">
                      * Phòng này được cấu hình tự động tính giá theo diện tích ({room.area} m²)
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest ml-1 transition-colors">
                    Tiền cọc đảm bảo
                  </label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-emerald-500 dark:text-emerald-400 transition-colors">₫</div>
                    <input
                      type="number"
                      value={formData.deposit_amount || ''}
                      onChange={(e) => updateField('deposit_amount', Number(e.target.value))}
                      placeholder="0"
                      className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-emerald-50/50 dark:focus:ring-emerald-500/20 transition-all text-lg font-black shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 transition-colors">
                    Chu kỳ đóng tiền
                  </label>
                  <select
                    value={formData.billing_cycle}
                    onChange={(e) => updateField('billing_cycle', e.target.value as 'MONTHLY' | 'QUARTERLY')}
                    className="w-full px-5 py-4 bg-slate-50/50 dark:bg-slate-800/50 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-indigo-50/50 dark:focus:ring-indigo-500/20 transition-all text-sm font-black cursor-pointer shadow-sm"
                  >
                    <option value="MONTHLY">Hàng tháng</option>
                    <option value="QUARTERLY">Hàng quý</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-rose-400 dark:text-rose-500 uppercase tracking-widest pl-1 transition-colors">
                    Hạn nộp (Ngày)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={formData.due_day}
                    onChange={(e) => updateField('due_day', Number(e.target.value))}
                    className="w-full px-5 py-4 bg-white dark:bg-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-rose-50/50 dark:focus:ring-rose-500/20 transition-all text-sm font-black shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 transition-colors">
                    Chốt số (Ngày)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={formData.cutoff_day}
                    onChange={(e) => updateField('cutoff_day', Number(e.target.value))}
                    className="w-full px-5 py-4 bg-white dark:bg-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-slate-50 dark:focus:ring-slate-700 transition-all text-sm font-black shadow-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ─────── STEP 1 (SCAN) ─────── */}
          {step === 1 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-8"
            >
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-5xl p-10 relative overflow-hidden text-center transition-colors shadow-sm">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="max-w-xl mx-auto space-y-8 relative z-10">
                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto text-indigo-500 dark:text-indigo-400 mb-6 shadow-inner ring-4 ring-indigo-500/5">
                    <FileUp className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3">
                      Tải lên hợp đồng / OCR
                    </h3>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed px-4">
                      Hệ thống sẽ tự động trích xuất thông tin khách thuê, giá tiền, thời hạn... từ file Hợp đồng Word hoặc PDF của bạn.
                    </p>
                  </div>
                  
                  <div className="relative mt-10">
                    {!scanFile ? (
                      <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-[2rem] cursor-pointer transition-all hover:border-indigo-400 group shadow-sm">
                        <UploadCloud className="w-12 h-12 text-indigo-300 dark:text-indigo-600 group-hover:text-indigo-500 transition-colors mb-5 group-hover:scale-110 duration-300" />
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                          Chọn hoặc Kéo thả file mềm
                        </span>
                        <span className="text-xs font-bold text-indigo-400/70 dark:text-indigo-500/70 uppercase tracking-tighter bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm">
                          Hỗ trợ .PDF, .DOCX
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setScanFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    ) : (
                      <div className="p-8 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-[2rem] flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-5 text-left">
                          <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-md ring-2 ring-indigo-500/10 shrink-0">
                            <FileText className="w-7 h-7" />
                          </div>
                          <div className="min-w-0 pr-4">
                            <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate" title={scanFile.name}>
                              {scanFile.name}
                            </p>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-tighter">
                              {(scanFile.size / 1024 / 1024).toFixed(2)} MB • Sẵn sàng quét
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setScanFile(null)}
                          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-all shadow-sm border border-slate-100 dark:border-slate-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <AnimatePresence>
                    {scanFile && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onClick={() => {
                          scanContract.mutate(scanFile, {
                            onSuccess: (data) => {
                              toast.success('Đã trích xuất dữ liệu thành công!');
                              setFormData(prev => ({
                                ...prev,
                                tenant_name: data?.tenant_name || prev.tenant_name,
                                rent_price: data?.rent_price || prev.rent_price,
                                deposit_amount: data?.deposit_amount || prev.deposit_amount,
                                start_date: data?.start_date ? new Date(data.start_date).toISOString().split('T')[0] : prev.start_date,
                                billing_cycle: (data?.billing_cycle as any) || prev.billing_cycle,
                              }));
                              nextStep();
                            },
                            onError: () => {
                              toast.error('Trích xuất thất bại, vui lòng kiểm tra lại file hoặc điền thủ công.');
                              nextStep();
                            }
                          });
                        }}
                        disabled={scanContract.isPending}
                        className="w-full mt-8 py-5 px-8 bg-indigo-600 dark:bg-indigo-500 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 dark:shadow-none hover:-translate-y-0.5 active:scale-[0.98]"
                      >
                        {scanContract.isPending ? (
                          <>
                            <Clock className="w-5 h-5 animate-spin" />
                            HỆ THỐNG ĐANG PHÂN TÍCH OCR...
                          </>
                        ) : (
                          'Bắt đầu phân tích dữ liệu'
                        )}
                      </motion.button>
                    )}
                  </AnimatePresence>
                  
                  {!scanFile && (
                    <div className="pt-4">
                      <button
                        onClick={nextStep}
                        className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        Chưa có file mềm, điền thủ công
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─────── STEP 5 ─────── */}
          {step === 5 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-8"
            >
              <div className="flex flex-col lg:flex-row gap-8 items-stretch">
                <div className="flex-1 space-y-6 text-left">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] transition-colors">Bản xem trước thỏa thuận</h4>
                    <span className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1 transition-colors">
                      <ShieldAlert className="w-3 h-3" /> Chế độ an toàn
                    </span>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-5xl p-10 space-y-8 shadow-xl shadow-slate-200/20 dark:shadow-none relative overflow-hidden group transition-colors">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-32 translate-x-32 blur-3xl pointer-events-none" />
                    
                    <div className="flex justify-between items-start pb-8 border-b border-slate-100 dark:border-slate-700 transition-colors">
                      <div>
                        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">Bên thuê (Tenant)</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">
                          {formData.tenant_name || 'CHƯA XÁC ĐỊNH'}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 transition-colors">{formData.tenant_phone || 'Chưa có số điện thoại'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">Mã tham chiếu</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700/50 px-3 py-1 rounded-lg uppercase transition-colors">#DRAFT-{new Date().getFullYear()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Hiệu lực hợp đồng</span>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase italic transition-colors">Từ ngày</span>
                              <span className="text-sm font-black text-slate-700 dark:text-slate-300 transition-colors">{new Date(formData.start_date).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-200 dark:text-slate-600 transition-colors" />
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase italic transition-colors">Đến ngày</span>
                              <span className="text-sm font-black text-slate-700 dark:text-slate-300 transition-colors">{formData.end_date ? new Date(formData.end_date).toLocaleDateString('vi-VN') : 'Vô thời hạn'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Giá thuê định kỳ</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter transition-colors">
                              {formatCurrencyVND(formData.rent_price).replace('₫', '')}
                            </span>
                            <span className="text-sm font-black text-indigo-400 dark:text-indigo-500 transition-colors">VNĐ / {formData.billing_cycle === 'MONTHLY' ? 'Tháng' : 'Quý'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Khoản đặt cọc</span>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-sm shadow-emerald-200 dark:shadow-emerald-900 transition-colors" />
                            <span className="text-lg font-black text-slate-800 dark:text-slate-200 transition-colors">{formatCurrencyVND(formData.deposit_amount)}</span>
                          </div>
                        </div>

                        <div className="p-5 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/20 space-y-3 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-widest transition-colors">Lịch thanh toán</span>
                            <Clock className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-500 transition-colors" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors">Hạn nộp: <span className="font-black text-indigo-700 dark:text-indigo-400 underline decoration-indigo-200 dark:decoration-indigo-800 decoration-2 underline-offset-4 transition-colors">Ngày {formData.due_day}</span> hàng kỳ</p>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors">Chốt nợ: <span className="font-black text-slate-700 dark:text-slate-300 transition-colors">Ngày {formData.cutoff_day}</span> hàng kỳ</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 dark:border-slate-700 flex items-center gap-4 transition-colors">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-500 transition-colors">
                        <FileSignature className="w-6 h-6" />
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed max-w-md italic transition-colors">
                        * Đây là bản tóm tắt nội dung chính. Hợp đồng pháp lý đầy đủ sẽ được tạo sau khi bạn nhấn xác nhận và chuyển sang trạng thái ký kết.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-80 shrink-0">
                  <div className="sticky top-0 p-10 bg-slate-900 rounded-6xl flex flex-col justify-between text-left h-full min-h-[450px] shadow-2xl shadow-indigo-200/30 group">
                    <div className="space-y-8">
                      <div className="w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-3xl flex items-center justify-center text-white border border-white/10 group-hover:rotate-6 transition-transform">
                        <ShieldAlert className="w-8 h-8" />
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xl font-black text-white leading-tight">Cam kết bảo mật & Pháp lý</h4>
                        <p className="text-sm font-medium text-slate-400 leading-relaxed">
                          Mọi thông tin trong bản nháp này đều được mã hóa theo chuẩn <span className="text-white font-bold">AES-256</span>. 
                        </p>
                      </div>
                      
                      <ul className="space-y-4">
                        {[
                          'Tự động sao lưu bản nháp',
                          'Kiểm soát phiên bản thay đổi',
                          'Sẵn sàng xuất file PDF'
                        ].map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-xs font-bold text-slate-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="pt-8 border-t border-white/10 mt-auto">
                      <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Hostech Verified</p>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {[1,2,3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900" />
                          ))}
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter cursor-default">+1k Managers trusted</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─────── NAVIGATION ─────── */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100/50 dark:border-slate-800 shrink-0 transition-colors">
        <div>
          {step === 1 && onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-3 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors uppercase tracking-widest"
            >
              Hủy bỏ
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay lại
            </button>
          )}

          {step < 5 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-10 py-4 bg-indigo-600 dark:bg-indigo-500 text-white rounded-[1.25rem] text-sm font-black shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all active:scale-95 hover:-translate-y-0.5"
            >
              Tiếp tục
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createContract.isPending}
              className="flex items-center gap-2 px-10 py-4 bg-emerald-500 dark:bg-emerald-600 text-white rounded-[1.25rem] text-sm font-black shadow-lg shadow-emerald-100 dark:shadow-none hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
            >
              {createContract.isPending ? 'Đang tạo...' : 'Xác nhận tạo bản nháp'}
              {!createContract.isPending && <CheckCircle className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
