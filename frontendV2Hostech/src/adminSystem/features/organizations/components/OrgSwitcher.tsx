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
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
        <span className="text-xs font-bold text-slate-400">Loading Orgs...</span>
      </div>
    );
  }

  // Only show if there are organizations
  if (organizations.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors group"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-100">
          <Globe className="w-4 h-4" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Organization</p>
          <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
            {selectedOrg?.name || 'Global View'}
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
              className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl shadow-emerald-200/50 border border-slate-100 p-2 z-50"
            >
              <div className="px-3 py-2 border-b border-slate-50 mb-1">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Organization</p>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 cust-scrollbar">
                <button
                  onClick={() => {
                    navigate('/system/dashboard');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all ${
                    !organizationId 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-xs font-bold">Show All (Admin)</span>
                  {!organizationId && <Check className="w-4 h-4" />}
                </button>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      // Navigate to the system view of this organization (when implemented in the future)
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all ${
                      org.id === organizationId 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-xs font-bold">{org.name}</p>
                      <p className="text-xs opacity-60 font-medium">{org.code}</p>
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
