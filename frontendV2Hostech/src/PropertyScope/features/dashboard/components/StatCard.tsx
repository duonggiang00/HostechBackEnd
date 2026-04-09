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
  color: 'blue' | 'emerald' | 'amber' | 'rose' | 'gray';
  testId?: string;
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-900 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50',
  emerald: 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50',
  amber: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50',
  rose: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50',
  gray: 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800/50',
};

export const StatCard = ({ label, value, icon: Icon, trend, color, testId }: StatCardProps) => {
  const { fontSize } = useTheme();
  const isLargeFont = fontSize === 'lg';

  const getFontSizeClass = () => {
    const valStr = value.toString();
    const len = valStr.length;
    
    // For very long numbers like currency billions
    if (len > 15) return isLargeFont ? 'text-[13px]' : 'text-[16px]';
    if (len > 12) return isLargeFont ? 'text-[16px]' : 'text-[18px]';
    if (len > 10) return isLargeFont ? 'text-[18px]' : 'text-[20px]';
    
    return isLargeFont ? 'text-[20px]' : 'text-[24px]';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={testId}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-[12px] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
    >
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-current opacity-[0.03] rounded-full blur-xl group-hover:scale-125 transition-transform" />
      
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <h3 className={`font-bold text-gray-900 dark:text-white tracking-tight whitespace-nowrap overflow-hidden text-ellipsis ${getFontSizeClass()}`}>
            {value}
          </h3>
          
          {trend && (
            <div className={`mt-2 flex items-center flex-wrap gap-1 text-[12px] font-medium ${trend.isUp ? 'text-green-600' : 'text-red-500'}`}>
              <span className="flex items-center gap-0.5 font-bold">
                {trend.isUp ? '↑' : '↓'}
                {trend.value}%
              </span>
              <span className="text-gray-500 font-normal whitespace-nowrap">so với tháng trước</span>
            </div>
          )}
        </div>
        
        <div className={`shrink-0 p-2.5 rounded-lg border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
};
