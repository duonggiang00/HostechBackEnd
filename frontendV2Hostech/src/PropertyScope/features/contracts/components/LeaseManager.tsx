import { useContracts } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { 
  FileSignature, ChevronRight, FilePenLine, QrCode, Loader2, CheckCircle2,
  Clock, FileWarning
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';
import { useState } from 'react';

import type { RoomContract } from '@/PropertyScope/features/rooms/types';

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
  const { data: fetchedContracts = [], isLoading: contractsLoading } = useContracts(roomId, { 
    enabled: !hasExternalData && !!roomId 
  });
  
  const contracts = hasExternalData ? (data as RoomContract[]) : fetchedContracts;
  const isLoading = propIsLoading !== undefined ? propIsLoading : contractsLoading;
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [signingId, setSigningId] = useState<string | null>(null);

  const handleSignContract = async (contractId: string) => {
    try {
      setSigningId(contractId);
      // Simulate e-signature API call
      await new Promise(resolve => setTimeout(resolve, 800));
      await apiClient.put(`/contracts/${contractId}`, { status: 'active' });
      toast.success('Contract signed successfully! Room is now occupied.');
      queryClient.invalidateQueries({ queryKey: ['contracts', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to sign contract');
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
         <h3 className="text-xl font-black text-slate-900">Lease Management</h3>
      </div>
      
      {sortedContracts.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contract History</h4>
          {sortedContracts.map(contract => {
            const isExpanded = expandedId === contract.id;
            return (
              <div key={contract.id} className={`bg-white border transition-all duration-300 overflow-hidden ${
                isExpanded ? 'border-indigo-200 rounded-[2rem] shadow-xl shadow-indigo-50/50' : 'border-slate-100 rounded-3xl hover:border-slate-200 shadow-sm'
              }`}>
                {/* Header Section (Always Visible) */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : contract.id)}
                  className="p-4 cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                      isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                    }`}>
                      <FileSignature className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {contract.tenant?.name || contract.members?.find(m => m.is_primary)?.full_name || contract.members?.[0]?.full_name || 'New Tenant'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {contract.billing_cycle} cycle • {new Date(contract.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 ${
                        contract.status === 'active' ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' :
                        contract.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                    }`}>
                        {contract.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                        {contract.status === 'draft' && <Clock className="w-3 h-3" />}
                        {contract.status}
                    </div>
                    <div className={`p-1 rounded-lg transition-transform duration-300 ${isExpanded ? 'rotate-90 bg-slate-100 text-slate-900' : 'text-slate-300'}`}>
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
                      <div className="px-5 pb-5 pt-2 space-y-4 border-t border-slate-50">
                        <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
                           <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Rent</p>
                               <p className="text-sm font-black text-slate-900">{contract.monthly_rent.toLocaleString()}₫</p>
                           </div>
                           <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deposit</p>
                               <p className="text-sm font-black text-slate-900">{contract.deposit_amount.toLocaleString()}₫</p>
                           </div>
                        </div>

                        {/* Members List */}
                        <div className="space-y-2">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contract Members</p>
                           <div className="grid grid-cols-1 gap-2">
                             {contract.members?.map(member => (
                               <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                 <div className="flex items-center gap-3">
                                   <div className={`w-2 h-2 rounded-full ${member.is_primary ? 'bg-indigo-500' : 'bg-slate-400'}`} />
                                   <div>
                                     <p className="text-xs font-black text-slate-700">{member.full_name}</p>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</p>
                                   </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                   {member.is_primary && (
                                     <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-[8px] font-black uppercase tracking-tighter">
                                       Primary
                                     </span>
                                   )}
                                   <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter ${
                                     member.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                   }`}>
                                     {member.status}
                                   </span>
                                 </div>
                               </div>
                             ))}
                           </div>
                        </div>

                        {contract.status === 'draft' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSignContract(contract.id);
                            }}
                            disabled={signingId === contract.id}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-sm font-black transition-all shadow-lg hover:shadow-indigo-100 disabled:opacity-50 group"
                          >
                            {signingId === contract.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <FileSignature className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            )}
                            {signingId === contract.id ? 'Activating...' : 'Activate Legal Contract'}
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
        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                <FileWarning className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No Active Contracts</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
              This unit is not leased. Use the wizard below to create one.
            </p>
        </div>
      )}

      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</h4>
        <button onClick={onOpenWizard} className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all shadow-sm group">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl"><FilePenLine className="w-5 h-5 text-indigo-600" /></div>
            <span className="text-sm font-bold text-slate-700">Contract Wizard</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
        </button>
        <button className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all shadow-sm group">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl"><QrCode className="w-5 h-5 text-emerald-600" /></div>
            <span className="text-sm font-bold text-slate-700">QR Enrollment</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    </div>
  );
}
