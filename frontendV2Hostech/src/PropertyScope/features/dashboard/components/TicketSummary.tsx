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
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Maintenance Overview</h3>
        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span className="text-sm font-bold text-rose-900 dark:text-rose-400 tracking-tight">Needs Urgent Action</span>
          </div>
          <span className="text-xl font-black text-rose-600">{pending}</span>
        </div>

        <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-bold text-amber-900 dark:text-amber-400 tracking-tight">Unresolved Tickets</span>
          </div>
          <span className="text-xl font-black text-amber-600">{unresolved}</span>
        </div>

        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-900 dark:text-emerald-400 tracking-tight">Resolved (24h)</span>
          </div>
          <span className="text-xl font-black text-emerald-600">32</span>
        </div>
      </div>
    </motion.div>
  );
};
