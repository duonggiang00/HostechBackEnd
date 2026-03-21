import { Building, ChevronRight, Layers } from 'lucide-react';

interface OrganizationCardProps {
  name: string;
  code: string;
  propertyCount?: number;
  onClick: () => void;
}

export default function OrganizationCard({ name, code, propertyCount, onClick }: OrganizationCardProps) {
  return (
    <div 
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-4xl p-6 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
          <Building className="w-7 h-7" />
        </div>
        <div className="text-right">
            <span className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-1">Org Code</span>
            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{code}</span>
        </div>
      </div>

      <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
        {name}
      </h3>
      
      <div className="flex items-center gap-4 py-4 border-t border-slate-100 mt-4">
        <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-700">{propertyCount || 0} <span className="text-slate-400 font-medium">Properties</span></span>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all text-indigo-600">
        <ChevronRight className="w-6 h-6" />
      </div>
    </div>
  );
}
