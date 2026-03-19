import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Droplets, Home, Settings, Plus, Trash2, 
  ChevronRight, Save, DollarSign, Calculator,
  TrendingUp, BarChart3, Receipt, Loader2
} from 'lucide-react';
import { useService } from '@/shared/features/billing/hooks/useService';
import type { Service } from '@/shared/features/billing/hooks/useService';

const CATEGORY_ICONS: Record<string, any> = {
  rent: Home,
  utility: Zap,
  water: Droplets,
  service: Settings,
};

export default function ServiceCatalog() {
  const { useServices } = useService();
  const { data: response, isLoading } = useServices();
  const services = (response?.data || []) as Service[];
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const getIcon = (service: Service) => {
    if (service.code.toLowerCase().includes('dien')) return Zap;
    if (service.code.toLowerCase().includes('nuoc')) return Droplets;
    return CATEGORY_ICONS[service.calc_mode] || Settings;
  };

  return (
    <div className="flex bg-[#0A0A0B] text-white rounded-xl border border-white/10 overflow-hidden h-[600px]">
      {/* Services List Sidebar */}
      <div className="w-1/3 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            Service Catalog
          </h3>
          <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : services.map((service) => {
            const Icon = getIcon(service);
            return (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
                  selectedService?.id === service.id 
                    ? 'bg-emerald-500/10 border border-emerald-500/30' 
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  selectedService?.id === service.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="font-medium truncate">{service.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    {service.calc_mode === 'tiered' ? (
                      <BarChart3 className="w-3 h-3" />
                    ) : (
                      <DollarSign className="w-3 h-3" />
                    )}
                    {Number(service.current_price).toLocaleString()}đ / {service.unit}
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${
                  selectedService?.id === service.id ? 'text-emerald-400 translate-x-1' : 'text-slate-600'
                }`} />
              </button>
            );
          })}
      </div>

      {/* Editor Surface */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent_40%)]">
        <AnimatePresence mode="wait">
          {selectedService ? (
            <motion.div
              key={selectedService.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col p-8"
            >
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      {(() => { const Icon = getIcon(selectedService); return <Icon className="w-8 h-8" />; })()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedService.name}</h2>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 uppercase tracking-wider">
                        {selectedService.code}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-400 max-w-md">Configuration for {selectedService.name} billing and rates.</p>
                </div>

                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all border border-white/10">
                    Duplicate
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Configuration
                    </h4>
                    
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400">Calculation Mode</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['fixed', 'meterer', 'tiered'].map((mode) => (
                          <button
                            key={mode}
                            className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                              selectedService.calc_mode === mode 
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                            }`}
                          >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-slate-400">Base Price (VND)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            defaultValue={selectedService.current_price}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors"
                          />
                          <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-slate-400">Per Unit</label>
                        <input 
                          type="text" 
                          defaultValue={selectedService.unit}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {selectedService.calc_mode === 'tiered' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Pricing Tiers
                    </h4>
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-white/5 text-slate-400 font-medium">
                            <th className="px-4 py-3 text-left">From</th>
                            <th className="px-4 py-3 text-left">To</th>
                            <th className="px-4 py-3 text-left">Price</th>
                            <th className="px-4 py-3 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {/* We need to load tiered rates from the current active rate */}
                          {(selectedService as any).current_rate?.tiered_rates?.map((tier: any) => (
                            <tr key={tier.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3">{tier.tier_from}</td>
                              <td className="px-4 py-3">{tier.tier_to || '∞'}</td>
                              <td className="px-4 py-3 text-emerald-400 font-semibold">{Number(tier.price).toLocaleString()}đ</td>
                              <td className="px-4 py-3 text-right">
                                <button className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button className="w-full py-3 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-medium border-t border-white/10">
                        + Add Tier
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 space-y-4">
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 animate-pulse">
                <Receipt className="w-16 h-16 opacity-20" />
              </div>
              <div className="text-center">
                <h4 className="text-lg font-medium text-slate-400">Select a Service</h4>
                <p className="text-sm max-w-[200px]">Configure pricing, calculation modes, and tiers for billing.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
