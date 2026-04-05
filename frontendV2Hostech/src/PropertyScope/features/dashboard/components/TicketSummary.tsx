import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface TicketSummaryProps {
  pending: number;
  unresolved: number;
}

export const TicketSummary = ({ pending, unresolved }: TicketSummaryProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Bảo trì</h3>
        <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg transition-colors uppercase tracking-wider">
          Tất cả
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="text-[11px] font-bold text-rose-900 dark:text-rose-400 uppercase tracking-tight">Cần xử lý</span>
          </div>
          <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{pending}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-[11px] font-bold text-amber-900 dark:text-amber-400 uppercase tracking-tight">Chưa xong</span>
          </div>
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{unresolved}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-400 uppercase tracking-tight">Đã xong 24h</span>
          </div>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">32</span>
        </div>
      </div>
    </motion.div>
  );
};
