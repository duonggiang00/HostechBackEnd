import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, Box, LayoutGrid, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { roomTemplatesApi } from '../../api/roomTemplatesApi';
import type { RoomTemplate } from '../../types';
import { formatNumber } from '@/lib/utils';

interface RoomTemplateSelectProps {
  propertyId: string;
  onSelect: (template: RoomTemplate) => void;
  selectedId?: string;
}

export function RoomTemplateSelect({ propertyId, onSelect, selectedId }: RoomTemplateSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['room-templates', propertyId],
    queryFn: () => roomTemplatesApi.getTemplates(propertyId),
  });

  const selectedTemplate = templates.find(t => t.id === selectedId);

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Sử dụng mẫu cấu hình</label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none hover:border-indigo-500 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500/10 rounded-xl group-hover:scale-110 transition-transform">
            <LayoutGrid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          {selectedTemplate ? (
            <div className="text-left">
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {selectedTemplate.name}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {selectedTemplate.area} m² • {formatNumber(selectedTemplate.base_price)}đ
              </p>
            </div>
          ) : (
            <span className="text-sm font-bold text-slate-400 italic">Chọn một mẫu để áp dụng nhanh...</span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-60" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 right-0 top-full mt-3 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700/50 z-70 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-50 dark:border-slate-700/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm mẫu..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-indigo-500 rounded-xl text-sm font-bold outline-none transition-all"
                  />
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                {isLoading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto pb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải...</p>
                  </div>
                ) : filteredTemplates.length > 0 ? (
                  <div className="space-y-1">
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => {
                          onSelect(template);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group ${selectedId === template.id ? 'bg-indigo-500/5 border border-indigo-500/20' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg transition-colors ${selectedId === template.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-500'}`}>
                            <Box className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{template.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              {template.area} m²
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900 dark:text-white">{template.area} m²</p>
                          <p className="text-[10px] font-bold text-emerald-500">{formatNumber(template.base_price)}đ</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs font-bold italic lowercase tracking-wider">
                    Không tìm thấy mẫu nào
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
