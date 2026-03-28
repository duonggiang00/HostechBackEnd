import { useContracts } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { 
  FileSignature, ChevronRight, FilePenLine, QrCode, Loader2, CheckCircle2,
  Clock, FileWarning, XCircle
} from 'lucide-react';

const normalizeBillingCycleMonths = (value: string | number | null | undefined): number => {
  if (value === 'MONTHLY') return 1;
  if (value === 'QUARTERLY') return 3;
  if (value === 'SEMI_ANNUALLY') return 6;
  if (value === 'YEARLY') return 12;

  const months = Number(value);
  return Number.isFinite(months) && months > 0 ? months : 1;
};
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';
import { useState } from 'react';
import { TerminateContractModal } from '@/PropertyScope/features/contracts/components/TerminateContractModal';

import type { RoomContract } from '@/PropertyScope/features/contracts/types';

interface LeaseManagerProps {
  roomId: string;
  propertyId: string;
  data?: RoomContract[];
  isLoading?: boolean;
  onOpenWizard: () => void;
}

export default function LeaseManager({ roomId, data, isLoading: propIsLoading, onOpenWizard }: LeaseManagerProps) {
  // Only fetch if data is not provided by parent (e.g. from RoomDetailDrawer)
  const hasExternalData = Array.isArray(data);
  const { data: fetchedContracts = [], isLoading: contractsLoading } = useContracts({ room_id: roomId }, { 
    enabled: !hasExternalData && !!roomId 
  });
  
  const contracts = hasExternalData 
    ? (data as RoomContract[]) 
    : (Array.isArray(fetchedContracts) ? fetchedContracts : (fetchedContracts as any)?.data || []);
  
  const isLoading = propIsLoading !== undefined ? propIsLoading : contractsLoading;
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [terminateContractData, setTerminateContractData] = useState<any>(null);

  const handleSignContract = async (contractId: string) => {
    try {
      setSigningId(contractId);
      // Simulate e-signature API call
      await new Promise(resolve => setTimeout(resolve, 800));
      await apiClient.put(`/contracts/${contractId}`, { status: 'active' });
      toast.success('Ký hợp đồng thành công! Phòng hiện đã có người thuê.');
      queryClient.invalidateQueries({ queryKey: ['contracts', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể ký hợp đồng');
    } finally {
      setSigningId(null);
    }
  };

  const sortedContracts = [...contracts].sort((a, b) => 
    new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h3 className="text-xl font-black text-slate-900 dark:text-white">Quản lý Hợp đồng</h3>
      </div>
      
      {sortedContracts.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lịch sử hợp đồng</h4>
          {sortedContracts.map(contract => {
            const isExpanded = expandedId === contract.id;
            return (
              <div key={contract.id} className={`bg-white dark:bg-slate-800 border transition-all duration-300 overflow-hidden ${
                isExpanded ? 'border-indigo-200 dark:border-indigo-500/30 rounded-4xl shadow-xl shadow-indigo-50/50 dark:shadow-indigo-500/10' : 'border-slate-100 dark:border-slate-700/50 rounded-3xl hover:border-slate-200 dark:hover:border-slate-600/50 shadow-sm'
              }`}>
                {/* Header Section (Always Visible) */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : contract.id)}
                  className="p-4 cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                      isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 group-hover:bg-slate-100 dark:group-hover:bg-slate-800'
                    }`}>
                      <FileSignature className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {contract.tenant?.name || contract.members?.find((m: any) => m.is_primary)?.full_name || contract.members?.[0]?.full_name || 'Khách thuê mới'}
                      </p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Chu kỳ {normalizeBillingCycleMonths(contract.billing_cycle)} tháng • {new Date(contract.start_date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 ${
                        contract.status === 'ACTIVE' ? 'bg-emerald-600 dark:bg-emerald-500/20 text-white dark:text-emerald-400 shadow-sm shadow-emerald-200 dark:shadow-none' :
                        (contract.status === 'DRAFT' || contract.status === 'PENDING_SIGNATURE') ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                        {contract.status === 'ACTIVE' && <CheckCircle2 className="w-3 h-3" />}
                        {(contract.status === 'DRAFT' || contract.status === 'PENDING_SIGNATURE') && <Clock className="w-3 h-3" />}
                        {contract.status === 'ACTIVE' ? 'Đang hiệu lực' : contract.status === 'DRAFT' ? 'Bản nháp' : contract.status === 'PENDING_SIGNATURE' ? 'Chờ chữ ký' : contract.status}
                    </div>
                    <div className={`p-1 rounded-lg transition-transform duration-300 ${isExpanded ? 'rotate-90 bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-600'}`}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Collapsible details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-5 pb-5 pt-2 space-y-4 border-t border-slate-50 dark:border-slate-700/50">
                        <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50 dark:border-slate-700/50">
                           <div>
                               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tiền thuê tháng</p>
                               <p className="text-sm font-black text-slate-900 dark:text-white">{contract.monthly_rent.toLocaleString()}₫</p>
                           </div>
                           <div>
                               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tiền cọc</p>
                               <p className="text-sm font-black text-slate-900 dark:text-white">{contract.deposit_amount.toLocaleString()}₫</p>
                           </div>
                        </div>

                        {/* Members List */}
                        <div className="space-y-2">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thành viên hợp đồng</p>
                           <div className="grid grid-cols-1 gap-2">
                             {contract.members?.map((member: any) => (
                               <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                 <div className="flex items-center gap-3">
                                   <div className={`w-2 h-2 rounded-full ${member.is_primary ? 'bg-indigo-500' : 'bg-slate-400'}`} />
                                   <div>
                                     <p className="text-xs font-black text-slate-700 dark:text-slate-200">{member.full_name}</p>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</p>
                                   </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                   {member.is_primary && (
                                     <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-[8px] font-black uppercase tracking-tighter">
                                       Chủ hợp đồng
                                     </span>
                                   )}
                                   <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter ${
                                     member.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                                   }`}>
                                     {member.status}
                                   </span>
                                 </div>
                               </div>
                             ))}
                           </div>
                        </div>

                        {(contract.status === 'DRAFT' || contract.status === 'PENDING_SIGNATURE') && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSignContract(contract.id);
                            }}
                            disabled={signingId === contract.id}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 dark:bg-white hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white dark:text-slate-900 dark:hover:text-white rounded-2xl text-sm font-black transition-all shadow-lg hover:shadow-indigo-100 dark:shadow-none disabled:opacity-50 group"
                          >
                            {signingId === contract.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <FileSignature className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            )}
                            {signingId === contract.id ? 'Đang kích hoạt...' : 'Kích hoạt hợp đồng pháp lý'}
                          </button>
                        )}
                        {contract.status === 'ACTIVE' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setTerminateContractData({
                                id: contract.id,
                                rent_price: contract.monthly_rent || contract.rent_price,
                                deposit_amount: contract.deposit_amount
                              });
                            }}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-600 dark:hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white dark:hover:text-white rounded-2xl text-sm font-black transition-all group"
                          >
                            <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Thanh lý / Chấm dứt hợp đồng
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl text-center">
            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300 dark:text-slate-600">
                <FileWarning className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Chưa có hợp đồng nào</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
              Phòng này hiện đang trống. Sử dụng Wizard bên dưới để tạo hợp đồng mới.
            </p>
        </div>
      )}

      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thao tác</h4>
        <button onClick={onOpenWizard} className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl transition-all shadow-sm group">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl"><FilePenLine className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Wizard Hợp đồng</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
        </button>
        <button className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl transition-all shadow-sm group">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl"><QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Đăng ký qua QR</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      <AnimatePresence>
        {terminateContractData && (
          <TerminateContractModal
            isOpen={!!terminateContractData}
            onClose={() => setTerminateContractData(null)}
            contract={terminateContractData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
