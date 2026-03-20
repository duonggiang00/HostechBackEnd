import React from 'react';


import { Search, Filter, Trash2, LayoutGrid } from 'lucide-react';

import { motion } from 'framer-motion';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

interface ContractFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string | 'all';
  onStatusChange: (status: any) => void;
  isTrashView: boolean;
  onViewChange: (value: boolean) => void;
}

export const ContractFilterBar: React.FC<ContractFilterBarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  isTrashView,
  onViewChange,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 mb-10 p-2 rounded-[2rem] bg-white/40 backdrop-blur-xl border border-white/40 shadow-2xl shadow-indigo-500/5"
    >
      <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-4 p-1">
        <div className="relative group max-w-md w-full">
          <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-xl group-focus-within:bg-indigo-500/10 transition-all duration-500" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
          <Input
            placeholder="Tìm theo tên khách, số điện thoại..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="relative pl-11 h-14 bg-white/80 border-slate-100 rounded-2xl focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500/50 transition-all font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium shadow-sm hover:shadow-md z-10"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-4 h-14 rounded-2xl bg-white/60 border border-white/40 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Lọc theo</span>
          </div>
          <Select
            value={status}
            onValueChange={onStatusChange}
          >
            <SelectTrigger className="w-full sm:w-[240px] h-14 bg-white/80 border-slate-100 rounded-2xl focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-slate-700 shadow-sm hover:shadow-md hover:border-indigo-100 group">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <SelectValue placeholder="Tất cả trạng thái" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 p-2 shadow-2xl backdrop-blur-xl bg-white/95">
              <SelectItem value="all" className="rounded-xl font-bold py-3">Tất cả trạng thái</SelectItem>
              <SelectItem value="DRAFT" className="rounded-xl font-bold py-3">Bản nháp</SelectItem>
              <SelectItem value="PENDING_SIGNATURE" className="rounded-xl font-bold py-3 text-amber-600">Chờ ký</SelectItem>
              <SelectItem value="ACTIVE" className="rounded-xl font-bold py-3 text-emerald-600">Đang hiệu lực</SelectItem>
              <SelectItem value="ENDED" className="rounded-xl font-bold py-3 text-rose-600">Đã kết thúc</SelectItem>
              <SelectItem value="CANCELLED" className="rounded-xl font-bold py-3 text-slate-500">Đã huỷ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/5 border border-white/20 backdrop-blur-sm self-end lg:self-auto shadow-inner">
        {[
          { icon: LayoutGrid, label: 'Hoạt động', value: false, activeColor: 'bg-white text-indigo-600', iconColor: 'text-indigo-500' },
          { icon: Trash2, label: 'Thùng rác', value: true, activeColor: 'bg-white text-rose-600', iconColor: 'text-rose-500' }
        ].map((item) => (
          <motion.button
            key={item.label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewChange(item.value)}
            className={`relative flex items-center gap-2.5 px-6 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all z-10 ${
              isTrashView === item.value 
                ? item.activeColor + ' shadow-lg shadow-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            {isTrashView === item.value && (
              <motion.div
                layoutId="active-view-bg"
                className="absolute inset-0 rounded-xl bg-white z-[-1]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <item.icon className={`h-4 w-4 ${isTrashView === item.value ? item.iconColor : 'text-slate-400'}`} />
            {item.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

