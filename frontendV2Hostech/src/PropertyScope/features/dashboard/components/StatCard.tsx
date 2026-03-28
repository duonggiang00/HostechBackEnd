import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  testId?: string;
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50',
  amber: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50',
  rose: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50',
  sky: 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800/50',
};

export const StatCard = ({ label, value, icon: Icon, trend, color, testId }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={testId}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-current opacity-[0.03] rounded-full blur-2xl group-hover:scale-125 transition-transform" />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
          
          {trend && (
            <div className={`mt-2 flex items-center gap-1 text-xs font-bold ${trend.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
              <span>{trend.isUp ? '↑' : '↓'}</span>
              <span>{trend.value}%</span>
              <span className="text-slate-400 font-medium ml-1">so với tháng trước</span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-2xl border ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};
