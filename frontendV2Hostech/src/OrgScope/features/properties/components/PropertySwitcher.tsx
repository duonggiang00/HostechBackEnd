import { useState, useEffect } from 'react';
import { useScopeStore } from '@/shared/stores/useScopeStore';
import { useProperties } from '@/OrgScope/features/properties/hooks/useProperties';
import { Building2, ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

export default function PropertySwitcher() {
  const { propertyId, setPropertyId, organizationId } = useScopeStore();
  const { data: properties = [], isLoading, isError } = useProperties({ 
    'filter[org_id]': organizationId || undefined 
  });
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Handle empty or auto-selection
  useEffect(() => {
    if (!isLoading && properties.length > 0) {
      if (!propertyId || !properties.find(p => p.id === propertyId)) {
        // Auto-select first property if none selected or current not in list
        // Caution: Only auto-select if needed to avoid infinite loops
        // For now, just let the user select.
      }
    }
  }, [isLoading, properties, propertyId]);

  const selectedProperty = properties.find(p => p.id === propertyId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
        <span className="text-xs font-bold text-slate-400">Loading Properties...</span>
      </div>
    );
  }

  if (isError) {
    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-bold">Error loading</span>
        </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors group"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Property</p>
          <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
            {selectedProperty?.name || 'Select Property'}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl shadow-indigo-200/50 border border-slate-100 p-2 z-50"
            >
              <div className="px-3 py-2 border-b border-slate-50 mb-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Scope</p>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 cust-scrollbar">
                {properties.length === 0 && (
                    <div className="p-4 text-center">
                        <p className="text-xs text-slate-400">No properties found.</p>
                    </div>
                )}
                {properties.map((property) => (
                  <button
                    key={property.id}
                    onClick={() => {
                      setPropertyId(property.id);
                      queryClient.invalidateQueries();
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all ${
                      property.id === propertyId 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-xs font-bold">{property.name}</p>
                      <p className="text-[10px] opacity-60 font-medium">{property.address || property.code}</p>
                    </div>
                    {property.id === propertyId && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
