import { useState } from 'react';
import { 
  FileCode2, 
  Plus, 
  Settings2, 
  Eye, 
  Save,
  Variable,
  ChevronRight,
  Info
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  content: string;
  type: 'email' | 'sms' | 'push';
  category: 'billing' | 'maintenance' | 'announcement';
  lastUpdated: string;
}

export default function CommunicationTemplateEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>('1');

  const templates: Template[] = [
    { id: '1', name: 'Billing Reminder (7 Days)', type: 'email', category: 'billing', content: 'Dear {{tenant_name}}, this is a friendly reminder that your monthly invoice for {{property_name}} is due in 7 days.', lastUpdated: '2 hours ago' },
    { id: '2', name: 'Maintenance Notice', type: 'email', category: 'maintenance', content: 'Scheduled maintenance will be performed on {{date}} from {{time_start}} to {{time_end}}.', lastUpdated: '1 day ago' },
    { id: '3', name: 'Late Payment Alert', type: 'sms', category: 'billing', content: 'Urgent: Your payment for {{property_name}} is now overdue. Please settle immediately.', lastUpdated: '3 days ago' },
  ];

  const variables = [
    { key: '{{tenant_name}}', desc: 'Full name of the primary tenant' },
    { key: '{{property_name}}', desc: 'Name of the current property' },
    { key: '{{due_date}}', desc: 'Expiration date of the invoice' },
    { key: '{{total_amount}}', desc: 'Total amount due in currency' },
  ];

  return (
    <div className="grid grid-cols-12 gap-8 h-[750px] bg-slate-900/50 border border-white/5 rounded-5xl overflow-hidden backdrop-blur-xl">
      {/* List Sidebar */}
      <div className="col-span-4 border-r border-white/5 flex flex-col bg-white/1">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase italic text-white tracking-widest">Protocols</h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-xs font-black uppercase text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
            <Plus className="w-3 h-3" /> New
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => setSelectedTemplate(tpl.id)}
              className={`w-full p-6 rounded-3xl text-left transition-all border ${
                selectedTemplate === tpl.id 
                  ? 'bg-white/5 border-white/10' 
                  : 'hover:bg-white/2 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  tpl.type === 'email' ? 'bg-sky-500/10 text-sky-400' : 'bg-purple-500/10 text-purple-400'
                }`}>
                  {tpl.type}
                </span>
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Updated {tpl.lastUpdated}</span>
              </div>
              <h3 className="text-xs font-black uppercase text-white mb-2">{tpl.name}</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{tpl.category} channel</p>
            </button>
          ))}
        </div>
      </div>

      {/* Editor Main */}
      <div className="col-span-8 flex flex-col bg-white/1">
        {selectedTemplate ? (
          <>
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <Settings2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white mb-1">Editing Deployment Logic</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">PROD-ENV-01</span>
                    <ChevronRight className="w-3 h-3 text-slate-700" />
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest italic">Live Template</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
                  <Eye className="w-5 h-5" />
                </button>
                <button className="flex items-center gap-3 px-6 py-3 bg-indigo-600 rounded-2xl text-xs font-black uppercase text-white shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
                  <Save className="w-4 h-4" /> Deploy Changes
                </button>
              </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-[0.2em]">Logic Layer (Content)</label>
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-indigo-400">
                    <Variable className="w-3 h-3" /> Insert Dynamic Token
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-indigo-500/5 blur-2xl group-focus-within:bg-indigo-500/10 transition-all rounded-4xl" />
                  <textarea
                    value={templates.find(t => t.id === selectedTemplate)?.content}
                    readOnly
                    className="relative w-full h-80 bg-slate-950/80 border border-white/5 rounded-4xl p-8 text-xs font-bold leading-relaxed text-slate-300 outline-none focus:border-indigo-500/30 transition-all font-mono shadow-2xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-white/2 border border-white/5 rounded-3xl">
                  <h4 className="text-xs font-black uppercase text-white tracking-widest mb-6 flex items-center gap-2">
                    <Variable className="w-3 h-3 text-indigo-400" /> Schema Definitions
                  </h4>
                  <div className="space-y-4">
                    {variables.map((v) => (
                      <div key={v.key} className="flex items-start justify-between group cursor-help">
                        <div>
                          <code className="text-xs font-bold text-indigo-400">{v.key}</code>
                          <p className="text-[9px] font-bold text-slate-600 uppercase mt-1">{v.desc}</p>
                        </div>
                        <Plus className="w-3 h-3 text-slate-700 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-6 bg-indigo-500/3 border border-indigo-500/10 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-white tracking-widest mb-4 flex items-center gap-2">
                      <Info className="w-3 h-3 text-indigo-400" /> Audit Guidance
                    </h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                      Changes to billing templates are audited for compliance under IFRS-15 standards. Ensure all variable tokens are properly escaped to prevent injection vulnerabilities.
                    </p>
                  </div>
                  <button className="flex items-center justify-center gap-2 w-full py-3 border border-white/5 bg-white/5 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:text-white transition-all">
                    View Version History <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center text-slate-700 mb-6">
              <FileCode2 className="w-10 h-10" />
            </div>
            <p className="text-xs font-black uppercase text-slate-600 tracking-widest">Select a protocol to edit</p>
          </div>
        )}
      </div>
    </div>
  );
}
