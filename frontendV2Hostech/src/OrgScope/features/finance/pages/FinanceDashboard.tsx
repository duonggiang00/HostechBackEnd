import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Receipt, Wallet, 
  Settings, ChevronRight, LayoutDashboard,
  Printer, X
} from 'lucide-react';

// Import local components
import FinancialOverview from '@/OrgScope/features/finance/components/FinancialOverview';
import InvoiceGenerator from '@/OrgScope/features/finance/components/InvoiceGenerator';
import PaymentAllocationEngine from '@/OrgScope/features/finance/components/PaymentAllocationEngine';
import ServiceCatalog from '@/PropertyScope/features/operations/components/ServiceCatalog';
import InvoiceProfessionalView from '@/OrgScope/features/finance/components/InvoiceProfessionalView';

type FinanceTab = 'overview' | 'generation' | 'reconciliation' | 'catalog';

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'generation', label: 'Tạo hóa đơn', icon: Receipt },
    { id: 'reconciliation', label: 'Đối soát', icon: Wallet },
    { id: 'catalog', label: 'Danh mục dịch vụ', icon: Settings },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0B]">
      {/* Tab Navigation Bar */}
      <div className="bg-[#0A0A0B] border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 rounded-lg p-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Hệ thống tài chính</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-widest">
              Cổng quản trị <ChevronRight className="w-3 h-3" /> {tabs.find(t => t.id === activeTab)?.label}
            </div>
          </div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FinanceTab)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowInvoicePreview(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all text-xs font-bold"
          >
            <Printer className="w-4 h-4" /> Mẫu hóa đơn
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-8 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.03),transparent_50%)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-[1400px] mx-auto"
          >
            {activeTab === 'overview' && <FinancialOverview />}
            {activeTab === 'generation' && <InvoiceGenerator />}
            {activeTab === 'reconciliation' && <PaymentAllocationEngine />}
            {activeTab === 'catalog' && <ServiceCatalog />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Global Invoice Preview Modal */}
      <AnimatePresence>
        {showInvoicePreview && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInvoicePreview(false)}
              className="absolute inset-0 bg-[#0A0A0B]/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl h-[90vh] bg-[#0A0A0B] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Chế độ xem trước hóa đơn</span>
                <button 
                  onClick={() => setShowInvoicePreview(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <InvoiceProfessionalView />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
