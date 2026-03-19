import { Wand2, Files, Calculator, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InvoiceGenerator() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        
        <div className="relative z-10 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Wand2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Mass Billing Generator</h2>
          <p className="text-slate-400 font-medium max-w-md mx-auto">Generate hundreds of invoices for all active properties with a single dynamic execution pass.</p>
          
          <div className="flex items-center justify-center gap-4 pt-4">
            <button className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
              Execute Generation Pass <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Smart Sync', desc: 'Sync meter readings automatically', icon: Zap },
          { title: 'Template Engine', desc: 'Apply custom branding to PDF', icon: Files },
          { title: 'Auto Tax', desc: 'Calculate VAT/GST by region', icon: Calculator },
        ].map((feat, i) => (
          <div key={i} className="bg-white/5 border border-white/5 rounded-[2rem] p-8 hover:border-white/20 transition-all group">
             <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
               <feat.icon className="w-5 h-5 text-emerald-500" />
             </div>
             <h3 className="text-sm font-black text-white uppercase tracking-widest">{feat.title}</h3>
             <p className="text-xs text-slate-500 font-medium mt-2">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
