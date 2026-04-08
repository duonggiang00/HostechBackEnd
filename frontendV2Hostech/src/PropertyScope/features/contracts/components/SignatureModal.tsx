import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PenTool, Eraser, CheckCircle } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureDataUrl: string) => void;
  isLoading?: boolean;
}

export default function SignatureModal({ isOpen, onClose, onConfirm, isLoading = false }: SignatureModalProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setError(null);
  };

  const handleConfirm = () => {
    if (sigCanvas.current?.isEmpty()) {
      setError('Vui lòng ký tay trước khi xác nhận.');
      return;
    }
    
    // Bỏ qua getTrimmedCanvas do lỗi tương thích Vite, dùng getCanvas trực tiếp
    const dataUrl = sigCanvas.current?.getCanvas().toDataURL('image/png');
    if (dataUrl) {
      onConfirm(dataUrl);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-slate-200 dark:border-slate-700 flex flex-col max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Ký hợp đồng</h3>
                    <p className="text-xs font-bold text-slate-500">Sử dụng chuột hoặc ngón tay để vẽ chữ ký</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-8 flex-1 overflow-y-auto">
                <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden relative group">
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
                    <span className="text-6xl font-black uppercase tracking-widest text-indigo-900 dark:text-indigo-100 whitespace-nowrap rotate-[-15deg] select-none">
                      Ký tại đây
                    </span>
                  </div>
                  
                  <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                      className: 'w-full h-64 sm:h-80 relative z-10 cursor-crosshair',
                      style: { touchAction: 'none' } // Prevent scrolling on touch devices while signing
                    }}
                    minWidth={2}
                    maxWidth={4}
                    penColor="rgb(79, 70, 229)" // Indigo 600
                  />
                  
                  {/* Decorative corner lines indicating signature area */}
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-indigo-300 dark:border-indigo-500/50 rounded-bl" />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-indigo-300 dark:border-indigo-500/50 rounded-br" />
                </div>
                
                {error && (
                  <p className="text-sm font-bold text-rose-500 mt-4 text-center">{error}</p>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 sm:px-8 sm:py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 shrink-0">
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Eraser className="w-4 h-4" />
                  Ký lại
                </button>

                <div className="flex w-full sm:w-auto items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-center"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang xử lý...
                      </span>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Hoàn tất ký
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
