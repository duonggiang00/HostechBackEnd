import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Camera, Zap, Droplet, Calendar, 
  User, CheckCircle, Info, AlertCircle
} from 'lucide-react';
import type { MeterReading } from '../types';
import { ReadingStatusBadge } from './ReadingStatusBadge';

interface ReadingDetailModalProps {
  reading: MeterReading | null;
  onClose: () => void;
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export function ReadingDetailModal({ reading, onClose }: ReadingDetailModalProps) {
  if (!reading) return null;

  const meter = reading.meter;
  const isElectric = meter?.type === 'ELECTRIC';
  const Icon = isElectric ? Zap : Droplet;
  const themeColor = isElectric ? 'text-yellow-500' : 'text-blue-500';
  const unit = isElectric ? 'kWh' : 'm³';

  // Ensure proofs are normalized
  const proofs = reading.proofs ?? (reading as any).media ?? [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700`}>
                <Icon className={`w-5 h-5 ${themeColor}`} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  Chi tiết chốt số
                </h2>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  Phòng {meter?.room?.name || '-'} &middot; {meter?.code || '-'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Stats & Info */}
              <div className="space-y-6">
                {/* Core Stats */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Trạng thái</span>
                    <ReadingStatusBadge status={reading.status} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Chỉ số chốt</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">
                        {reading.reading_value.toLocaleString()} 
                        <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Tiêu thụ</p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        +{reading.consumption?.toLocaleString() || 0} 
                        <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline info */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-md text-indigo-500">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Kỳ chốt số</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Từ {formatDate(reading.period_start)} đến {formatDate(reading.period_end)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-md text-emerald-500">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Người chốt</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {reading.submitted_by?.full_name || '-'}
                      </p>
                      <p className="text-[10px] text-slate-400">{reading.submitted_at ? new Date(reading.submitted_at).toLocaleString('vi-VN') : ''}</p>
                    </div>
                  </div>

                  {reading.approved_by && (
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1 bg-blue-50 dark:bg-blue-500/10 rounded-md text-blue-500">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Người duyệt</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {reading.approved_by?.full_name || '-'}
                        </p>
                        <p className="text-[10px] text-slate-400">{reading.approved_at ? new Date(reading.approved_at).toLocaleString('vi-VN') : ''}</p>
                      </div>
                    </div>
                  )}

                  {reading.status === 'REJECTED' && reading.meta?.rejection_reason && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Lý do từ chối</p>
                        <p className="text-sm font-semibold text-rose-700 dark:text-rose-400 mt-0.5">
                          {reading.meta.rejection_reason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Images */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-500" />
                    Ảnh minh chứng
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 ">
                    {proofs.length} ảnh
                  </span>
                </div>

                {proofs.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {proofs.map((img: any, idx: number) => (
                      <a 
                        key={img.id || idx} 
                        href={img.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group relative shadow-sm hover:shadow-md transition-all"
                      >
                        <img 
                          src={img.url} 
                          alt="Minh chứng" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus className="w-6 h-6 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400">
                    <Camera className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm font-bold opacity-50 text-center px-4">Không có ảnh minh chứng cho lần chốt này.</p>
                  </div>
                )}

                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20">
                  <div className="flex gap-3">
                    <div className="mt-0.5"><Info className="w-4 h-4 text-indigo-400" /></div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed ">
                      Click vào ảnh để xem bản gốc độ phân giải cao. Ảnh chụp giúp minh bạch thông tin giữa chủ nhà và khách thuê.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 flex justify-end">
             <button
               onClick={onClose}
               className="px-8 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black rounded-xl hover:opacity-90 transition-all active:scale-95"
             >
               Đóng
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Re-using Plus from lucide-react (not imported yet in this snippet but available in icon sets)
import { Plus } from 'lucide-react';
