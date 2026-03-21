import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  X, 
  Zap,
  Droplets,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useMediaUpload } from '@/shared/features/media/hooks/useMedia';
import apiClient from '@/shared/api/client';
import toast from 'react-hot-toast';

interface TenantMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TenantMeterModal({ isOpen, onClose }: TenantMeterModalProps) {
  const [meterType, setMeterType] = useState<'ELECTRIC' | 'WATER'>('ELECTRIC');
  const [reading, setReading] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, progress } = useMediaUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploaded = await uploadFile(file, 'meters');
    if (uploaded) {
      setPhotoUrl(uploaded.url);
      toast.success('Photo uploaded successfully');
    }
  };

  const handleSubmit = async () => {
    if (!reading || isNaN(Number(reading))) {
      toast.error('Please enter a valid reading value');
      return;
    }
    if (!photoUrl) {
      toast.error('Please upload a photo of the meter');
      return;
    }

    setIsSubmitting(true);
    try {
      // Assuming tenant's assigned meter is matched on backend by type
      await apiClient.post('/tenant/meter-readings', {
        type: meterType,
        reading_value: Number(reading),
        photo_url: photoUrl
      });
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
       // Handled by global interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setMeterType('ELECTRIC');
    setReading('');
    setPhotoUrl(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-[#0A0A0B]/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="relative w-full max-w-lg bg-[#0A0A0B] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-5xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Submit Reading</h2>
                <p className="text-xs font-medium text-slate-500 mt-1">Self-service meter reporting</p>
              </div>
              <button 
                onClick={handleClose}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 pt-4 overflow-y-auto max-h-[70vh]">
              {success ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-white italic uppercase tracking-wider mb-2">Reading Submitted</h3>
                  <p className="text-sm text-slate-400 max-w-xs">Your reading has been recorded and is pending property manager approval.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setMeterType('ELECTRIC')}
                      className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all ${
                        meterType === 'ELECTRIC' 
                          ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/50 scale-105' 
                          : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <Zap className="w-8 h-8 mb-3" />
                      <span className="text-sm font-black uppercase tracking-widest">Electric</span>
                    </button>
                    <button
                      onClick={() => setMeterType('WATER')}
                      className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all ${
                        meterType === 'WATER' 
                          ? 'bg-blue-400/10 text-blue-400 border-blue-400/50 scale-105' 
                          : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <Droplets className="w-8 h-8 mb-3" />
                      <span className="text-sm font-black uppercase tracking-widest">Water</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Meter Value</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="e.g. 1405"
                        value={reading}
                        onChange={(e) => setReading(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-2xl font-black text-white outline-none focus:border-emerald-500/50 transition-all font-mono"
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-600 uppercase">
                        {meterType === 'ELECTRIC' ? 'kWh' : 'm³'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Photo Evidence</label>
                    
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />

                    {photoUrl ? (
                      <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 group">
                        <img src={photoUrl} alt="Meter" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => setPhotoUrl(null)}
                            className="px-4 py-2 bg-rose-500 text-white font-bold rounded-xl text-xs"
                          >
                            Remove Photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                         <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-video rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-white/20 hover:text-slate-300 transition-all bg-white/5 relative overflow-hidden"
                         >
                            {isUploading && (
                              <div className="absolute bottom-0 left-0 bg-indigo-500/20 h-full transition-all" style={{ width: `${progress}%` }} />
                            )}
                            {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                            <span className="text-xs font-bold uppercase tracking-widest z-10">{isUploading ? 'Uploading...' : 'Take Photo'}</span>
                         </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!success && (
              <div className="p-8 pt-4 border-t border-white/5">
                <button
                  disabled={isSubmitting || isUploading || !reading || !photoUrl}
                  onClick={handleSubmit}
                  className="w-full px-8 py-5 bg-indigo-600 text-white font-black italic uppercase tracking-wider rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20 disabled:grayscale disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  {isSubmitting ? 'Submitting...' : 'Upload Reading'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
