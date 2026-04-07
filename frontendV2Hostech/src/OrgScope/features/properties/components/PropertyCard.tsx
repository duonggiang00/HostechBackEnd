import { Building2, MapPin, Users, ChevronRight, DoorOpen } from 'lucide-react';

interface PropertyCardProps {
  name: string;
  address: string;
  roomCount: number;
  staffCount: number;
  status: 'active' | 'inactive' | 'maintenance';
  onClick: () => void;
}

export default function PropertyCard({ 
  name, 
  address, 
  roomCount, 
  staffCount, 
  status,
  onClick 
}: PropertyCardProps) {
  const statusLabels: Record<string, string> = {
    active: 'Đang hoạt động',
    inactive: 'Ngừng hoạt động',
    maintenance: 'Bảo trì',
  };

  const statusStyles: Record<string, string> = {
    active: 'bg-green-100 text-green-700 border-green-200',
    inactive: 'bg-slate-100 text-slate-700 border-slate-200',
    maintenance: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Decorative Gradient Blob */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-50 rounded-full blur-2xl group-hover:bg-indigo-100 transition-colors" />
      
      <div className="relative">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <Building2 className="w-6 h-6" />
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${statusStyles[status]}`}>
            {statusLabels[status] || status}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
          {name}
        </h3>
        <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-6">
          <MapPin className="w-3.5 h-3.5" />
          {address}
        </p>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
              <DoorOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{roomCount}</p>
              <p className="text-xs text-slate-500 uppercase font-medium text-nowrap">Phòng ngủ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{staffCount}</p>
              <p className="text-xs text-slate-500 uppercase font-medium text-nowrap">Nhân sự</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
        <ChevronRight className="w-5 h-5 text-indigo-600" />
      </div>
    </div>
  );
}

