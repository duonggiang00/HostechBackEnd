import { useState } from 'react';
import { 
  Plus, 
  MessageCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TicketTimeline from '@/shared/features/tickets/components/TicketTimeline';

interface Request {
  id: string;
  title: string;
  category: string;
  status: 'pending' | 'in_progress' | 'completed';
  date: string;
}

export default function TenantRequestsPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const requests: Request[] = [
    { id: 'REQ-101', title: 'AC Filter Replacement', category: 'Maintenance', status: 'pending', date: 'Mar 15, 2026' },
    { id: 'REQ-102', title: 'Leaking tap in Kitchen', category: 'Plumbing', status: 'in_progress', date: 'Mar 12, 2026' },
    { id: 'REQ-103', title: 'New Gate Access Card', category: 'Security', status: 'completed', date: 'Mar 08, 2026' },
  ];

  const statusIcons = {
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    in_progress: { icon: AlertCircle, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    completed: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      <AnimatePresence>
        {selectedTicketId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-200 flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-[#0A0A0B]/90 backdrop-blur-xl" onClick={() => setSelectedTicketId(null)} />
            <div className="relative w-full max-w-2xl bg-[#0A0A0B] border border-white/10 rounded-6xl shadow-2xl overflow-hidden p-2">
              <TicketTimeline />
              <button 
                onClick={() => setSelectedTicketId(null)}
                className="absolute top-8 right-8 p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Prime Support</h1>
        <button className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-indigo-900/30 hover:scale-105 active:scale-95 transition-all">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-4xl border border-slate-200 dark:border-slate-700">
        {['active', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-[0.2em] rounded-3xl transition-all ${
              activeTab === tab ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {requests
          .filter(r => activeTab === 'active' ? r.status !== 'completed' : r.status === 'completed')
          .map((req) => {
            const StatusInfo = statusIcons[req.status];
            return (
              <motion.div
                key={req.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTicketId(req.id)}
                className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-5xl p-6 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all flex items-center gap-5 cursor-pointer group"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${StatusInfo.bg} ${StatusInfo.color}`}>
                  <StatusInfo.icon className="w-7 h-7" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 leading-none">{req.category}</span>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{req.date}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase italic">{req.title}</h3>
                  <div className="flex items-center gap-2 mt-2.5">
                    <div className={`w-2 h-2 rounded-full ${StatusInfo.color.replace('text', 'bg')}`} />
                    <span className={`text-xs font-black uppercase tracking-widest ${StatusInfo.color}`}>{req.status.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="p-3 text-slate-200 dark:text-slate-600 group-hover:text-indigo-300 dark:group-hover:text-indigo-400 transition-colors">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* Empty State */}
      {requests.filter(r => activeTab === 'active' ? r.status !== 'completed' : r.status === 'completed').length === 0 && (
         <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-600 rounded-6xl p-16 text-center space-y-6">
            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-4xl shadow-sm flex items-center justify-center mx-auto text-slate-200 dark:text-slate-600 border border-slate-100 dark:border-slate-700">
               <MessageCircle className="w-10 h-10" />
            </div>
            <div>
               <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase italic">No {activeTab} inquiries</h4>
               <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 max-w-[220px] mx-auto font-medium leading-relaxed">Everything looks clear in your unit. We're here if you need anything.</p>
            </div>
         </div>
      )}
    </div>
  );
}
