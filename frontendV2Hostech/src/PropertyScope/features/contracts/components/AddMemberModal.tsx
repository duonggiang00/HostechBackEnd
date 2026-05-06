import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useContractActions } from '../hooks/useContracts';
import { Loader2, UserPlus, FileEdit, Phone, Mail, User, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { IdentityCardUploadPair } from './IdentityCardUploadPair';
import { BirthDateDayMonthYear } from './BirthDateDayMonthYear';
import { isValidUuid, requiresIdentityForMember } from '../utils/contractMemberAge';

function buildAddMemberSchema(contractStartIso: string) {
  return z
    .object({
      full_name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
      phone: z.string().min(10, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
      email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
      identity_number: z.string().optional(),
      date_of_birth: z.string().optional(),
      license_plate: z.string().optional(),
      identity_front_media_id: z.string().optional().default(''),
      identity_back_media_id: z.string().optional().default(''),
      role: z.enum(['ROOMMATE', 'TENANT', 'GUARANTOR']),
      status: z.enum(['PENDING', 'APPROVED']),
    })
    .superRefine((data, ctx) => {
      const req = requiresIdentityForMember({
        isPrimary: false,
        dobIso: data.date_of_birth,
        contractStartIso: contractStartIso,
      });
      const f = (data.identity_front_media_id ?? '').trim();
      const b = (data.identity_back_media_id ?? '').trim();
      const fOk = isValidUuid(f);
      const bOk = isValidUuid(b);
      if (fOk !== bOk) {
        ctx.addIssue({
          code: 'custom',
          path: ['identity_front_media_id'],
          message: 'Khi tải CCCD, vui lòng gửi cả mặt trước và mặt sau.',
        });
      } else if (req && (!fOk || !bOk)) {
        ctx.addIssue({
          code: 'custom',
          path: ['identity_front_media_id'],
          message: 'Thành viên từ đủ 18 tuổi (hoặc chưa khai báo ngày sinh) cần tải đủ ảnh CCCD.',
        });
      }
    });
}

type AddMemberForm = z.input<ReturnType<typeof buildAddMemberSchema>>;

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  /** Ngày bắt đầu hợp đồng yyyy-MM-dd — dùng tính tuổi / bắt buộc CCCD */
  contractStartDate?: string | null;
}

export function AddMemberModal({ isOpen, onClose, contractId, contractStartDate }: AddMemberModalProps) {
  const { addContractMember } = useContractActions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startIso = useMemo(
    () => (contractStartDate && contractStartDate.length >= 10 ? contractStartDate.slice(0, 10) : new Date().toISOString().slice(0, 10)),
    [contractStartDate],
  );

  const schema = useMemo(() => buildAddMemberSchema(startIso), [startIso]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddMemberForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'ROOMMATE',
      status: 'APPROVED',
      full_name: '',
      phone: '',
      email: '',
      identity_number: '',
      date_of_birth: '',
      license_plate: '',
      identity_front_media_id: '',
      identity_back_media_id: '',
    },
  });

  const v = watch();
  const identityRequired = requiresIdentityForMember({
    isPrimary: false,
    dobIso: v.date_of_birth,
    contractStartIso: startIso,
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: AddMemberForm) => {
    if (!contractId) {
      toast.error('Chưa có hợp đồng hiệu lực để thêm thành viên.');
      return;
    }

    setIsSubmitting(true);
    try {
      const f = (data.identity_front_media_id ?? '').trim();
      const b = (data.identity_back_media_id ?? '').trim();
      const row: Record<string, unknown> = {
        full_name: data.full_name,
        role: data.role,
        status: data.status,
        phone: data.phone || undefined,
        email: data.email || undefined,
        identity_number: data.identity_number || undefined,
        date_of_birth: data.date_of_birth || undefined,
        license_plate: data.license_plate || undefined,
      };
      if (isValidUuid(f) && isValidUuid(b)) {
        row.identity_front_media_id = f;
        row.identity_back_media_id = b;
      }

      await addContractMember.mutateAsync({
        id: contractId,
        data: row,
      });
      toast.success('Đã thêm người ở cùng thành công!');
      handleClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi thêm người ở cùng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
          >
            <div className="bg-indigo-600 p-6 text-white relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <UserPlus className="w-32 h-32" />
              </div>
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white mb-1">Thêm Cư Dân Mới</h2>
                  <p className="text-indigo-100/80 font-medium text-sm">
                    Tạo mới và gán người này vào hợp đồng hiện tại.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-indigo-100 hover:text-white rounded-full hover:bg-indigo-500/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      {...register('full_name')}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-medium"
                    />
                  </div>
                  {errors.full_name && <p className="text-sm text-red-500 mt-1">{errors.full_name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        {...register('phone')}
                        placeholder="09xx..."
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-medium"
                      />
                    </div>
                    {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="email@..."
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-medium"
                      />
                    </div>
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    CCCD / CMND
                  </label>
                  <div className="relative">
                    <FileEdit className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      {...register('identity_number', {
                        onChange: (e) => {
                          e.target.value = e.target.value.replace(/\D/g, '');
                        }
                      })}
                      placeholder="0123456789..."
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Ngày sinh
                    </label>
                    <BirthDateDayMonthYear
                      idPrefix="add_member_dob"
                      variant="rounded"
                      value={watch('date_of_birth') || ''}
                      onChange={(iso) => setValue('date_of_birth', iso, { shouldValidate: true })}
                      disabled={isSubmitting}
                    />
                    {errors.date_of_birth && <p className="text-sm text-red-500 mt-1">{errors.date_of_birth.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Biển số xe
                    </label>
                    <input
                      {...register('license_plate')}
                      placeholder="59-X1 123.45"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-medium"
                    />
                  </div>
                </div>

                {identityRequired ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Ảnh CCCD (bắt buộc)
                    </label>
                    <IdentityCardUploadPair
                      identityRequired
                      frontMediaUuid={watch('identity_front_media_id') || null}
                      backMediaUuid={watch('identity_back_media_id') || null}
                      onFrontMediaUuid={(id) => setValue('identity_front_media_id', id ?? '', { shouldValidate: true })}
                      onBackMediaUuid={(id) => setValue('identity_back_media_id', id ?? '', { shouldValidate: true })}
                      disabled={isSubmitting}
                    />
                    {(errors.identity_front_media_id || errors.identity_back_media_id) && (
                      <p className="text-sm text-red-500">
                        {errors.identity_front_media_id?.message || errors.identity_back_media_id?.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                    Thành viên dưới 18 tuổi tại ngày bắt đầu hợp đồng: không cần tải ảnh CCCD.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Vai trò
                    </label>
                    <select
                      value={watch('role')}
                      onChange={(e) => setValue('role', e.target.value as AddMemberForm['role'])}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-medium"
                    >
                      <option value="ROOMMATE">Người ở cùng</option>
                      <option value="TENANT">Chủ đồng thuê</option>
                      <option value="GUARANTOR">Người bảo lãnh</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Trạng thái
                    </label>
                    <select
                      value={watch('status')}
                      onChange={(e) => setValue('status', e.target.value as AddMemberForm['status'])}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-medium"
                    >
                      <option value="APPROVED">Kích hoạt ngay</option>
                      <option value="PENDING" className="text-amber-600">Chờ duyệt sau</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 shrink-0 mt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Thêm người</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
