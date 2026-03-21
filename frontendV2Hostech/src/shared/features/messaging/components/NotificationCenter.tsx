import { X, Bell, MessageSquare, Megaphone, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import type { Notification } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  // Mock notifications
  const notifications: Notification[] = [
    {
      id: '1',
      title: 'New Message from Property Hub',
      description: 'Your plumbing repair request has been assigned to a technician.',
      time: '2 mins ago',
      unread: true,
      type: 'message'
    },
    {
      id: '2',
      title: 'Annual Fire Safety Audit',
      description: 'The property fire safety inspection will commence tomorrow at 9 AM.',
      time: '1 hour ago',
      unread: true,
      type: 'announcement'
    },
    {
      id: '3',
      title: 'Monthly Statement Generated',
      description: 'Your invoice for April 2026 is now available for review and payment.',
      time: '4 hours ago',
      unread: false,
      type: 'update'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100 cursor-zoom-out"
          />
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl z-[110] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                  <Bell className="w-6 h-6 text-indigo-600" />
                  Notifications
                </h2>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Stay updated with your property</p>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-2xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    whileHover={{ scale: 1.01 }}
                    className={`relative p-5 rounded-3xl border transition-all cursor-pointer group ${
                      notif.unread 
                        ? 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/50 shadow-lg shadow-indigo-100/20 dark:shadow-indigo-900/10' 
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                    }`}
                  >
                    {notif.unread && (
                      <div className="absolute top-5 right-5 w-2 h-2 bg-indigo-600 rounded-full" />
                    )}
                    
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center transition-all ${
                        notif.type === 'message' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' :
                        notif.type === 'announcement' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' :
                        notif.type === 'alert' ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400' :
                        'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {notif.type === 'message' && <MessageSquare className="w-5 h-5" />}
                        {notif.type === 'announcement' && <Megaphone className="w-5 h-5" />}
                        {notif.type === 'update' && <CheckCircle2 className="w-5 h-5" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase italic">{notif.title}</h3>
                        </div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-3">{notif.description}</p>
                        <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-tighter">{notif.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6">
                    <Bell className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 italic uppercase">All Caught Up!</h3>
                  <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">No new notifications for now</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <button className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors group">
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
              <button className="px-6 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-900 dark:hover:bg-slate-600 hover:text-white dark:hover:text-white transition-all shadow-sm">
                Open Full Hub
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
