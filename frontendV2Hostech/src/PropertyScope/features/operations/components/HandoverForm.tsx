import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, X, Plus, Trash2, 
  Package, Droplets, Zap, Info,
  ClipboardList,
  Camera, Activity, Loader2
} from 'lucide-react';
import { useHandover } from '@/shared/features/operations/hooks/useHandover';

export default function HandoverForm({ 
  onClose, 
  roomId, 
  contractId, 
  type = 'check_in' 
}: { 
  onClose: () => void, 
  roomId?: string, 
  contractId?: string,
  type?: 'check_in' | 'check_out'
}) {
  const { createHandover } = useHandover();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    room_id: roomId || '',
    contract_id: contractId || '',
    type: type,
    handover_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [
      { name: 'Key Set', condition: 'good' as const, notes: '' },
      { name: 'Air Conditioner', condition: 'good' as const, notes: '' },
      { name: 'Bed & Mattress', condition: 'good' as const, notes: '' }
    ],
    snapshots: [
      { meter_type: 'Electricity', reading_value: '' as any, unit: 'kWh' },
      { meter_type: 'Water', reading_value: '' as any, unit: 'm3' }
    ]
  });

  const handleSave = async () => {
    try {
      await createHandover.mutateAsync(formData);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Record Room Inspection</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Step {step} of 3 • {formData.type.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Inspection Date</label>
                    <input 
                      type="date" 
                      value={formData.handover_date}
                      onChange={(e) => setFormData({ ...formData, handover_date: e.target.value })}
                      className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none font-bold text-sm bg-slate-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Inspection Type</label>
                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                      <button 
                        onClick={() => setFormData({ ...formData, type: 'check_in' })}
                        className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.type === 'check_in' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >Check-in</button>
                      <button 
                         onClick={() => setFormData({ ...formData, type: 'check_out' })}
                        className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.type === 'check_out' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >Check-out</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">General Notes</label>
                  <textarea 
                    placeholder="Describe overall room condition..."
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-5 py-4 rounded-3xl border border-slate-200 focus:border-indigo-500 outline-none font-medium text-sm bg-slate-50/50 resize-none"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-500" />
                    Asset Checklist
                  </h3>
                  <button 
                    onClick={() => setFormData({ 
                      ...formData, 
                      items: [...formData.items, { name: '', condition: 'good', notes: '' }] 
                    })}
                    className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Asset
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4 group">
                      <div className="flex-1">
                        <input 
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const newItems = [...formData.items];
                            newItems[idx].name = e.target.value;
                            setFormData({ ...formData, items: newItems });
                          }}
                          placeholder="Asset name (e.g. Fridge)"
                          className="w-full bg-transparent border-none outline-none font-bold text-sm placeholder:text-slate-300"
                        />
                      </div>
                      <select 
                        value={item.condition}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[idx].condition = e.target.value as any;
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-widest text-slate-600 outline-none"
                      >
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                        <option value="broken">Broken</option>
                      </select>
                      <button 
                        onClick={() => {
                          const newItems = formData.items.filter((_, i) => i !== idx);
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-500" />
                    Meter Snapshots
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {formData.snapshots.map((snap, idx) => (
                      <div key={idx} className="p-6 bg-slate-900 rounded-4xl text-white flex items-center justify-between border border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-all group-hover:bg-white/10" />
                        <div className="flex items-center gap-4 relative">
                          <div className={`p-3 rounded-2xl ${snap.meter_type === 'Electricity' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {snap.meter_type === 'Electricity' ? <Zap className="w-6 h-6" /> : <Droplets className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-white/40 uppercase tracking-widest">{snap.meter_type}</p>
                            <div className="flex items-baseline gap-2">
                              <input 
                                type="number"
                                placeholder="000.0"
                                value={snap.reading_value}
                                onChange={(e) => {
                                  const newSnaps = [...formData.snapshots];
                                  newSnaps[idx].reading_value = e.target.value;
                                  setFormData({ ...formData, snapshots: newSnaps });
                                }}
                                className="bg-transparent border-none outline-none font-black text-3xl w-24 placeholder:text-white/10"
                              />
                              <span className="text-xs font-black text-white/50">{snap.unit}</span>
                            </div>
                          </div>
                        </div>
                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-white/60">
                          <Camera className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-start gap-4">
                  <div className="p-2 bg-indigo-600 rounded-xl text-white">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-1">Confirmation Required</p>
                    <p className="text-[11px] text-indigo-600 font-medium leading-relaxed">By saving this inspection, you are recording the definitive state of the property. This data will be used for deposit reconciliation.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex gap-2">
            {[1,2,3].map(i => (
              <div key={i} className={`w-8 h-1.5 rounded-full transition-all ${step === i ? 'bg-indigo-600 w-12' : 'bg-slate-200'}`} />
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
              >Back</button>
            )}
            {step < 3 ? (
              <button 
                onClick={() => setStep(step + 1)}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center gap-2"
              >Next Step <ChevronRight className="w-3 h-3" /></button>
            ) : (
              <button 
                onClick={handleSave}
                disabled={createHandover.status === 'pending'}
                className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {createHandover.status === 'pending' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save Inspection
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="9 5l7 7-7 7" /></svg>;
}
