import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Invoice } from '../types';
import { roomsApi } from '../../rooms/api/rooms';
import { ManualInvoiceFormPanel } from './ManualInvoiceFormPanel';

interface CreateManualInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  propertyId: string;
  roomName?: string;
  onInvoiceCreated?: (invoice: Invoice) => void;
}

export const CreateManualInvoiceModal: React.FC<CreateManualInvoiceModalProps> = ({
  isOpen,
  onClose,
  roomId,
  propertyId,
  roomName,
  onInvoiceCreated,
}) => {
  const { data: room } = useQuery({
    queryKey: ['rooms', roomId],
    queryFn: () => roomsApi.getRoom(roomId),
    enabled: isOpen,
  });

  const activeContract = room?.contracts?.find(
    (c) => String(c.status).toLowerCase() === 'active' || String(c.status).toLowerCase() === 'pending_termination',
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-8 py-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    Tạo Hóa Đơn Tùy Chỉnh
                  </h2>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    Phòng {roomName || room?.name} •{' '}
                    {activeContract ? `Khách: ${activeContract.tenant_full_name || 'Khách thuê'}` : 'Phòng trống'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-8">
              <ManualInvoiceFormPanel
                propertyId={propertyId}
                roomId={roomId}
                roomName={roomName}
                enabled={isOpen}
                formId="manual-invoice-form-modal"
                onInvoiceCreated={onInvoiceCreated}
                onClose={onClose}
                embeddedSubmit
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
