import { MessageCircle, ShieldCheck, Settings, Bell } from 'lucide-react';
import MessagingCenter from '@/shared/features/messaging/components/MessagingCenter';

export default function TenantMessagingPage() {
  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Mobile-Friendly Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase italic italic text-white leading-none mb-1">Support Hub</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time interaction with property staff</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Your messages are encrypted and audited for quality.</span>
            </div>
            <span className="text-[10px] font-black uppercase text-indigo-400 italic">Official Channel</span>
          </div>
        </div>

        {/* Shared component used here */}
        <div className="shadow-3xl shadow-indigo-500/10 rounded-[3rem] overflow-hidden">
          <MessagingCenter />
        </div>
        
        {/* Contextual Info */}
        <p className="text-center text-[10px] font-bold text-slate-700 uppercase tracking-widest px-8 max-w-md mx-auto leading-relaxed">
          Need immediate assistance? For emergencies related to electricity or water, please use the emergency broadcast button in your dashboard.
        </p>
      </div>
    </div>
  );
}
