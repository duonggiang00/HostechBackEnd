import { useState } from 'react';
import { Camera, ClipboardCheck, AlertTriangle, ChevronRight, Image as ImageIcon } from 'lucide-react';
import ESignaturePad from '@/shared/features/documents/components/ESignaturePad';

export default function CheckInOutManager() {
  const [activeMode, setActiveMode] = useState<'checkin' | 'checkout'>('checkin');
  
  const checklist = [
    { id: 'walls', label: 'Tình trạng Tường & Sơn', status: 'pending' },
    { id: 'floor', label: 'Sàn nhà & Gạch ốp', status: 'pending' },
    { id: 'electric', label: 'Ổ cắm điện & Đèn chiếu sáng', status: 'pending' },
    { id: 'assets', label: 'Nội thất & Thiết bị', status: 'pending' },
  ];

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
        <button 
          onClick={() => setActiveMode('checkin')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeMode === 'checkin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Nhận phòng
        </button>
        <button 
          onClick={() => setActiveMode('checkout')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeMode === 'checkout' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Trả phòng
        </button>
      </div>

      {/* Checklist Section */}
      <div className="bg-white border border-slate-100 rounded-5xl p-6 shadow-sm overflow-hidden relative">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-500" />
            <span className="font-bold text-slate-800">Biên bản bàn giao</span>
          </div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Hoàn thành 0/4</span>
        </div>

        <div className="space-y-2">
          {checklist.map((item) => (
            <div key={item.id} className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 border border-transparent hover:border-indigo-100 rounded-2xl transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors" />
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 transition-transform group-hover:translate-x-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Visual Evidence Section */}
      <div className="bg-white border border-slate-100 rounded-5xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-slate-800">Hình ảnh minh chứng</span>
          </div>
          <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Thêm hàng loạt</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white hover:border-indigo-200 transition-all group">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Chụp ảnh</span>
          </div>
          <div className="aspect-square bg-slate-100 rounded-3xl flex items-center justify-center relative overflow-hidden group">
            <ImageIcon className="w-8 h-8 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-black uppercase tracking-widest">Xem trước</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature & Confirmation */}
      <div className="bg-white border border-slate-100 rounded-5xl p-6 shadow-sm">
        <ESignaturePad />
        
        <button className={`w-full mt-8 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
          activeMode === 'checkin' 
            ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700' 
            : 'bg-rose-600 text-white shadow-rose-200 hover:bg-rose-700'
        }`}>
          Hoàn tất {activeMode === 'checkin' ? 'Nhận phòng' : 'Trả phòng'}
        </button>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        <p className="text-xs text-amber-800 font-medium leading-relaxed">
          Việc khóa báo cáo {activeMode === 'checkin' ? 'nhận phòng' : 'trả phòng'} sẽ tạo ra bản PDF không thể chỉnh sửa cho cả hai bên.
        </p>
      </div>
    </div>
  );
}
