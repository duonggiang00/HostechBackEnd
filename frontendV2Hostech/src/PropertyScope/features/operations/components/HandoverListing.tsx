import { motion } from 'framer-motion';
import { 
  ClipboardCheck, Search, Plus, Filter, 
  Calendar, User, Home, ArrowRight,
  AlertCircle, CheckCircle2,
  Package, Droplets, Zap
} from 'lucide-react';
import { useHandover } from '@/shared/features/operations/hooks/useHandover';
import { useState } from 'react';
import HandoverForm from './HandoverForm';

export default function HandoverListing() {
  const [showForm, setShowForm] = useState(false);
  const { useHandovers } = useHandover();
  const { data: response, isLoading } = useHandovers();
  const handovers = response?.data || [];

  return (
    <div className="space-y-6 bg-slate-50/50 p-6 rounded-3xl min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight text-white">Handover & Inspection</h1>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest pl-11">Room State & Asset Audit</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search room or contract..."
              className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-indigo-500 transition-all w-64 font-medium"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Record Handover
          </button>
        </div>
      </div>

      {showForm && (
        <HandoverForm onClose={() => setShowForm(false)} />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 bg-white/50 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {handovers.map((item: any) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex items-center justify-between mb-6 relative">
                <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                  item.type === 'check_in' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {item.type.replace('_', ' ')}
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest ${
                  item.status === 'confirmed' ? 'text-indigo-600' : 'text-amber-600'
                }`}>
                  {item.status === 'confirmed' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {item.status}
                </div>
              </div>

              <div className="space-y-4 mb-6 relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Room {item.room?.number || 'N/A'}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase">{item.property?.name || 'Main Property'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 pl-1 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.handover_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    {item.contract?.tenant?.name || 'No Tenant'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-100 relative">
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Checklist</p>
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-3 h-3 text-indigo-400" />
                    {item.items_count || 0} Assets
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Meter Caps</p>
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <Droplets className="w-3 h-3 text-blue-400" />
                  </div>
                </div>
              </div>

              <button className="absolute bottom-4 right-4 w-10 h-10 bg-slate-900 rounded-xl text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-[-4px] transition-all shadow-lg active:scale-95">
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
