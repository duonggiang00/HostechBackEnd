import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  UserPlus,
  UserX,
  Car,
  Users,
  Building2,
  CalendarDays,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useContract, useContractActions } from '../hooks/useContracts';
import type { ContractMember } from '../types';
import { AddMemberModal } from '../components/AddMemberModal';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtVND(n?: number | null) {
  if (!n) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
}

const ROLE_LABEL: Record<string, string> = {
  TENANT: 'Người thuê chính',
  ROOMMATE: 'Người ở cùng',
  GUARANTOR: 'Người bảo lãnh',
};

// ── Sub-components ───────────────────────────────────────────────────────────

function InfoCard({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
        <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ContractEditPage() {
  const { contractId, propertyId } = useParams<{ contractId: string; propertyId: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading } = useContract(contractId);
  const { updateContractMember, removeContractMember, generateDocument } = useContractActions();

  // Biển số xe local state — keyed by memberId
  const [plates, setPlates] = useState<Record<string, string>>({});
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getPlate = useCallback(
    (m: ContractMember) => plates[m.id] ?? (m.license_plate ?? ''),
    [plates],
  );

  const isDirty = useCallback(
    (m: ContractMember) => {
      const current = plates[m.id];
      return current !== undefined && current !== (m.license_plate ?? '');
    },
    [plates],
  );

  const hasAnyDirty = contract?.members?.some(isDirty) ?? false;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRemove = async (m: ContractMember) => {
    if (!contractId) return;
    setRemovingId(m.id);
    try {
      await removeContractMember.mutateAsync({ contractId, memberId: m.id });
      toast.success(`Đã xóa ${m.full_name} khỏi hợp đồng.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể xóa thành viên.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleSave = async () => {
    if (!contractId || !contract) return;
    setIsSaving(true);
    try {
      const dirtyMembers = (contract.members ?? []).filter(isDirty);

      await Promise.all(
        dirtyMembers.map((m) =>
          updateContractMember.mutateAsync({
            contractId,
            memberId: m.id,
            data: { license_plate: getPlate(m) || null },
          }),
        ),
      );

      // Regenerate document if there is one (backend also auto-regenerates,
      // but calling explicitly ensures the frontend gets fresh document_path).
      if (contract.document_path) {
        await generateDocument.mutateAsync({ id: contractId });
      }

      toast.success('Đã lưu thay đổi hợp đồng.');
      navigate(`/properties/${propertyId}/contracts/${contractId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-8">
        <PageBackButton />
        <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-6 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          Không tìm thấy hợp đồng.
        </div>
      </div>
    );
  }

  const activeMembers = (contract.members ?? []).filter((m) => !m.left_at);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* ── Action Bar ── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Chỉnh sửa hợp đồng
          </span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !hasAnyDirty}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu thay đổi
        </button>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">

        {/* ── Read-only contract summary ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Thông tin hợp đồng (chỉ xem)
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoCard label="Phòng" value={contract.room?.code ?? contract.room?.name ?? '—'} icon={Building2} />
            <InfoCard
              label="Thời hạn"
              value={`${fmtDate(contract.start_date)} → ${fmtDate(contract.end_date)}`}
              icon={CalendarDays}
            />
            <InfoCard label="Giá thuê" value={fmtVND(contract.rent_price)} icon={DollarSign} />
            <InfoCard
              label="Tiền cọc"
              value={
                Number(contract.deposit_months) > 0
                  ? `${fmtVND(contract.deposit_amount)} (${contract.deposit_months} tháng)`
                  : fmtVND(contract.deposit_amount)
              }
              icon={DollarSign}
            />
          </div>
        </div>

        {/* ── Member list ── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                Danh sách thành viên
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsAddMemberOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Thêm cư dân
            </button>
          </div>

          {activeMembers.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">Chưa có thành viên nào.</div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {activeMembers.map((m) => (
                <li key={m.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{m.full_name}</span>
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                          {ROLE_LABEL[m.role] ?? m.role}
                        </span>
                        {m.is_primary && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                            Chủ hợp đồng
                          </span>
                        )}
                      </div>

                      {/* License plate editor */}
                      <div className="mt-3 flex items-center gap-2">
                        <Car className="h-4 w-4 shrink-0 text-slate-400" />
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Biển số xe:
                        </label>
                        <input
                          type="text"
                          value={getPlate(m)}
                          onChange={(e) => setPlates((prev) => ({ ...prev, [m.id]: e.target.value }))}
                          placeholder="59-X1 123.45 (nếu có)"
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-900 dark:text-white
                            ${isDirty(m)
                              ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500/60 dark:bg-indigo-500/10'
                              : 'border-slate-200 bg-slate-50 dark:border-slate-700'
                            }`}
                        />
                        {isDirty(m) && (
                          <span className="text-[10px] font-bold text-indigo-500">Đã thay đổi</span>
                        )}
                      </div>
                    </div>

                    {/* Right: remove button (non-primary only) */}
                    {!m.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleRemove(m)}
                        disabled={removingId === m.id}
                        className="shrink-0 rounded-xl p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                        title="Xóa khỏi hợp đồng"
                      >
                        {removingId === m.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <UserX className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Note ── */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs font-medium leading-relaxed text-amber-700 dark:text-amber-300">
            Chỉ có thể chỉnh sửa danh sách thành viên và biển số xe. Sau khi lưu, bản mềm hợp đồng sẽ được tạo lại tự động nếu đã có bản trước đó.
          </p>
        </div>
      </div>

      {/* ── Add Member Modal ── */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        contractId={contractId ?? ''}
        contractStartDate={contract.start_date ? String(contract.start_date).slice(0, 10) : null}
      />
    </div>
  );
}
