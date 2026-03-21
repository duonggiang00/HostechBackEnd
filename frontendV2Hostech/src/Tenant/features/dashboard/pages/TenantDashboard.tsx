import { 
  Bell, 
  CreditCard, 
  Calendar, 
  Zap, 
  CircleCheck,
  Megaphone,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import NotificationCenter from '@/shared/features/messaging/components/NotificationCenter';
import MaintenanceReportModal from '@/shared/features/tickets/components/MaintenanceReportModal';
import TenantMeterModal from '@/PropertyScope/features/metering/components/TenantMeterModal';

export default function TenantDashboard() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);

  // Mock data
  const tenantName = "Alex Johnson";
  const propertyName = "Grand Horizon Resort";
  const unitNumber = "101";

  const nextPayment = {
    amount: 1200,
    dueDate: "Apr 01, 2026",
    daysLeft: 14
  };

  const recentNews = [
    { id: 1, title: "Pool Maintenance Schedule", date: "2 hours ago", type: "event" },
    { id: 2, title: "New Security Enhancements", date: "Yesterday", type: "alert" },
  ];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Modals */}
      <NotificationCenter isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      <MaintenanceReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
      <TenantMeterModal isOpen={isMeterModalOpen} onClose={() => setIsMeterModalOpen(false)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Prime Living, {tenantName.split(' ')[0]}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Room {unitNumber} • {propertyName}</p>
        </div>
        <button 
          onClick={() => setIsNotificationsOpen(true)}
          className="relative p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800" />
        </button>
      </div>

      {/* Bill Card */}
      <motion.div 
        whileTap={{ scale: 0.98 }}
        className="relative overflow-hidden bg-indigo-600 rounded-[32px] p-8 text-white shadow-2xl shadow-indigo-100/50 dark:shadow-none"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-8 -translate-y-8">
          <CreditCard className="w-48 h-48" />
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-8">
             <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <Calendar className="w-4 h-4" />
             </div>
             <span className="text-sm font-bold opacity-80">Next billing in {nextPayment.daysLeft} days</span>
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Standard Monthly Rent</p>
              <h2 className="text-4xl font-black">${nextPayment.amount.toLocaleString()}</h2>
            </div>
            <button className="px-6 py-3 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:bg-slate-50 transition-colors shadow-lg shadow-black/5 active:scale-95">
              Pay Now
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <button 
          onClick={() => setIsReportModalOpen(true)}
          className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[28px] group hover:border-indigo-300 dark:hover:border-indigo-700 transition-all active:scale-95 shadow-sm"
         >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
               <Zap className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">Maintenance</span>
         </button>
         <button className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[28px] group hover:border-indigo-300 dark:hover:border-indigo-700 transition-all active:scale-95 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
               <CircleCheck className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">Guest Pass</span>
         </button>
         <button 
          onClick={() => setIsMeterModalOpen(true)}
          className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[28px] group hover:border-indigo-300 dark:hover:border-indigo-700 transition-all active:scale-95 shadow-sm"
         >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
               <Zap className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">Submit Reading</span>
         </button>
         <button className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[28px] group hover:border-indigo-300 dark:hover:border-indigo-700 transition-all active:scale-95 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-3 group-hover:bg-slate-100 dark:group-hover:bg-slate-600 transition-colors">
               <Calendar className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">Events</span>
         </button>
      </div>

      {/* News/Announcements */}
      <div className="space-y-4">
         <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Building Updates</h3>
            <button className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">See All</button>
         </div>
         
         <div className="space-y-3">
            {recentNews.map(news => (
               <div key={news.id} className="flex items-center gap-4 p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-700 transition-all shadow-sm">
                  <div className={`p-2.5 rounded-xl ${news.type === 'alert' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500'}`}>
                     <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                     <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight italic uppercase">{news.title}</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium tracking-tight">{news.date}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" />
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
