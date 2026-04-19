import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, FileText, User, Home, Calendar, Shield, 
  DollarSign, Clock, MapPin, Users, Printer, Edit3, 
  AlertCircle, CheckCircle2, History, XCircle, Loader2, ArrowRightLeft
} from 'lucide-react';
import { useContract, useContractActions, useContractStatusHistories } from '../hooks/useContracts';
import { TerminateContractModal } from '../components/TerminateContractModal';
import { ExecuteRoomTransferModal } from '../components/ExecuteRoomTransferModal';
import { ContractStatusTimeline } from '../components/ContractStatusTimeline';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import SignatureModal from '../components/SignatureModal';
import { AddMemberModal } from '../components/AddMemberModal';
import { PenTool, UserPlus, LogOut } from 'lucide-react';
import { useAuth } from '@/shared/features/auth/hooks/useAuth';

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
  EXPIRED: { label: 'Hết hạn', color: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400', icon: Clock },
  ENDED: { label: 'Đã kết thúc', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', icon: Shield },
  TERMINATED: { label: 'Đã thanh lý', color: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400', icon: XCircle },
  CANCELLED: { label: 'Đã hủy', color: 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500', icon: AlertCircle },
};

export default function ContractDetailPage() {
  const { propertyId, contractId } = useParams<{ propertyId: string; contractId: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading, error } = useContract(contractId);
  const { generateDocument, downloadDocument } = useContractActions();
  const { data: histories, isLoading: isLoadingHistories } = useContractStatusHistories(contractId);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const { signContract, removeContractMember, approveContractMember } = useContractActions();
  const { user, hasPermission } = useAuth();
  
  const isManager = hasPermission('update Contracts');
  const currentMembership = contract?.members?.find(m => m.user_id === user?.id);
  const isPrimaryTenant = !!currentMembership?.is_primary;
  
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
      const blob = await downloadDocument.mutateAsync(contractId);
      
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
  
  const handleBack = () => {
    navigate(`/properties/${propertyId}/contracts`);
  };

  const handleEdit = () => {
    // Navigate to edit page if implemented
    console.log('Edit contract', contractId);
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
          <button 
            onClick={handleBack}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[contract.status as string] || STATUS_MAP.DRAFT;
  const isOrdinalEditable = !['ACTIVE', 'ENDED', 'TERMINATED'].includes(contract.status as string);

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden transition-colors">
      {/* Header & Actions */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button 
            onClick={handleBack}
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all shadow-sm group"
          >
            <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight transition-colors">
                Chi tiết Hợp đồng
              </h1>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                {statusInfo.label}
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2 text-xs transition-colors">
              <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md font-bold">
                {contract.id?.substring(0, 8).toUpperCase()}
              </span>
              <span>• Tạo ngày {format(new Date(contract.created_at), 'dd/MM/yyyy')}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/properties/${propertyId}/contracts/${contractId}/view`)}
            className="flex items-center gap-2 px-5 py-3.5 bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Xem hợp đồng</span>
          </button>
          <button 
            onClick={handlePrintContract}
            disabled={isPrinting}
            className="flex items-center gap-2 px-5 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            <span>{isPrinting ? 'Đang tạo file...' : 'In hợp đồng'}</span>
          </button>
          {(contract.status === 'DRAFT' || contract.status === 'PENDING_SIGNATURE') && (
            <button 
              onClick={() => setIsSignatureModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 dark:shadow-none ring-4 ring-emerald-50 dark:ring-emerald-500/20"
            >
              <PenTool className="w-4 h-4" />
              <span>Ký của Chủ nhà</span>
            </button>
          )}
          {isOrdinalEditable && (
            <button 
              onClick={handleEdit}
              className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100 dark:shadow-none ring-4 ring-indigo-50 dark:ring-indigo-500/20"
            >
              <Edit3 className="w-4 h-4" />
              <span>Chỉnh sửa</span>
            </button>
          )}
          {contract.status === 'ACTIVE' && (
            <>
              <button 
                onClick={() => setIsTransferModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 dark:shadow-none ring-4 ring-blue-50 dark:ring-blue-500/20"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Chuyển phòng</span>
              </button>
              <button 
                onClick={() => setIsTerminateModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3.5 bg-rose-600 dark:bg-rose-500 text-white rounded-2xl font-bold text-sm hover:bg-rose-700 dark:hover:bg-rose-600 transition-all shadow-lg shadow-rose-100 dark:shadow-none ring-4 ring-rose-50 dark:ring-rose-500/20"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Thanh lý hợp đồng</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Main Content */}
        <div className="xl:col-span-8 space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl border border-white/60 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors"
            >
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 transition-colors">Tiền phòng (Tháng)</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums transition-colors">
                {Intl.NumberFormat('vi-VN').format(contract.rent_price || 0)} <span className="text-sm font-bold">đ</span>
              </h3>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl border border-white/60 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors"
            >
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 transition-colors">Tiền đặt cọc</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums transition-colors">
                {Intl.NumberFormat('vi-VN').format(contract.deposit_amount || 0)} <span className="text-sm font-bold">đ</span>
              </h3>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl border border-white/60 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors"
            >
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 transition-colors">Thời hạn hợp đồng</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">
                {contract.cycle_months || 0} <span className="text-sm font-bold font-sans tracking-tight">Tháng</span>
              </h3>
            </motion.div>

            {contract.meta?.credit_balance > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-blue-50/50 dark:bg-blue-900/20 backdrop-blur-xl p-6 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-xl shadow-blue-100 dark:shadow-none transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-xl flex items-center justify-center mb-3">
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                </div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 transition-colors">Ví cấn trừ</p>
                <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300 tracking-tight tabular-nums transition-colors">
                  {Intl.NumberFormat('vi-VN').format(contract.meta?.credit_balance || 0)} <span className="text-sm font-bold">đ</span>
                </h3>
              </motion.div>
            )}
          </div>

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
                  label="Ngày bắt đầu" 
                  value={contract.start_date ? format(new Date(contract.start_date), 'dd/MM/yyyy') : '---'}
                  icon={<Calendar className="w-4 h-4" />}
                />
                <DetailItem 
                  label="Ngày kết thúc" 
                  value={contract.end_date ? format(new Date(contract.end_date), 'dd/MM/yyyy') : '---'}
                  icon={<Calendar className="w-4 h-4" />}
                />
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

                {['DRAFT', 'PENDING_SIGNATURE', 'PENDING_PAYMENT', 'ACTIVE'].includes(contract.status as string) && (
                  <button
                    onClick={() => setIsAddMemberOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors shadow-sm border border-indigo-100 dark:border-indigo-500/30"
                  >
                    <UserPlus className="w-4 h-4" />
                    Thêm cư dân
                  </button>
                )}
              </div>
              
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
                          <div className="flex items-center justify-end gap-2">
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
            className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 transition-colors"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
              <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Nghiệp vụ
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                  <User className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 transition-colors">Người tạo</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300 transition-colors">{contract.createdBy?.full_name || 'Hệ thống'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                  <AlertCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 transition-colors">Ghi chú nghiệp vụ</p>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 transition-colors">Không có ghi chú nào đặc biệt cho hợp đồng này.</p>
                </div>
              </div>
            </div>

            {['ACTIVE', 'PENDING_TERMINATION', 'EXPIRED'].includes(contract.status as string) && (
              <button
                onClick={() => setIsTerminateModalOpen(true)}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold uppercase text-xs hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200 dark:shadow-none"
              >
                <XCircle className="w-4 h-4" />
                Thanh lý hợp đồng
              </button>
            )}

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-6 transition-colors">
                <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Timeline Trạng thái
              </h4>
              <ContractStatusTimeline histories={histories || []} isLoading={isLoadingHistories} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <ExecuteRoomTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        contract={contract}
        onSuccess={() => {
          // You might prefer to navigate to the new contract here, 
          // or at least refresh the list. Let it handled or just reload page briefly.
          window.location.reload();
        }}
      />
      <TerminateContractModal
        isOpen={isTerminateModalOpen}
        onClose={() => setIsTerminateModalOpen(false)}
        contract={contract}
      />
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
