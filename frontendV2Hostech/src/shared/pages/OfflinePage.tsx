import { WifiOff, RefreshCcw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-transparent" />
          <WifiOff className="w-10 h-10 text-rose-500 relative z-10" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight italic uppercase">Connection Lost</h1>
          <p className="text-slate-400 font-medium mb-10 leading-relaxed">
            You're currently offline. Don't worry, your data is safe and we'll sync back as soon as you're connected.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-[#0A0A0B] font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/10 italic uppercase tracking-wider"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry Connection
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white/5 border border-white/10 text-slate-300 font-bold rounded-2xl hover:bg-white/10 transition-all uppercase text-sm tracking-widest"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </button>
        </motion.div>

        <p className="mt-12 text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">
          Hostech V2 • Offline Support Enabled
        </p>
      </div>
    </div>
  );
}
