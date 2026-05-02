import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Receipt, Wallet, 
  Settings, ChevronRight, LayoutDashboard,
  Printer, X
} from 'lucide-react';

// Import local components
import FinancialOverview from '@/OrgScope/features/finance/components/FinancialOverview';
import OrgDashboardSummary from '@/OrgScope/features/finance/components/OrgDashboardSummary';
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
    <div className="flex h-full min-h-0 flex-col">
      {/* Tab Navigation Bar */}
      <div className="-mx-4 -mt-4 mb-6 flex flex-col gap-4 border-b border-white/10 bg-[#0d0d0f]/80 px-4 py-4 backdrop-blur-sm md:-mx-8 md:-mt-8 md:px-6 md:py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-2">
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

        <div className="flex max-w-full flex-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-1 [scrollbar-width:thin]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FinanceTab)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all sm:px-6 ${
                activeTab === tab.id
                  ? 'scale-[1.02] bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-3 lg:w-auto">
          <button
            type="button"
            onClick={() => setShowInvoicePreview(true)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/10"
          >
            <Printer className="h-4 w-4" /> Mẫu hóa đơn
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-0 flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-[1400px] mx-auto"
          >
            {activeTab === 'overview' && (
              <>
                <OrgDashboardSummary />
                <FinancialOverview />
              </>
            )}
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
