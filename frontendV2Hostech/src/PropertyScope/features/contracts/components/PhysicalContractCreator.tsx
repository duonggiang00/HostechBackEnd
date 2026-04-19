import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  FileSignature, Loader2, Save, X,
  Building2, User, CalendarDays, FileText, Landmark,
  CheckCircle2, UserPlus, UserX, Mail, Shield, AlertCircle, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

import { contractsApi } from '../api/contracts';
import type { CreateContractPayload } from '../types';
import { useRooms, useRoomDetail } from '@/PropertyScope/features/rooms/hooks/useRooms';
import { usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import apiClient from '@/shared/api/client';

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  room_id: z.string().min(1, 'Vui lòng chọn phòng thuê'),
  start_date: z.string().min(1, 'Vui lòng chọn ngày bắt đầu hợp đồng'),
  end_date: z.string().optional(),
  rent_price: z.number({ required_error: 'Vui lòng nhập giá thuê' }).min(1, 'Giá thuê phải lớn hơn 0'),
  deposit_amount: z.number({ required_error: 'Vui lòng nhập tiền cọc' }).min(0, 'Tiền cọc không được là số âm'),
  billing_cycle: z.number().min(1, 'Chu kỳ tối thiểu 1 tháng').max(12, 'Chu kỳ tối đa 12 tháng'),
  due_day: z.number().min(1, 'Ngày hạn đóng tiền từ mùng 1-31').max(31, 'Ngày hạn đóng tiền từ mùng 1-31'),
  cutoff_day: z.number().min(1, 'Ngày chốt số từ mùng 1-31').max(31, 'Ngày chốt số từ mùng 1-31'),
  // Tenant identity
  tenant_email: z.string().email('Địa chỉ email không hợp lệ').optional().or(z.literal('')),
  tenant_full_name: z.string().min(2, 'Vui lòng nhập đầy đủ họ tên người thuê'),
  tenant_phone: z.string().min(10, 'Số điện thoại phải có ít nhất 10 số'),
  tenant_identity_number: z.string().min(9, 'Số CCCD/CMND phải từ 9-12 số').max(12, 'Số CCCD/CMND phải từ 9-12 số'),
  tenant_date_of_birth: z.string().optional(),
  tenant_license_plate: z.string().optional(),
  tenant_permanent_address: z.string().optional(),
  clause_responsibilities: z.string().optional(),
  clause_extra: z.string().optional(),
  additional_members: z.array(z.object({
    full_name: z.string().min(2, 'Vui lòng nhập đầy đủ họ tên'),
    phone: z.string().min(10, 'Số điện thoại phải có ít nhất 10 số'),
    email: z.string().email('Địa chỉ email không hợp lệ').optional().or(z.literal('')),
    identity_number: z.string().min(9, 'Số CCCD/CMND phải từ 9-12 số').max(12, 'Số CCCD/CMND phải từ 9-12 số'),
    date_of_birth: z.string().optional(),
    license_plate: z.string().optional(),
    role: z.enum(['TENANT', 'ROOMMATE', 'GUARANTOR']).default('ROOMMATE'),
  })).optional().default([]),
});

type FormValues = z.infer<typeof schema>;

interface PhysicalContractCreatorProps {
  propertyId: string;
  roomId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(value || 0);

/** Hiển thị giá trị hoặc placeholder nhợt nếu chưa có */
function DataField({ value, placeholder = '—' }: { value?: string | null; placeholder?: string }) {
  if (value) {
    return <span className="font-medium text-gray-900 dark:text-gray-100">{value}</span>;
  }
  return <span className="italic text-gray-400 dark:text-gray-600 text-xs">{placeholder}</span>;
}

/** Inline input bên trong văn bản */
function InlineInput({
  id, value, onChange, placeholder, type = 'text', className = '', error
}: {
  id: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; className?: string; error?: string;
}) {
  return (
    <span className="inline-flex flex-col">
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`inline-block border-b-2 border-dashed border-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20
          text-indigo-900 dark:text-indigo-200 px-1.5 py-0.5 text-sm outline-none
          focus:border-indigo-600 focus:bg-indigo-50 dark:focus:bg-indigo-800/30 rounded-sm transition-colors
          placeholder:text-indigo-300 dark:placeholder:text-indigo-600
          ${error ? 'border-red-400 bg-red-50/40' : ''} ${className}`}
      />
      {error && <span className="text-[10px] text-red-500 mt-0.5">{error}</span>}
    </span>
  );
}

// ─── TenantSearchInput ────────────────────────────────────────────────────────
type TenantStatus = 'idle' | 'checking' | 'found' | 'new' | 'manual';

function TenantSearchInput({
  value, onChange, onUserFound, onReset
}: {
  value: string;
  onChange: (v: string) => void;
  onUserFound: (user: { id: string; full_name: string; phone: string; identity_number: string }) => void;
  onReset: () => void;
}) {
  const [status, setStatus] = useState<TenantStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const check = useCallback(async (email: string) => {
    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      setStatus('idle');
      return;
    }
    setStatus('checking');
    try {
      const res = await apiClient.get('/users/check-email', { params: { email } });
      const user = res.data?.data;
      if (user) {
        setStatus('found');
        onUserFound(user);
      } else {
        setStatus('new');
        onReset();
      }
    } catch {
      setStatus('new');
      onReset();
    }
  }, [onUserFound, onReset]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    onReset();
    setStatus('idle');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => check(val), 600);
  };

  const statusConfig = {
    idle:     { icon: <Mail className="w-3.5 h-3.5 text-gray-400" />, text: '', cls: '' },
    checking: { icon: <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />, text: 'Đang kiểm tra...', cls: 'text-gray-400' },
    found:    { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />, text: 'Đã có tài khoản — sẽ nhận thông báo ký', cls: 'text-emerald-600' },
    new:      { icon: <UserPlus className="w-3.5 h-3.5 text-amber-500" />, text: 'Chưa có tài khoản — sẽ nhận link đăng ký qua email', cls: 'text-amber-600' },
    manual:   { icon: <UserX className="w-3.5 h-3.5 text-gray-400" />, text: 'Không điền email — xác nhận thủ công', cls: 'text-gray-400' },
  }[status];

  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1">
        <input
          id="tenant_email"
          type="email"
          value={value}
          onChange={handleChange}
          placeholder="email@tenant.com (tùy chọn)"
          className="inline-block border-b-2 border-dashed border-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20
            text-indigo-900 dark:text-indigo-200 px-1.5 py-0.5 text-sm outline-none
            focus:border-indigo-600 focus:bg-indigo-50 dark:focus:bg-indigo-800/30 rounded-sm transition-colors
            placeholder:text-indigo-300 dark:placeholder:text-indigo-600 w-64"
        />
        {statusConfig.icon}
      </span>
      {statusConfig.text && (
        <span className={`text-[10px] ${statusConfig.cls} flex items-center gap-1`}>
          {statusConfig.text}
        </span>
      )}
    </span>
  );
}

/** Tiêu đề điều khoản (Heading) trong hợp đồng */
function ArticleHeading({ number, title, icon }: { number: string; title: string; icon?: React.ReactNode }) {
  return (
    <h3 className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide mt-7 mb-3 text-sm
      border-b-2 border-gray-300 dark:border-gray-600 pb-1.5 flex items-center gap-2">
      {icon}
      {number}: {title}
    </h3>
  );
}

/** Một điều khoản chỉ đọc (Static) – hiển thị như văn bản gốc */
function StaticClause({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-baseline gap-2 text-sm leading-7 text-gray-700 dark:text-gray-300">
      {children}
    </p>
  );
}

function BulletPoint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-gray-400 font-bold shrink-0">•</span>
      <span>{children}</span>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-1 text-sm leading-7 flex-wrap">
      <span className="font-semibold text-gray-700 dark:text-gray-300 shrink-0">{label}:</span>
      <span className="text-gray-800 dark:text-gray-200 flex items-center flex-wrap gap-1">{children}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PhysicalContractCreator({
  propertyId, roomId: initialRoomId, onSuccess, onCancel
}: PhysicalContractCreatorProps) {

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: roomsData } = useRooms({ property_id: propertyId, status: 'available' });
  const rooms = roomsData || [];

  const { data: property } = usePropertyDetail(propertyId);
  const { user: currentUser } = useAuthStore();

  // ── Form ───────────────────────────────────────────────────────────────────
  const {
    register, handleSubmit, watch, setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      room_id: initialRoomId || '',
      start_date: new Date().toISOString().split('T')[0],
      billing_cycle: 1,
      due_day: (property as any)?.default_due_day || 5,
      cutoff_day: (property as any)?.default_cutoff_day || 25,
      rent_price: 0,
      deposit_amount: 0,
      tenant_email: '',
      tenant_full_name: '',
      tenant_phone: '',
      tenant_identity_number: '',
      tenant_date_of_birth: '',
      tenant_license_plate: '',
      tenant_permanent_address: '',
      clause_responsibilities: '',
      clause_extra: '',
      additional_members: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'additional_members',
  });

  // resolved user from TenantSearchInput (Path A: email matched existing account)
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  const v = watch();
  const selectedRoom = rooms.find((r: any) => r.id === v.room_id);

  // Fetch full room detail to get assets + room_services
  const { data: roomDetail } = useRoomDetail(v.room_id || undefined);

  // Auto-fill rent_price and deposit_amount when room changes
  useEffect(() => {
    if (!roomDetail) return;
    const price = roomDetail.base_price ?? 0;
    if (price > 0) {
      setValue('rent_price', price, { shouldValidate: true });
      const currentDeposit = v.deposit_amount;
      if (!currentDeposit || currentDeposit === 0) {
        setValue('deposit_amount', price, { shouldValidate: true });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomDetail?.id]);

  // ── Derived property/user info ─────────────────────────────────────────────
  const propertyName = (property as any)?.name || '';
  const propertyAddress = (property as any)?.address || '';
  const propertyHouseRules: string = (property as any)?.house_rules || '';
  const bankAccounts: any[] = (property as any)?.bank_accounts || [];
  const primaryBank = bankAccounts[0];

  const repFullName = currentUser?.full_name || '';
  const repPhone = currentUser?.phone || '';
  const repRole = currentUser?.role === 'Owner' ? 'Chủ sở hữu'
    : currentUser?.role === 'Manager' ? 'Quản lý tòa nhà'
    : currentUser?.role === 'Staff' ? 'Nhân viên quản lý'
    : currentUser?.role || '';

  /** Tạo nội dung mặc định cho Điều 3 từ house_rules + các điều khoản chuẩn */
  const buildDefaultResponsibilities = useCallback((houseRules: string): string => {
    const lines: string[] = ['3.1. Các quy định về hành vi và vệ sinh:'];
    if (houseRules) {
      houseRules.split('\n').filter(Boolean).forEach(rule => {
        lines.push('   ' + rule.trim());
      });
    } else {
      lines.push('   - (Chưa có quy định — vui lòng bổ sung)');
    }
    lines.push('');
    lines.push('3.2. Bên thuê có trách nhiệm bảo quản tốt các tài sản, trang thiết bị trong nhà. Nếu hư hỏng do lỗi người dùng phải bồi thường theo giá thị trường.');
    lines.push('');
    lines.push('3.3. Tuyệt đối không được khoan tường, đóng đinh, dán giấy khi chưa được sự đồng ý của Bên A.');
    return lines.join('\n');
  }, []);

  // Auto-fill clause_responsibilities khi property load xong (chỉ fill 1 lần)
  const [responsibilitiesInitialized, setResponsibilitiesInitialized] = useState(false);
  useEffect(() => {
    if (property && !responsibilitiesInitialized) {
      const houseRules = (property as any)?.house_rules || '';
      const current = watch('clause_responsibilities');
      if (!current) {
        setValue('clause_responsibilities', buildDefaultResponsibilities(houseRules));
      }
      setResponsibilitiesInitialized(true);
    }
  }, [property, responsibilitiesInitialized, buildDefaultResponsibilities, setValue, watch]);

  // ── Mutation ───────────────────────────────────────────────────────────────
  const createContract = useMutation({
    mutationFn: (payload: CreateContractPayload) => contractsApi.createContract(payload),
    onSuccess: () => {
      toast.success('Hợp đồng đã được tạo thành công!');
      onSuccess?.();
    },
    onError: (error: AxiosError<any>) => {
      console.error('Create contract error:', error.response?.data || error);
      const serverErrors = error.response?.data?.errors;
      if (serverErrors) {
        const fieldMap: Record<string, string> = {
          room_id: 'Phòng',
          start_date: 'Ngày bắt đầu',
          end_date: 'Ngày kết thúc',
          rent_price: 'Giá thuê',
          deposit_amount: 'Tiền cọc',
          billing_cycle: 'Chu kỳ thanh toán',
          due_day: 'Ngày hạn đóng tiền',
          cutoff_day: 'Ngày chốt số',
          members: 'Thành viên',
          tenant_full_name: 'Họ tên người thuê',
          tenant_phone: 'Số điện thoại',
          tenant_identity_number: 'Số CCCD',
          tenant_email: 'Email',
        };

        const firstErrorKey = Object.keys(serverErrors)[0];
        const firstErrorMessages = serverErrors[firstErrorKey];
        const message = Array.isArray(firstErrorMessages) ? firstErrorMessages[0] : firstErrorMessages;
        const translatedKey = fieldMap[firstErrorKey] || firstErrorKey;
        
        toast.error(`${translatedKey}: ${message}`);
      } else {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo hợp đồng');
      }
    },
  });

  const onSubmit = (data: FormValues) => {
    const primaryMember: any = {
      full_name: data.tenant_full_name,
      phone: data.tenant_phone,
      identity_number: data.tenant_identity_number,
      date_of_birth: data.tenant_date_of_birth || undefined,
      license_plate: data.tenant_license_plate || undefined,
      permanent_address: data.tenant_permanent_address || undefined,
      role: 'TENANT',
      is_primary: true,
      joined_at: data.start_date,
    };

    if (resolvedUserId) {
      primaryMember.user_id = resolvedUserId;
    } else if (data.tenant_email) {
      primaryMember.email = data.tenant_email;
    }

    const additionalMembers = (data.additional_members || []).map(m => ({
      ...m,
      is_primary: false,
      joined_at: data.start_date,
    }));

    const payload: CreateContractPayload = {
      property_id: propertyId,
      room_id: data.room_id,
      start_date: data.start_date,
      end_date: data.end_date,
      rent_price: data.rent_price,
      deposit_amount: data.deposit_amount,
      billing_cycle: data.billing_cycle,
      due_day: data.due_day,
      cutoff_day: data.cutoff_day,
      members: [primaryMember, ...additionalMembers],
    };
    createContract.mutate(payload);
  };

  const errorMessages = Object.values(errors).map(e => e?.message).filter(Boolean);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">

      {/* ── ACTION BAR ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-gray-800
        border-b border-gray-200 dark:border-gray-700 shrink-0 gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-indigo-500" />
          <span className="font-bold text-gray-800 dark:text-white">Soạn thảo Hợp Đồng Thuê Phòng</span>
          {propertyName && (
            <span className="text-xs text-gray-400 hidden sm:block">— {propertyName}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-500
                hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-4 h-4" /> Hủy
            </button>
          )}
          <button type="submit" disabled={createContract.isPending}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700
              text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-70
              shadow-md shadow-indigo-500/20">
            {createContract.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />}
            Lưu &amp; Tạo Hợp Đồng
          </button>
        </div>
      </div>

      {/* ── VALIDATION ERRORS ── */}
      {errorMessages.length > 0 && (
        <div className="mx-5 mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700
          rounded-lg text-xs text-red-600 dark:text-red-400 flex flex-wrap gap-2">
          {errorMessages.map((msg, i) => <span key={i} className="font-medium">⚠ {msg}</span>)}
        </div>
      )}

      {/* ── CONTRACT DOCUMENT ── */}
      <div className="flex-1 overflow-auto py-6 px-4">
        <div className="mx-auto max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-lg
          border border-gray-200 dark:border-gray-700 overflow-hidden">

          {/* Legend */}
          <div className="flex items-center gap-5 px-6 py-2.5 bg-gray-50 dark:bg-gray-700/50 border-b
            border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-100 border-b-2 border-dashed border-indigo-400 inline-block" />
              Ô cần điền
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-1.5 rounded bg-gray-300 dark:bg-gray-500" />
              Điền tự động từ hệ thống
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-amber-500" />
              Điều khoản pháp lý (chỉ đọc)
            </span>
          </div>

          {/* Document Body */}
          <div className="px-10 py-8 text-sm leading-relaxed text-gray-800 dark:text-gray-200 font-serif">

            {/* ── HEADER ── */}
            <div className="text-center mb-6 space-y-0.5">
              <p className="font-bold text-base uppercase tracking-wide">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="font-semibold">Độc lập – Tự do – Hạnh phúc</p>
              <p className="text-gray-400 text-xs">───────────────────</p>
              <p className="font-bold text-lg uppercase mt-3">HỢP ĐỒNG THUÊ NHÀ</p>
              <p className="text-xs text-gray-500 mt-1">
                Mã hợp đồng: <span className="text-gray-400 italic">
                  {selectedRoom?.code || '???'}/
                  <span className="text-[10px]">Tự động khi lưu</span>
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Hôm nay, ngày <span className="font-medium text-gray-700 dark:text-gray-300">
                  {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>{' '}
                tại tòa nhà <DataField value={propertyName} placeholder="chưa có tên tòa nhà" />
              </p>
              <p className="text-xs text-gray-500">
                Địa chỉ: <DataField value={propertyAddress} placeholder="chưa có địa chỉ tòa nhà" />
              </p>
              <p className="text-xs text-gray-500 mt-1 italic">Chúng tôi gồm:</p>
            </div>

            {/* ── BÊN A ── */}
            <h3 className="font-bold text-sm uppercase tracking-wide mt-5 mb-2 text-gray-900 dark:text-gray-100
              bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              BÊN CHO THUÊ (BÊN A)
            </h3>
            <div className="pl-3 space-y-0.5 border-l-2 border-blue-200 dark:border-blue-700 ml-1">
              <InfoRow label="Tổ chức">
                <DataField value={(property as any)?.org?.name} placeholder="(Tên tổ chức)" />
              </InfoRow>
              <InfoRow label="Đại diện">
                <DataField value={repFullName} placeholder="(Tên đại diện chưa cập nhật trong hồ sơ)" />
              </InfoRow>
              <InfoRow label="Chức vụ">
                <DataField value={repRole} placeholder="(Vai trò)" />
              </InfoRow>
              <InfoRow label="Điện thoại">
                <DataField value={repPhone} placeholder="(Chưa có SĐT trong hồ sơ)" />
              </InfoRow>
              <InfoRow label="Địa chỉ">
                <DataField value={propertyAddress} placeholder="(Địa chỉ tòa nhà chưa thiết lập)" />
              </InfoRow>
            </div>

            {/* ── BÊN B ── */}
            <h3 className="font-bold text-sm uppercase tracking-wide mt-5 mb-2 text-gray-900 dark:text-gray-100
              bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-500" />
              BÊN THUÊ NHÀ (BÊN B)
            </h3>
            <div className="pl-3 space-y-1 border-l-2 border-emerald-200 dark:border-emerald-700 ml-1">
              {/* Email (TenantSearchInput — drives Path A/B/C) */}
              <InfoRow label="Email">
                <TenantSearchInput
                  value={v.tenant_email || ''}
                  onChange={val => setValue('tenant_email', val)}
                  onUserFound={user => {
                    setResolvedUserId(user.id);
                    if (!v.tenant_full_name) setValue('tenant_full_name', user.full_name);
                    if (!v.tenant_phone)     setValue('tenant_phone', user.phone || '');
                    if (!v.tenant_identity_number) setValue('tenant_identity_number', user.identity_number || '');
                  }}
                  onReset={() => setResolvedUserId(null)}
                />
              </InfoRow>
              <InfoRow label="Họ và tên">
                <InlineInput id="tenant_full_name" value={v.tenant_full_name}
                  onChange={val => setValue('tenant_full_name', val, { shouldValidate: true })}
                  placeholder="Họ và tên đầy đủ" className="w-56"
                  error={errors.tenant_full_name?.message} />
              </InfoRow>
              <InfoRow label="Năm sinh">
                <InlineInput id="tenant_date_of_birth" value={v.tenant_date_of_birth || ''}
                  onChange={val => setValue('tenant_date_of_birth', val)}
                  type="date" className="w-40" />
              </InfoRow>
              <InfoRow label="Số CCCD">
                <InlineInput id="tenant_identity_number" value={v.tenant_identity_number}
                  onChange={val => setValue('tenant_identity_number', val, { shouldValidate: true })}
                  placeholder="012345678901" className="w-44"
                  error={errors.tenant_identity_number?.message} />
              </InfoRow>
              <InfoRow label="Điện thoại">
                <InlineInput id="tenant_phone" value={v.tenant_phone}
                  onChange={val => setValue('tenant_phone', val, { shouldValidate: true })}
                  placeholder="09xx..." className="w-36"
                  error={errors.tenant_phone?.message} />
              </InfoRow>
              <InfoRow label="Địa chỉ HKTT">
                <InlineInput id="tenant_permanent_address" value={v.tenant_permanent_address || ''}
                  onChange={val => setValue('tenant_permanent_address', val)}
                  placeholder="Số nhà, đường, phường/xã, tỉnh/thành..." className="w-72" />
              </InfoRow>
              <InfoRow label="Biển số xe">
                <InlineInput id="tenant_license_plate" value={v.tenant_license_plate || ''}
                  onChange={val => setValue('tenant_license_plate', val)}
                  placeholder="59-X1 123.45 (nếu có)" className="w-44" />
              </InfoRow>
            </div>

            {/* ── DANH SÁCH THÀNH VIÊN CÙNG Ở ── */}
            <div className="flex items-center justify-between mt-8 mb-4 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded">
              <h3 className="font-bold text-sm uppercase tracking-wide text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-500" />
                DANH SÁCH THÀNH VIÊN KHÁC (BÊN B)
              </h3>
              <button
                type="button"
                onClick={() => append({
                  full_name: '',
                  phone: '',
                  email: '',
                  identity_number: '',
                  date_of_birth: '',
                  license_plate: '',
                  role: 'ROOMMATE'
                })}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase tracking-tight
                  bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
              >
                + Thêm thành viên
              </button>
            </div>

            <div className="pl-3 ml-1 space-y-6">
              {fields.length === 0 ? (
                <p className="text-gray-400 text-xs italic py-2">
                  Chưa có thành viên nào khác được thêm vào hợp đồng này.
                </p>
              ) : (
                fields.map((field, index) => (
                  <div key={field.id} className="relative p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/30 dark:bg-gray-900/10 space-y-3">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      <InfoRow label="Họ và tên">
                        <InlineInput
                          id={`member_${index}_name`}
                          value={watch(`additional_members.${index}.full_name`) || ''}
                          onChange={val => setValue(`additional_members.${index}.full_name`, val, { shouldValidate: true })}
                          placeholder="Họ và tên người ở cùng"
                          className="w-48"
                          error={(errors.additional_members?.[index] as any)?.full_name?.message}
                        />
                      </InfoRow>

                      <InfoRow label="Vai trò">
                        <select
                          {...register(`additional_members.${index}.role`)}
                          className="text-xs border border-dashed border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded px-2 py-0.5 outline-none focus:border-indigo-600 dark:text-indigo-200"
                        >
                          <option value="ROOMMATE">Người ở cùng</option>
                          <option value="TENANT">Chủ đồng thuê</option>
                          <option value="GUARANTOR">Người bảo lãnh</option>
                        </select>
                      </InfoRow>

                      <InfoRow label="Điện thoại">
                        <InlineInput
                          id={`member_${index}_phone`}
                          value={watch(`additional_members.${index}.phone`) || ''}
                          onChange={val => setValue(`additional_members.${index}.phone`, val, { shouldValidate: true })}
                          placeholder="09xx..."
                          className="w-36"
                          error={(errors.additional_members?.[index] as any)?.phone?.message}
                        />
                      </InfoRow>

                      <InfoRow label="Email">
                        <InlineInput
                          id={`member_${index}_email`}
                          value={watch(`additional_members.${index}.email`) || ''}
                          onChange={val => setValue(`additional_members.${index}.email`, val)}
                          placeholder="email@..."
                          className="w-48"
                        />
                      </InfoRow>

                      <InfoRow label="Số CCCD">
                        <InlineInput
                          id={`member_${index}_id`}
                          value={watch(`additional_members.${index}.identity_number`) || ''}
                          onChange={val => setValue(`additional_members.${index}.identity_number`, val, { shouldValidate: true })}
                          placeholder="Số định danh..."
                          className="w-36"
                          error={(errors.additional_members?.[index] as any)?.identity_number?.message}
                        />
                      </InfoRow>

                      <InfoRow label="Ngày sinh">
                        <input
                          {...register(`additional_members.${index}.date_of_birth`)}
                          type="date"
                          className="border-b-2 border-dashed border-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20 px-1 py-0.5
                            text-sm text-indigo-900 dark:text-indigo-200 outline-none focus:border-indigo-600 rounded-sm w-36"
                        />
                      </InfoRow>

                      <InfoRow label="Biển số xe">
                        <InlineInput
                          id={`member_${index}_plate`}
                          value={watch(`additional_members.${index}.license_plate`) || ''}
                          onChange={val => setValue(`additional_members.${index}.license_plate`, val)}
                          placeholder="59-X1..."
                          className="w-32"
                        />
                      </InfoRow>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── INTRO ── */}
            <p className="mt-5 text-sm italic text-gray-600 dark:text-gray-400">
              Sau khi hai bên đi đến thống nhất ký kết hợp đồng thuê nhà với các điều kiện và điều khoản sau đây:
            </p>

            {/* ═══════════════════════════════════════════════════
                ĐIỀU 1: NỘI DUNG HỢP ĐỒNG
            ═══════════════════════════════════════════════════ */}
            <ArticleHeading number="ĐIỀU 1" title="NỘI DUNG HỢP ĐỒNG" icon={<FileText className="w-4 h-4 text-gray-500" />} />
            <div className="pl-4 space-y-1.5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-gray-500 font-semibold shrink-0">1.1.</span>
                <span>Bên A đồng ý cho Bên B thuê căn phòng số:</span>
                {selectedRoom ? (
                  <span className="font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                    {selectedRoom.code || selectedRoom.name}
                  </span>
                ) : (
                  <select {...register('room_id')}
                    className="text-sm border border-dashed border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded px-2 py-0.5 outline-none focus:border-indigo-600 dark:text-indigo-200">
                    <option value="">-- Chọn phòng --</option>
                    {rooms.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.code || r.name}</option>
                    ))}
                  </select>
                )}
                {errors.room_id && <span className="text-xs text-red-500">({errors.room_id.message})</span>}
              </div>
              {/* inline room switcher nếu đã chọn */}
              {selectedRoom && (
                <div className="flex items-center gap-2 text-xs text-gray-400 pl-6">
                  <span>Đổi phòng:</span>
                  <select {...register('room_id')}
                    className="border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 outline-none bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {rooms.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.code || r.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <StaticClause>
                <span className="text-gray-500 font-semibold shrink-0">1.2.</span>
                <span>Tòa nhà / Khu trọ: <DataField value={propertyName} placeholder="(chưa có tên tòa nhà)" /> — Địa chỉ: <DataField value={propertyAddress} placeholder="(chưa có địa chỉ)" /></span>
              </StaticClause>
              {roomDetail?.area && (
                <StaticClause>
                  <span className="text-gray-500 font-semibold shrink-0">1.3.</span>
                  <span>Diện tích: <span className="font-medium">{roomDetail.area}m²</span> — Sức chứa tối đa: <span className="font-medium">{roomDetail.capacity} người</span></span>
                </StaticClause>
              )}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-0">
                <span className="text-gray-500 font-semibold shrink-0">1.4.</span>
                <span>Thời hạn: Từ</span>
                <input {...register('start_date')} type="date"
                  className="border-b-2 border-dashed border-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20 px-1 py-0.5
                    text-sm text-indigo-900 dark:text-indigo-200 outline-none focus:border-indigo-600 rounded-sm" />
                <span>đến</span>
                <input {...register('end_date')} type="date"
                  className="border-b-2 border-dashed border-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20 px-1 py-0.5
                    text-sm text-indigo-900 dark:text-indigo-200 outline-none focus:border-indigo-600 rounded-sm" />
                <span className="text-gray-400 text-xs italic">(để trống nếu không giới hạn)</span>
              </div>

              {/* Tài sản bàn giao */}
              {roomDetail?.assets && roomDetail.assets.length > 0 && (
                <div className="mt-3 pl-0">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    1.5. Tài sản trong nhà bàn giao bao gồm:
                  </p>
                  <table className="w-full text-sm border-collapse ml-4">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-dotted border-gray-400">
                        <th className="text-left font-semibold py-0.5 w-8">STT</th>
                        <th className="text-left font-semibold py-0.5">Tên tài sản</th>
                        <th className="text-left font-semibold py-0.5 w-36">Số hiệu / S/N</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomDetail.assets.map((asset: any, i: number) => (
                        <tr key={asset.id ?? i}
                          className="border-b border-dotted border-gray-300 dark:border-gray-600">
                          <td className="py-1 text-gray-500">{i + 1}</td>
                          <td className="py-1 font-medium text-gray-800 dark:text-gray-200">{asset.name}</td>
                          <td className="py-1 font-mono text-gray-500 text-xs">
                            {asset.serial || <span className="italic text-gray-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════
                ĐIỀU 2: GIÁ THUÊ VÀ THANH TOÁN
            ═══════════════════════════════════════════════════ */}
            <ArticleHeading number="ĐIỀU 2" title="GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN" icon={<CalendarDays className="w-4 h-4 text-blue-500" />} />
            <div className="pl-4 space-y-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-gray-500 font-semibold shrink-0">2.1.</span>
                <span>Giá thuê phòng mỗi tháng là:</span>
                <input {...register('rent_price', { valueAsNumber: true })} type="number" min={0}
                  className="border-b-2 border-dashed border-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20 px-1 py-0.5
                    text-sm font-bold text-indigo-900 dark:text-indigo-200 outline-none focus:border-indigo-600 rounded-sm w-32 text-right" />
                <span>VNĐ/tháng</span>
                {v.rent_price > 0 && (
                  <span className="text-xs text-gray-500">— {formatVND(v.rent_price)} đồng</span>
                )}
                {errors.rent_price && <span className="text-xs text-red-500">({errors.rent_price.message})</span>}
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-gray-500 font-semibold shrink-0">2.2.</span>
                <span>Tiền đặt cọc:</span>
                <input {...register('deposit_amount', { valueAsNumber: true })} type="number" min={0}
                  className="border-b-2 border-dashed border-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20 px-1 py-0.5
                    text-sm font-bold text-indigo-900 dark:text-indigo-200 outline-none focus:border-indigo-600 rounded-sm w-32 text-right" />
                <span>VNĐ</span>
                {v.deposit_amount > 0 && (
                  <span className="text-xs text-gray-500">— {formatVND(v.deposit_amount)} đồng</span>
                )}
              </div>
              <StaticClause>
                <span className="text-gray-400 text-xs italic pl-6">
                  (Tiền cọc sẽ được hoàn trả sau khi thanh lý hợp đồng, trừ đi các khoản nợ còn lại. Bên B đơn phương chấm dứt hợp đồng trước thời hạn, tiền cọc sẽ không được hoàn trả.)
                </span>
              </StaticClause>

              {/* Dịch vụ kèm theo */}
              {roomDetail?.room_services && roomDetail.room_services.length > 0 ? (
                <div>
                  <p className="flex items-baseline gap-2">
                    <span className="text-gray-500 font-semibold shrink-0">2.3.</span>
                    <span>Chi phí dịch vụ khác:</span>
                  </p>
                  <table className="w-full text-sm border-collapse mt-1 ml-6">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-dotted border-gray-400">
                        <th className="text-left font-semibold py-0.5">Dịch vụ</th>
                        <th className="text-right font-semibold py-0.5 w-28">Đơn giá</th>
                        <th className="text-left font-semibold py-0.5 w-20 px-2">ĐVT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomDetail.room_services.map((rs: any, i: number) => (
                        <tr key={rs.id ?? i}
                          className="border-b border-dotted border-gray-300 dark:border-gray-600">
                          <td className="py-1 font-medium text-gray-800 dark:text-gray-200">
                            {rs.service?.name ?? 'Dịch vụ'}
                            {rs.quantity > 1 && <span className="text-gray-400 text-xs ml-1">×{rs.quantity}</span>}
                          </td>
                          <td className="py-1 text-right font-mono text-gray-700 dark:text-gray-300">
                            {rs.service?.price != null
                              ? formatVND(rs.service.price)
                              : rs.service?.current_price != null
                                ? formatVND(rs.service.current_price)
                                : <span className="italic text-gray-300">—</span>}
                          </td>
                          <td className="py-1 px-2 text-gray-500 text-xs">
                            {rs.service?.unit || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <StaticClause>
                  <span className="text-gray-500 font-semibold shrink-0">2.3.</span>
                  <span className="text-gray-400 italic text-xs">Chi phí dịch vụ theo quy định chung của tòa nhà (phòng này chưa gắn dịch vụ cụ thể).</span>
                </StaticClause>
              )}

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-gray-500 font-semibold shrink-0">2.4.</span>
                <span>Thời gian thanh toán:</span>
                <select {...register('billing_cycle', { valueAsNumber: true })}
                  className="border-b-2 border-dashed border-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20 px-1 py-0.5
                    text-sm outline-none focus:border-indigo-600 rounded-sm dark:text-indigo-200">
                  {[1, 2, 3, 6, 12].map(m => <option key={m} value={m}>{m} tháng</option>)}
                </select>
                <span>một lần — Hạn đóng: mùng</span>
                <input {...register('due_day', { valueAsNumber: true })} type="number" min={1} max={31}
                  className="border-b-2 border-dashed border-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20 px-1 py-0.5
                    text-sm outline-none focus:border-indigo-600 rounded-sm w-12 text-center dark:text-indigo-200" />
                <span>, Chốt số: mùng</span>
                <input {...register('cutoff_day', { valueAsNumber: true })} type="number" min={1} max={31}
                  className="border-b-2 border-dashed border-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20 px-1 py-0.5
                    text-sm outline-none focus:border-indigo-600 rounded-sm w-12 text-center dark:text-indigo-200" />
                <span>hàng tháng.</span>
              </div>

              <div>
                <StaticClause>
                  <span className="text-gray-500 font-semibold shrink-0">2.5.</span>
                  <span>Tài khoản ngân hàng nhận tiền (Tòa nhà):</span>
                </StaticClause>
                {primaryBank ? (
                  <div className="ml-6 mt-1 text-sm space-y-0.5">
                    <p><span className="font-semibold">Ngân hàng:</span> <span className="font-medium">{primaryBank.bank_name}</span></p>
                    <p><span className="font-semibold">Số tài khoản:</span> <span className="font-mono font-medium">{primaryBank.account_number}</span></p>
                    {primaryBank.account_name && (
                      <p><span className="font-semibold">Chủ tài khoản:</span> <span className="font-medium">{primaryBank.account_name}</span></p>
                    )}
                    {primaryBank.account_holder && (
                      <p><span className="font-semibold">Chủ tài khoản:</span> <span className="font-medium">{primaryBank.account_holder}</span></p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic ml-6 mt-1">
                    (Chưa thiết lập tài khoản ngân hàng cho tòa nhà — vui lòng cập nhật trong phần cài đặt tòa nhà)
                  </p>
                )}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                ĐIỀU 3: TRÁCH NHIỆM VÀ QUY ĐỊNH CHUNG
                ✏️ Người dùng có thể chỉnh sửa / thêm điều khoản
            ═══════════════════════════════════════════════════ */}
            <ArticleHeading number="ĐIỀU 3" title="TRÁCH NHIỆM VÀ QUY ĐỊNH CHUNG" icon={<Shield className="w-4 h-4 text-emerald-500" />} />

            {/* Info: editable pre-filled */}
            <div className="flex items-start gap-2 mb-3 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20
              border border-emerald-200 dark:border-emerald-700 rounded-lg text-xs text-emerald-700 dark:text-emerald-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Nội dung dưới đây được lấy từ quy định chung của tòa nhà (house rules) và các điều khoản chuẩn.
                <strong className="ml-1">Bạn có thể tự do chỉnh sửa, xóa hoặc thêm điều khoản</strong> phù hợp với từng hợp đồng cụ thể.
              </span>
            </div>

            {/* Toolbar: reset + quick-add chips */}
            <div className="flex flex-wrap items-center gap-2 mb-2 pl-4">
              {/* Nút khôi phục mặc định */}
              <button
                type="button"
                onClick={() => {
                  const houseRules = (property as any)?.house_rules || '';
                  setValue('clause_responsibilities', buildDefaultResponsibilities(houseRules));
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md
                  bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300
                  hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
              >
                <RefreshCw className="w-3 h-3" />
                Khôi phục mặc định
              </button>

              {/* Quick-add chips */}
              <span className="text-xs text-gray-400">Thêm nhanh:</span>
              {[
                '3.4. Không được nuôi thú cưng trong phòng.',
                '3.5. Phải thông báo trước khi mời khách ở lại qua đêm.',
                '3.6. Giữ trật tự, không gây tiếng ồn sau 22:00.',
                '3.7. Không hút thuốc trong phòng và khu vực chung.',
                '3.8. Phải đóng cửa và tắt điện khi ra ngoài lâu.',
              ].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    const current = watch('clause_responsibilities') || '';
                    setValue('clause_responsibilities', current + (current.endsWith('\n') || !current ? '' : '\n') + chip);
                  }}
                  title={chip}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full
                    bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400
                    border border-indigo-200 dark:border-indigo-700
                    hover:bg-indigo-100 dark:hover:bg-indigo-800/40 transition-colors cursor-pointer"
                >
                  + {chip.split('. ').slice(1).join('. ')}
                </button>
              ))}
            </div>

            {/* Editable textarea */}
            <div className="pl-4">
              <textarea
                {...register('clause_responsibilities')}
                rows={10}
                placeholder={
                  '3.1. Các quy định về hành vi và vệ sinh:\n' +
                  '   - Giữ gìn vệ sinh chung trong và ngoài phòng\n' +
                  '   - ...\n\n' +
                  '3.2. Bên thuê có trách nhiệm bảo quản tốt các tài sản...\n\n' +
                  '3.3. Tuyệt đối không được khoan tường...'
                }
                className="w-full border border-indigo-200 dark:border-indigo-700
                  bg-white dark:bg-gray-800/60
                  rounded-lg px-4 py-3 text-sm font-mono leading-6
                  text-gray-800 dark:text-gray-200
                  outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10
                  resize-y transition-colors
                  placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 text-right">
                {(v.clause_responsibilities || '').split('\n').filter(Boolean).length} dòng
                — Dùng phím Enter để xuống dòng, mỗi dòng là một điều khoản
              </p>
            </div>

            {/* ═══════════════════════════════════════════════════
                ĐIỀU 4: CHẤM DỨT HỢP ĐỒNG
                ⚠️ Điều khoản pháp lý – Chỉ đọc
            ═══════════════════════════════════════════════════ */}
            <ArticleHeading number="ĐIỀU 4" title="CHẤM DỨT HỢP ĐỒNG" icon={<AlertCircle className="w-4 h-4 text-red-400" />} />
            <div className="pl-4 space-y-2">
              <StaticClause>
                <span className="text-gray-500 font-semibold shrink-0">4.1.</span>
                <span>Trong trường hợp một trong hai bên muốn chấm dứt hợp đồng trước hạn phải thông báo cho bên kia ít nhất <strong>30 ngày</strong>.</span>
              </StaticClause>
              <StaticClause>
                <span className="text-gray-500 font-semibold shrink-0">4.2.</span>
                <span>Nếu Bên B tự ý chấm dứt hợp đồng mà không báo trước hoặc vi phạm nghiêm trọng các quy định tại Điều 3, Bên A có quyền đơn phương chấm dứt và <strong>không hoàn trả tiền đặt cọc</strong>.</span>
              </StaticClause>
            </div>

            {/* ═══════════════════════════════════════════════════
                ĐIỀU KHOẢN BỔ SUNG (Tùy chọn)
            ═══════════════════════════════════════════════════ */}
            <ArticleHeading number="ĐIỀU KHOẢN BỔ SUNG" title="(Tùy chọn)" icon={<Landmark className="w-4 h-4 text-violet-500" />} />
            <div className="pl-4">
              <textarea
                {...register('clause_extra')}
                rows={4}
                placeholder="Nhập các điều khoản bổ sung riêng cho hợp đồng này (nếu có)..."
                className="w-full border border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-900/10
                  rounded p-2 text-sm outline-none focus:border-indigo-500 resize-none text-gray-800 dark:text-gray-200
                  placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* ── CHÚ THÍCH CUỐI ── */}
            <p className="mt-6 text-xs text-gray-400 italic text-center">
              Hợp đồng này được lập thành 02 bản, mỗi bên giữ 01 bản có giá trị pháp lý như nhau.
            </p>

            {/* ── CHỮ KÝ ── */}
            <div className="mt-10 grid grid-cols-2 gap-6 text-center text-xs text-gray-500">
              <div className="space-y-2">
                <p className="font-bold text-sm text-gray-700 dark:text-gray-300">BÊN CHO THUÊ (BÊN A)</p>
                <p className="italic">(Ký và ghi rõ họ tên)</p>
                <div className="h-16 border-b border-gray-300 dark:border-gray-600" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  {repFullName || '..................................'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-sm text-gray-700 dark:text-gray-300">BÊN THUÊ NHÀ (BÊN B)</p>
                <p className="italic">(Ký và ghi rõ họ tên)</p>
                <div className="h-16 border-b border-gray-300 dark:border-gray-600" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  {v.tenant_full_name || '..................................'}
                </p>
              </div>
            </div>

          </div>{/* end document */}
        </div>

        {/* ── BOTTOM ACTION BAR ── */}
        <div className="mx-auto max-w-3xl mt-12 mb-20 flex flex-col sm:flex-row items-center justify-center gap-4 px-4 bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-center sm:text-left flex-1">
            <h4 className="font-bold text-gray-900 dark:text-white mb-1 uppercase tracking-tight">Hoàn tất soạn thảo?</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">Kiểm tra lại toàn bộ thông tin trước khi nhấn lưu và tạo hợp đồng.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-black uppercase tracking-widest text-gray-500
                  bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all active:scale-95"
              >
                <X className="w-5 h-5" /> Hủy bỏ
              </button>
            )}
            <button
              type="submit"
              disabled={createContract.isPending}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700
                text-white text-sm font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-70
                shadow-xl shadow-indigo-500/20 active:scale-95"
            >
              {createContract.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Lưu & Tạo Hợp Đồng
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
