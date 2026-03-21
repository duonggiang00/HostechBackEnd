import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Zap, 
  FileCode2, 
  Settings2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import MessagingCenter from '@/shared/features/messaging/components/MessagingCenter';
import AutomationWorkflowBuilder from '@/PropertyScope/features/operations/components/AutomationWorkflowBuilder';
import CommunicationTemplateEditor from '@/shared/features/messaging/components/CommunicationTemplateEditor';

type Tab = 'messages' | 'automations' | 'templates';

export default function AdminCommunicationPage() {
  const [activeTab, setActiveTab] = useState<Tab>('messages');

  const tabs = [
    { id: 'messages', label: 'Messaging Hub', icon: MessageSquare, description: 'Direct tenant communication' },
    { id: 'automations', label: 'Rule Engine', icon: Zap, description: 'Automated notification workflows' },
    { id: 'templates', label: 'Template Library', icon: FileCode2, description: 'Dynamic message personalization' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/2 border border-white/5 p-10 rounded-6xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-black uppercase tracking-[0.2em] text-indigo-400">
                Operations Phase 7
              </span>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span className="text-xs font-black uppercase text-emerald-500">Encrypted Protocols</span>
              </div>
            </div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
              Control & <span className="text-indigo-500">Automation</span>
            </h1>
            <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-xs max-w-xl leading-relaxed">
              Unified communication command center for real-time messaging, autonomous reminder workflows, and standardized template protocols.
            </p>
          </div>

          <div className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-3xl relative z-10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`relative px-8 py-4 rounded-2xl transition-all group overflow-hidden ${
                  activeTab === tab.id ? 'text-[#0A0A0B]' : 'text-slate-500 hover:text-white'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'stroke-[3px]' : ''}`} />
                  <span className="text-xs font-black uppercase italic tracking-wider">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'messages' && <MessagingCenter />}
            {activeTab === 'automations' && <AutomationWorkflowBuilder />}
            {activeTab === 'templates' && <CommunicationTemplateEditor />}
          </motion.div>
        </AnimatePresence>

        {/* Footer Audit Context */}
        <div className="flex items-center justify-between px-10 py-6 border border-white/5 rounded-5xl bg-white/1">
          <div className="flex items-center gap-4 text-xs font-black uppercase text-slate-700 tracking-widest leading-none">
            <Settings2 className="w-4 h-4" />
            System Status: Nominal • Automation Engine Active • 14 Active Rules
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase text-slate-500">Quick Access:</span>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase text-slate-400 hover:text-white transition-all">
              Webhook Logs <ChevronRight className="w-3 h-3" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase text-slate-400 hover:text-white transition-all">
              Broadcast Archive <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
