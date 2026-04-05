import { motion } from 'framer-motion';
import { useTheme } from '@/shared/hooks/useTheme';

interface OccupancyGaugeProps {
  percentage: number;
}

export const OccupancyGauge = ({ percentage }: OccupancyGaugeProps) => {
  const { fontSize } = useTheme();
  const isLargeFont = fontSize === 'lg';
  
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center ${isLargeFont ? 'h-auto py-6' : 'h-[340px]'}`}
    >
      <h3 className={`${isLargeFont ? 'text-lg' : 'text-base'} font-bold text-slate-900 dark:text-white mb-0.5`}>Tỉ lệ lấp đầy</h3>
      <p className={`${isLargeFont ? 'text-sm' : 'text-xs'} text-slate-500 dark:text-slate-400 font-medium mb-4`}>Trạng thái hiện tại</p>
      
      <div className={`relative ${isLargeFont ? 'w-36 h-36' : 'w-44 h-44'}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-slate-100 dark:text-slate-800"
          />
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="text-indigo-600"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${isLargeFont ? 'text-2xl' : 'text-3xl'} font-bold text-slate-900 dark:text-white`}>{percentage}%</span>
          <span className={`${isLargeFont ? 'text-[10px]' : 'text-[10px]'} font-bold text-slate-400 uppercase tracking-widest mt-0.5`}>Lấp đầy</span>
        </div>
      </div>
      
      <div className={`${isLargeFont ? 'mt-4' : 'mt-8'} flex gap-6`}>
        <div className="text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Trạng thái</p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Rất tốt</span>
          </div>
        </div>
        <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
        <div className="text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mục tiêu</p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Đúng tiến độ</p>
        </div>
      </div>
    </motion.div>
  );
};
