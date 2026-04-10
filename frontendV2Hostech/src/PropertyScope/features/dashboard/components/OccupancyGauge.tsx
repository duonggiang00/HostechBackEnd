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
      className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-[12px] shadow-sm flex flex-col items-center justify-center text-center ${isLargeFont ? 'h-auto py-6' : 'h-[340px]'}`}
    >
      <h3 className={`${isLargeFont ? 'text-[18px]' : 'text-[16px]'} font-bold text-gray-900 dark:text-white mb-0.5`}>Tỉ lệ lấp đầy</h3>
      <p className={`${isLargeFont ? 'text-[13px]' : 'text-[12px]'} text-gray-500 dark:text-gray-400 font-normal mb-4`}>Trạng thái hiện tại</p>
      
      <div className={`relative flex items-center justify-center ${isLargeFont ? 'w-36 h-36' : 'w-44 h-44'}`}>
        <svg className="w-full h-full transform -rotate-90 absolute" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-gray-100 dark:text-gray-800"
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
            className="text-blue-900"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${isLargeFont ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 dark:text-white`}>{percentage}%</span>
          <span className={`${isLargeFont ? 'text-[10px]' : 'text-[11px]'} font-semibold text-gray-500 uppercase tracking-widest mt-0.5`}>Lấp đầy</span>
        </div>
      </div>
      
      <div className={`${isLargeFont ? 'mt-4' : 'mt-8'} flex gap-6`}>
        <div className="text-center">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Trạng thái</p>
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-[13px] font-medium text-gray-700 dark:text-gray-200">Rất tốt</span>
          </div>
        </div>
        <div className="w-px h-8 bg-gray-200 dark:bg-gray-800" />
        <div className="text-center">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Mục tiêu</p>
          <p className="text-[13px] font-medium text-gray-700 dark:text-gray-200">Đúng tiến độ</p>
        </div>
      </div>
    </motion.div>
  );
};
