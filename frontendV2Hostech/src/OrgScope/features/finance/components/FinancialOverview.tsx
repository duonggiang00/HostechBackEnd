import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FinancialOverview() {
  const cards = [
    { label: 'Total Revenue', value: '$124,500.00', change: '+12.5%', icon: DollarSign, trend: 'up' },
    { label: 'Outstanding Debt', value: '$8,230.15', change: '-2.4%', icon: Wallet, trend: 'down' },
    { label: 'Projected Earnings', value: '$45,000.00', change: '+5.0%', icon: TrendingUp, trend: 'up' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <card.icon className="w-6 h-6 text-emerald-500" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-black ${card.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {card.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {card.change}
              </div>
            </div>
            <p className="text-xs font-black uppercase text-slate-500 tracking-[0.2em]">{card.label}</p>
            <h3 className="text-3xl font-black text-white mt-2 italic tracking-tight">{card.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-5xl p-8">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6">Recent Collections</h4>
            <div className="space-y-4">
               {[1,2,3].map(i => (
                 <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                          <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-white">Payment Received - INV-00{i}</p>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tenant A0{i}</p>
                       </div>
                    </div>
                    <span className="text-sm font-black text-emerald-500">+$1,500.00</span>
                 </div>
               ))}
            </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-5xl p-8">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6">Cash Flow Velocity</h4>
            <div className="h-64 flex items-end gap-2 px-4">
               {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                 <div key={i} className="flex-1 bg-emerald-500/20 rounded-t-lg transition-all hover:bg-emerald-500/40 relative group" style={{ height: `${h}%` }}>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500 rounded-full" />
                 </div>
               ))}
            </div>
            <div className="flex justify-between mt-4 px-4 text-xs font-black text-slate-600 uppercase tracking-widest">
               <span>Mon</span>
               <span>Wed</span>
               <span>Fri</span>
               <span>Sun</span>
            </div>
        </div>
      </div>
    </div>
  );
}
