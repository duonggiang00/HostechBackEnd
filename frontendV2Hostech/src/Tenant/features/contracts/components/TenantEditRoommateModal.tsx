import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useContractActions } from '@/PropertyScope/features/contracts/hooks/useContracts';
import type { ContractMember } from '@/PropertyScope/features/contracts/types';
import { IdentityCardUploadPair } from '@/PropertyScope/features/contracts/components/IdentityCardUploadPair';
import { BirthDateDayMonthYear } from '@/PropertyScope/features/contracts/components/BirthDateDayMonthYear';
import { isValidUuid, requiresIdentityForMember } from '@/PropertyScope/features/contracts/utils/contractMemberAge';

interface TenantEditRoommateModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  member: ContractMember | null;
  /** yyyy-MM-dd — tính tuổi / bắt buộc CCCD; thiếu thì dùng hôm nay (đồng bộ AddMemberModal) */
  contractStartDate?: string | null;
}

export function TenantEditRoommateModal({
  isOpen,
  onClose,
  contractId,
  member,
  contractStartDate,
}: TenantEditRoommateModalProps) {
  const { updateContractMember } = useContractActions();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [identityFrontMediaId, setIdentityFrontMediaId] = useState<string | null>(null);
  const [identityBackMediaId, setIdentityBackMediaId] = useState<string | null>(null);

  const startIso = useMemo(
    () =>
      contractStartDate && contractStartDate.length >= 10
        ? contractStartDate.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    [contractStartDate],
  );

  const identityRequired = useMemo(
    () =>
      requiresIdentityForMember({
        isPrimary: false,
        dobIso: dateOfBirth,
        contractStartIso: startIso,
      }),
    [dateOfBirth, startIso],
  );

  const hasDbIdentityPair = Boolean(member?.identity_front_url && member?.identity_back_url);

  useEffect(() => {
    if (!member || !isOpen) return;
    setFullName(member.full_name || '');
    setPhone(member.phone || '');
    setIdentityNumber(member.identity_number || '');
    setPermanentAddress(member.permanent_address || '');
    setDateOfBirth(member.date_of_birth ? String(member.date_of_birth).slice(0, 10) : '');
    setLicensePlate(member.license_plate || '');
    setIdentityFrontMediaId(null);
    setIdentityBackMediaId(null);
  }, [member, isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = () => {
    if (!member) return;
    const name = fullName.trim();
    if (!name) {
      toast.error('Vui lòng nhập họ và tên.');
      return;
    }

    const fOk = !!identityFrontMediaId && isValidUuid(identityFrontMediaId);
    const bOk = !!identityBackMediaId && isValidUuid(identityBackMediaId);
    if (fOk !== bOk) {
      toast.error('Khi đổi ảnh CCCD, vui lòng tải đủ mặt trước và mặt sau.');
      return;
    }

    if (identityRequired && !hasDbIdentityPair && !(fOk && bOk)) {
      toast.error('Thành viên từ đủ 18 tuổi (hoặc chưa khai báo ngày sinh) cần tải đủ ảnh CCCD.');
      return;
    }

    const data: Record<string, unknown> = {
      full_name: name,
      phone: phone.trim() || null,
      identity_number: identityNumber.trim() || null,
      permanent_address: permanentAddress.trim() || null,
      date_of_birth: dateOfBirth.trim() || null,
      license_plate: licensePlate.trim() || null,
    };
    if (fOk && bOk && identityFrontMediaId && identityBackMediaId) {
      data.identity_front_media_id = identityFrontMediaId;
      data.identity_back_media_id = identityBackMediaId;
    }

    updateContractMember.mutate(
      {
        contractId,
        memberId: member.id,
        data,
      },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật thông tin thành viên.');
          handleClose();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Không cập nhật được.');
        },
      },
    );
  };

  return (
    <AnimatePresence>
      {isOpen && member && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-label="Đóng"
            onClick={() => !updateContractMember.isPending && handleClose()}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Cập nhật thành viên</h2>
                  <p className="text-xs font-medium text-slate-500">Chỉ áp dụng cho người ở cùng / thành viên phụ</p>
                </div>
              </div>
              <button
                type="button"
                disabled={updateContractMember.isPending}
                onClick={handleClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-6 py-5">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Họ và tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Số điện thoại</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">CMND/CCCD</label>
                <input
                  type="text"
                  value={identityNumber}
                  onChange={(e) => setIdentityNumber(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Ngày sinh</label>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <BirthDateDayMonthYear
                    idPrefix="tenant_edit_dob"
                    variant="rounded"
                    value={dateOfBirth}
                    onChange={setDateOfBirth}
                    disabled={updateContractMember.isPending}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Biển số xe</label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Địa chỉ thường trú</label>
                <textarea
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  rows={2}
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Ảnh CCCD
                  {identityRequired ? ' (bắt buộc nếu chưa có trên hồ sơ)' : ' (tuỳ chọn — dưới 18 tuổi)'}
                </label>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {identityRequired
                    ? 'Người từ đủ 18 tuổi cần đủ hai mặt trên hồ sơ hoặc tải mới đủ cặp. Khi đổi ảnh, gửi đủ mặt trước và mặt sau.'
                    : 'Chỉ gửi khi bạn muốn thay ảnh mới; cần tải đủ mặt trước và mặt sau.'}
                </p>
                <div className="mt-2">
                  <IdentityCardUploadPair
                    identityRequired={identityRequired}
                    frontMediaUuid={identityFrontMediaId}
                    backMediaUuid={identityBackMediaId}
                    onFrontMediaUuid={setIdentityFrontMediaId}
                    onBackMediaUuid={setIdentityBackMediaId}
                    disabled={updateContractMember.isPending}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button
                type="button"
                disabled={updateContractMember.isPending}
                onClick={handleClose}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={updateContractMember.isPending}
                onClick={handleSubmit}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                {updateContractMember.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                Lưu
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
