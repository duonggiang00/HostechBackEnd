import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download, Printer, Loader2, AlertCircle } from 'lucide-react';
import { useContractActions } from '../hooks/useContracts';
import { toast } from 'react-hot-toast';
import { renderAsync } from 'docx-preview';

interface ContractPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  contract?: any;
}

export function ContractPreviewModal({ isOpen, onClose, contractId, contract }: ContractPreviewModalProps) {
  const { downloadDocument } = useContractActions();
  
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [docType, setDocType] = useState<'PDF' | 'DOCX' | null>(null);

  useEffect(() => {
    const fetchFile = async () => {
      if (!contractId || !isOpen) return;
      
      setIsLoading(true);
      try {
        const blob = await downloadDocument.mutateAsync(contractId);
        setFileBlob(blob);
        
        const url = window.URL.createObjectURL(blob);
        setFileUrl(url);

        // Determine type based on contract prop or blob type
        if (contract?.document_type) {
          setDocType(contract.document_type.toUpperCase() as 'PDF' | 'DOCX');
        } else if (blob.type === 'application/pdf') {
          setDocType('PDF');
        } else {
          setDocType('DOCX');
        }
      } catch (err) {
        console.error('Error fetching document:', err);
        toast.error('Không thể tải tệp bản mềm hợp đồng.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchFile();
    }

    return () => {
      if (fileUrl) {
        window.URL.revokeObjectURL(fileUrl);
        setFileUrl(null);
        setFileBlob(null);
        setDocType(null);
      }
    };
  }, [contractId, isOpen]);

  useEffect(() => {
    if (isOpen && docType === 'DOCX' && fileBlob && fileUrl) {
      // Small timeout to ensure DOM element is ready
      const timer = setTimeout(() => {
        const container = document.getElementById('modal-docx-container');
        if (container) {
          renderAsync(fileBlob, container).catch(err => {
             console.error('Docx render error:', err);
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, docType, fileBlob, fileUrl]);

  const handleDownload = () => {
    if (!fileUrl) return;
    const link = document.createElement('a');
    link.href = fileUrl;
    const extension = docType === 'PDF' ? 'pdf' : 'docx';
    link.download = `Hop-dong-${contract?.room?.code || contractId.substring(0, 8)}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-slate-200 dark:border-slate-700 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 sm:px-8 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-4 text-indigo-600 dark:text-indigo-400">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Xem trước hợp đồng</h3>
                    <p className="text-xs font-bold text-slate-500">Bản mềm lưu trữ trên hệ thống</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleDownload}
                    disabled={!fileUrl}
                    className="p-2.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors disabled:opacity-30"
                    title="Tải xuống"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => window.print()}
                    disabled={!fileUrl}
                    className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-30"
                    title="In tài liệu"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                  <button
                    onClick={onClose}
                    className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-950 relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="font-bold text-slate-500 animate-pulse uppercase tracking-widest text-xs">Đang tải tài liệu...</p>
                  </div>
                ) : !fileUrl ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Không thể hiển thị tài liệu</h4>
                    <p className="text-slate-500 max-w-xs mx-auto">Tệp tin không tồn tại hoặc bạn không có quyền truy cập.</p>
                  </div>
                ) : docType === 'PDF' ? (
                  <iframe 
                    src={`${fileUrl}#toolbar=0`} 
                    className="w-full h-full border-none"
                    title="Contract Preview"
                  />
                ) : (
                  <div className="w-full h-full overflow-auto p-4 sm:p-8 flex justify-center">
                    <div id="modal-docx-container" className="bg-white shadow-xl max-w-[850px] w-full min-h-[1000px]" />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 sm:px-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center shrink-0">
                <button
                  onClick={onClose}
                  className="px-8 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-black uppercase tracking-widest text-xs transition-all"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
