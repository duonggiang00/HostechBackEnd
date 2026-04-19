import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, FileText, User, Home, Calendar, Shield, 
  DollarSign, Clock, MapPin, Users, Printer, Edit3, 
  AlertCircle, CheckCircle2, History, XCircle, Loader2, ArrowRightLeft,
  PenTool, UserPlus
} from 'lucide-react';
import { useContract, useContractActions, useContractStatusHistories } from '../hooks/useContracts';
import { TerminateContractModal } from '../components/TerminateContractModal';
import { ExecuteRoomTransferModal } from '../components/ExecuteRoomTransferModal';
import { ContractPreviewModal } from '../components/ContractPreviewModal';
import { ContractStatusTimeline } from '../components/ContractStatusTimeline';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import SignatureModal from '../components/SignatureModal';
import { AddMemberModal } from '../components/AddMemberModal';

const normalizeBillingCycleMonths = (value: string | number | null | undefined): number => {
  if (value === 'MONTHLY') return 1;
  if (value === 'QUARTERLY') return 3;
  if (value === 'SEMI_ANNUALLY') return 6;
  if (value === 'YEARLY') return 12;

  const months = Number(value);
  return Number.isFinite(months) && months > 0 ? months : 1;
};

// Use System Colors: Emerald for Available/Active, Red for Rented/Ended, Amber for Pending
const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: 'Bản nháp', color: 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300', icon: FileText },
  PENDING_SIGNATURE: { label: 'Chờ ký', color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400', icon: Clock },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400', icon: DollarSign },
  ACTIVE: { label: 'Hiệu lực', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  PENDING_TERMINATION: { label: 'Chờ thanh lý', color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400', icon: AlertCircle },
  EXPIRED: { label: 'Hết hạn', color: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400', icon: Clock },
  ENDED: { label: 'Đã kết thúc', color: 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300', icon: Shield },
  TERMINATED: { label: 'Đã thanh lý', color: 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300', icon: XCircle },
  CANCELLED: { label: 'Đã hủy', color: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400', icon: AlertCircle },
};

export default function ContractDetailPage() {
  const { propertyId, contractId } = useParams<{ propertyId: string; contractId: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading, error } = useContract(contractId);
  const { generateDocument, downloadDocument } = useContractActions();
  const { data: histories, isLoading: isLoadingHistories } = useContractStatusHistories(contractId);
  
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const { signContract } = useContractActions();
  
  const handlePrintContract = async () => {
    if (!contractId) return;
    setIsPrinting(true);
    try {
      await generateDocument.mutateAsync({ id: contractId });
      const blob = await downloadDocument.mutateAsync(contractId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `Hop-dong-${contract?.room?.code || contractId.substring(0,8)}.docx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
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
    console.log('Edit contract', contractId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-900 dark:border-blue-500 border-t-transparent dark:border-t-transparent rounded-full animate-spin" />
          <p className="font-normal text-sm text-gray-500 dark:text-slate-400">Đang tải dữ liệu hợp đồng...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-100 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-gray-600 dark:text-slate-400 font-normal text-sm mb-6">Không thể tìm thấy thông tin hợp đồng này hoặc đã có lỗi xẩy ra.</p>
          <button 
            onClick={handleBack}
            className="w-full bg-blue-900 text-white py-2 px-4 rounded-md font-medium text-sm hover:bg-blue-800 transition-colors"
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
    <div className="min-h-screen pb-20 overflow-x-hidden bg-gray-100 dark:bg-slate-900 transition-colors">
      {/* Header & Actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 pt-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-gray-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                Chi tiết Hợp đồng
              </h1>
              <div className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </div>
            </div>
            <p className="text-gray-500 dark:text-slate-400 font-normal text-xs mt-1">
              <span className="text-blue-900 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded mr-2 font-medium">
                {contract.id?.substring(0, 8).toUpperCase()}
              </span>
              Tạo ngày {format(new Date(contract.created_at), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setIsPreviewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-gray-700 dark:text-slate-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Xem hợp đồng</span>
          </button>
          <button 
            onClick={handlePrintContract}
            disabled={isPrinting}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-gray-700 dark:text-slate-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            <span>{isPrinting ? 'Đang tạo file...' : 'In hợp đồng'}</span>
          </button>
          {(contract.status === 'DRAFT' || contract.status === 'PENDING_SIGNATURE') && (
            <button 
              onClick={() => setIsSignatureModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 dark:bg-amber-600 text-white rounded-md font-medium text-sm hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors shadow-sm"
            >
              <PenTool className="w-4 h-4" />
              <span>Ký của Chủ nhà</span>
            </button>
          )}
          {isOrdinalEditable && (
            <button 
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-900 dark:bg-blue-800 text-white rounded-md font-medium text-sm hover:bg-blue-800 dark:hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Edit3 className="w-4 h-4" />
              <span>Chỉnh sửa</span>
            </button>
          )}
          {contract.status === 'ACTIVE' && (
            <>
              <button 
                onClick={() => setIsTransferModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-gray-700 dark:text-slate-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Chuyển phòng</span>
              </button>
              <button 
                onClick={() => setIsTerminateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-md font-medium text-sm hover:bg-red-600 dark:hover:bg-red-700 transition-colors shadow-sm"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Thanh lý hợp đồng</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="px-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Main Content */}
        <div className="xl:col-span-8 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors"
            >
              <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center justify-center mb-2">
                <DollarSign className="w-4 h-4 text-blue-900 dark:text-blue-400" />
              </div>
              <p className="text-xs font-normal text-gray-500 dark:text-slate-400 mb-1">Tiền phòng (Tháng)</p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {Intl.NumberFormat('vi-VN').format(contract.rent_price || 0)} <span className="text-sm font-medium">đ</span>
              </h3>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors"
            >
              <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 rounded-md flex items-center justify-center mb-2">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs font-normal text-gray-500 dark:text-slate-400 mb-1">Tiền đặt cọc</p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {Intl.NumberFormat('vi-VN').format(contract.deposit_amount || 0)} <span className="text-sm font-medium">đ</span>
              </h3>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors"
            >
              <div className="w-8 h-8 bg-amber-50 dark:bg-amber-500/10 rounded-md flex items-center justify-center mb-2">
                <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-xs font-normal text-gray-500 dark:text-slate-400 mb-1">Thời hạn hợp đồng</p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {contract.cycle_months || 0} <span className="text-sm font-medium">Tháng</span>
              </h3>
            </motion.div>

            {contract.meta?.credit_balance > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-md flex items-center justify-center mb-2">
                  <DollarSign className="w-4 h-4 text-blue-900 dark:text-blue-300" />
                </div>
                <p className="text-xs font-normal text-blue-900 dark:text-blue-400 mb-1">Ví cấn trừ</p>
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300">
                  {Intl.NumberFormat('vi-VN').format(contract.meta?.credit_balance || 0)} <span className="text-sm font-medium">đ</span>
                </h3>
              </motion.div>
            )}
          </div>

          {/* Details Sections */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-6 transition-colors"
          >
            {/* Rent & Terms */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4 transition-colors">
                <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                Điều khoản thuê
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

            <div className="h-px bg-gray-100 dark:bg-slate-700 w-full transition-colors" />

            {/* Property & Room */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4 transition-colors">
                <Home className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                Vị trí & Cơ sở
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-xl flex items-start gap-4 transition-colors">
                  <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-md flex items-center justify-center shadow-sm shrink-0 transition-colors">
                    <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-normal text-gray-500 dark:text-slate-400 transition-colors">Tòa nhà / Cơ sở</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm transition-colors">{contract.property?.name || '---'}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-normal transition-colors">{contract.property?.address}</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-xl flex items-start gap-4 transition-colors">
                  <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-md flex items-center justify-center shadow-sm shrink-0 transition-colors">
                    <Home className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-normal text-gray-500 dark:text-slate-400 transition-colors">Mã số phòng</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm transition-colors">{contract.room?.name || '---'}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-normal transition-colors">Phòng {contract.room?.code}</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="h-px bg-gray-100 dark:bg-slate-700 w-full transition-colors" />

            {/* Members / Occupants */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
                  <Users className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  Thành viên & Cư dân
                </h3>

                {['DRAFT', 'PENDING_SIGNATURE', 'PENDING_PAYMENT', 'ACTIVE'].includes(contract.status as string) && (
                  <button
                    onClick={() => setIsAddMemberOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Thêm cư dân
                  </button>
                )}
              </div>
              
              <div className="overflow-hidden bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm transition-colors">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800/50 transition-colors border-b border-gray-200 dark:border-slate-700">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 transition-colors">Họ tên</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 transition-colors">Vai trò</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 transition-colors">Điện thoại</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 transition-colors">Trạng thái</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 transition-colors">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700 transition-colors">
                    {contract.members?.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-slate-700 flex items-center justify-center transition-colors">
                              <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors">{member.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${member.is_primary ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                            {member.is_primary ? 'Chủ hợp đồng' : 'Cư dân'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-slate-400 transition-colors">
                          {member.phone || '---'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${member.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'}`}>
                            {member.status === 'APPROVED' ? 'Đang ở' : 'Chờ duyệt'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => navigate(`/properties/${propertyId}/users/${member.user_id || member.id}`, { 
                              state: { from: 'contract-detail', contractId: contractId } 
                            })}
                            className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-xs font-medium shadow-sm"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!contract.members?.length && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center bg-gray-50 dark:bg-slate-800/50">
                          <p className="text-gray-500 dark:text-slate-400 font-normal text-sm transition-colors">Chưa có thông tin thành viên.</p>
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
        <div className="xl:col-span-4 space-y-6">
          {/* Quick Info Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-6 transition-colors"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
              <History className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              Nghiệp vụ
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-md flex items-center justify-center shrink-0 transition-colors">
                  <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-normal text-gray-500 dark:text-slate-400 transition-colors">Người tạo</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm transition-colors">{contract.createdBy?.full_name || 'Hệ thống'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-md flex items-center justify-center shrink-0 transition-colors">
                  <AlertCircle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-normal text-gray-500 dark:text-slate-400 transition-colors">Ghi chú nghiệp vụ</p>
                  <p className="text-sm font-normal text-gray-600 dark:text-slate-400 transition-colors">Không có ghi chú nào đặc biệt cho hợp đồng này.</p>
                </div>
              </div>
            </div>

            {['ACTIVE', 'PENDING_TERMINATION', 'EXPIRED'].includes(contract.status as string) && (
              <button
                onClick={() => setIsTerminateModalOpen(true)}
                className="w-full bg-red-600 text-white py-2.5 rounded-md font-medium text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <XCircle className="w-4 h-4" />
                Thanh lý hợp đồng
              </button>
            )}

            <div className="pt-6 border-t border-gray-100 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4 transition-colors">
                <History className="w-4 h-4 text-gray-400 dark:text-gray-500" />
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
          window.location.reload();
        }}
      />
      <TerminateContractModal
        isOpen={isTerminateModalOpen}
        onClose={() => setIsTerminateModalOpen(false)}
        contract={contract}
      />
      <ContractPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        contractId={contractId || ''}
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
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="text-gray-400 dark:text-gray-500 transition-colors">{icon}</div>
        <p className="text-xs font-normal text-gray-500 dark:text-slate-400 transition-colors">{label}</p>
      </div>
      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm ml-6 transition-colors">{value}</p>
    </div>
  );
}
