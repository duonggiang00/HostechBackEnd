// @ts-nocheck
import { useState } from 'react';
import { 
  UserPlus, Home, FileText, CheckCircle, ChevronRight, ChevronLeft, 
  Search, Calendar, DollarSign, FileSignature, Check
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';
import { useContracts } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ContractWizardProps {
  roomId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type WizardStep = 1 | 2 | 3 | 4;

export default function ContractWizard({ roomId, onSuccess, onCancel }: ContractWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const { createContract } = useContracts(roomId);
  
  // Form State
  const [formData, setFormData] = useState({
    tenant_id: '',
    tenant_name: '',
    tenant_email: '',
    tenant_phone: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    monthly_rent: 5000000,
    deposit_amount: 5000000,
    billing_cycle: 'monthly' as 'monthly' | 'quarterly',
  });

  const nextStep = () => {
    if (step < 4) setStep((s) => (s + 1) as WizardStep);
  };

  const prevStep = () => {
    if (step > 1) setStep((s) => (s - 1) as WizardStep);
  };

  const handleSubmit = () => {
    createContract.mutate({
      room_id: roomId,
      tenant_id: formData.tenant_id, // assuming 1 for new or existing ID
      start_date: formData.start_date,
      end_date: formData.end_date,
      monthly_rent: formData.monthly_rent,
      deposit_amount: formData.deposit_amount,
      billing_cycle: formData.billing_cycle,
      status: 'draft' // we just keep it draft until signed
    }, {
      onSuccess: () => {
        toast.success('Contract Draft Generated Successfully!');
        onSuccess?.();
      }
    });
  };

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: 'Tenant', icon: UserPlus },
      { num: 2, label: 'Room', icon: Home },
      { num: 3, label: 'Terms', icon: FileText },
      { num: 4, label: 'Review', icon: CheckCircle }
    ];

    return (
      <div className="flex items-center justify-between relative mb-8">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-300"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        />
        
        {steps.map((s) => {
          const isActive = step >= s.num;
          const isCurrent = step === s.num;
          
          return (
            <div key={s.num} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isActive 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' 
                    : 'bg-white border-slate-200 text-slate-400'
                } ${isCurrent ? 'ring-4 ring-indigo-50 scale-110' : ''}`}
              >
                <s.icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-black ${
                isActive ? 'text-indigo-600' : 'text-slate-400'
              }`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Create New Contract</h2>
          <p className="text-sm text-slate-500 font-medium">Step {step} of 4</p>
        </div>
      </div>

      {renderStepIndicator()}

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 mb-6">
                <h3 className="text-sm font-bold text-slate-900 mb-1">Select or Create Tenant</h3>
                <p className="text-xs text-slate-500">Record who will be leasing this room. Can be an existing user or a new profile.</p>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search existing tenants by name or phone..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium"
                />
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR Add New</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                  <input 
                    value={formData.tenant_name}
                    onChange={e => setFormData({...formData, tenant_name: e.target.value})}
                    placeholder="Nguyen Van A"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                  <input 
                    value={formData.tenant_phone}
                    onChange={e => setFormData({...formData, tenant_phone: e.target.value})}
                    placeholder="+84..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 mb-6">
                <h3 className="text-sm font-bold text-slate-900 mb-1">Room & Services Configuration</h3>
                <p className="text-xs text-slate-500">Confirm the room details and included utility services for this contract.</p>
              </div>

              <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm space-y-4">
                 <div className="flex justify-between items-start">
                    <div>
                        <h4 className="text-base font-bold text-slate-900">Room Info</h4>
                        <p className="text-sm text-slate-500 mt-1">Room ID: {roomId}</p>
                    </div>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Home className="w-5 h-5" />
                    </div>
                 </div>
                 {/* Provide summary info here if room data was explicitly passed */}
              </div>

              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50">
                 <h4 className="text-sm font-bold text-slate-900 mb-4">Included Services</h4>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-slate-600 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500"/> Electricity (Metered)</span>
                        <span className="text-slate-900 font-bold">4,000₫ / kWh</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-slate-600 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500"/> Water (Per Person)</span>
                        <span className="text-slate-900 font-bold">100,000₫ / user</span>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="date"
                      value={formData.start_date}
                      onChange={e => setFormData({...formData, start_date: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold text-slate-700"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="date"
                      value={formData.end_date}
                      onChange={e => setFormData({...formData, end_date: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold text-slate-700"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Monthly Rent</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number"
                      value={formData.monthly_rent}
                      onChange={e => setFormData({...formData, monthly_rent: Number(e.target.value)})}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Deposit Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number"
                      value={formData.deposit_amount}
                      onChange={e => setFormData({...formData, deposit_amount: Number(e.target.value)})}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Billing Cycle</label>
                  <select 
                    value={formData.billing_cycle}
                    onChange={e => setFormData({...formData, billing_cycle: e.target.value as 'monthly' | 'quarterly'})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold"
                  >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                  </select>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex gap-6 items-start">
                  <div className="flex-1 space-y-6">
                      <div className="space-y-3">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Lease Summary</h4>
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                              <div className="flex justify-between border-b border-slate-200 pb-3">
                                  <span className="text-sm text-slate-500">Tenant</span>
                                  <span className="text-sm font-bold text-slate-900">{formData.tenant_name || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-200 pb-3">
                                  <span className="text-sm text-slate-500">Duration</span>
                                  <span className="text-sm font-bold text-slate-900">
                                      {new Date(formData.start_date).toLocaleDateString()} - {new Date(formData.end_date).toLocaleDateString()}
                                  </span>
                              </div>
                              <div className="flex justify-between border-b border-slate-200 pb-3">
                                  <span className="text-sm text-slate-500">Rent</span>
                                  <span className="text-sm font-bold text-emerald-600">{formData.monthly_rent.toLocaleString()}₫ / mo</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Deposit</span>
                                  <span className="text-sm font-bold text-slate-900">{formData.deposit_amount.toLocaleString()}₫</span>
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="w-1/3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col items-center justify-center text-center gap-3 h-[250px]">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-indigo-500 shadow-sm">
                          <FileSignature className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold text-slate-900">Contract Preview</p>
                      <button className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
                          View PDF Draft
                      </button>
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between pt-6 mt-4 border-t border-slate-100 shrink-0">
        <div>
           {step === 1 && onCancel && (
               <button 
                onClick={onCancel}
                className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
               >
                 Cancel
               </button>
           )}
        </div>
        
        <div className="flex items-center gap-4">
            {step > 1 && (
            <button 
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
            >
                <ChevronLeft className="w-4 h-4" />
                Back
            </button>
            )}
            
            {step < 4 ? (
            <button 
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
                Continue
                <ChevronRight className="w-4 h-4" />
            </button>
            ) : (
            <button 
                onClick={handleSubmit}
                disabled={createContract.isPending}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95"
            >
                Generate Draft
                <CheckCircle className="w-4 h-4" />
            </button>
            )}
        </div>
      </div>
    </div>
  );
}

