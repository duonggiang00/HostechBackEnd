import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useContractActions, CONTRACT_KEY, CONTRACTS_KEY } from '../../hooks/useContracts';
import { echo } from '@/shared/utils/echo';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { Step1InfoForm } from './Step1InfoForm';
import { Step2Handover } from './Step2Handover';
import { Step2MeterReadings } from './Step2MeterReadings';
import { Step3Preview } from './Step3Preview';
import type { TerminationWizardState, SubmittedMeterReading } from './types';

interface TerminationWizardProps {
  contract: any;
  onClose: () => void;
}

const STEPS = ['Thông tin', 'Bàn giao', 'Chốt số', 'Xác nhận'];

export function TerminationWizard({ contract, onClose }: TerminationWizardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { terminateContract } = useContractActions();
  const authUser = useAuthStore(s => s.user);

  const propertyId = contract?.property_id ?? contract?.property?.id;

  useEffect(() => {
    if (!echo || !propertyId) return;

    const channel = echo.private(`property.${propertyId}`);

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, contract.id] });
      queryClient.invalidateQueries({ queryKey: [CONTRACTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['handovers'] });
      queryClient.invalidateQueries({ queryKey: ['property-dashboard', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['meters', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-readings', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['meter-readings'] });
    };

    const terminationSteps = [
      '.contract.termination.initiated',
      '.contract.termination.handover_submitted',
      '.contract.termination.final_invoice_generated',
      '.contract.termination.debt_reconciliation',
      '.contract.settlement.resolved',
      '.contract.settlement.payment_required',
    ];

    terminationSteps.forEach((ev) => channel.listen(ev, invalidate));

    const onTerminationFailed = (payload?: { message?: string }) => {
      invalidate();
      toast.error(payload?.message ?? 'Thanh lý hợp đồng thất bại.');
    };
    channel.listen('.contract.termination.failed', onTerminationFailed);

    return () => {
      terminationSteps.forEach((ev) => channel.stopListening(ev));
      channel.stopListening('.contract.termination.failed');
      echo?.leave(`private-property.${propertyId}`);
    };
  }, [propertyId, contract.id, queryClient]);

  useEffect(() => {
    if (!echo || !authUser?.id) return;

    const channel = echo.private(`user.${authUser.id}`);
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, contract.id] });
      queryClient.invalidateQueries({ queryKey: [CONTRACTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['handovers'] });
      queryClient.invalidateQueries({ queryKey: ['property-dashboard', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['meters', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-readings', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['meter-readings'] });
    };

    const terminationSteps = [
      '.contract.termination.initiated',
      '.contract.termination.handover_submitted',
      '.contract.termination.final_invoice_generated',
      '.contract.termination.debt_reconciliation',
      '.contract.settlement.resolved',
      '.contract.settlement.payment_required',
    ];

    terminationSteps.forEach((ev) => channel.listen(ev, invalidate));

    const onTerminationFailed = (payload?: { message?: string }) => {
      invalidate();
      toast.error(payload?.message ?? 'Thanh lý hợp đồng thất bại.');
    };
    channel.listen('.contract.termination.failed', onTerminationFailed);

    return () => {
      terminationSteps.forEach((ev) => channel.stopListening(ev));
      channel.stopListening('.contract.termination.failed');
      echo?.leave(`private-user.${authUser.id}`);
    };
  }, [authUser?.id, contract.id, queryClient, propertyId]);

  const [step, setStep] = useState(0);
  const [state, setState] = useState<TerminationWizardState>({
    terminationDate: format(new Date(), 'yyyy-MM-dd'),
    cancellationParty: 'TENANT',
    reason: '',
    waivePenalty: false,
    refundRemainingRent: false,
    damageFeeTotal: 0,
    handoverId: undefined,
    approvedReadings: [],
  });

  const patch = (v: Partial<TerminationWizardState>) => setState(prev => ({ ...prev, ...v }));

  // Step 1 → 2 (Bàn giao)
  const handleStep1Done = () => setStep(1);

  // Step 2 → 3 (Chốt số) — nhận handoverId từ Step2Handover
  const handleStep2Done = (handoverId: string) => {
    patch({ handoverId });
    setStep(2);
  };

  // Step 3 → 4 (Xác nhận) — nhận approved readings
  const handleStep3Done = (readings: SubmittedMeterReading[]) => {
    patch({ approvedReadings: readings });
    setStep(3);
  };

  const handleConfirm = () => {
    terminateContract.mutate(
      {
        id: contract.id,
        data: {
          termination_date: state.terminationDate,
          cancellation_party: state.cancellationParty,
          cancellation_reason: state.reason,
          waive_penalty: state.waivePenalty,
          refund_remaining_rent: state.refundRemainingRent,
          damage_fee_total: state.damageFeeTotal ?? 0,
          // Gửi kèm handover_id để backend verify (Guard 1)
          handover_id: state.handoverId,
        },
      },
      {
        onSuccess: (data: any, variables) => {
          queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id] });
          queryClient.invalidateQueries({ queryKey: [CONTRACTS_KEY] });
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          queryClient.invalidateQueries({ queryKey: ['handovers'] });
          const pid = contract?.property_id ?? contract?.property?.id;
          if (pid) {
            queryClient.invalidateQueries({ queryKey: ['property-dashboard', pid] });
            queryClient.invalidateQueries({ queryKey: ['meters', pid] });
            queryClient.invalidateQueries({ queryKey: ['property-readings', pid] });
          }
          queryClient.invalidateQueries({ queryKey: ['meter-readings'] });

          if (data?.processing_mode === 'async_eda') {
            toast.success(
              data?.message ??
                'Đã tiếp nhận thanh lý. Hệ thống đang xử lý; trạng thái cập nhật theo thời gian thực.',
            );
            onClose();
            return;
          }

          toast.success('Đã thanh lý hợp đồng thành công');

          const invoiceId = data?.settlement_invoice_id;
          const propertyId = contract?.property_id ?? contract?.property?.id;
          if (invoiceId && propertyId) {
            onClose();
            navigate(`/properties/${propertyId}/billing/invoices/${invoiceId}`);
          } else {
            onClose();
          }
        },
        onError: (error: any) => {
          const msg = error?.response?.data?.message || 'Có lỗi xảy ra khi thanh lý hợp đồng';
          toast.error(msg);
        },
      }
    );
  };

  const roomId   = contract?.room_id ?? contract?.room?.id;
  const roomName = contract?.room?.name ?? contract?.room?.code;
  const tenantName = contract?.tenant_full_name
    ?? contract?.primary_tenant_name
    ?? contract?.primaryMember?.full_name
    ?? contract?.primaryMember?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[16px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Thanh lý hợp đồng</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bước {step + 1} / {STEPS.length} — {STEPS[step]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 pt-4 shrink-0">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-black flex-shrink-0 transition-colors ${
                  i < step
                    ? 'bg-rose-600 text-white'
                    : i === step
                    ? 'bg-rose-600 text-white ring-2 ring-rose-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span
                className={`ml-1.5 text-[11px] font-bold hidden sm:block ${
                  i === step ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                    i < step ? 'bg-rose-600' : 'bg-slate-100 dark:bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Step 0: Thông tin thanh lý */}
          {step === 0 && (
            <Step1InfoForm
              contract={contract}
              value={state}
              onChange={patch}
              onNext={handleStep1Done}
            />
          )}

          {/* Step 1: Bàn giao phòng ← MỚI */}
          {step === 1 && (
            <Step2Handover
              roomId={roomId}
              roomName={roomName}
              contractId={contract.id}
              tenantName={tenantName}
              handoverId={state.handoverId}
              onBack={() => setStep(0)}
              onNext={handleStep2Done}
            />
          )}

          {/* Step 2: Chốt số điện nước */}
          {step === 2 && (
            <Step2MeterReadings
              roomId={roomId}
              terminationDate={state.terminationDate}
              onBack={() => setStep(1)}
              onNext={handleStep3Done}
            />
          )}

          {/* Step 3: Xem trước & Xác nhận */}
          {step === 3 && (
            <Step3Preview
              contract={contract}
              terminationDate={state.terminationDate}
              cancellationParty={state.cancellationParty}
              waivePenalty={state.waivePenalty}
              damageFeeTotal={state.damageFeeTotal ?? 0}
              approvedReadings={state.approvedReadings}
              onBack={() => setStep(2)}
              onConfirm={handleConfirm}
              isSubmitting={terminateContract.isPending}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
