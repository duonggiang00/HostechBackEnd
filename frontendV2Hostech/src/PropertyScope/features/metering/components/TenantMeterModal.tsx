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
  // Electric State
  const [electricReading, setElectricReading] = useState('');
  const [electricPhotoUrl, setElectricPhotoUrl] = useState<string | null>(null);
  const [electricPhotoId, setElectricPhotoId] = useState<string | null>(null);

  // Water State
  const [waterReading, setWaterReading] = useState('');
  const [waterPhotoUrl, setWaterPhotoUrl] = useState<string | null>(null);
  const [waterPhotoId, setWaterPhotoId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const electricFileRef = useRef<HTMLInputElement>(null);
  const waterFileRef = useRef<HTMLInputElement>(null);

  // Using separate upload hooks to avoid shared progress overlay (or we can just reuse and show generic loading)
  const { uploadFile: uploadElectric, isUploading: isUploadingElectric, progress: progressElectric } = useMediaUpload();
  const { uploadFile: uploadWater, isUploading: isUploadingWater, progress: progressWater } = useMediaUpload();

  const handleElectricFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploaded = await uploadElectric(file, 'meters');
    if (uploaded) {
      setElectricPhotoUrl(uploaded.url);
      setElectricPhotoId(uploaded.id);
      toast.success('Tải ảnh điện lên thành công');
    }
  };

  const handleWaterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploaded = await uploadWater(file, 'meters');
    if (uploaded) {
      setWaterPhotoUrl(uploaded.url);
      setWaterPhotoId(uploaded.id);
      toast.success('Tải ảnh nước lên thành công');
    }
  };

  const hasElectricData = electricReading !== '' && electricPhotoUrl && electricPhotoId;
  const hasWaterData = waterReading !== '' && waterPhotoUrl && waterPhotoId;

  const handleSubmit = async () => {
    if (!hasElectricData && !hasWaterData) {
      toast.error('Vui lòng nhập ít nhất một chỉ số (Đồng hồ điện hoặc Đồng hồ nước) kèm theo ảnh');
      return;
    }

    if (electricReading && isNaN(Number(electricReading))) {
      toast.error('Chỉ số điện không hợp lệ');
      return;
    }

    if (waterReading && isNaN(Number(waterReading))) {
      toast.error('Chỉ số nước không hợp lệ');
      return;
    }

    if (electricReading && !electricPhotoId) {
      toast.error('Vui lòng tải lên ảnh minh chứng cho đồng hồ điện');
      return;
    }

    if (waterReading && !waterPhotoId) {
      toast.error('Vui lòng tải lên ảnh minh chứng cho đồng hồ nước');
      return;
    }

    setIsSubmitting(true);
    try {
      const promises = [];

      if (hasElectricData) {
        promises.push(apiClient.post('/tenant/meter-readings', {
          type: 'ELECTRIC',
          reading_value: Number(electricReading),
          photo_url: electricPhotoUrl,
          photo_id: electricPhotoId
        }));
      }

      if (hasWaterData) {
        promises.push(apiClient.post('/tenant/meter-readings', {
          type: 'WATER',
          reading_value: Number(waterReading),
          photo_url: waterPhotoUrl,
          photo_id: waterPhotoId
        }));
      }

      await Promise.all(promises);

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
    if (!isSubmitting) {
      setSuccess(false);
      setElectricReading('');
      setElectricPhotoUrl(null);
      setElectricPhotoId(null);
      setWaterReading('');
      setWaterPhotoUrl(null);
      setWaterPhotoId(null);
      onClose();
    }
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
            className="relative w-full max-w-xl bg-[#0A0A0B] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-5xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Gửi chỉ số</h2>
                <p className="text-xs font-medium text-slate-500 mt-1">Ghi nhận chỉ số điện nước cuối tháng</p>
              </div>
              <button 
                onClick={handleClose}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 pt-4 overflow-y-auto max-h-[75vh]">
              {success ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-white italic uppercase tracking-wider mb-2">Đã gửi thành công</h3>
                  <p className="text-sm text-slate-400 max-w-xs">Chỉ số của bạn đã được ghi nhận và đang chờ quản lý phê duyệt.</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* ELECTRIC SECTION */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                       <Zap className="w-5 h-5 text-yellow-400" />
                       <h3 className="text-sm font-black uppercase tracking-widest text-yellow-400">Đồng hồ điện</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Input Reading */}
                      <div className="space-y-2 flex flex-col justify-center">
                        <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Chỉ số điện (kWh)</label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="VD: 1405"
                            value={electricReading}
                            onChange={(e) => setElectricReading(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xl font-black text-white outline-none focus:border-yellow-400/50 transition-all font-mono"
                          />
                        </div>
                      </div>

                      {/* Photo Upload */}
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Ảnh chụp (Bắt buộc)</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={electricFileRef}
                          onChange={handleElectricFileChange}
                        />

                        {electricPhotoUrl ? (
                          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 group">
                            <img src={electricPhotoUrl} alt="Meter" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                onClick={() => {
                                  setElectricPhotoUrl(null);
                                  setElectricPhotoId(null);
                                }}
                                className="px-4 py-2 bg-rose-500 text-white font-bold rounded-xl text-xs"
                              >
                                Gỡ ảnh
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => electricFileRef.current?.click()}
                            className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-yellow-400/30 hover:text-yellow-400 transition-all bg-white/5 relative overflow-hidden"
                          >
                            {isUploadingElectric && (
                              <div className="absolute bottom-0 left-0 bg-yellow-400/20 h-full transition-all" style={{ width: `${progressElectric}%` }} />
                            )}
                            {isUploadingElectric ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                            <span className="text-[10px] font-bold uppercase tracking-widest z-10">
                              {isUploadingElectric ? 'Đang tải...' : 'Chụp ảnh điện'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* WATER SECTION */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                       <Droplets className="w-5 h-5 text-blue-400" />
                       <h3 className="text-sm font-black uppercase tracking-widest text-blue-400">Đồng hồ nước</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Input Reading */}
                      <div className="space-y-2 flex flex-col justify-center">
                        <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Chỉ số nước (m³)</label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="VD: 521"
                            value={waterReading}
                            onChange={(e) => setWaterReading(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xl font-black text-white outline-none focus:border-blue-400/50 transition-all font-mono"
                          />
                        </div>
                      </div>

                      {/* Photo Upload */}
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Ảnh chụp (Bắt buộc)</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={waterFileRef}
                          onChange={handleWaterFileChange}
                        />

                        {waterPhotoUrl ? (
                          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 group">
                            <img src={waterPhotoUrl} alt="Meter" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                onClick={() => {
                                  setWaterPhotoUrl(null);
                                  setWaterPhotoId(null);
                                }}
                                className="px-4 py-2 bg-rose-500 text-white font-bold rounded-xl text-xs"
                              >
                                Gỡ ảnh
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => waterFileRef.current?.click()}
                            className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-blue-400/30 hover:text-blue-400 transition-all bg-white/5 relative overflow-hidden"
                          >
                            {isUploadingWater && (
                              <div className="absolute bottom-0 left-0 bg-blue-400/20 h-full transition-all" style={{ width: `${progressWater}%` }} />
                            )}
                            {isUploadingWater ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                            <span className="text-[10px] font-bold uppercase tracking-widest z-10">
                              {isUploadingWater ? 'Đang tải...' : 'Chụp ảnh nước'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Footer */}
            {!success && (
              <div className="p-8 pt-4 border-t border-white/5">
                <button
                  disabled={isSubmitting || isUploadingElectric || isUploadingWater || (!hasElectricData && !hasWaterData)}
                  onClick={handleSubmit}
                  className="w-full px-8 py-5 bg-indigo-600 text-white font-black italic uppercase tracking-wider rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20 disabled:grayscale disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  {isSubmitting ? 'Đang gửi...' : 'Gửi chỉ số'}
                </button>
                <p className="text-center text-xs text-slate-500 mt-4">Bạn có thể gửi 1 hoặc cả 2 chỉ số cùng lúc.</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
