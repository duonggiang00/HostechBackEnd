import { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { contractsApi } from '../api/contracts';
import { toast } from 'react-hot-toast';

interface ContractPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
}

export function ContractPreviewModal({ isOpen, onClose, contractId }: ContractPreviewModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isOpen || !contractId) return;

    let isMounted = true;
    const loadPreview = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        // Fetch DOCX Blob
        const blob = await contractsApi.downloadDocument(contractId);
        
        if (!isMounted) return;

        // Ensure container is empty before rendering
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          await renderAsync(blob, containerRef.current, undefined, {
            className: 'docx-viewer',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: true,
            experimental: false,
            trimXmlDeclaration: true,
            debug: false,
          });
        }
      } catch (err: any) {
        if (!isMounted) return;
        setHasError(true);
        if (err?.response?.data instanceof Blob) {
           const text = await err.response.data.text();
           try {
             const json = JSON.parse(text);
             toast.error(json.message || 'Hợp đồng này chưa có file DOCX.');
           } catch {
             toast.error('Có lỗi xảy ra khi lấy file bản mềm.');
           }
        } else {
           toast.error('Có lỗi xảy ra hoặc file bản mềm không tồn tại.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPreview();

    return () => {
      isMounted = false;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [isOpen, contractId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 transition-colors"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4 md:p-8">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-5xl bg-slate-100 dark:bg-slate-900 rounded-[2rem] md:rounded-[3xl] shadow-2xl flex flex-col pointer-events-auto overflow-hidden h-[95vh] border border-slate-200 dark:border-slate-800 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 transition-colors z-20 shrink-0 shadow-sm relative">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic transition-colors">
                    Xem trước hợp đồng
                  </h3>
                  <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest transition-colors">
                    Bản xem trước của file hợp đồng
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-slate-200 dark:border-slate-700 active:scale-95"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto relative bg-slate-200 dark:bg-slate-950 p-4 md:p-10 custom-scrollbar z-10 transition-colors">
                {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-200/80 dark:bg-slate-950/80 backdrop-blur-sm z-30 transition-colors">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4 drop-shadow-md" />
                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-pulse drop-shadow-sm">
                      Đang xử lý tài liệu cấu trúc DOCX...
                    </p>
                  </div>
                )}
                
                {hasError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-8 text-center m-auto mb-[20vh]">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm">
                      <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <X className="w-8 h-8 text-rose-500" />
                      </div>
                      <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Lỗi hiển thị</p>
                      <p className="text-sm font-bold text-slate-500">
                        Không có file tài liệu DOCX hoặc quá trình render thất bại. Bạn vui lòng Khởi tạo DOCX trước khi xem!
                      </p>
                    </div>
                  </div>
                )}
                
                {/* DOCX Container */}
                <div 
                  className={`min-h-full max-w-4xl bg-white text-black shadow-xl mx-auto ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity rounded-xl overflow-hidden`} 
                >
                  <div ref={containerRef} className="docx-container p-4 md:p-8" />
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
