import { Edit2, Trash2, Box, Zap, Gauge, Users, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { RoomTemplate } from '../../types';
import { ActionButton } from '@/shared/components/ui/ActionButton';

interface RoomTemplateCardProps {
  template: RoomTemplate;
  onEdit: (template: RoomTemplate) => void;
  onDelete: (id: string) => void;
}

export function RoomTemplateCard({ template, onEdit, onDelete }: RoomTemplateCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] p-6 border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none group hover:shadow-2xl transition-all"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:scale-110 transition-transform">
            <Box className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">
              {template.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                {template.room_type}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <ActionButton
            variant="glass"
            size="sm"
            icon={Edit2}
            label=""
            onClick={() => onEdit(template)}
            className="text-indigo-500 hover:bg-indigo-50"
          />
          <ActionButton
            variant="danger"
            size="sm"
            icon={Trash2}
            label=""
            onClick={() => onDelete(template.id)}
            className="shadow-rose-100 hover:shadow-rose-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <Maximize2 className="w-4 h-4 text-emerald-500" />
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase">Diện tích</p>
            <p className="text-sm font-black text-slate-700 dark:text-slate-200">{template.area} m²</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <Users className="w-4 h-4 text-blue-500" />
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase">Sức chứa</p>
            <p className="text-sm font-black text-slate-700 dark:text-slate-200">{template.capacity} người</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Assets & Meters Summary */}
        <div className="flex flex-wrap gap-2">
          {template.meters?.map((meter, idx) => (
            <div key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
              <Gauge className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tighter">
                {meter.type === 'ELECTRIC' ? 'ĐIỆN' : 'NƯỚC'}
              </span>
            </div>
          ))}
          {template.assets && template.assets.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 rounded-full border border-violet-500/20">
              <Zap className="w-3 h-3 text-violet-500" />
              <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-tighter">
                {template.assets.length} NỘI THẤT
              </span>
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-black text-slate-400 uppercase">Giá thuê mẫu</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
              {template.base_price?.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold text-slate-400 underline decoration-slate-300">đ/tháng</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
