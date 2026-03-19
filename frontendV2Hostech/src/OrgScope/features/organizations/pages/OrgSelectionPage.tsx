import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { Building, ArrowRight, Loader2, ShieldCheck, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOrganizations } from '@/adminSystem/features/organizations/hooks/useOrganizations';

export default function OrgSelectionPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // For Admin, we fetch all. For others, we might just show their assigned one.
  const { data: organizations = [], isLoading } = useOrganizations();

  // Filter organizations to only show the one the user belongs to (if not Admin)
  const displayOrgs = user?.role === 'Admin' 
    ? organizations 
    : organizations.filter(org => org.id === user?.org_id);

  const handleOrgClick = (orgId: string) => {
    // For Managers and Staff, if they only have ONE property, jump straight to it.
    if (user?.role === 'Manager' || user?.role === 'Staff') {
      const assigned = user.properties || [];
      if (assigned.length === 1) {
        navigate(`/properties/${assigned[0].id}/dashboard`);
        return;
      }
    }
    
    // Default: go to property selection list
    navigate('/org/properties');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Accessing Infrastructure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full mb-6 border border-indigo-100 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider">Secure Access Point</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Select <span className="text-indigo-600">Organization</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">
            Choose the workspace you want to manage today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {displayOrgs.length > 0 ? (
            displayOrgs.map((org, i) => (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleOrgClick(org.id)}
                className="group bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-indigo-200">
                    <Building className="w-8 h-8" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Status</span>
                    <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold uppercase">Active</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">
                    {org.name}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Globe className="w-4 h-4" />
                    <span className="text-xs font-bold font-mono tracking-wider">{org.code}</span>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between">
                   <div className="flex -space-x-2">
                      {[1, 2, 3].map(j => (
                        <div key={j} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                          {String.fromCharCode(64 + i + j)}
                        </div>
                      ))}
                   </div>
                   <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                      Enter Workspace
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full p-12 bg-white rounded-[2.5rem] border border-slate-200 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Building className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-bold">No organizations found for your account.</p>
              <button 
                onClick={() => navigate('/login')}
                className="text-indigo-600 font-black uppercase tracking-widest text-xs hover:underline"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>

        <div className="mt-16 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
           Unified Management Infrastructure
        </div>
      </div>
    </div>
  );
}
