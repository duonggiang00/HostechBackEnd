import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';
import { useContract } from '../hooks/useContracts';
import { TerminationWizard } from '../components/TerminationWizard';

const ALLOWED_STATUSES = ['ACTIVE', 'PENDING_TERMINATION', 'EXPIRED'] as const;

export default function ContractTerminatePage() {
  const { propertyId, contractId } = useParams<{ propertyId: string; contractId: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading } = useContract(contractId);

  if (!propertyId || !contractId) {
    return <Navigate to="/org/properties" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6">
        <PageBackButton to={`/properties/${propertyId}/contracts`} />
        <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-6 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          Không tìm thấy hợp đồng.
        </div>
      </div>
    );
  }

  if (!ALLOWED_STATUSES.includes(contract.status as (typeof ALLOWED_STATUSES)[number])) {
    return <Navigate to={`/properties/${propertyId}/contracts/${contractId}`} replace />;
  }

  const backTo = `/properties/${propertyId}/contracts/${contractId}`;

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <PageBackButton to={backTo} className="mb-6" />
        <TerminationWizard
          contract={contract}
          onClose={() => navigate(backTo)}
        />
      </div>
    </div>
  );
}
