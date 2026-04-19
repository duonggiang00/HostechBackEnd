import { useRoomTemplates } from '../hooks/useTemplates';
import { Layout, Zap, Users, Maximize2, DollarSign } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { RoomTemplate } from '../types/templates.types';

interface RoomTemplateSelectorProps {
  propertyId: string;
  onSelect: (template: RoomTemplate) => void;
  selectedId?: string;
}

export function RoomTemplateSelector({ propertyId, onSelect, selectedId }: RoomTemplateSelectorProps) {
  const { data: templates = [], isLoading } = useRoomTemplates(propertyId);

  if (isLoading) return <div className="animate-pulse h-20 bg-slate-100 rounded-2xl" />;
  if (templates.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Sử dụng mẫu phòng</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md active:scale-[0.98] ${
              selectedId === template.id
                ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-500/10'
                : 'border-slate-100 bg-white hover:border-indigo-200'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-slate-900 dark:text-white truncate pr-2">
                {template.name}
              </span>
              <Layout className={`w-4 h-4 ${selectedId === template.id ? 'text-indigo-600' : 'text-slate-400'}`} />
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
              <div className="flex items-center gap-1">
                <Maximize2 className="w-3 h-3" />
                {formatNumber(template.area)}m²
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {formatNumber(template.capacity)}
              </div>
              <div className="flex items-center gap-1 text-emerald-600">
                <DollarSign className="w-3 h-3" />
                {formatNumber(template.base_price)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
