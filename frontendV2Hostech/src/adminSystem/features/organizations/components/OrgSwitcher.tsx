import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrganizations } from '@/adminSystem/features/organizations/hooks/useOrganizations';
import { Globe, ChevronDown, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrgSwitcher() {
  const { orgId } = useParams<{ orgId?: string }>();
  const navigate = useNavigate();
  const organizationId = orgId || null;

  const { data: organizations = [], isLoading } = useOrganizations();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOrg = organizations.find(o => o.id === organizationId);

  if (isLoading) {
    return (
      <div className="flex w-full items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-3.5 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.06)] dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-none">
        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
        <span className="text-xs font-bold text-slate-400">Loading Orgs...</span>
      </div>
    );
  }

  // Only show if there are organizations
  if (organizations.length === 0) return null;

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/80 px-3.5 py-3 text-left shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-all duration-200 hover:border-emerald-100 hover:bg-white dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-none dark:hover:border-slate-700 dark:hover:bg-slate-900"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-[0_12px_24px_rgba(16,185,129,0.22)] dark:shadow-none">
            <Globe className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-left">
            <p className="mb-1 text-[10px] font-bold uppercase leading-none tracking-[0.18em] text-slate-400">Organization</p>
            <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">
              {selectedOrg?.name || 'Global View'}
            </p>
            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {selectedOrg?.code || 'System scope'}
            </p>
          </div>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100/80 text-slate-400 dark:bg-white/5 dark:text-slate-500">
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Select Organization</p>
              </div>
              <div className="cust-scrollbar max-h-60 space-y-0.5 overflow-y-auto">
                <button
                  onClick={() => {
                    navigate('/system/dashboard');
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                    !organizationId 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <span className="text-[13px] font-semibold">Show All (Admin)</span>
                  {!organizationId && <Check className="w-4 h-4" />}
                </button>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      // Navigate to the system view of this organization (when implemented in the future)
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                      org.id === organizationId 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-[13px] font-semibold">{org.name}</p>
                      <p className="text-[11px] font-medium opacity-60">{org.code}</p>
                    </div>
                    {org.id === organizationId && <Check className="w-4 h-4" />}
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
