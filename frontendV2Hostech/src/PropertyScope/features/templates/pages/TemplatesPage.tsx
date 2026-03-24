import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Settings, Building2, LayoutGrid } from 'lucide-react';
import { RoomTemplateList } from '../components/RoomTemplateList';
import { BuildingConfig } from '../components/BuildingConfig';
import { motion, AnimatePresence } from 'framer-motion';

export function TemplatesPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [activeTab, setActiveTab] = useState<'building' | 'rooms'>('building');

  if (!propertyId) return null;

  const tabs = [
    { id: 'building', label: 'Cấu hình tòa nhà', icon: Building2 },
    { id: 'rooms', label: 'Mẫu thiết lập phòng', icon: LayoutGrid }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black bg-linear-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Thiết lập tòa nhà
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Quản lý các thông số vận hành và mẫu cấu hình tiêu chuẩn
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl w-fit border border-slate-200/50 dark:border-slate-700/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all relative
              ${activeTab === tab.id 
                ? 'text-white' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}
            `}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-indigo-600 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <tab.icon className={`w-4 h-4 relative z-10 ${activeTab === tab.id ? 'text-white' : ''}`} />
            <span className="relative z-10 uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="relative min-h-[600px]">
        <AnimatePresence mode="wait">
          {activeTab === 'building' ? (
            <motion.div
              key="building"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <BuildingConfig propertyId={propertyId} />
            </motion.div>
          ) : (
            <motion.div
              key="rooms"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <RoomTemplateList propertyId={propertyId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
