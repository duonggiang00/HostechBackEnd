import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/features/auth/hooks/useAuth';
import { useProperties } from '@/OrgScope/features/properties/hooks/useProperties';
import { Building2, ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PropertySwitcher() {
  const { propertyId } = useParams<{ propertyId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const organizationId = user?.org_id;

  const { data: properties = [], isLoading, isError } = useProperties({ 
    'filter[org_id]': organizationId || undefined 
  });
  const [isOpen, setIsOpen] = useState(false);

  const selectedProperty = properties.find(p => p.id === propertyId);

  if (isLoading) {
    return (
      <div className="flex w-full items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-3.5 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.06)] dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-none">
        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
        <span className="text-xs font-bold text-slate-400">Loading Properties...</span>
      </div>
    );
  }

  if (isError) {
    return (
        <div className="flex w-full items-center gap-2.5 rounded-2xl border border-rose-100 bg-rose-50/90 px-3.5 py-3 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-bold">Error loading</span>
        </div>
    )
  }

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/80 px-3.5 py-3 text-left shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-all duration-200 hover:border-brand-100 hover:bg-white dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-none dark:hover:border-slate-700 dark:hover:bg-slate-900"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-[0_12px_24px_rgba(99,102,241,0.24)] dark:bg-brand-500 dark:shadow-none">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-left">
            <p className="mb-1 text-[10px] font-bold uppercase leading-none tracking-[0.18em] text-slate-400">Active Property</p>
            <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">
              {selectedProperty?.name || 'Select Property'}
            </p>
            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {selectedProperty?.address || selectedProperty?.code || 'Switch scope'}
            </p>
          </div>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100/80 text-slate-400 dark:bg-white/5 dark:text-slate-500">
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 top-full z-50 mt-2 w-full min-w-[16rem] rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
            >
              <div className="mb-1 border-b border-slate-100 px-3 py-2 dark:border-slate-800/60">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Select Scope</p>
              </div>
              <div className="cust-scrollbar max-h-60 space-y-0.5 overflow-y-auto">
                {properties.length === 0 && (
                    <div className="p-4 text-center">
                        <p className="text-xs text-slate-400">No properties found.</p>
                    </div>
                )}
                {properties.map((property) => (
                  <button
                    key={property.id}
                    onClick={() => {
                      if (propertyId && location.pathname.includes(`/properties/${propertyId}/`)) {
                        const relativePath = location.pathname.split(`/properties/${propertyId}/`)[1] || 'dashboard';
                        navigate(`/properties/${property.id}/${relativePath}`);
                      } else {
                        navigate(`/properties/${property.id}/dashboard`);
                      }
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                      property.id === propertyId 
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-[13px] font-semibold">{property.name}</p>
                      <p className="text-[11px] font-medium opacity-60">{property.address || property.code}</p>
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
