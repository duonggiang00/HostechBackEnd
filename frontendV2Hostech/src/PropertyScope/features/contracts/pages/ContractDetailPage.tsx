import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { 
  FileText, User, Home, Calendar, Shield, 
  DollarSign, Clock, MapPin, Users, Printer, Edit3, 
  AlertCircle, CheckCircle2, History, XCircle, Loader2, ArrowRightLeft, IdCard,
  CircleDollarSign, Receipt, ExternalLink,
} from 'lucide-react';
import { useContract, useContractActions, useContractStatusHistories } from '../hooks/useContracts';
import { ContractRentDebtPanel } from '../components/ContractRentDebtPanel';
import { ContractStatusTimeline } from '../components/ContractStatusTimeline';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import SignatureModal from '../components/SignatureModal';
import { AddMemberModal } from '../components/AddMemberModal';
import { MemberIdentityViewDialog } from '../components/MemberIdentityViewDialog';
import type { ContractMember } from '../types';
import { PenTool, UserPlus, LogOut, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/shared/features/auth/hooks/useAuth';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';
import { useHandover } from '@/shared/features/operations/hooks/useHandover';
import { usePropertyInvoices } from '@/PropertyScope/features/billing/hooks/usePropertyInvoices';
import { InvoiceStatusBadge } from '@/PropertyScope/features/billing/components/InvoiceStatusBadge';
import { usePayments } from '@/PropertyScope/features/finance/hooks/useFinance';
import { PaymentStatusBadge } from '@/PropertyScope/features/finance/components/PaymentStatusBadge';
import type { Invoice } from '@/PropertyScope/features/billing/types';
import type { Payment } from '@/PropertyScope/features/finance/types';
import { paymentDetailReferrerState } from '@/PropertyScope/features/finance/utils/paymentNavigation';

type ContractDetailTab = 'info' | 'timeline' | 'invoices' | 'payments';

const CONTRACT_DETAIL_TABS: { id: ContractDetailTab; label: string }[] = [
  { id: 'info', label: 'Thông tin hợp đồng' },
  { id: 'timeline', label: 'Lịch sử hợp đồng' },
  { id: 'invoices', label: 'Lịch sử hóa đơn' },
  { id: 'payments', label: 'Thu tiền & biên lai' },
];

const normalizeBillingCycleMonths = (value: string | number | null | undefined): number => {
  if (value === 'MONTHLY') return 1;
  if (value === 'QUARTERLY') return 3;
  if (value === 'SEMI_ANNUALLY') return 6;
  if (value === 'YEARLY') return 12;

  const months = Number(value);
  return Number.isFinite(months) && months > 0 ? months : 1;
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: 'Bản nháp', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', icon: FileText },
  PENDING_SIGNATURE: { label: 'Chờ ký', color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400', icon: Clock },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400', icon: DollarSign },
  ACTIVE: { label: 'Hiệu lực', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  PENDING_TERMINATION: { label: 'Chờ thanh lý', color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400', icon: AlertCircle },
  PENDING_SETTLEMENT: { label: 'Chờ quyết toán nợ', color: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400', icon: Clock },
  EXPIRED: { label: 'Hết hạn', color: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400', icon: Clock },
  ENDED: { label: 'Đã kết thúc', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', icon: Shield },
  TERMINATED: { label: 'Đã kết thúc', color: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400', icon: XCircle },
  CANCELLED: { label: 'Đã hủy', color: 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500', icon: AlertCircle },
};

export default function ContractDetailPage() {
  const { propertyId, contractId } = useParams<{ propertyId: string; contractId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { data: contract, isLoading, error } = useContract(contractId);
  const { useHandovers } = useHandover();
  const endedWithHandoverStatuses = ['ENDED', 'TERMINATED', 'EXPIRED'];
  const { data: handoverForContractRes } = useHandovers(
    { filter: { contract_id: contractId }, per_page: 1 },
    {
      enabled:
        !!contractId &&
        !!contract &&
        endedWithHandoverStatuses.includes(String(contract.status)),
      staleTime: 30_000,
    },
  );
  const terminationHandoverId = (handoverForContractRes as { data?: { id: string }[] } | undefined)?.data?.[0]?.id;
  const { generateDocument, downloadDocument } = useContractActions();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [identityViewMember, setIdentityViewMember] = useState<ContractMember | null>(null);
  const [detailTab, setDetailTab] = useState<ContractDetailTab>('info');
  const { signContract, removeContractMember, approveContractMember } = useContractActions();
  const { user, hasPermission, hasRole } = useAuth();
  const {
    data: statusHistories,
    isLoading: isLoadingHistories,
  } = useContractStatusHistories(contractId);

  const { data: invoicesPage, isLoading: invoicesLoading } = usePropertyInvoices(
    propertyId ?? '',
    { contract_id: contractId, per_page: 100, page: 1 },
    { enabled: !!propertyId && !!contractId && detailTab === 'invoices' },
  );

  const { data: paymentsPage, isLoading: paymentsLoading } = usePayments(
    {
      'filter[property_id]': propertyId,
      'filter[contract_id]': contractId,
      per_page: 100,
      page: 1,
      sort: '-received_at',
    },
    { enabled: !!propertyId && !!contractId && detailTab === 'payments' },
  );

  useEffect(() => {
    if (searchParams.get('openTerminate') !== '1' || !propertyId || !contractId) return;
    navigate(`/properties/${propertyId}/contracts/${contractId}/terminate`, { replace: true });
  }, [searchParams, propertyId, contractId, navigate]);
  
  const isManager = hasPermission('update Contracts');
  const canLandlordSign =
    ['DRAFT', 'PENDING_SIGNATURE'].includes(contract?.status as string) &&
    hasRole(['Owner', 'Manager', 'Admin', 'Staff']) &&
    !!contract &&
    !contract.meta?.manager_signed_at;
  const currentMembership = contract?.members?.find(m => m.user_id === user?.id);
  const isPrimaryTenant = !!currentMembership?.is_primary;
  const roomCapacity = Number(contract?.room?.capacity ?? 0);
  const roomHasCapacityLimit = roomCapacity > 0;
  const currentOccupants = (contract?.members ?? []).filter((m) => !m.left_at).length;
  const canAddOccupant = !roomHasCapacityLimit || currentOccupants < roomCapacity;
  
  const handleApproveMember = async (memberId: string) => {
    if (!contractId) return;
    try {
      await approveContractMember.mutateAsync({ contractId, memberId });
      toast.success('Đã phê duyệt thành viên thành công.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt thành viên.');
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!contractId) return;
    if (!window.confirm(`Bạn có chắc chắn muốn báo cư dân "${name}" đã chuyển đi? Thao tác này sẽ chấm dứt tư cách thành viên của họ trong hợp đồng.`)) {
      return;
    }

    try {
      await removeContractMember.mutateAsync({ contractId, memberId });
      toast.success(`Đã báo cư dân ${name} chuyển đi thành công.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi báo cư dân chuyển đi.');
    }
  };
  
  const handlePrintContract = async () => {
    if (!contractId) return;
    setIsPrinting(true);
    try {
      // 1. Generate document
      await generateDocument.mutateAsync({ id: contractId });
      
      // 2. Download the Blob
      const blob = await downloadDocument.mutateAsync({
        id: contractId,
        revision: contract?.updated_at || contract?.document_path || undefined,
      });
      
      // 3. Create URL and download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract room code to name the file nicely
      const fileName = `Hop-dong-${contract?.room?.code || contractId.substring(0,8)}.docx`;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Đã tải file hợp đồng thành công! Vui lòng mở file để in.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi tải file hợp đồng.');
    } finally {
      setIsPrinting(false);
    }
  };
  
  const handleEdit = () => {
    navigate(`/properties/${propertyId}/contracts/${contractId}/edit`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent dark:border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-slate-500 dark:text-slate-400 animate-pulse">Đang tải dữ liệu hợp đồng...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-white dark:bg-slate-800 p-12 rounded-6xl border border-slate-200 dark:border-slate-700 shadow-2xl text-center max-w-md">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-rose-500 dark:text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Không thể tìm thấy thông tin hợp đồng này hoặc đã có lỗi xẩy ra.</p>
          <PageBackButton className="w-full justify-center py-4 rounded-2xl" />
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[contract.status as string] || STATUS_MAP.DRAFT;
  const isOrdinalEditable = !['ACTIVE', 'ENDED', 'TERMINATED'].includes(contract.status as string);

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden transition-colors">
      {/* Header & Actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <PageBackButton className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 shadow-sm mt-1" />
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight transition-colors">
                Chi tiết Hợp đồng
              </h1>
              <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusInfo.color}`}>
                {statusInfo.label}
              </div>
              {contract.has_invoice_debt && (
                <div className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/25">
                  Có hóa đơn nợ
                </div>
              )}
              {contract.status === 'PENDING_TERMINATION' && contract.expected_move_out_date && (
                <div className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                  Sắp trả phòng
                </div>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 text-xs transition-colors">
              <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md font-bold">
                {contract.id?.substring(0, 8).toUpperCase()}
              </span>
              <span>• Tạo ngày {format(new Date(contract.created_at), 'dd/MM/yyyy')}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {propertyId && terminationHandoverId && endedWithHandoverStatuses.includes(String(contract.status)) && (
            <Link
              to={`/properties/${propertyId}/handovers/${terminationHandoverId}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-50/90 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/25 rounded-xl text-teal-800 dark:text-teal-300 font-bold text-sm hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-all shadow-sm"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Biên bản bàn giao</span>
            </Link>
          )}
          {contract.room_id && (
            <button 
              onClick={() => navigate(`/properties/${propertyId}/rooms/${contract.room_id}`)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400 font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all shadow-sm"
            >
              <Home className="w-4 h-4" />
              <span>Xem chi tiết phòng</span>
            </button>
          )}
          <button 
            onClick={() => navigate(`/properties/${propertyId}/contracts/${contractId}/view`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Xem hợp đồng</span>
          </button>
          <button 
            onClick={handlePrintContract}
            disabled={isPrinting}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            <span>{isPrinting ? 'Đang tạo...' : 'In'}</span>
          </button>
          {canLandlordSign && (
            <button 
              onClick={() => setIsSignatureModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all shadow-sm"
            >
              <PenTool className="w-4 h-4" />
              <span>Ký hợp đồng</span>
            </button>
          )}
          {isOrdinalEditable && (
            <button 
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-sm"
            >
              <Edit3 className="w-4 h-4" />
              <span>Sửa</span>
            </button>
          )}
          {contract.status === 'ACTIVE' && (
            <>
              <button
                onClick={() => navigate(`/properties/${propertyId}/contracts/${contractId}/transfer`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-sm"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Chuyển phòng</span>
              </button>
              <button 
                onClick={() => navigate(`/properties/${propertyId}/contracts/${contractId}/terminate`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 dark:bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-700 dark:hover:bg-rose-600 transition-all shadow-sm"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Thanh lý</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-3 mb-6">
        {CONTRACT_DETAIL_TABS.map((t) => {
          const active = detailTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setDetailTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                active
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {detailTab === 'info' && (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Main Content */}
        <div className="xl:col-span-8 space-y-8">
          {/* Details Sections */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-xl shadow-slate-200/30 dark:shadow-none space-y-8 transition-colors"
          >
            {/* Rent & Terms */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-6 transition-colors">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Điều khoản thuê
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <DetailItem 
                  label="Tiền phòng (Tháng)" 
                  value={`${Intl.NumberFormat('vi-VN').format(contract.rent_price || 0)} đ`}
                  icon={<DollarSign className="w-4 h-4" />}
                />
                <DetailItem 
                  label="Tiền đặt cọc" 
                  value={`${Intl.NumberFormat('vi-VN').format(contract.deposit_amount || 0)} đ ${Number(contract.deposit_months) > 0 ? `(${contract.deposit_months} tháng)` : ''}`}
                  icon={<Shield className="w-4 h-4" />}
                />
                <DetailItem 
                  label="Thời hạn hợp đồng" 
                  value={Number(contract.cycle_months) > 0 ? `${contract.cycle_months} tháng` : 'Vô hạn'}
                  icon={<Calendar className="w-4 h-4" />}
                />
                {contract.meta?.credit_balance > 0 && (
                  <DetailItem 
                    label="Ví cấn trừ" 
                    value={`${Intl.NumberFormat('vi-VN').format(contract.meta?.credit_balance || 0)} đ`}
                    icon={<DollarSign className="w-4 h-4" />}
                  />
                )}
                <DetailItem 
                  label="Ngày bắt đầu" 
                  value={contract.start_date ? format(new Date(contract.start_date), 'dd/MM/yyyy') : '---'}
                  icon={<Calendar className="w-4 h-4" />}
                />
                <DetailItem 
                  label="Ngày kết thúc" 
                  value={contract.end_date ? format(new Date(contract.end_date), 'dd/MM/yyyy') : 'Vô hạn'}
                  icon={<Calendar className="w-4 h-4" />}
                />
                {contract.status === 'PENDING_TERMINATION' && contract.expected_move_out_date && (
                  <DetailItem
                    label="Ngày dự kiến dọn (tenant)"
                    value={format(new Date(contract.expected_move_out_date), 'dd/MM/yyyy')}
                    icon={<Calendar className="w-4 h-4" />}
                  />
                )}
                <DetailItem 
                  label="Chu kỳ đóng tiền" 
                  value={`${contract.billing_cycle_months ?? normalizeBillingCycleMonths(contract.billing_cycle)} tháng`}
                  icon={<Clock className="w-4 h-4" />}
                />
                <DetailItem 
                  label="Ngày chốt số" 
                  value={`Ngày ${contract.cutoff_day}`}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                />
              </div>
            </section>

            <div className="h-px bg-slate-100 dark:bg-slate-700 w-full transition-colors" />

            {/* Property & Room */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-6 transition-colors">
                <Home className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Vị trí & Cơ sở
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-3xl flex items-start gap-4 transition-colors">
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm shrink-0 transition-colors">
                    <MapPin className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 transition-colors">Tòa nhà / Cơ sở</p>
                    <p className="font-bold text-slate-900 dark:text-white text-lg transition-colors">{contract.property?.name || '---'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">{contract.property?.address}</p>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-3xl flex items-start gap-4 transition-colors">
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm shrink-0 transition-colors">
                    <Home className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 transition-colors">Mã số phòng</p>
                    <p className="font-bold text-slate-900 dark:text-white text-lg transition-colors">{contract.room?.name || '---'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">Phòng {contract.room?.code}</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="h-px bg-slate-100 dark:bg-slate-700 w-full transition-colors" />

            {/* Members / Occupants */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3 transition-colors">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Thành viên & Cư dân
                </h3>

                {!['ENDED', 'TERMINATED', 'CANCELLED', 'EXPIRED'].includes(contract.status as string) && (
                  <button
                    onClick={() => {
                      if (!canAddOccupant) {
                        toast.error(`Phòng chỉ giới hạn ${roomCapacity} người. Không thể thêm cư dân.`);
                        return;
                      }
                      setIsAddMemberOpen(true);
                    }}
                    disabled={!canAddOccupant}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors shadow-sm border border-indigo-100 dark:border-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <UserPlus className="w-4 h-4" />
                    Thêm cư dân
                  </button>
                )}
              </div>
              {!canAddOccupant && (
                <p className="mb-4 text-xs font-medium text-rose-600 dark:text-rose-400">
                  Phòng chỉ giới hạn tối đa {roomCapacity} người (đã đủ số lượng).
                </p>
              )}
              
              <div className="overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm transition-colors">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 transition-colors">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 transition-colors">Họ tên</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 transition-colors">Vai trò</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 transition-colors">Điện thoại</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 transition-colors">Trạng thái</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 dark:text-slate-500 transition-colors">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 transition-colors">
                    {contract.members?.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center transition-colors">
                              <User className="w-4 h-4 text-indigo-400 dark:text-indigo-400/80" />
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 transition-colors">{member.full_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-colors ${member.is_primary ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                            {member.is_primary ? 'Chủ hợp đồng' : 'Cư dân'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 tracking-tight tabular-nums transition-colors">
                          {member.phone || '---'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {member.left_at ? (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                Đã rời đi ({format(new Date(member.left_at), 'dd/MM/yyyy')})
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-colors ${member.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                                {member.status === 'APPROVED' ? 'Đang ở' : 'Chờ duyệt'}
                              </span>
                            )}
                            {member.user_id ? (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Đã đăng ký
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                <Clock className="w-2.5 h-2.5" /> Chờ đăng ký
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {(member.identity_front_url || member.identity_back_url) && (
                              <button
                                type="button"
                                onClick={() => setIdentityViewMember(member)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-bold"
                              >
                                <IdCard className="w-3.5 h-3.5" />
                                Xem CCCD
                              </button>
                            )}
                            {isManager && member.status === 'PENDING' && (
                              <button 
                                onClick={() => handleApproveMember(member.id)}
                                disabled={approveContractMember.isPending}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors text-xs font-bold disabled:opacity-50"
                              >
                                {approveContractMember.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                Duyệt
                              </button>
                            )}

                            {((isManager) || (isPrimaryTenant && member.id !== currentMembership?.id)) && 
                              member.status === 'APPROVED' && !member.left_at && (
                                <button
                                  onClick={() => handleRemoveMember(member.id, member.full_name)}
                                  disabled={removeContractMember.isPending}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors text-xs font-bold disabled:opacity-50"
                                >
                                  {removeContractMember.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                                  Báo đi
                                </button>
                            )}

                            <button 
                              onClick={() => {
                                if (member.user_id) {
                                  navigate(`/properties/${propertyId}/users/${member.user_id}`, { 
                                    state: { from: 'contract-detail', contractId: contractId } 
                                  });
                                } else {
                                  toast.error('Cư dân này chưa kích hoạt tài khoản hệ thống.');
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold ${
                                member.user_id 
                                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20' 
                                  : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!contract.members?.length && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <p className="text-slate-400 dark:text-slate-500 font-bold transition-colors">Chưa có thông tin thành viên.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-4 space-y-8">
          {/* Join Code Card (Hidden per user request) */}
          {/* 
          {contract.join_code && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-indigo-600 p-8 rounded-6xl text-white shadow-2xl shadow-indigo-200 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Shield className="w-24 h-24" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 mb-4 relative z-10">
                <Clock className="w-5 h-5" />
                Mã tham gia
              </h3>
              <div className="bg-white/20 backdrop-blur-md rounded-4xl p-8 text-center relative z-10 border border-white/20">
                <p className="text-xs uppercase font-black tracking-widest mb-3 opacity-80">Gửi mã này cho khách thuê</p>
                <p className="text-3xl font-black tracking-tighter tabular-nums mb-4">{contract.join_code}</p>
                <div className="flex items-center justify-center gap-2 text-xs font-bold opacity-70">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Mã có hiệu lực</span>
                </div>
              </div>
            </motion.div>
          )} 
          */}

          {/* Quick Info Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
          >
            <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-6 transition-colors">
              <CircleDollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Hóa đơn đang nợ
            </h4>
            <ContractRentDebtPanel
              propertyId={propertyId ?? ''}
              invoiceDebt={contract.invoice_debt}
              isLoading={isLoading}
            />
          </motion.div>
        </div>
      </div>
      )}

      {detailTab === 'timeline' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
            <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Lịch sử trạng thái & nghiệp vụ
          </h3>
          <ContractStatusTimeline
            histories={statusHistories ?? []}
            isLoading={isLoadingHistories}
          />
        </motion.div>
      )}

      {detailTab === 'invoices' && propertyId && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {invoicesLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Kỳ</th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Tổng</th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Đã trả</th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Còn nợ</th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Trạng thái</th>
                    <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {(invoicesPage?.data ?? []).map((inv: Invoice) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                      <td className="py-3 px-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                        {new Date(inv.period_start).toLocaleDateString('vi-VN')} – {new Date(inv.period_end).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold tabular-nums">{inv.total_amount.toLocaleString('vi-VN')} đ</td>
                      <td className="py-3 px-4 text-sm font-semibold text-emerald-600 tabular-nums">{inv.paid_amount.toLocaleString('vi-VN')} đ</td>
                      <td className="py-3 px-4 text-sm font-semibold text-rose-600 tabular-nums">{inv.debt.toLocaleString('vi-VN')} đ</td>
                      <td className="py-3 px-4">
                        <InvoiceStatusBadge status={inv.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/properties/${propertyId}/billing/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Chi tiết
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {(invoicesPage?.data ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm font-medium text-slate-500">
                        Chưa có hóa đơn gắn hợp đồng này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {detailTab === 'payments' && propertyId && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {paymentsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Thời điểm</th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Số tiền</th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Phương thức</th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Trạng thái</th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Gạch nợ (hóa đơn)</th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Biên lai</th>
                    <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {(paymentsPage?.data ?? []).map((p: Payment) => {
                    const allocLabels = (p.allocations ?? [])
                      .map((a) => {
                        const inv = a.invoice;
                        if (!inv) return null;
                        const ps = new Date(inv.period_start).toLocaleDateString('vi-VN');
                        const pe = new Date(inv.period_end).toLocaleDateString('vi-VN');
                        return `${ps}→${pe}: ${a.amount.toLocaleString('vi-VN')}đ`;
                      })
                      .filter(Boolean)
                      .join(' · ');
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                        <td className="py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {p.received_at
                            ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(p.received_at))
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-sm font-bold tabular-nums">{p.amount.toLocaleString('vi-VN')} đ</td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{p.method_label ?? p.method}</td>
                        <td className="py-3 px-4">
                          <PaymentStatusBadge status={p.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-[220px] truncate" title={allocLabels}>
                          {allocLabels || '—'}
                        </td>
                        <td className="py-3 px-4">
                          {p.receipt?.url ? (
                            <a
                              href={p.receipt.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              PDF
                            </a>
                          ) : p.proof_receipt?.url ? (
                            <a
                              href={p.proof_receipt.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                            >
                              Chứng từ
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/properties/${propertyId}/finance/payments/${p.id}`}
                            state={paymentDetailReferrerState(location.pathname, location.search)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Chi tiết
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {(paymentsPage?.data ?? []).length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm font-medium text-slate-500">
                        Chưa có giao dịch thu tiền gạch nợ hóa đơn của hợp đồng này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        isLoading={signContract.isPending}
        onConfirm={(signatureBase64) => {
          if (!contractId) return;
          signContract.mutate({ id: contractId, signatureDataUrl: signatureBase64 }, {
            onSuccess: () => {
              toast.success('Đã ký hợp đồng thành công!');
              setIsSignatureModalOpen(false);
              if (propertyId && contractId) {
                navigate(`/properties/${propertyId}/contracts/${contractId}/view`);
              }
            },
            onError: (err: any) => {
              toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi tải chữ ký.');
            }
          });
        }}
      />
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        contractId={contractId || ''}
        contractStartDate={contract.start_date ? String(contract.start_date).slice(0, 10) : null}
      />
      <MemberIdentityViewDialog
        open={!!identityViewMember}
        onClose={() => setIdentityViewMember(null)}
        memberName={identityViewMember?.full_name ?? ''}
        frontUrl={identityViewMember?.identity_front_url}
        backUrl={identityViewMember?.identity_back_url}
      />
    </div>
  );
}

function DetailItem({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-slate-400 dark:text-slate-500 transition-colors">{icon}</div>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 transition-colors">{label}</p>
      </div>
      <p className="font-bold text-slate-700 dark:text-slate-300 ml-6 transition-colors">{value}</p>
    </div>
  );
}
