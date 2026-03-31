import { useState, useMemo, memo, useEffect } from 'react';
import {
  UserPlus, Home, FileText, CheckCircle, ChevronRight, ChevronLeft,
  Search, Calendar, FileSignature, AlertCircle, Clock, ShieldAlert,
  Loader2
} from 'lucide-react';
import { useContractActions } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { useContracts } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { useRoomDetail, useRooms } from '@/PropertyScope/features/rooms/hooks/useRooms';
import { useFloors } from '@/PropertyScope/features/floors/hooks/useFloors';
import { usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import { usePropertyUsers } from '@/PropertyScope/features/users/hooks/usePropertyUsers';
import type { CreateContractPayload, CreateContractMemberPayload } from '@/PropertyScope/features/contracts/types';
import type { RoomStatus } from '@/PropertyScope/features/rooms/types';
import type { PropertyUser } from '@/PropertyScope/features/users/types';
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
  tenants?: string;
  room_id?: string;
  start_date?: string;
  end_date?: string;
  rent_price?: string;
  due_day?: string;
  cutoff_day?: string;
}

interface ContractWarning {
  id: string;
  title: string;
  description: string;
}

const normalizeBillingCycleMonths = (value: string | number | null | undefined): number => {
  if (value === 'MONTHLY') return 1;
  if (value === 'QUARTERLY') return 3;
  if (value === 'SEMI_ANNUALLY') return 6;
  if (value === 'YEARLY') return 12;

  const months = Number(value);
  return Number.isFinite(months) && months > 0 ? months : 1;
};

const formatBillingCycleLabel = (value: string | number | null | undefined): string => {
  const months = normalizeBillingCycleMonths(value);
  return `${months} thang`;
};

const formatDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMinimumEndDate = (
  startDate: string,
  billingCycle: string | number | null | undefined,
): string | null => {
  if (!startDate) return null;

  const [year, month, day] = startDate.split('-').map(Number);
  if (!year || !month || !day) return null;

  const nextDate = new Date(year, month - 1, day);
  nextDate.setMonth(nextDate.getMonth() + normalizeBillingCycleMonths(billingCycle));

  return formatDateInputValue(nextDate);
};

const getApiValidationErrors = (error: unknown): Partial<FormErrors> => {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return {};
  }

  const responseData = (error as {
    response?: {
      data?: {
        errors?: Record<string, string[]>;
      };
    };
  }).response?.data;

  const apiErrors = responseData?.errors;
  if (!apiErrors) {
    return {};
  }

  const fieldErrors: Partial<FormErrors> = {};

  for (const [key, messages] of Object.entries(apiErrors)) {
    const message = messages?.[0];
    if (!message) continue;

    if (key === 'members' || key.startsWith('members.')) {
      fieldErrors.tenants ??= message;
      continue;
    }

    if (key === 'room_id') fieldErrors.room_id = message;
    if (key === 'start_date') fieldErrors.start_date = message;
    if (key === 'end_date') fieldErrors.end_date = message;
    if (key === 'rent_price') fieldErrors.rent_price = message;
    if (key === 'due_day') fieldErrors.due_day = message;
    if (key === 'cutoff_day') fieldErrors.cutoff_day = message;
  }

  return fieldErrors;
};

const getApiErrorMessage = (error: unknown): string | undefined => {
  const validationErrors = getApiValidationErrors(error);
  const firstValidationMessage = Object.values(validationErrors).find(Boolean);
  if (firstValidationMessage) {
    return firstValidationMessage;
  }

  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }

  return (error as { response?: { data?: { message?: string } } }).response?.data?.message;
};

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
  const { createContract } = useContractActions();
  const [selectedRoomId, setSelectedRoomId] = useState(roomId || '');
  const [tenantFilters, setTenantFilters] = useState({
    search: '',
    is_active: 'all' as 'all' | 'true' | 'false',
    page: 1,
    per_page: 8,
  });
  const [selectedTenantRecords, setSelectedTenantRecords] = useState<PropertyUser[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    // Thông tin thành viên chính (tenant)
    selected_tenant_ids: [] as string[],
    primary_tenant_id: '',
    contract_file_path: '',
    contract_file_name: '',
    // Thời hạn hợp đồng
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    // Tài chính
    rent_price: 0,
    deposit_amount: 0,
    billing_cycle: 1,
    due_day: 5,
    cutoff_day: 1,
  });

  const { data: room } = useRoomDetail(selectedRoomId || undefined);
  const { data: property } = usePropertyDetail(propertyId);
  const { usersQuery } = usePropertyUsers({
    'filter[role]': 'TENANT',
    'filter[property_id]': propertyId,
    'filter[is_active]': tenantFilters.is_active === 'all' ? undefined : tenantFilters.is_active === 'true',
    per_page: tenantFilters.per_page,
    page: tenantFilters.page,
    search: tenantFilters.search,
  });
  const { data: floors = [] } = useFloors(propertyId);
  const { data: allRooms = [], isLoading: isRoomsLoading, error: roomsError } = useRooms(
    { property_id: propertyId, include: 'floor,property', per_page: 100, page: 1 },
    { enabled: !!propertyId, staleTime: 60_000 },
  );
  const { data: propertyContractsResponse, isLoading: isContractsLoading } = useContracts(
    { property_id: propertyId, per_page: 100, page: 1 },
    { enabled: !!propertyId, staleTime: 30_000 },
  );

  const [roomFilters, setRoomFilters] = useState<{
    floor_id: string;
    status: 'all' | RoomStatus;
    search: string;
  }>({
    floor_id: '',
    status: 'all',
    search: '',
  });

  const tenantOptions = useMemo(() => {
    return ((usersQuery.data?.data || []) as PropertyUser[]).filter((user) => user.role === 'Tenant');
  }, [usersQuery.data]);

  const selectedTenants = useMemo(() => {
    return selectedTenantRecords;
  }, [selectedTenantRecords]);

  const primaryTenant = useMemo(() => {
    return selectedTenants.find((tenant) => tenant.id === formData.primary_tenant_id) || selectedTenants[0] || null;
  }, [selectedTenants, formData.primary_tenant_id]);
  const selectedRoom = useMemo(
    () => allRooms.find((candidate) => candidate.id === selectedRoomId) || room || null,
    [allRooms, room, selectedRoomId],
  );
  const tenantMeta = usersQuery.data?.meta;

  const roomStatusLabel: Record<RoomStatus, string> = {
    available: 'Phòng trống',
    occupied: 'Đã thuê',
    maintenance: 'Bảo trì',
    reserved: 'Giữ chỗ',
    draft: 'Nháp',
  };

  const roomStatusClass: Record<RoomStatus, string> = {
    available: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    occupied: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    maintenance: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    reserved: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  };

  const normalizeRoomStatus = (status?: string | null): RoomStatus => {
    const s = (status || '').toLowerCase();
    if (s === 'available' || s === 'vacant') return 'available';
    if (s === 'occupied' || s === 'rented') return 'occupied';
    if (s === 'maintenance') return 'maintenance';
    if (s === 'reserved') return 'reserved';
    return 'draft';
  };

  const filteredRooms = useMemo(() => {
    const keyword = roomFilters.search.trim().toLowerCase();

    return allRooms.filter((r) => {
      if (roomFilters.floor_id && r.floor_id !== roomFilters.floor_id) return false;
      if (roomFilters.status !== 'all' && normalizeRoomStatus(r.status) !== roomFilters.status) return false;
      if (!keyword) return true;

      const floorName = (r.floor?.name || r.floor_name || '').toLowerCase();
      return (
        (r.name || '').toLowerCase().includes(keyword) ||
        (r.code || '').toLowerCase().includes(keyword) ||
        floorName.includes(keyword)
      );
    });
  }, [allRooms, roomFilters]);

  const blockedRoomIds = useMemo(() => {
    const contracts = propertyContractsResponse?.data ?? [];
    const blockingStatuses = new Set(['PENDING_SIGNATURE', 'PENDING_PAYMENT', 'ACTIVE']);
    return new Set(
      contracts
        .filter((c) => c.room_id && blockingStatuses.has(c.status))
        .map((c) => c.room_id),
    );
  }, [propertyContractsResponse]);

  // Initialize form with defaults when room/property data is available
  useEffect(() => {
    if (room || property) {
      setFormData(prev => ({
        ...prev,
        // Only set rent_price if it hasn't been touched or is 0
        rent_price: prev.rent_price === 0 ? (room?.base_price || 0) : prev.rent_price,
        billing_cycle: property?.default_billing_cycle
          ? normalizeBillingCycleMonths(property.default_billing_cycle)
          : prev.billing_cycle,
        due_day: property?.default_due_day || prev.due_day,
        cutoff_day: Math.min(property?.default_cutoff_day || prev.cutoff_day, 25),
      }));
    }
  }, [room, property]);

  useEffect(() => {
    if (tenantOptions.length === 0) return;

    setSelectedTenantRecords((prev) =>
      prev.map((tenant) => tenantOptions.find((candidate) => candidate.id === tenant.id) || tenant),
    );
  }, [tenantOptions]);

  const [errors, setErrors] = useState<FormErrors>({});
  const minimumEndDate = useMemo(
    () => getMinimumEndDate(formData.start_date, formData.billing_cycle),
    [formData.start_date, formData.billing_cycle],
  );

  useEffect(() => {
    if (!minimumEndDate) return;

    setFormData((prev) => {
      if (!prev.end_date || prev.end_date >= minimumEndDate) {
        return prev;
      }

      return {
        ...prev,
        end_date: minimumEndDate,
      };
    });
  }, [minimumEndDate]);

  // ─── Validation ──────────────────────────────────────────────────────────────

  const validateStep = (currentStep: WizardStep): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 1) {
      if (formData.selected_tenant_ids.length === 0) {
        newErrors.tenants = 'Vui long chon it nhat 1 cu dan da dang ky tai khoan';
      } else if (!formData.primary_tenant_id || !formData.selected_tenant_ids.includes(formData.primary_tenant_id)) {
        newErrors.tenants = 'Vui long chon nguoi thue chinh trong danh sach da them';
      }
    }

    if (currentStep === 2) {
      const normalizedRoomStatus = normalizeRoomStatus(selectedRoom?.status);

      if (!selectedRoomId) {
        newErrors.room_id = 'Vui long chon phong truoc khi tiep tuc';
      } else if (normalizedRoomStatus === 'maintenance') {
        newErrors.room_id = 'Phong dang bao tri, khong the tao hop dong moi';
      } else if (blockedRoomIds.has(selectedRoomId)) {
        newErrors.room_id = 'Phong nay dang co hop dong hieu luc, vui long chon phong khac';
      }
    }

    if (currentStep === 3) {
      const rentPrice = Number(formData.rent_price);
      const dueDay = Number(formData.due_day);
      const cutoffDay = Number(formData.cutoff_day);

      if (!formData.start_date) {
        newErrors.start_date = 'Vui long chon ngay bat dau';
      }

      if (formData.end_date && minimumEndDate && formData.end_date < minimumEndDate) {
        newErrors.end_date = `Ngay ket thuc khong duoc nho hon ${minimumEndDate} theo chu ky thue`;
      }

      if (!Number.isFinite(rentPrice) || rentPrice <= 0) {
        newErrors.rent_price = 'Gia thue phai lon hon 0';
      }

      if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
        newErrors.due_day = 'Han nop phai nam trong khoang 1-31';
      }

      if (!Number.isInteger(cutoffDay) || cutoffDay < 1 || cutoffDay > 25) {
        newErrors.cutoff_day = 'Ngay chot so phai nam trong khoang 1-25';
      } else if (!newErrors.due_day && cutoffDay > dueDay) {
        newErrors.cutoff_day = 'Ngay chot so khong duoc sau han nop';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

    const members: CreateContractMemberPayload[] = selectedTenants.map((tenant) => ({
      user_id: tenant.id,
      full_name: tenant.full_name,
      phone: tenant.phone || undefined,
      identity_number: tenant.identity_number || undefined,
      role: tenant.id === formData.primary_tenant_id ? 'TENANT' : 'ROOMMATE',
      is_primary: tenant.id === formData.primary_tenant_id,
    }));

    const payload: CreateContractPayload = {
      property_id: propertyId,
      room_id: selectedRoomId,
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      rent_price: formData.rent_price,
      deposit_amount: formData.deposit_amount || undefined,
      billing_cycle: formData.billing_cycle,
      due_day: formData.due_day,
      cutoff_day: formData.cutoff_day,
      status: 'DRAFT',
      members,
      meta: formData.contract_file_path || formData.contract_file_name
        ? {
          file_path: formData.contract_file_path || undefined,
          file_name: formData.contract_file_name || undefined,
        }
        : undefined,
    };

    createContract.mutate(payload, {
      onSuccess: () => {
        toast.success('Đã tạo hợp đồng và chuyển sang chờ cư dân ký điện tử!');
        onSuccess?.();
      },
      onError: (error: unknown) => {
        const validationErrors = getApiValidationErrors(error);

        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);

          if (validationErrors.tenants) {
            setStep(1);
          } else if (validationErrors.room_id) {
            setStep(2);
          } else if (
            validationErrors.start_date ||
            validationErrors.end_date ||
            validationErrors.rent_price ||
            validationErrors.due_day ||
            validationErrors.cutoff_day
          ) {
            setStep(3);
          }
        }

        const message = getApiErrorMessage(error) || 'Co loi xay ra khi tao hop dong.';
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

  const billingCycleMonths = normalizeBillingCycleMonths(formData.billing_cycle);
  const monthlyRent = Number(formData.rent_price) || 0;
  const depositAmount = Number(formData.deposit_amount) || 0;
  const recurringRentTotal = monthlyRent * billingCycleMonths;
  const agreementGrandTotal = recurringRentTotal + depositAmount;
  const contractWarnings = useMemo<ContractWarning[]>(() => {
    const warnings: ContractWarning[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    if (formData.start_date && formData.start_date < todayString) {
      warnings.push({
        id: 'backdate',
        title: 'Hop dong lui ngay',
        description: 'Ngay bat dau dang o qua khu. He thong van cho tao de phuc vu nhap lieu backdate.',
      });
    }

    if (depositAmount === 0) {
      warnings.push({
        id: 'deposit-zero',
        title: 'Tien coc bang 0',
        description: 'Hop dong nay khong thu tien coc ban dau. Hay chac chan day la chu dich cua ban.',
      });
    }

    if (selectedRoom?.base_price && monthlyRent > 0) {
      const listedPrice = Number(selectedRoom.base_price);
      const deviation = listedPrice > 0 ? Math.abs(monthlyRent - listedPrice) / listedPrice : 0;

      if (deviation >= 0.2) {
        warnings.push({
          id: 'price-gap',
          title: 'Gia thue lech chuan',
          description: `Gia thue dang lech khoang ${Math.round(deviation * 100)}% so voi gia niem yet cua phong.`,
        });
      }
    }

    if (selectedRoom?.capacity && selectedTenants.length > selectedRoom.capacity) {
      warnings.push({
        id: 'capacity',
        title: 'Vuot suc chua phong',
        description: `Dang co ${selectedTenants.length} nguoi ky cho phong suc chua ${selectedRoom.capacity} nguoi.`,
      });
    }

    return warnings;
  }, [depositAmount, formData.start_date, monthlyRent, selectedRoom, selectedTenants.length]);

  const updateTenantFilter = <K extends keyof typeof tenantFilters>(key: K, value: (typeof tenantFilters)[K]) => {
    setTenantFilters((prev) => {
      if (key === 'page') {
        return {
          ...prev,
          page: value as number,
        };
      }

      return {
        ...prev,
        [key]: value,
        page: 1,
      };
    });
  };

  const toggleTenantSelection = (tenant: PropertyUser) => {
    setFormData((prev) => {
      const exists = prev.selected_tenant_ids.includes(tenant.id);
      const nextSelected = exists
        ? prev.selected_tenant_ids.filter((id) => id !== tenant.id)
        : [...prev.selected_tenant_ids, tenant.id];

      return {
        ...prev,
        selected_tenant_ids: nextSelected,
        primary_tenant_id: nextSelected.includes(prev.primary_tenant_id) ? prev.primary_tenant_id : (nextSelected[0] || ''),
      };
    });
    setSelectedTenantRecords((prev) => {
      const exists = prev.some((item) => item.id === tenant.id);
      if (exists) {
        return prev.filter((item) => item.id !== tenant.id);
      }
      return [...prev, tenant];
    });
    setErrors((prev) => ({ ...prev, tenants: undefined }));
  };

  // ─── Step Indicator (Memoized) ──────────────────────────────────────────────

  const StepIndicator = memo(({ step }: { step: WizardStep }) => {
    const indicatorSteps = useMemo(() => [
      { num: 1, label: 'Khách', icon: UserPlus },
      { num: 2, label: 'Phòng', icon: Home },
      { num: 3, label: 'Điều khoản', icon: FileText },
      { num: 4, label: 'Hoàn tất', icon: CheckCircle },
    ], []);

    return (
      <div className="flex items-center justify-between relative mb-12 px-4 select-none">
        <div className="absolute left-8 right-8 top-5 h-0.5 bg-slate-100/50 z-0" />
        <motion.div
          className="absolute left-8 top-5 h-0.5 bg-linear-to-r from-indigo-500 to-indigo-400 z-0"
          initial={{ width: 0 }}
          animate={{ width: step === 1 ? 0 : `calc(${((step - 1) / 3) * 100}% - 16px)` }}
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
                className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all shadow-sm ${isActive ? 'text-white' : 'text-slate-300'
                  } ${isCurrent ? 'shadow-lg shadow-indigo-100 ring-4 ring-indigo-500/10' : ''}`}
              >
                <s.icon className={`w-4 h-4 ${isCurrent ? 'animate-pulse' : ''}`} />
              </motion.div>
              <span
                className={`text-xs font-black uppercase tracking-widest transition-colors duration-200 ${isCurrent ? 'text-indigo-600' : isActive ? 'text-slate-600' : 'text-slate-300'
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
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Bước {step} / 4</p>
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
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1 uppercase tracking-tighter transition-colors">
                {room ? `${room.code || room.name}` : (selectedRoomId ? `ID: ${selectedRoomId.substring(0, 8)}` : 'Chưa chọn')}
              </p>
            </div>
          </motion.div>
        </div>

        <StepIndicator step={step} />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative px-1">
        <AnimatePresence mode="wait">
          {/* Step 1: Tenants */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Chọn cư dân đã đăng ký</p>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">Chỉ các user đã có tài khoản mới được thêm vào hợp đồng để ký điện tử.</p>
                  </div>
                  <span className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                    {selectedTenants.length} cư dân
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_220px_140px] gap-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={tenantFilters.search}
                      onChange={(e) => updateTenantFilter('search', e.target.value)}
                      placeholder="Tim theo ten, email, so dien thoai..."
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-sm font-bold outline-none focus:border-indigo-400 dark:focus:border-indigo-500"
                    />
                  </div>

                  <select
                    value={tenantFilters.is_active}
                    onChange={(e) => updateTenantFilter('is_active', e.target.value as 'all' | 'true' | 'false')}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-sm font-bold outline-none focus:border-indigo-400 dark:focus:border-indigo-500"
                  >
                    <option value="all">Tat ca trang thai</option>
                    <option value="true">Dang hoat dong</option>
                    <option value="false">Ngung hoat dong</option>
                  </select>

                  <select
                    value={tenantFilters.per_page}
                    onChange={(e) => updateTenantFilter('per_page', Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-sm font-bold outline-none focus:border-indigo-400 dark:focus:border-indigo-500"
                  >
                    <option value={6}>6 / trang</option>
                    <option value={8}>8 / trang</option>
                    <option value={12}>12 / trang</option>
                  </select>
                </div>

                {selectedTenants.length > 0 && (
                  <div className="p-5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                        Cu dan da them vao hop dong
                      </p>
                      <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {selectedTenants.length} nguoi
                      </span>
                    </div>
                    <div className="space-y-2">
                      {selectedTenants.map((tenant) => (
                        <div
                          key={tenant.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 dark:border-slate-700 bg-white/90 dark:bg-slate-800/80 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                              {tenant.full_name}
                              {tenant.id === formData.primary_tenant_id ? ' (Nguoi thue chinh)' : ''}
                            </p>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                              {tenant.phone || tenant.email}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleTenantSelection(tenant)}
                            className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-500/20 text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          >
                            Bo chon
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {usersQuery.isLoading ? (
                    <div className="md:col-span-2 p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-400 dark:text-slate-500 text-center flex items-center justify-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Dang tai danh sach cu dan...
                    </div>
                  ) : tenantOptions.length === 0 ? (
                    <div className="md:col-span-2 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-400 dark:text-slate-500 text-center">
                      Chưa có cư dân nào trong tòa nhà này. Hãy tạo tài khoản cư dân trước khi lập hợp đồng.
                    </div>
                  ) : (
                    tenantOptions.map((tenant) => {
                      const isSelected = formData.selected_tenant_ids.includes(tenant.id);
                      const isPrimary = formData.primary_tenant_id === tenant.id;

                      return (
                        <button
                          key={tenant.id}
                          type="button"
                          onClick={() => toggleTenantSelection(tenant)}
                          className={`p-5 rounded-3xl border text-left transition-all ${isSelected
                            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                            : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-200'
                            }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-slate-900 dark:text-slate-100">{tenant.full_name}</p>
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{tenant.phone || 'Chưa có số điện thoại'}</p>
                              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">CCCD: {tenant.identity_number || 'Chưa cập nhật'}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                              }`}>
                              {isSelected ? 'Đã chọn' : 'Chọn'}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-500/20">
                              <label className="flex items-center gap-3 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                                <input
                                  type="radio"
                                  name="primary_tenant"
                                  checked={isPrimary}
                                  onChange={() => updateField('primary_tenant_id', tenant.id)}
                                  className="w-4 h-4 accent-indigo-600"
                                />
                                Người thuê chính
                              </label>
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {tenantMeta && tenantMeta.last_page > 1 && (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-4 py-3">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Hien thi {tenantMeta.from} - {tenantMeta.to} trong {tenantMeta.total} cu dan
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateTenantFilter('page', Math.max(1, tenantMeta.current_page - 1))}
                        disabled={tenantMeta.current_page === 1}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-700 transition-colors"
                      >
                        Truoc
                      </button>
                      <span className="px-3 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                        Trang {tenantMeta.current_page}/{tenantMeta.last_page}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateTenantFilter('page', Math.min(tenantMeta.last_page, tenantMeta.current_page + 1))}
                        disabled={tenantMeta.current_page === tenantMeta.last_page}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-700 transition-colors"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}

                <FieldError message={errors.tenants} />
              </div>
            </motion.div>
          )}

          {/* Step 2: Room */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-6"
            >
              <div className="p-6 border border-slate-100 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-800 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tìm phòng</label>
                    <div className="relative mt-2">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={roomFilters.search}
                        onChange={(e) => setRoomFilters((prev) => ({ ...prev, search: e.target.value }))}
                        placeholder="Mã phòng, tên phòng..."
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 text-sm font-bold outline-none focus:border-indigo-400 dark:focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Lọc theo tầng</label>
                    <select
                      value={roomFilters.floor_id}
                      onChange={(e) => setRoomFilters((prev) => ({ ...prev, floor_id: e.target.value }))}
                      className="mt-2 w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 text-sm font-bold outline-none focus:border-indigo-400 dark:focus:border-indigo-500"
                    >
                      <option value="">Tất cả tầng</option>
                      {floors.map((floor) => (
                        <option key={floor.id} value={floor.id}>
                          {floor.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Trạng thái phòng</label>
                    <select
                      value={roomFilters.status}
                      onChange={(e) => setRoomFilters((prev) => ({ ...prev, status: e.target.value as 'all' | RoomStatus }))}
                      className="mt-2 w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 text-sm font-bold outline-none focus:border-indigo-400 dark:focus:border-indigo-500"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="available">Phòng trống</option>
                      <option value="occupied">Phòng đã thuê</option>
                      <option value="reserved">Phòng giữ chỗ</option>
                      <option value="maintenance">Phòng bảo trì</option>
                      <option value="draft">Phòng nháp</option>
                    </select>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {isRoomsLoading || isContractsLoading ? (
                    <p className="text-sm font-bold text-slate-400 px-2 py-6">Đang tải danh sách phòng...</p>
                  ) : roomsError ? (
                    <p className="text-sm font-bold text-rose-500 px-2 py-6">Không thể tải danh sách phòng. Vui lòng thử tải lại trang.</p>
                  ) : filteredRooms.length === 0 ? (
                    <p className="text-sm font-bold text-slate-400 px-2 py-6">Không có phòng phù hợp với bộ lọc hiện tại.</p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {filteredRooms.map((r) => {
                        const isSelected = selectedRoomId === r.id;
                        const floorName = r.floor?.name || r.floor_name || 'Chua gan tang';
                        const normalizedStatus = normalizeRoomStatus(r.status);
                        const isBlocked = blockedRoomIds.has(r.id);
                        const isMaintenance = normalizedStatus === 'maintenance';
                        const isUnavailable = isBlocked || isMaintenance;
                        return (
                          <button
                            type="button"
                            key={r.id}
                            disabled={isUnavailable}
                            onClick={() => {
                              setSelectedRoomId(r.id);
                              setErrors((prev) => ({ ...prev, room_id: undefined }));
                            }}
                            className={`text-left p-4 rounded-2xl border transition-all ${isSelected

                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15'
                                : isUnavailable
                                  ? 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 opacity-60 cursor-not-allowed'
                                  : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300'

                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15'
                              : isBlocked
                                ? 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 opacity-60 cursor-not-allowed'
                                : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300'

                              }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-black text-slate-900 dark:text-slate-100">{r.code || r.name}</p>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                                  {r.name} - {floorName}
                                </p>
                                {isMaintenance ? (
                                  <p className="text-[11px] font-bold text-amber-500 mt-1">Phong dang bao tri, tam thoi khong the chon</p>
                                ) : isBlocked ? (
                                  <p className="text-[11px] font-bold text-rose-500 mt-1">Phong dang co hop dong hieu luc, khong the chon</p>
                                ) : null}
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${roomStatusClass[normalizedStatus]}`}>
                                {roomStatusLabel[normalizedStatus]}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <FieldError message={errors.room_id} />
              </div>

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
                        {(() => {
                          const normalizedStatus = normalizeRoomStatus(room?.status);
                          return (
                            <span className={`inline-block border-none font-black text-[9px] uppercase tracking-widest mb-3 rounded-lg px-2.5 py-1 transition-colors ${room ? roomStatusClass[normalizedStatus] : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              }`}>
                              Trạng thái: {room ? roomStatusLabel[normalizedStatus] : 'Chưa chọn'}
                            </span>
                          );
                        })()}
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none transition-colors">THÔNG TIN PHÒNG HIỆN TẠI</h3>
                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-tight transition-colors">
                          {room
                            ? `Phòng: ${room.code || room.name} • Tầng: ${room.floor?.name || room.floor_name || 'N/A'}`
                            : 'Vui lòng chọn phòng ở danh sách bên trên'}
                        </p>
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
                    Vui lòng kiểm tra kỹ mã phòng trước khi tiếp tục. Các chỉ số dịch vụ sẽ được cấu hình ở bước Tài chính tiếp theo.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          {/* Step 3: Terms */}
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
                  <label className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest ml-1 italic transition-colors">
                    Bắt đầu từ ngày
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 dark:text-indigo-500 transition-colors" />
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => updateField('start_date', e.target.value)}
                      className={`w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 border rounded-[1.25rem] outline-none focus:ring-4 transition-all text-sm font-black shadow-sm ${errors.start_date ? 'border-rose-200 dark:border-rose-900/50 ring-rose-50 dark:ring-rose-900/20' : 'border-slate-100 dark:border-slate-700 ring-indigo-50 dark:ring-indigo-500/20'
                        }`}
                    />
                  </div>
                  <FieldError message={errors.start_date} />
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
                      min={minimumEndDate || formData.start_date}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-indigo-50/30 dark:focus:ring-indigo-500/20 transition-all text-sm font-black shadow-sm"
                    />
                  </div>
                  {minimumEndDate && (
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 ml-2 italic">
                      * Toi thieu: {new Date(`${minimumEndDate}T00:00:00`).toLocaleDateString('vi-VN')} ({minimumEndDate})
                    </p>
                  )}
                  <FieldError message={errors.end_date} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-1">
                <div className="space-y-2 text-left">
                  <label className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest ml-1 transition-colors">
                    Giá thuê 1 tháng (VNĐ) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-indigo-500 dark:text-indigo-400 transition-colors">₫</div>
                    <input
                      type="number"
                      value={formData.rent_price || ''}
                      onChange={(e) => updateField('rent_price', Number(e.target.value))}
                      placeholder={room?.base_price === 0 ? "Tự động tính theo diện tích..." : "0"}
                      className={`w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 dark:text-slate-100 border rounded-[1.25rem] outline-none focus:ring-4 transition-all text-lg font-black shadow-sm ${errors.rent_price ? 'border-rose-200 dark:border-rose-900/50 ring-rose-50 dark:ring-rose-900/20' : 'border-slate-100 dark:border-slate-700 ring-indigo-50 dark:ring-indigo-500/20'
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
                  <FieldError message={errors.rent_price} />
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
                    onChange={(e) => updateField('billing_cycle', Number(e.target.value))}
                    className="w-full px-5 py-4 bg-slate-50/50 dark:bg-slate-800/50 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-indigo-50/50 dark:focus:ring-indigo-500/20 transition-all text-sm font-black cursor-pointer shadow-sm"
                  >
                    {Array.from({ length: 12 }, (_, index) => {
                      const months = index + 1;
                      return (
                        <option key={months} value={months}>
                          {months} tháng
                        </option>
                      );
                    })}
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
                  <FieldError message={errors.due_day} />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 transition-colors">
                    Chốt số (Ngày)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={formData.cutoff_day}
                    onChange={(e) => updateField('cutoff_day', Math.min(Number(e.target.value), 25))}
                    className="w-full px-5 py-4 bg-white dark:bg-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-slate-50 dark:focus:ring-slate-700 transition-all text-sm font-black shadow-sm"
                  />
                  <FieldError message={errors.cutoff_day} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review */}
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
                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] transition-colors">Bản xem trước thỏa thuận</h4>
                    <span className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1 transition-colors">
                      <ShieldAlert className="w-3 h-3" /> Chế độ an toàn
                    </span>
                  </div>


                  {contractWarnings.length > 0 && (
                    <div className="rounded-3xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-500/5 p-5 space-y-3 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                          <AlertCircle className="w-4 h-4" />
                          <p className="text-xs font-black uppercase tracking-widest">Cac diem can luu y truoc khi tao</p>
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-300">
                          {contractWarnings.length} warning
                        </span>
                      </div>
                      <div className="space-y-3">
                        {contractWarnings.map((warning) => (
                          <div key={warning.id} className="rounded-2xl border border-amber-100 dark:border-amber-500/10 bg-white/70 dark:bg-slate-900/30 px-4 py-3">
                            <p className="text-sm font-black text-slate-900 dark:text-slate-100">{warning.title}</p>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{warning.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-5xl p-10 space-y-8 shadow-xl shadow-slate-200/20 dark:shadow-none relative overflow-hidden group transition-colors">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-32 translate-x-32 blur-3xl pointer-events-none" />

                    <div className="flex justify-between items-start pb-8 border-b border-slate-100 dark:border-slate-700 transition-colors">
                      <div>
                        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">Bên thuê (Tenant)</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">
                          {primaryTenant?.full_name || 'CHƯA XÁC ĐỊNH'}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 transition-colors">{primaryTenant?.phone || 'Chưa có số điện thoại'}</p>
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
                          <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Tiền thuê hàng tháng</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter transition-colors">
                              {formatCurrencyVND(monthlyRent).replace('₫', '')}
                            </span>
                            <span className="text-sm font-black text-indigo-400 dark:text-indigo-500 transition-colors">VNĐ / tháng</span>
                          </div>
                        </div>

                        <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Chi tiết tiền thuê</span>
                            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-colors" />
                          </div>
                          <div className="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors">
                            <p>Chu kỳ thanh toán: <span className="font-black text-slate-800 dark:text-slate-200">{formatBillingCycleLabel(formData.billing_cycle)}</span></p>
                            <p>Tiền thuê phòng hàng tháng: <span className="font-black text-indigo-700 dark:text-indigo-400">{formatCurrencyVND(monthlyRent)}</span></p>
                            <p>Tổng tiền thuê chu kỳ này: <span className="font-black text-indigo-700 dark:text-indigo-400">{formatCurrencyVND(monthlyRent)} x {billingCycleMonths} = {formatCurrencyVND(recurringRentTotal)}</span></p>
                          </div>
                        </div>

                        <div className="p-5 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2 transition-colors">
                          <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Danh sách người ký</span>
                          <div className="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                            {selectedTenants.map((tenant) => (
                              <p key={tenant.id}>
                                {tenant.full_name}
                                <span className="font-black text-slate-800 dark:text-slate-200"> {tenant.id === formData.primary_tenant_id ? '(Người thuê chính)' : '(Thành viên hợp đồng)'}</span>
                              </p>
                            ))}
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

                        <div className="p-5 bg-emerald-50/60 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100/70 dark:border-emerald-500/20 space-y-3 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest transition-colors">Tổng thanh toán ban đầu</span>
                            <FileText className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 transition-colors" />
                          </div>
                          <div className="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors">
                            <p>Tiền thuê phòng hàng tháng x số tháng: <span className="font-black text-slate-800 dark:text-slate-200">{formatCurrencyVND(monthlyRent)} x {billingCycleMonths} = {formatCurrencyVND(recurringRentTotal)}</span></p>
                            <p>Tiền cọc: <span className="font-black text-slate-800 dark:text-slate-200">{formatCurrencyVND(depositAmount)}</span></p>
                            <p className="pt-2 border-t border-emerald-100 dark:border-emerald-500/20">Tổng tiền phải thu ban đầu: <span className="font-black text-emerald-700 dark:text-emerald-400">{formatCurrencyVND(agreementGrandTotal)}</span></p>
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
                          {[1, 2, 3].map(i => (
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

          {step < 4 ? (
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