import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '@/shared/hooks/useTheme';

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
  const { fontSize } = useTheme();
  const isLargeFont = fontSize === 'lg';

  const getFontSizeClass = () => {
    const valStr = value.toString();
    const len = valStr.length;
    
    // For very long numbers like currency billions
    if (len > 15) return isLargeFont ? 'text-[13px]' : 'text-base';
    if (len > 12) return isLargeFont ? 'text-base' : 'text-lg';
    if (len > 10) return isLargeFont ? 'text-lg' : 'text-xl';
    
    return isLargeFont ? 'text-xl' : 'text-2xl';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={testId}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-current opacity-[0.03] rounded-full blur-2xl group-hover:scale-125 transition-transform" />
      
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider truncate">{label}</p>
          <h3 className={`font-bold text-slate-900 dark:text-white tracking-tight whitespace-nowrap overflow-hidden text-ellipsis ${getFontSizeClass()}`}>
            {value}
          </h3>
          
          {trend && (
            <div className={`mt-2 flex items-center flex-wrap gap-1 text-[10px] font-bold ${trend.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
              <span className="flex items-center gap-0.5">
                {trend.isUp ? '↑' : '↓'}
                {trend.value}%
              </span>
              <span className="text-slate-400 font-medium whitespace-nowrap">vs tháng trước</span>
            </div>
          )}
        </div>
        
        <div className={`shrink-0 p-2.5 rounded-xl border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
};
