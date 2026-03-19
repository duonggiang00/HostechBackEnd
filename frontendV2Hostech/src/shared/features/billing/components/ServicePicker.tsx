// @ts-nocheck
import { useState, useMemo } from 'react';
import { Check, Info, AlertCircle, Loader2 } from 'lucide-react';
import { useService, type Service } from '@/shared/features/billing/hooks/useService';

interface ServicePickerProps {
  selectedServiceIds: string[];
  onChange: (serviceIds: string[]) => void;
  // Options for overriding prices per room
  servicePrices?: Record<string, number>;
  onPriceChange?: (serviceId: string, customPrice: number) => void;
}

export default function ServicePicker({ 
  selectedServiceIds, 
  onChange,
  servicePrices = {},
  onPriceChange
}: ServicePickerProps) {
  const { useServices } = useService();
  const { data: response, isLoading, error } = useServices({ is_active: true });
  
  // The API returns { data: Service[], ... } or just array based on standard setup
  // Based on useService.ts, response.data might be the array if it's paginated, 
  // or response could be the array itself if there's no wrapper. 
  // Let's handle both.
  const services: Service[] = Array.isArray(response) ? response : response?.data || [];

  const handleToggle = (id: string) => {
    if (selectedServiceIds.includes(id)) {
      onChange(selectedServiceIds.filter(sId => sId !== id));
    } else {
      onChange([...selectedServiceIds, id]);
    }
  };

  const getCalculationLabel = (mode: string) => {
    switch(mode) {
      case 'fixed': return 'Fixed / Month';
      case 'metered': return 'Usage Based';
      case 'tiered': return 'Tiered Pricing';
      case 'per_tenant': return 'Per Person';
      default: return 'Custom';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-sm font-medium">Failed to load services. Please try again.</p>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <p className="text-sm font-bold text-slate-500 mb-1">No Services Available</p>
        <p className="text-xs text-slate-400 font-medium">Add services in settings to make them available here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {services.map((service) => {
        const isSelected = selectedServiceIds.includes(service.id);
        const currentPrice = servicePrices[service.id] !== undefined 
          ? servicePrices[service.id] 
          : service.current_price;

        return (
          <div 
            key={service.id}
            onClick={() => handleToggle(service.id)}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              isSelected 
                ? 'border-indigo-500 bg-indigo-50/30' 
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 border border-slate-200 text-transparent'
                }`}>
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{service.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      {getCalculationLabel(service.calc_mode)}
                    </span>
                    {service.is_recurring && (
                      <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                        Recurring
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right" onClick={e => e.stopPropagation()}>
                {isSelected && onPriceChange && service.calc_mode !== 'tiered' ? (
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <span className="text-sm font-bold text-slate-400">₫</span>
                    <input 
                      type="number" 
                      value={currentPrice}
                      onChange={(e) => onPriceChange(service.id, Number(e.target.value))}
                      className="w-24 px-1 py-1.5 text-sm font-bold text-slate-900 outline-none text-right appearance-none"
                    />
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">/ {service.unit}</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="font-black text-slate-900">
                      {service.calc_mode === 'tiered' ? 'Tiered' : `${currentPrice.toLocaleString()}₫`}
                    </span>
                    {service.calc_mode !== 'tiered' && (
                      <span className="text-xs text-slate-500 font-medium">/ {service.unit}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {service.calc_mode === 'tiered' && isSelected && (
               <div className="mt-3 ml-8 p-3 bg-white rounded-xl border border-slate-100 text-xs text-slate-500 flex items-start gap-2">
                 <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                 <p>Tiered pricing applies automatically based on consumption. Check service settings for tier details.</p>
               </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

