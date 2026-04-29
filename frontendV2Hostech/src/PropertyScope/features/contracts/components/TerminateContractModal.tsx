import { AnimatePresence } from 'framer-motion';
import { TerminationWizard } from './TerminationWizard';

interface TerminateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
}

/**
 * Wrapper giữ API cũ (isOpen, onClose, contract) và render TerminationWizard.
 * Tất cả logic thanh lý & chốt số đã được chuyển sang TerminationWizard.
 */
export function TerminateContractModal({ isOpen, onClose, contract }: TerminateContractModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <TerminationWizard contract={contract} onClose={onClose} />
      )}
    </AnimatePresence>
  );
}
