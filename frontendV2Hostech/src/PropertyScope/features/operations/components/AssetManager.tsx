import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Package, 
  Camera, Info, Edit2, Loader2
} from 'lucide-react';

import type { RoomAsset } from '@/PropertyScope/features/rooms/types';

interface AssetManagerProps {
  propertyId?: string;
  roomId?: string | null;
  data?: RoomAsset[];
  isLoading?: boolean;
}

export default function AssetManager({ roomId, data, isLoading }: AssetManagerProps) {
  const assets = data || [];
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (a.serial && a.serial.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case 'new': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'good': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'fair': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'poor': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  if (!roomId) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
        <Package className="w-12 h-12 mb-4 opacity-20" />
        <p className="font-bold">No Room Selected</p>
        <p className="text-xs font-medium">Select a room on the floor plan to view its assets</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search assets or serials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all text-sm font-medium"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 whitespace-nowrap">
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {filteredAssets.map((asset, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              key={asset.id}
              className="group p-4 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors`}>
                  <Package className="w-6 h-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-black text-slate-900 truncate tracking-tight">{asset.name}</h4>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">
                        <Camera className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2.5 py-0.5 rounded-full border font-bold ${getConditionColor(asset.condition)}`}>
                      {asset.condition}
                    </span>
                    {asset.serial && (
                      <>
                        <span className="text-slate-400 font-medium">•</span>
                        <code className="text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded uppercase">
                          {asset.serial}
                        </code>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAssets.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
            <Package className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold">No assets found matching "{searchTerm}"</p>
            <p className="text-xs font-medium">Try searching for a different item or serial number</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-3xl flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <h5 className="text-sm font-bold text-indigo-900 mb-1">Asset Policy</h5>
          <p className="text-xs text-indigo-700 leading-relaxed font-medium">
            Condition reports are synced with the digital check-in/out explorer. 
            Flagging an item for maintenance will automatically create a high-priority ticket.
          </p>
        </div>
      </div>
    </div>
  );
}
