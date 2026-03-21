import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, QrCode, ClipboardCheck, ArrowLeft } from 'lucide-react';
import ContractWizard from '@/OrgScope/features/finance/components/ContractWizard';
import TenantQRVerification from '@/PropertyScope/features/operations/components/TenantQRVerification';
import CheckInOutManager from '@/PropertyScope/features/operations/components/CheckInOutManager';

interface ManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  title?: string;
  children?: React.ReactNode;
}

type ManagementView = 'selection' | 'contract' | 'qr' | 'protocol' | 'custom';

export default function ManagementModal({ isOpen, onClose, roomName, title, children }: ManagementModalProps) {
  const [activeView, setActiveView] = useState<ManagementView>('selection');

  const views = [
    { 
      id: 'contract' as ManagementView, 
      title: 'New Lease Contract', 
      desc: 'Build legal agreement & pricing',
      icon: FileText,
      color: 'bg-indigo-50 text-indigo-600'
    },
    { 
      id: 'qr' as ManagementView, 
      title: 'QR Enrollment', 
      desc: 'Let tenant register via mobile',
      icon: QrCode,
      color: 'bg-emerald-50 text-emerald-600'
    },
    { 
      id: 'protocol' as ManagementView, 
      title: 'Check-In/Out', 
      desc: 'Condition reports & visual evidence',
      icon: ClipboardCheck,
      color: 'bg-amber-50 text-amber-600'
    }
  ];

  const handleClose = () => {
    setActiveView('selection');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="bg-slate-50 rounded-6xl shadow-2xl w-full max-w-5xl h-fit max-h-[90vh] overflow-hidden relative border border-white/20 flex flex-col"
          >
            {/* Modal Header */}
            <div className="px-8 py-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                {activeView !== 'selection' && (
                  <button 
                    onClick={() => setActiveView('selection')}
                    className="p-2.5 bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-xl transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {title || (activeView === 'selection' ? `Manage Room ${roomName}` : views.find(v => v.id === activeView)?.title)}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                    {activeView === 'selection' ? 'Select an operational workflow' : `Scoping: Room ${roomName}`}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-3 bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <AnimatePresence mode="wait">
                {children ? (
                  <motion.div
                    key="custom-content"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                  >
                    {children}
                  </motion.div>
                ) : (
                  <>
                    {activeView === 'selection' && (
                      <motion.div
                        key="selection"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                      >
                        {views.map((view) => {
                          const Icon = view.icon;
                          return (
                            <button
                              key={view.id}
                              onClick={() => setActiveView(view.id)}
                              className="group p-8 bg-white border border-slate-100 rounded-5xl text-left hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all active:scale-95 flex flex-col items-center text-center"
                            >
                              <div className={`w-20 h-20 ${view.color} rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                <Icon className="w-10 h-10" />
                              </div>
                              <h4 className="text-xl font-black text-slate-900 mb-2 leading-tight">{view.title}</h4>
                              <p className="text-sm text-slate-500 font-medium leading-relaxed">{view.desc}</p>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}

                    {activeView === 'contract' && (
                      <motion.div
                        key="contract"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                      >
                        <ContractWizard />
                      </motion.div>
                    )}

                    {activeView === 'qr' && (
                      <motion.div
                        key="qr"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="max-w-xl mx-auto"
                      >
                        <TenantQRVerification />
                      </motion.div>
                    )}

                    {activeView === 'protocol' && (
                      <motion.div
                        key="protocol"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="max-w-2xl mx-auto"
                      >
                        <CheckInOutManager />
                      </motion.div>
                    )}
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
