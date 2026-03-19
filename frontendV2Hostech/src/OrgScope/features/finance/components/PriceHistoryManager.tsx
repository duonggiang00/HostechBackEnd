import { History, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import type { PriceHistory } from '@/PropertyScope/features/rooms/types';

interface PriceHistoryManagerProps {
  roomId: string;
  data?: PriceHistory[];
  isLoading?: boolean;
}

export default function PriceHistoryManager({ roomId, data, isLoading }: PriceHistoryManagerProps) {
  const history = data || [];

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Live Pricing</h3>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Active Market Rate</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black italic text-slate-900">$1,250</span>
          <span className="text-sm font-bold text-slate-400">/ month</span>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6">
        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
          <History className="w-4 h-4" /> Adjustment History
        </h4>
        <div className="space-y-6">
          {history.length > 0 ? (
            history.map((item, i) => (
              <div key={item.id || i} className="flex items-center justify-between group">
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-900 italic tracking-tight">Price Entry</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Effective: {new Date(item.start_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-emerald-500 italic">
                    ${Number(item.price).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No price adjustments recorded</p>
            </div>
          )}
        </div>
      </div>

      <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3">
         <DollarSign className="w-4 h-4 text-emerald-400" /> Adjust Pricing Strategy
      </button>
    </div>
  );
}
