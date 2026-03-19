import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  Wrench, 
  UserCheck, 
  AlertCircle,
  MessageSquare,
  FileText
} from 'lucide-react';

type TicketStatus = 'REPORTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED';

interface TimelineStep {
  status: TicketStatus;
  label: string;
  date: string;
  description: string;
  icon: any;
  color: string;
}

const steps: TimelineStep[] = [
  {
    status: 'REPORTED',
    label: 'Issue Reported',
    date: 'Oct 12, 10:45 AM',
    description: 'Electrical sparking reported in Bedroom 2 ceiling fan.',
    icon: Clock,
    color: 'emerald'
  },
  {
    status: 'ASSIGNED',
    label: 'Staff Assigned',
    date: 'Oct 12, 11:15 AM',
    description: 'Technician Nguyen Van A assigned to the task.',
    icon: UserCheck,
    color: 'emerald'
  },
  {
    status: 'IN_PROGRESS',
    label: 'Under Repair',
    date: 'Oct 12, 02:30 PM',
    description: 'Technician is on-site. Replacing capacitor and wiring.',
    icon: Wrench,
    color: 'amber'
  },
  {
    status: 'RESOLVED',
    label: 'Resolved',
    date: 'Pending',
    description: 'Technician will mark as resolved once testing is complete.',
    icon: CheckCircle2,
    color: 'slate'
  },
  {
    status: 'VERIFIED',
    label: 'Verified by Tenant',
    date: 'Pending',
    description: 'Confirmation required from tenant side.',
    icon: Shield,
    color: 'slate'
  }
];

import { Shield } from 'lucide-react'; // Fix missing import

export default function TicketTimeline() {
  const currentStatus: TicketStatus = 'IN_PROGRESS';

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Maintenance Track</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Ticket #TK-99284 • Priority: High</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
            <MessageSquare className="w-5 h-5" />
          </button>
          <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
            <FileText className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-0 relative">
        {/* Connection Line */}
        <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-white/10" />

        {steps.map((step, idx) => {
          const isCompleted = idx <= steps.findIndex(s => s.status === currentStatus);
          const isCurrent = step.status === currentStatus;

          return (
            <motion.div 
              key={step.status}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative pl-16 pb-12 last:pb-0 group`}
            >
              {/* Node */}
              <div className={`absolute left-0 top-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 z-10 ${
                isCurrent 
                  ? 'bg-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.4)] scale-110' 
                  : isCompleted 
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-500' 
                    : 'bg-white/5 border border-white/10 text-slate-600'
              }`}>
                <step.icon className={`w-5 h-5 ${isCurrent ? 'text-white' : ''}`} />
              </div>

              {/* Progress Line Overlay */}
              {isCompleted && idx < steps.length - 1 && (
                <div className="absolute left-[23px] top-12 h-full w-0.5 bg-emerald-500/30" />
              )}

              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-black uppercase italic tracking-wider ${
                    isCurrent ? 'text-amber-500' : isCompleted ? 'text-emerald-500' : 'text-slate-500'
                  }`}>
                    {step.label}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">
                    {step.date}
                  </span>
                </div>
                <p className={`mt-2 text-sm leading-relaxed ${
                  isCurrent ? 'text-white' : 'text-slate-400'
                }`}>
                  {step.description}
                </p>
                {isCurrent && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-4 items-center"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Action Required</p>
                      <p className="text-xs text-amber-200/70 mt-0.5 font-medium">Please avoid using the room until technician finishes.</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
