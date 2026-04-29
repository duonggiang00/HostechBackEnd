import React from 'react';
import { Zap, Droplets, Trash2, ChevronRight, Info } from 'lucide-react';
import type { EditableInvoiceItem } from '../../types';

interface InvoiceItemRowProps {
  item: EditableInvoiceItem;
  index: number;
  onUpdate: (id: string, updates: Partial<EditableInvoiceItem>) => void;
  onRemove: (id: string) => void;
  calculateTieredAmount: (usage: number, tiers: any[]) => { total: number; breakdown: any[] };
  formatCurrency: (amount: number) => string;
}

const InvoiceTierInfo = ({ breakdown, formatCurrency }: { breakdown: any[], formatCurrency: (a: number) => string }) => {
  if (!breakdown || breakdown.length === 0) return null;
  return (
    <div className="mt-2 p-3 bg-teal-50 border border-teal-100 rounded-lg text-[10px] space-y-1.5 shadow-sm">
      <div className="font-black uppercase text-teal-700 flex items-center gap-1.5 border-b border-teal-100 pb-1 mb-1">
        <Info size={12} /> BẢNG TÍNH LŨY TIẾN (TIERED BREAKDOWN)
      </div>
      {breakdown.map((b, i) => (
        <div key={i} className="flex justify-between text-teal-800 font-bold">
          <span>Bậc {b.label}: {b.usage} × {formatCurrency(b.price)}</span>
          <span className="font-black">{formatCurrency(b.amount)}</span>
        </div>
      ))}
    </div>
  );
};

export const InvoiceItemRow: React.FC<InvoiceItemRowProps> = ({
  item,
  index,
  onUpdate,
  onRemove,
  calculateTieredAmount,
  formatCurrency
}) => {
  return (
    <tr className="group/row">
      <td className="py-8 font-black text-xs text-slate-300 text-center">{index + 1}</td>
      <td className="py-8">
        <input 
          type="text"
          value={item.description}
          onChange={(e) => onUpdate(item.id, { description: e.target.value.toUpperCase() })}
          className="w-full font-black text-sm text-slate-900 uppercase tracking-tight bg-transparent border-b-2 border-transparent focus:border-teal-500 outline-none py-1.5 transition-all"
        />
        
        {item.is_metered ? (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                 {item.meter_type === 'ELECTRIC' ? <Zap size={14} className="text-amber-500" /> : <Droplets size={14} className="text-blue-500" />}
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">NHẬP CHỈ SỐ SỬ DỤNG</span>
              </div>
              <div className="flex items-center gap-6">
                 <div className="space-y-2 flex-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CŨ (KỲ TRƯỚC)</label>
                    <input 
                      type="number"
                      value={item.prev_reading}
                      onChange={(e) => onUpdate(item.id, { prev_reading: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-xs font-black text-slate-900 focus:border-teal-500 outline-none transition-all tabular-nums"
                    />
                 </div>
                 <div className="text-slate-300 pt-6">
                    <ChevronRight size={14} />
                 </div>
                 <div className="space-y-2 flex-1 border-l-2 border-slate-200 pl-6">
                    <label className="text-[9px] font-black text-teal-600 uppercase tracking-widest ml-1 animate-pulse">MỚI (CHỐT SỐ)</label>
                    <input 
                      type="number"
                      value={item.curr_reading}
                      onChange={(e) => onUpdate(item.id, { curr_reading: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border-2 border-teal-500 rounded-xl px-4 py-2 text-xs font-black text-slate-900 focus:shadow-lg focus:shadow-teal-100 outline-none transition-all tabular-nums"
                    />
                 </div>
              </div>
              <div className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 inline-block px-3 py-1.5 rounded-lg border border-teal-100">
                 TIÊU THỤ: {item.quantity} {item.meter_type === 'ELECTRIC' ? 'kWh' : 'm³'}
              </div>
            </div>
            <div className="border-l border-slate-200 pl-4">
              {item.tiered_rates && item.tiered_rates.length > 0 && (
                <InvoiceTierInfo 
                  breakdown={calculateTieredAmount(item.quantity || 0, item.tiered_rates).breakdown} 
                  formatCurrency={formatCurrency}
                />
              )}
            </div>
          </div>
        ) : (
          <p className="text-[9px] font-black text-slate-400 uppercase mt-2 tracking-widest flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Cố định theo thỏa thuận dịch vụ
          </p>
        )}
      </td>
      <td className="py-8 text-center align-top pt-10">
        <input 
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdate(item.id, { quantity: parseFloat(e.target.value) || 0 })}
          className="w-20 bg-slate-50 border-2 border-transparent rounded-xl p-2.5 text-center font-black text-sm text-slate-900 focus:border-teal-500 focus:bg-white outline-none transition-all tabular-nums"
          disabled={item.is_metered}
        />
      </td>
      <td className="py-8 text-right align-top pt-10">
        <input 
          type="number"
          value={item.unit_price}
          onChange={(e) => onUpdate(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
          className="w-32 bg-slate-50 border-2 border-transparent rounded-xl p-2.5 text-right font-black text-sm text-slate-900 focus:border-teal-500 focus:bg-white outline-none transition-all tabular-nums"
          disabled={item.is_metered && item.tiered_rates && item.tiered_rates.length > 0}
        />
      </td>
      <td className="py-8 text-right font-black text-lg text-slate-900 tracking-tighter align-top pt-10">
        {formatCurrency(item.amount || 0)}
      </td>
      <td className="py-8 text-right align-top pt-10 px-4">
        <button 
          onClick={() => onRemove(item.id)}
          className="p-2.5 text-slate-200 hover:text-red-500 transition-all opacity-0 group-hover/row:opacity-100 hover:bg-red-50 rounded-xl"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
};
