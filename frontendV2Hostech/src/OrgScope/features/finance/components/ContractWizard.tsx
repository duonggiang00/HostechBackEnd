import { FilePlus, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export default function ContractWizard({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) {
  return (
    <div className="space-y-8 max-w-2xl mx-auto py-12">
      <div className="text-center space-y-4 mb-12">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-100">
          <FilePlus className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">Trình tạo Hợp đồng</h2>
        <p className="text-slate-500 font-medium">Khởi tạo ràng buộc pháp lý kỹ thuật số giữa cơ sở và khách thuê.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {[
          { title: 'Điều khoản', desc: 'Thiết lập ngày bắt đầu, thời hạn và chính sách gia hạn', icon: ShieldCheck, status: 'active' },
          { title: 'Cấu trúc Giá', desc: 'Tiền cọc, tiền thuê hàng tháng và dịch vụ tiện ích', icon: Check, status: 'pending' },
          { title: 'Chữ ký điện tử', desc: 'Xác minh an toàn và ký kết thỏa thuận', icon: Check, status: 'pending' },
        ].map((step, i) => (
          <div key={i} className={`p-8 rounded-4xl border-2 transition-all ${step.status === 'active' ? 'bg-white border-indigo-600 shadow-2xl shadow-indigo-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
            <div className="flex items-center gap-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step.status === 'active' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                <step.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 italic uppercase tracking-tighter">{step.title}</h3>
                <p className="text-xs text-slate-500 font-bold">{step.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 pt-8">
        <button onClick={onCancel} className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all active:scale-95">Hủy bỏ</button>
        <button onClick={onSuccess} className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3">
          Bắt đầu quy trình <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
