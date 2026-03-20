import { useState, useMemo, memo } from 'react';
import {
  UserPlus, Home, FileText, CheckCircle, ChevronRight, ChevronLeft,
  Search, Calendar, FileSignature, AlertCircle, Clock, ShieldAlert
} from 'lucide-react';
import { useContractActions } from '@/PropertyScope/features/contracts/hooks/useContracts';
import type { CreateContractPayload, CreateContractMemberPayload } from '@/PropertyScope/features/contracts/types';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ContractWizardProps {
  propertyId: string;
  roomId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type WizardStep = 1 | 2 | 3 | 4;

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
      className="text-[10px] font-bold text-rose-500 mt-1.5 ml-3 flex items-center gap-1.5"
    >
      <AlertCircle className="w-3 h-3" />
      {message}
    </motion.p>
  );
};

export default function ContractWizard({ propertyId, roomId, onSuccess, onCancel }: ContractWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const { createContract } = useContractActions();

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

  const [errors, setErrors] = useState<FormErrors>({});

  // ─── Validation ──────────────────────────────────────────────────────────────

  const validateStep = (currentStep: WizardStep): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 1) {
      if (!formData.tenant_name.trim()) {
        newErrors.tenant_name = 'Vui lòng nhập họ tên người thuê';
      }
    }

    if (currentStep === 3) {
      if (!formData.start_date) {
        newErrors.start_date = 'Vui lòng chọn ngày bắt đầu';
      }
      if (formData.rent_price <= 0) {
        newErrors.rent_price = 'Giá thuê phải lớn hơn 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Navigation ──────────────────────────────────────────────────────────────

  const nextStep = () => {
    if (!validateStep(step)) return;
    if (step < 4) setStep((s) => (s + 1) as WizardStep);
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
    { num: 1, label: 'Khách thuê', icon: UserPlus },
    { num: 2, label: 'Phòng thuê', icon: Home },
    { num: 3, label: 'Điều khoản', icon: FileText },
    { num: 4, label: 'Hoàn tất', icon: CheckCircle },
  ], []);

  return (
    <div className="flex items-center justify-between relative mb-12 px-4 select-none">
      <div className="absolute left-8 right-8 top-5 h-0.5 bg-slate-100/50 z-0" />
      <motion.div
        className="absolute left-8 top-5 h-0.5 bg-gradient-to-r from-indigo-500 to-indigo-400 z-0"
        initial={{ width: 0 }}
        animate={{ width: `calc(${((step - 1) / 3) * 100}% - 16px)` }}
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
              className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${
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
    <div className="flex flex-col h-full bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-100/20 border border-white/40 p-6 md:p-10 relative">
      {/* Decorative background elements */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Tạo Hợp Đồng</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-md">Bản nháp</span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Bước {step} / 4</p>
            </div>
          </div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-white/50 backdrop-blur-md rounded-2xl border border-white shadow-sm"
          >
            <div className="p-2 bg-indigo-50 rounded-xl shadow-inner text-indigo-500">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Phòng đang chọn</p>
              <p className="text-sm font-bold text-slate-700 mt-1 uppercase tracking-tighter">ID: {roomId.substring(0, 8)}</p>
            </div>
          </motion.div>
        </div>

        <StepIndicator step={step} />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative px-1">
        <AnimatePresence mode="wait">
          {/* ─────── STEP 1 ─────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-8"
            >
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Tìm khách hàng cũ từ dữ liệu hệ thống..."
                  className="w-full pl-16 pr-8 py-5 bg-white/50 backdrop-blur-sm border border-slate-100 rounded-[2rem] outline-none focus:border-indigo-400 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 transition-all text-sm font-bold shadow-sm placeholder:text-slate-300"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 shrink-0">Thông tin khách mới</span>
                <div className="flex-1 h-px bg-slate-100" />
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
                    className={`w-full px-6 py-5 bg-white border rounded-[1.5rem] outline-none focus:ring-8 transition-all text-sm font-black shadow-sm ${
                      errors.tenant_name 
                        ? 'border-rose-100 bg-rose-50/10 focus:ring-rose-500/5 focus:border-rose-400' 
                        : 'border-slate-100 focus:ring-indigo-500/5 focus:border-indigo-400'
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
                    className="w-full px-6 py-5 bg-white border border-slate-100 rounded-[1.5rem] outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all text-sm font-black shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Mã số định danh (CCCD / Passport)
                </label>
                <div className="relative">
                  <FileText className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input
                    value={formData.tenant_identity_number}
                    onChange={(e) => updateField('tenant_identity_number', e.target.value)}
                    placeholder="Nhập 12 số CCCD..."
                    className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[1.5rem] outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all text-sm font-black shadow-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ─────── STEP 2 ─────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-6"
            >
              <div className="relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-emerald-600/5 transition-opacity pointer-events-none" />
                <div className="relative p-8 border border-slate-100 rounded-[2rem] bg-white shadow-sm hover:shadow-xl transition-all">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-full md:w-48 aspect-square bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                      <Home className="w-8 h-8 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ảnh thực tế</span>
                    </div>
                    
                    <div className="flex-1 space-y-4 w-full text-left">
                      <div>
                        <span className="inline-block bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest mb-3 rounded-lg px-2.5 py-1">Trạng thái: Trống</span>
                        <h3 className="text-2xl font-black text-slate-900 leading-none">THÔNG TIN PHÒNG HIỆN TẠI</h3>
                        <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-tight">Hệ thống đang liên kết với ID: {roomId.substring(0, 12).toUpperCase()}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại giao dịch</p>
                          <p className="text-base font-black text-slate-700 mt-1 uppercase">Hợp đồng thuê</p>
                        </div>
                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn vị quản lý</p>
                          <p className="text-base font-black text-slate-700 mt-1 uppercase tracking-tighter">HOSTECH ERP</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[1.5rem] flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Lưu ý chốt hợp đồng</h4>
                  <p className="text-xs font-bold text-amber-700/70 mt-1 leading-relaxed">
                    Vui lòng kiểm tra kỹ Mã phòng trước khi tiếp tục. Các chỉ số dịch vụ sẽ được cấu hình ở bước Tài chính tiếp theo.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─────── STEP 3 ─────── */}
          {step === 3 && (
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
                  <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1 italic">
                    Bắt đầu từ ngày
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => updateField('start_date', e.target.value)}
                      className={`w-full pl-14 pr-6 py-4 bg-slate-50 border rounded-[1.25rem] outline-none focus:ring-4 transition-all text-sm font-black shadow-sm ${
                        errors.start_date ? 'border-rose-200 ring-rose-50' : 'border-slate-100 ring-indigo-50'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Thời hạn dự kiến
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => updateField('end_date', e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-indigo-50/30 transition-all text-sm font-black shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-1">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">
                    Giá thuê (VNĐ) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-indigo-500">₫</div>
                    <input
                      type="number"
                      value={formData.rent_price || ''}
                      onChange={(e) => updateField('rent_price', Number(e.target.value))}
                      placeholder="0"
                      className={`w-full pl-14 pr-6 py-4 bg-white border rounded-[1.25rem] outline-none focus:ring-4 transition-all text-lg font-black shadow-sm ${
                        errors.rent_price ? 'border-rose-200 ring-rose-50' : 'border-slate-100 ring-indigo-50'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">
                    Tiền cọc đảm bảo
                  </label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-emerald-500">₫</div>
                    <input
                      type="number"
                      value={formData.deposit_amount || ''}
                      onChange={(e) => updateField('deposit_amount', Number(e.target.value))}
                      placeholder="0"
                      className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-emerald-50/50 transition-all text-lg font-black shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Chu kỳ đóng tiền
                  </label>
                  <select
                    value={formData.billing_cycle}
                    onChange={(e) => updateField('billing_cycle', e.target.value as 'MONTHLY' | 'QUARTERLY')}
                    className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-indigo-50/50 transition-all text-sm font-black cursor-pointer shadow-sm"
                  >
                    <option value="MONTHLY">Hàng tháng</option>
                    <option value="QUARTERLY">Hàng quý</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest pl-1">
                    Hạn nộp (Ngày)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={formData.due_day}
                    onChange={(e) => updateField('due_day', Number(e.target.value))}
                    className="w-full px-5 py-4 bg-white border border-slate-100 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-rose-50/50 transition-all text-sm font-black shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Chốt số (Ngày)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={formData.cutoff_day}
                    onChange={(e) => updateField('cutoff_day', Number(e.target.value))}
                    className="w-full px-5 py-4 bg-white border border-slate-100 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-slate-50 transition-all text-sm font-black shadow-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ─────── STEP 4 ─────── */}
          {step === 4 && (
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
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Bản xem trước thỏa thuận</h4>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Chế độ an toàn
                    </span>
                  </div>
                  
                  <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 space-y-8 shadow-xl shadow-slate-200/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-32 translate-x-32 blur-3xl pointer-events-none" />
                    
                    <div className="flex justify-between items-start pb-8 border-b border-slate-100">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bên thuê (Tenant)</p>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                          {formData.tenant_name || 'CHƯA XÁC ĐỊNH'}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 mt-1">{formData.tenant_phone || 'Chưa có số điện thoại'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mã tham chiếu</p>
                        <p className="text-sm font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg uppercase">#DRAFT-{new Date().getFullYear()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hiệu lực hợp đồng</span>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-400 uppercase italic">Từ ngày</span>
                              <span className="text-sm font-black text-slate-700">{new Date(formData.start_date).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-200" />
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-400 uppercase italic">Đến ngày</span>
                              <span className="text-sm font-black text-slate-700">{formData.end_date ? new Date(formData.end_date).toLocaleDateString('vi-VN') : 'Vô thời hạn'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá thuê định kỳ</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-indigo-600 tracking-tighter">
                              {formatCurrencyVND(formData.rent_price).replace('₫', '')}
                            </span>
                            <span className="text-sm font-black text-indigo-400">VNĐ / {formData.billing_cycle === 'MONTHLY' ? 'Tháng' : 'Quý'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khoản đặt cọc</span>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                            <span className="text-lg font-black text-slate-800">{formatCurrencyVND(formData.deposit_amount)}</span>
                          </div>
                        </div>

                        <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Lịch thanh toán</span>
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-xs font-bold text-slate-600">Hạn nộp: <span className="font-black text-indigo-700 underline decoration-indigo-200 decoration-2 underline-offset-4">Ngày {formData.due_day}</span> hàng kỳ</p>
                            <p className="text-xs font-bold text-slate-600">Chốt nợ: <span className="font-black text-slate-700">Ngày {formData.cutoff_day}</span> hàng kỳ</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                        <FileSignature className="w-6 h-6" />
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 leading-relaxed max-w-md italic">
                        * Đây là bản tóm tắt nội dung chính. Hợp đồng pháp lý đầy đủ sẽ được tạo sau khi bạn nhấn xác nhận và chuyển sang trạng thái ký kết.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-80 shrink-0">
                  <div className="sticky top-0 p-10 bg-slate-900 rounded-[3rem] flex flex-col justify-between text-left h-full min-h-[450px] shadow-2xl shadow-indigo-200/30 group">
                    <div className="space-y-8">
                      <div className="w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-[1.5rem] flex items-center justify-center text-white border border-white/10 group-hover:rotate-6 transition-transform">
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
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Hostech Verified</p>
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
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100/50 shrink-0">
        <div>
          {step === 1 && onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
            >
              Hủy bỏ
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-4 border border-slate-200 rounded-2xl text-sm font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay lại
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-[1.25rem] text-sm font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 hover:-translate-y-0.5"
            >
              Tiếp tục
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createContract.isPending}
              className="flex items-center gap-2 px-10 py-4 bg-emerald-500 text-white rounded-[1.25rem] text-sm font-black shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
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
