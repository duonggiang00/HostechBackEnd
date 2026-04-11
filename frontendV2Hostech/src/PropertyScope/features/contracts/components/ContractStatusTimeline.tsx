import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, User, FileText, Settings, AlertTriangle } from 'lucide-react';
import type { ContractStatusHistory } from '../types';

interface ContractStatusTimelineProps {
  histories: ContractStatusHistory[];
  isLoading: boolean;
}

const DEFAULT_ICON_MAP: Record<string, any> = {
  'DRAFT->PENDING_SIGNATURE': FileText,
  'PENDING_SIGNATURE->PENDING_PAYMENT': Clock,
  'PENDING_PAYMENT->ACTIVE': CheckCircle2,
  'ACTIVE->PENDING_TERMINATION': AlertTriangle,
  'ACTIVE->TERMINATED': CheckCircle2,
  'ACTIVE->CANCELLED': AlertTriangle,
  'ACTIVE->EXPIRED': Clock,
  'PENDING_TERMINATION->TERMINATED': CheckCircle2,
  'PENDING_TERMINATION->CANCELLED': AlertTriangle,
  'EXPIRED->TERMINATED': CheckCircle2,
};

export function ContractStatusTimeline({ histories, isLoading }: ContractStatusTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!histories || histories.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500 italic">
        Chưa có thiết lập lịch sử cập nhật.
      </div>
    );
  }

  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-indigo-200 dark:before:via-indigo-800/50 before:to-transparent">
      {histories.map((history, idx) => {
        const transitionKey = `${history.old_status || 'DRAFT'}->${history.new_status}`;
        const Icon = DEFAULT_ICON_MAP[transitionKey] || Settings;

        return (
          <motion.div
            key={history.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative flex items-center gap-6 group is-active"
          >
            {/* Icon Circle */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-800 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0 shadow-md z-10">
              <Icon className="w-4 h-4" />
            </div>

            {/* Content Box */}
            <div className="w-[calc(100%-4rem)] p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 shadow-sm group-hover:shadow-md transition-shadow overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                <div className="font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                  <span className="text-sm">Trạng thái: </span>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider uppercase bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    {history.new_status}
                  </span>
                </div>
                <time className="text-xs font-semibold text-slate-400 italic shrink-0">
                  {format(new Date(history.created_at), 'dd/MM/yyyy HH:mm')}
                </time>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 mt-2 mb-3 break-words whitespace-pre-wrap">
                {history.reason || history.comment || 'Hệ thống cập nhật trạng thái hợp đồng.'}
              </div>
              {history.changedBy && (
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                  <User className="w-3 h-3 shrink-0" />
                  <span className="truncate">Bởi: <strong>{history.changedBy.full_name}</strong></span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
