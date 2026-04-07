import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

interface RevenueTrendProps {
  data: { month: string; revenue: number }[];
}

export const RevenueTrend = ({ data }: RevenueTrendProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm h-[340px]"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Hiệu suất doanh thu</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Xu hướng doanh thu hàng tháng</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Doanh thu (VND)</span>
          </div>
        </div>
      </div>

      <div className="w-full h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
              width={110}
              tickFormatter={(value) => `${new Intl.NumberFormat('vi-VN').format(value)}`}
            />
            <Tooltip 
              formatter={(value: any) => [
                typeof value === 'number' 
                  ? new Intl.NumberFormat('vi-VN').format(value) + ' VND' 
                  : value, 
                'Doanh thu'
              ]}
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#6366f1" 
              strokeWidth={4} 
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
