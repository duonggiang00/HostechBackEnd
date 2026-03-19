import { useState } from 'react';
import { Camera, ClipboardCheck, AlertTriangle, ChevronRight, Image as ImageIcon } from 'lucide-react';
import ESignaturePad from '@/shared/features/documents/components/ESignaturePad';

export default function CheckInOutManager() {
  const [activeMode, setActiveMode] = useState<'checkin' | 'checkout'>('checkin');
  
  const checklist = [
    { id: 'walls', label: 'Walls & Paint Condition', status: 'pending' },
    { id: 'floor', label: 'Flooring & Tiles', status: 'pending' },
    { id: 'electric', label: 'Electrical Sockets & Lights', status: 'pending' },
    { id: 'assets', label: 'Furniture & Appliances', status: 'pending' },
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
          Check-In
        </button>
        <button 
          onClick={() => setActiveMode('checkout')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeMode === 'checkout' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Check-Out
        </button>
      </div>

      {/* Checklist Section */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm overflow-hidden relative">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-500" />
            <span className="font-bold text-slate-800">Condition Protocol</span>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">0/4 Completed</span>
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
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-slate-800">Visual Evidence</span>
          </div>
          <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Add Batch</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white hover:border-indigo-200 transition-all group">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Snap Entry</span>
          </div>
          <div className="aspect-square bg-slate-100 rounded-3xl flex items-center justify-center relative overflow-hidden group">
            <ImageIcon className="w-8 h-8 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-[10px] font-black uppercase tracking-widest">Preview</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature & Confirmation */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
        <ESignaturePad />
        
        <button className={`w-full mt-8 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
          activeMode === 'checkin' 
            ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700' 
            : 'bg-rose-600 text-white shadow-rose-200 hover:bg-rose-700'
        }`}>
          Finalize {activeMode === 'checkin' ? 'Check-In' : 'Check-Out'}
        </button>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
          Locking the {activeMode} report will generate an immutable PDF version of this protocol for both parties.
        </p>
      </div>
    </div>
  );
}
