import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface TicketSummaryProps {
  pending: number;
  unresolved: number;
}

export const TicketSummary = ({ pending, unresolved }: TicketSummaryProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-[12px] shadow-sm h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Bảo trì</h3>
        <button className="text-[11px] font-semibold text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md transition-colors uppercase tracking-wider">
          Tất cả
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-[12px] font-semibold text-red-900 dark:text-red-400 uppercase tracking-tight">Cần xử lý</span>
          </div>
          <span className="text-lg font-bold text-red-600 dark:text-red-400">{pending}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-[12px] font-semibold text-amber-900 dark:text-amber-400 uppercase tracking-tight">Chưa xong</span>
          </div>
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{unresolved}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/30">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-[12px] font-semibold text-green-900 dark:text-green-400 uppercase tracking-tight">Đã xong 24h</span>
          </div>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">32</span>
        </div>
      </div>
    </motion.div>
  );
};
