import { ShieldCheck, Crosshair, RefreshCcw, Layers } from 'lucide-react';

export default function PaymentAllocationEngine() {
  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-5xl p-12 overflow-hidden relative">
        <div className="flex flex-col lg:flex-row items-center gap-12">
           <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 text-xs font-black uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" /> Trí tuệ hệ thống đang hoạt động
              </div>
              <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Đối soát <br/><span className="text-emerald-500">tự động</span></h2>
              <p className="text-slate-400 font-medium max-w-sm">Công cụ tự động so khớp sao kê ngân hàng với các hóa đơn chưa thanh toán với độ chính xác 99,8% trên tất cả các bút toán.</p>
              
              <div className="flex flex-wrap gap-4 pt-4 justify-center lg:justify-start">
                 <button className="px-6 py-3 bg-white text-black rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all active:scale-95">So khớp tất cả</button>
                 <button className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all active:scale-95">Tải xuống mục không khớp</button>
              </div>
           </div>
           
           <div className="w-full max-w-md bg-black/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
              <div className="space-y-6">
                 {[
                   { label: 'Khoản chi chưa phân bổ', value: '$450.00', icon: Layers, color: 'text-indigo-400' },
                   { label: 'Giao dịch nháp', value: '12 mục', icon: RefreshCcw, color: 'text-amber-400' },
                   { label: 'Điểm chính xác', value: '99.8%', icon: Crosshair, color: 'text-emerald-400' },
                 ].map((stat, i) => (
                   <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                         <stat.icon className={`w-4 h-4 ${stat.color}`} />
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                      </div>
                      <span className="text-sm font-black text-white italic">{stat.value}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
