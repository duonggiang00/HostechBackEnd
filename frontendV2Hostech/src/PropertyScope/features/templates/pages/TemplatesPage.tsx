import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Home, Zap, FileText } from 'lucide-react';
import { RoomTemplateList } from '../components/RoomTemplateList';
import { ServiceTemplateList } from '../components/ServiceTemplateList';
import { ContractTemplateList } from '../components/ContractTemplateList';

export function TemplatesPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [activeTab, setActiveTab] = useState<'room' | 'service' | 'contract'>('room');

  if (!propertyId) return null;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-linear-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            Cấu hình hệ thống
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý các mẫu cấu hình tiêu chuẩn cho khu trọ của bạn
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('room')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'room'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Home className="w-4 h-4" />
            Mẫu Phòng
          </button>
          <button
            onClick={() => setActiveTab('service')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'service'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Zap className="w-4 h-4" />
            Mẫu Dịch Vụ
          </button>
          <button
            onClick={() => setActiveTab('contract')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'contract'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Mẫu Hợp Đồng
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'room' && (
              <motion.div
                key="room"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <RoomTemplateList propertyId={propertyId} />
              </motion.div>
            )}
            {activeTab === 'service' && (
              <motion.div
                key="service"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ServiceTemplateList propertyId={propertyId} />
              </motion.div>
            )}
            {activeTab === 'contract' && (
              <motion.div
                key="contract"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ContractTemplateList propertyId={propertyId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
