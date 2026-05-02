import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useContractActions, CONTRACT_KEY, CONTRACTS_KEY } from '../../hooks/useContracts';
import { echo } from '@/shared/utils/echo';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { Step1InfoForm } from './Step1InfoForm';
import { Step2HandoverRoomAssets } from './Step2HandoverRoomAssets';
import { Step2HandoverRoomGallery } from './Step2HandoverRoomGallery';
import { Step2MeterReadings } from './Step2MeterReadings';
import { Step3Preview } from './Step3Preview';
import type { TerminationWizardState, SubmittedMeterReading } from './types';

interface TerminationWizardProps {
  contract: any;
  onClose: () => void;
}

const STEPS = ['Thông tin', 'Biên bản phòng', 'Ảnh bàn giao', 'Chốt số', 'Xác nhận'];

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
    approvedReadings: [],
  });

  const patch = (v: Partial<TerminationWizardState>) => setState(prev => ({ ...prev, ...v }));

  const handleStep1Done = () => setStep(1);

  const handleMeterStepDone = (readings: SubmittedMeterReading[]) => {
    patch({ approvedReadings: readings });
    setStep(4);
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
          const propertyIdNav = contract?.property_id ?? contract?.property?.id;
          if (invoiceId && propertyIdNav) {
            onClose();
            navigate(`/properties/${propertyIdNav}/billing/invoices/${invoiceId}`);
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

  const roomId = contract?.room_id ?? contract?.room?.id;

  return (
    <div className="relative flex w-full max-h-[min(92vh,calc(100dvh-8rem))] flex-col overflow-hidden rounded-[16px] border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:max-h-none sm:min-h-0">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 pb-4 pt-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-rose-50 dark:bg-rose-500/10">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Thanh lý hợp đồng</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Bước {step + 1} / {STEPS.length} — {STEPS[step]}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-0 px-6 pt-4">
        {STEPS.map((label, i) => (
          <div key={i} className="flex flex-1 items-center last:flex-none">
            <div
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors ${
                i < step
                  ? 'bg-rose-600 text-white'
                  : i === step
                    ? 'bg-rose-600 text-white ring-2 ring-rose-600/30'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span
              className={`ml-1.5 hidden text-[11px] font-bold sm:block ${
                i === step ? 'text-slate-900 dark:text-white' : 'text-slate-400'
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 flex-1 rounded-full transition-colors ${
                  i < step ? 'bg-rose-600' : 'bg-slate-100 dark:bg-slate-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {step === 0 && (
          <Step1InfoForm contract={contract} value={state} onChange={patch} onNext={handleStep1Done} />
        )}

        {step === 1 && (
          <Step2HandoverRoomAssets
            contractId={contract.id}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2HandoverRoomGallery
            contractId={contract.id}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <Step2MeterReadings
            roomId={roomId}
            terminationDate={state.terminationDate}
            onBack={() => setStep(2)}
            onNext={handleMeterStepDone}
          />
        )}

        {step === 4 && (
          <Step3Preview
            contract={contract}
            terminationDate={state.terminationDate}
            cancellationParty={state.cancellationParty}
            waivePenalty={state.waivePenalty}
            damageFeeTotal={state.damageFeeTotal ?? 0}
            approvedReadings={state.approvedReadings}
            onBack={() => setStep(3)}
            onConfirm={handleConfirm}
            isSubmitting={terminateContract.isPending}
          />
        )}
      </div>
    </div>
  );
}
