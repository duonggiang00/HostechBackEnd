import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useContractActions, useContract } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { IdentityCardUploadPair } from '@/PropertyScope/features/contracts/components/IdentityCardUploadPair';
import { BirthDateDayMonthYear } from '@/PropertyScope/features/contracts/components/BirthDateDayMonthYear';
import {
  isValidUuid,
  requiresIdentityForMember,
} from '@/PropertyScope/features/contracts/utils/contractMemberAge';

interface TenantAddRoommateModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
}

export function TenantAddRoommateModal({ isOpen, onClose, contractId }: TenantAddRoommateModalProps) {
  const { addContractMember } = useContractActions();
  const { data: contract } = useContract(isOpen ? contractId : undefined);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [identityFrontMediaId, setIdentityFrontMediaId] = useState<string | null>(null);
  const [identityBackMediaId, setIdentityBackMediaId] = useState<string | null>(null);

  const contractStart = useMemo(
    () => (contract?.start_date ? String(contract.start_date).slice(0, 10) : ''),
    [contract?.start_date],
  );

  const identityRequired = useMemo(
    () =>
      requiresIdentityForMember({
        isPrimary: false,
        dobIso: dateOfBirth,
        contractStartIso: contractStart || undefined,
      }),
    [dateOfBirth, contractStart],
  );

  const reset = () => {
    setEmail('');
    setFullName('');
    setPhone('');
    setDateOfBirth('');
    setIdentityFrontMediaId(null);
    setIdentityBackMediaId(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    const em = email.trim();
    const name = fullName.trim();
    if (!em && !name) {
      toast.error('Vui lòng nhập email tài khoản hoặc họ tên người ở cùng.');
      return;
    }
    if (!contractStart) {
      toast.error('Đang tải thông tin hợp đồng, vui lòng thử lại sau.');
      return;
    }
    const needId = requiresIdentityForMember({
      isPrimary: false,
      dobIso: dateOfBirth,
      contractStartIso: contractStart,
    });
    const fOk = identityFrontMediaId && isValidUuid(identityFrontMediaId);
    const bOk = identityBackMediaId && isValidUuid(identityBackMediaId);
    if (fOk !== bOk) {
      toast.error('Khi tải CCCD, vui lòng gửi cả mặt trước và mặt sau.');
      return;
    }
    if (needId && (!fOk || !bOk)) {
      toast.error('Người từ đủ 18 tuổi (hoặc chưa khai báo ngày sinh) cần tải đủ ảnh CCCD.');
      return;
    }

    const data: Record<string, unknown> = {
      email: em || undefined,
      full_name: name || undefined,
      phone: phone.trim() || undefined,
      role: 'ROOMMATE',
    };
    if (dateOfBirth.trim()) {
      data.date_of_birth = dateOfBirth.trim();
    }
    if (fOk && bOk && identityFrontMediaId && identityBackMediaId) {
      data.identity_front_media_id = identityFrontMediaId;
      data.identity_back_media_id = identityBackMediaId;
    }

    addContractMember.mutate(
      {
        id: contractId,
        data,
      },
      {
        onSuccess: () => {
          toast.success('Đã gửi yêu cầu. Ban quản lý sẽ duyệt khi đủ điều kiện.');
          handleClose();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Không thêm được thành viên.');
        },
      },
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-label="Đóng"
            onClick={() => !addContractMember.isPending && handleClose()}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Thêm người ở cùng</h2>
                  <p className="text-xs font-medium text-slate-500">Email tài khoản hoặc khai báo họ tên</p>
                </div>
              </div>
              <button
                type="button"
                disabled={addContractMember.isPending}
                onClick={handleClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-6 py-5">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email (khuyến nghị)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ban@example.com"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Họ và tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nếu có email có tài khoản, có thể để trống để hệ thống điền"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Số điện thoại (tuỳ chọn)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Ngày sinh</label>
                <p className="mt-1 text-[11px] text-slate-500">
                  Dùng để xác định có bắt buộc CCCD hay không (dưới 18 tuổi tại ngày bắt đầu hợp đồng: CCCD tuỳ chọn).
                </p>
                <div className="mt-2">
                  <BirthDateDayMonthYear
                    idPrefix="tenant_add_roommate_dob"
                    variant="rounded"
                    value={dateOfBirth}
                    onChange={setDateOfBirth}
                    disabled={addContractMember.isPending}
                  />
                </div>
              </div>
              {identityRequired ? (
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Ảnh CCCD (bắt buộc)
                  </label>
                  <div className="mt-2">
                    <IdentityCardUploadPair
                      identityRequired
                      frontMediaUuid={identityFrontMediaId}
                      backMediaUuid={identityBackMediaId}
                      onFrontMediaUuid={setIdentityFrontMediaId}
                      onBackMediaUuid={setIdentityBackMediaId}
                      disabled={addContractMember.isPending}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  Thành viên dưới 18 tuổi tại ngày bắt đầu hợp đồng: không cần tải ảnh CCCD.
                </div>
              )}
              <p className="text-xs leading-relaxed text-slate-500">
                Nếu dùng email đã có tài khoản, người đó sẽ nhận lời mời ký. Trường hợp khai báo tay không có email, ban quản lý sẽ xem xét.
              </p>
            </div>

            <div className="flex gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button
                type="button"
                disabled={addContractMember.isPending}
                onClick={handleClose}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={addContractMember.isPending}
                onClick={handleSubmit}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                {addContractMember.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                Gửi yêu cầu
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
