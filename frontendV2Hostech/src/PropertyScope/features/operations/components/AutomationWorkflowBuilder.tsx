// @ts-nocheck
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Play, 
  Pause,
  Clock,
  Settings2,
  Calendar,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: 'active' | 'paused' | 'draft';
  lastRun?: string;
  successRate?: number;
}

const MOCK_RULES: AutomationRule[] = [
  { id: '1', name: 'Rent Overdue Reminder (T+3)', trigger: 'Date > Due Date + 3 days', action: 'Send Email + SMS', status: 'active', lastRun: '2 hours ago', successRate: 98 },
  { id: '2', name: 'Contract Expiry Notice (T-30)', trigger: 'Contract Ends in 30 days', action: 'Tenant Notification', status: 'paused', lastRun: 'Yesterday', successRate: 100 },
  { id: '3', name: 'Utility Bill Arrival', trigger: 'Utility Invoice Generated', action: 'Push Notification', status: 'active', lastRun: '5 mins ago', successRate: 95 },
];

export default function AutomationWorkflowBuilder() {
  const [rules, setRules] = useState<AutomationRule[]>(MOCK_RULES);
  const [isAdding, setIsAdding] = useState(false);

  const deleteRule = (id: string) => setRules(rules.filter(r => r.id !== id));

  return (
    <div className="bg-[#0A0A0B] text-white rounded-[2.5rem] border border-white/10 overflow-hidden min-h-[700px] flex flex-col p-8 space-y-8 relative shadow-2xl">
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-500/5 blur-[120px] pointer-events-none" />
      
      {/* Header Section */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Workflow Engine</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Autonomous management lifecycle protocols</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-3 px-8 py-4 bg-white text-[#0A0A0B] rounded-2xl font-black uppercase italic tracking-wider hover:scale-[1.05] transition-all shadow-xl shadow-white/10"
        >
          <Plus className="w-5 h-5" />
          Deploy New Logic
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 relative z-10">
        {[
          { label: 'Total Automations', value: rules.length, color: 'text-white' },
          { label: 'Successful Runs', value: '14,202', color: 'text-emerald-400' },
          { label: 'Operational Uptime', value: '99.9%', color: 'text-indigo-400' },
          { label: 'Est. Hours Saved', value: '420h', color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black italic ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Rules Palette */}
      <div className="flex-1 space-y-4 relative z-10 overflow-y-auto pr-2">
        <div className="flex items-center justify-between px-4 mb-2">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Active Guardrails</span>
          <span className="text-[10px] font-bold text-slate-700 uppercase">Sorted by Priority</span>
        </div>

        {rules.map((rule) => (
          <motion.div
            layout
            key={rule.id}
            className={`group bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:border-white/20 transition-all ${
              rule.status === 'paused' ? 'opacity-60 grayscale' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                  rule.status === 'active' 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                    : 'bg-white/5 border-white/10 text-slate-500'
                }`}>
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-lg uppercase italic text-white tracking-tight group-hover:text-indigo-400 transition-colors">
                    {rule.name}
                  </h4>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase">
                      <Clock className="w-3 h-3" />
                      Runs {rule.trigger}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-400 uppercase italic">
                      <Settings2 className="w-3 h-3" />
                      EXECUTE: {rule.action}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="flex justify-end gap-1 mb-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase text-emerald-500">{rule.successRate}% OK</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase">Last: {rule.lastRun}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-500 hover:text-white transition-all">
                    {rule.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => deleteRule(rule.id)}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-500 hover:text-rose-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Visual Logic Builder Placeholder */}
      <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] mt-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-sm font-black uppercase italic tracking-wider">Scheduled Execution Timeline</span>
          </div>
          <span className="text-[10px] font-black uppercase text-indigo-400/50 tracking-widest italic">Simulation Mode Active</span>
        </div>
        
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div key={day} className="flex-1 space-y-2">
              <div className="h-24 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                {day === 3 && (
                  <div className="absolute inset-0 bg-indigo-500/20 border border-indigo-500/40 p-2 overflow-hidden">
                    <div className="w-1 h-8 bg-indigo-500 rounded-full" />
                  </div>
                )}
                <div className="absolute top-2 right-2 text-[8px] font-black text-slate-700">MAR {17 + day}</div>
              </div>
              <p className="text-[10px] text-center font-black uppercase tracking-tighter text-slate-600">Day {day}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

