import { motion } from 'framer-motion';

interface OccupancyGaugeProps {
  percentage: number;
}

export const OccupancyGauge = ({ percentage }: OccupancyGaugeProps) => {
  const strokeDasharray = 251.2; // 2 * PI * 40
  const offset = strokeDasharray - (percentage / 100) * strokeDasharray;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center h-[400px]"
    >
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Tỉ lệ lấp đầy</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8">Trạng thái lấp đầy tòa nhà hiện tại</p>
      
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="80"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-slate-100 dark:text-slate-800"
          />
          <motion.circle
            cx="96"
            cy="96"
            r="80"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: strokeDasharray }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="text-indigo-600"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-slate-900 dark:text-white">{percentage}%</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Full</span>
        </div>
      </div>
      
      <div className="mt-8 flex gap-6">
        <div className="text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Excellent</span>
          </div>
        </div>
        <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
        <div className="text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Targets</p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">On Track</p>
        </div>
      </div>
    </motion.div>
  );
};
