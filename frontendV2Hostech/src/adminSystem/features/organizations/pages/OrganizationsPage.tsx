import { useOrganizations } from '@/adminSystem/features/organizations/hooks/useOrganizations';
import { useNavigate } from 'react-router-dom';
import OrganizationCard from '@/adminSystem/features/organizations/components/OrganizationCard';
import { Plus, Loader2, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrganizationsPage() {
  const { data: organizations, isLoading, error } = useOrganizations();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-3xl m-8">
        <h3 className="text-xl font-bold mb-2">Error Loading Organizations</h3>
        <p>Something went wrong while fetching organization data.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Organizations</h1>
          <p className="text-slate-500 font-medium mt-1">Manage corporate entities and their property portfolios.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          Add Organization
        </button>
      </div>

      {!organizations?.length ? (
        <div className="p-20 text-center bg-white border border-slate-200 rounded-[3rem] shadow-xl shadow-slate-200/50">
           <Info className="w-16 h-16 text-slate-200 mx-auto mb-4" />
           <h3 className="text-xl font-bold text-slate-900">No Organizations Found</h3>
           <p className="text-slate-500 mt-2">Get started by creating your first organization.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {organizations.map((org, i) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <OrganizationCard 
                name={org.name}
                code={org.code}
                propertyCount={0}
                onClick={() => navigate(`/admin/organizations/${org.id}/properties`)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
