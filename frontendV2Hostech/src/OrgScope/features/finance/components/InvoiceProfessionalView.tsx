import { Receipt, Scissors, Printer, Download, Share2 } from 'lucide-react';

export default function InvoiceProfessionalView() {
  return (
    <div className="bg-white text-slate-900 p-12 shadow-2xl border border-slate-100 min-h-[800px] flex flex-col">
      <div className="flex justify-between items-start mb-16">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Hostech Billing</h1>
          </div>
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Trụ sở vận hành bất động sản</p>
          <p className="text-xs text-slate-500 font-bold mt-1">123 Management Way, Silicon Suite</p>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Hóa đơn</h2>
          <p className="text-sm font-black text-slate-900">#INV-94103</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Ngày: 18 tháng 3, 2026</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-16">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Người gửi</h3>
          <p className="text-sm font-black uppercase italic">Urban Living Apartments</p>
          <p className="text-xs text-slate-500 font-bold">Block A, Suite 402</p>
          <p className="text-xs text-slate-500 font-bold">+1 (555) 000-0000</p>
        </div>
        <div>
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Người nhận</h3>
          <p className="text-sm font-black uppercase italic">Abebe Kelemu</p>
          <p className="text-xs text-slate-500 font-bold">Mã khách thuê: TEN-4402</p>
          <p className="text-xs text-slate-500 font-bold">Phòng 10.12, Tầng 10</p>
        </div>
      </div>

      <div className="flex-1">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="py-4 text-xs font-black uppercase tracking-widest text-slate-400">Nội dung</th>
              <th className="py-4 text-xs font-black uppercase tracking-widest text-slate-400 text-center">SL</th>
              <th className="py-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Đơn giá</th>
              <th className="py-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              { desc: 'Tiền thuê phòng hàng tháng', qty: 1, price: 1200, total: 1200 },
              { desc: 'Phụ phí điện nước & tiện ích', qty: 1, price: 45, total: 45 },
              { desc: 'Phí bảo trì hàng tháng', qty: 1, price: 15, total: 15 },
            ].map((item, i) => (
              <tr key={i}>
                <td className="py-6 pr-8">
                  <p className="text-xs font-black uppercase italic">{item.desc}</p>
                </td>
                <td className="py-6 text-center text-xs font-bold">{item.qty}</td>
                <td className="py-6 text-right text-xs font-bold">${item.price.toFixed(2)}</td>
                <td className="py-6 text-right text-xs font-black italic underline decoration-indigo-500/20 underline-offset-4">${item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 pt-8 border-t-2 border-slate-900 flex justify-between items-end">
        <div className="flex gap-4">
          <button className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-slate-900 transition-all">
             <Printer className="w-4 h-4 text-slate-400 group-hover:text-white" />
             <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-400">In</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-slate-900 transition-all">
             <Download className="w-4 h-4 text-slate-400 group-hover:text-white" />
             <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-400">Lưu</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-slate-900 transition-all">
             <Share2 className="w-4 h-4 text-slate-400 group-hover:text-white" />
             <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-400">Chia sẻ</span>
          </button>
        </div>
        <div className="text-right">
          <div className="space-y-1 mb-4">
            <div className="flex justify-between gap-12 opacity-40">
              <span className="text-xs font-black uppercase tracking-widest">Tạm tính</span>
              <span className="text-xs font-black tracking-widest">$1,260.00</span>
            </div>
            <div className="flex justify-between gap-12 opacity-40">
              <span className="text-xs font-black uppercase tracking-widest">Thuế (0%)</span>
              <span className="text-xs font-black tracking-widest">$0.00</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <span className="text-xs font-black uppercase italic tracking-[0.2em] text-slate-400 underline decoration-slate-200 underline-offset-8">Tổng cộng</span>
            <span className="text-4xl font-black italic tracking-tighter">$1,260.00</span>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <Scissors className="w-4 h-4 text-slate-200" />
           <div className="h-px flex-1 bg-slate-100 w-32 hidden md:block" />
         </div>
         <p className="text-xs font-bold text-slate-300 italic tracking-[0.3em] uppercase">Đây là tài liệu được tạo tự động từ hệ thống</p>
      </div>
    </div>
  );
}
