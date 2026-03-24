import { useEffect } from 'react';
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

  // Auto-redirect if only one organization exists and user is not Admin
  useEffect(() => {
    if (!isLoading && user?.role !== 'Admin' && displayOrgs.length === 1) {
      handleOrgClick(displayOrgs[0].id);
    }
  }, [isLoading, displayOrgs, user?.role]);

  const handleOrgClick = (orgId: string) => {
    // 1. For Admin, go to specific organization properties
    if (user?.role === 'Admin') {
      navigate(`/org/organizations/${orgId}/properties`);
      return;
    }

    // 2. For Managers and Staff, if they only have ONE property, jump straight to it.
    if (user?.role === 'Manager' || user?.role === 'Staff') {
      const assigned = user.properties || [];
      if (assigned.length === 1) {
        navigate(`/properties/${assigned[0].id}/dashboard`);
        return;
      }
    }
    
    // 3. Default: go to property selection list
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
    <div className="w-full max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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
                  <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
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

              <div className="mt-10 flex items-center justify-between">
                 <div className="flex -space-x-2.5">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
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
          <div className="col-span-full p-16 bg-white rounded-[2.5rem] border border-slate-200 text-center space-y-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Building className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">No organizations found</h3>
              <p className="text-slate-500">Your account is not associated with any active organizations.</p>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-full font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
