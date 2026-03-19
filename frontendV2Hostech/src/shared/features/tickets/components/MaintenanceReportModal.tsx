import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  X, 
  Lightbulb,
  Droplets,
  Hammer,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface MaintenanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  { id: 'electric', label: 'Electricity', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  { id: 'plumbing', label: 'Plumbing', icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  { id: 'furniture', label: 'Furniture', icon: Hammer, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  { id: 'other', label: 'Others', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
];

export default function MaintenanceReportModal({ isOpen, onClose }: MaintenanceReportModalProps) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0A0A0B]/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="relative w-full max-w-lg bg-[#0A0A0B] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Step {step} of 2</span>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tight mt-1">Report Issue</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 pt-4 overflow-y-auto max-h-[70vh]">
              {step === 1 ? (
                <div className="space-y-6">
                  <p className="text-slate-400 font-medium">What seems to be the problem today?</p>
                  <div className="grid grid-cols-2 gap-4">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setCategory(cat.id);
                          setStep(2);
                        }}
                        className={`group relative p-6 rounded-[2rem] border transition-all duration-300 text-left overflow-hidden ${
                          category === cat.id 
                            ? `${cat.border} ${cat.bg} scale-[1.05]` 
                            : 'border-white/5 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className={`p-4 rounded-2xl ${cat.bg} ${cat.color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
                          <cat.icon className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-black text-white uppercase italic tracking-wider block">{cat.label}</span>
                        <ChevronRight className={`absolute bottom-6 right-6 w-4 h-4 transition-all duration-300 ${
                          category === cat.id ? 'translate-x-0 opacity-100 text-white' : '-translate-x-4 opacity-0 text-slate-600'
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Description</label>
                    <textarea
                      autoFocus
                      placeholder="Tell us exactly what's wrong..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:border-emerald-500/50 min-h-[150px] transition-all"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Photo Evidence</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-white/20 hover:text-slate-300 transition-all bg-white/5">
                        <Camera className="w-6 h-6" />
                        <span className="text-[10px] font-bold">Snap</span>
                      </button>
                      <button className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-white/20 hover:text-slate-300 transition-all bg-white/5">
                        <Upload className="w-6 h-6" />
                        <span className="text-[10px] font-bold">Upload</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 pt-4 border-t border-white/5 flex gap-4">
              {step === 2 && (
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-4 rounded-2xl bg-white/5 text-slate-400 font-black uppercase italic tracking-wider hover:bg-white/10 transition-all"
                >
                  Back
                </button>
              )}
              <button
                disabled={step === 1 && !category}
                onClick={onClose} // Mocking submission
                className="flex-1 px-8 py-4 bg-emerald-500 text-white font-black italic uppercase tracking-wider rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 disabled:grayscale disabled:opacity-50"
              >
                {step === 1 ? 'Next' : 'Submit Report'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
