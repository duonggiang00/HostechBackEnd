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
  onClick,
}: PropertyCardProps) {
  const statusLabels: Record<string, string> = {
    active: 'Đang hoạt động',
    inactive: 'Ngừng hoạt động',
    maintenance: 'Bảo trì',
  };

  const statusStyles: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    inactive: 'bg-white/10 text-slate-400 border-white/15',
    maintenance: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  };

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-emerald-500/35 hover:bg-white/[0.07]"
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition-opacity group-hover:opacity-100" />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 transition-colors group-hover:bg-emerald-500/25">
            <Building2 className="h-6 w-6" />
          </div>
          <span className={`rounded-full border px-2 py-1 text-xs font-bold uppercase tracking-wider ${statusStyles[status]}`}>
            {statusLabels[status] || status}
          </span>
        </div>

        <h3 className="mb-1 text-lg font-bold text-white transition-colors group-hover:text-emerald-300">{name}</h3>
        <p className="mb-6 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          {address}
        </p>

        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400">
              <DoorOpen className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{roomCount}</p>
              <p className="text-xs font-medium uppercase text-slate-500 text-nowrap">Phòng ngủ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{staffCount}</p>
              <p className="text-xs font-medium uppercase text-slate-500 text-nowrap">Nhân sự</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
        <ChevronRight className="h-5 w-5 text-emerald-400" />
      </div>
    </div>
  );
}
