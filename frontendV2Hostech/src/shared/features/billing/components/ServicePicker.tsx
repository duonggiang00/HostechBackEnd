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
  const { data: response, isLoading, error } = useServices({ 'filter[is_active]': 1, per_page: 100 });
  
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
      case 'fixed':
      case 'PER_MONTH':
      case 'PER_ROOM': return 'Fixed / Month';
      case 'metered':
      case 'PER_METER': return 'Usage Based';
      case 'tiered': return 'Tiered Pricing';
      case 'per_tenant':
      case 'PER_TENANT': return 'Per Person';
      case 'PER_QUANTITY': return 'Per Quantity';
      default: return 'Custom';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-800/50 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-sm font-medium">Failed to load services. Please try again.</p>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">No Services Available</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Add services in settings to make them available here.</p>
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
                ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10' 
                : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-transparent'
                }`}>
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{service.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                      {getCalculationLabel(service.calc_mode)}
                    </span>
                    {service.is_recurring && (
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                        Recurring
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right" onClick={e => e.stopPropagation()}>
                {isSelected && onPriceChange && service.calc_mode !== 'tiered' ? (
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <span className="text-sm font-bold text-slate-400">₫</span>
                    <input 
                      type="number" 
                      value={currentPrice}
                      onChange={(e) => onPriceChange(service.id, Number(e.target.value))}
                      className="w-24 px-1 py-1.5 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none text-right appearance-none bg-transparent"
                    />
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">/ {service.unit}</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="font-black text-slate-900 dark:text-slate-100">
                      {service.calc_mode === 'tiered' ? 'Tiered' : `${(currentPrice ?? 0).toLocaleString()}₫`}
                    </span>
                    {service.calc_mode !== 'tiered' && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ {service.unit}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {service.calc_mode === 'tiered' && isSelected && (
               <div className="mt-3 ml-8 p-3 bg-white dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
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

