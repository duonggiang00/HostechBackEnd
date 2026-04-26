import { useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, Clock, MessageCircle, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import TicketTimeline from '@/shared/features/tickets/components/TicketTimeline';
import MaintenanceReportModal from '@/shared/features/tickets/components/MaintenanceReportModal';
import { useMyContracts } from '@/PropertyScope/features/contracts/hooks/useContracts';
import toast from 'react-hot-toast';

interface Request {
  id: string;
  title: string;
  category: string;
  status: 'pending' | 'in_progress' | 'completed';
  date: string;
}

export default function TenantRequestsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const { data: myContracts = [] } = useMyContracts();

  const requests: Request[] = [];

  const statusMap = {
    pending: { icon: Clock, label: 'Chờ xử lý', tone: 'text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10' },
    in_progress: { icon: AlertCircle, label: 'Đang xử lý', tone: 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/10' },
    completed: { icon: CheckCircle2, label: 'Hoàn tất', tone: 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10' },
  };

  const visibleRequests = requests.filter((request) =>
    activeTab === 'active' ? request.status !== 'completed' : request.status === 'completed',
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <MaintenanceReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />

      <AnimatePresence>
        {selectedTicketId ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur" onClick={() => setSelectedTicketId(null)} />
            <div className="relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950 p-2 shadow-2xl">
              <TicketTimeline />
              <button
                onClick={() => setSelectedTicketId(null)}
                className="absolute right-6 top-6 rounded-2xl bg-white/10 p-3 text-slate-300 transition-colors hover:bg-white/20 hover:text-white"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Yêu cầu hỗ trợ</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Gửi mới hoặc kiểm tra tiến độ</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Chỉ giữ lại hai nhóm dễ thao tác: đang xử lý và đã hoàn tất.
            </p>
          </div>

          <button
            onClick={() => {
              if (myContracts.length === 0) {
                toast.error('Tính năng không khả dụng do chưa có hợp đồng.');
                return;
              }
              setIsReportModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" />
            Báo sự cố mới
          </button>
        </div>
      </section>

      <div className="inline-flex rounded-3xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {[
          { key: 'active', label: 'Đang xử lý' },
          { key: 'completed', label: 'Đã hoàn tất' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'active' | 'completed')}
            className={`rounded-3xl px-5 py-3 text-sm font-black transition-colors ${
              activeTab === tab.key
                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="space-y-3">
        {visibleRequests.map((request) => {
          const status = statusMap[request.status];
          return (
            <button
              key={request.id}
              onClick={() => setSelectedTicketId(request.id)}
              className="flex w-full items-center gap-4 rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500 dark:hover:bg-slate-800/70"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${status.tone}`}>
                <status.icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  <span>{request.category}</span>
                  <span>{request.date}</span>
                </div>
                <h3 className="mt-2 text-base font-black text-slate-950 dark:text-white">{request.title}</h3>
              </div>

              <div className="flex items-center gap-3">
                <span className={`hidden rounded-2xl px-3 py-1.5 text-xs font-black sm:inline-flex ${status.tone}`}>
                  {status.label}
                </span>
                <ChevronRight className="h-5 w-5 text-slate-300 dark:text-slate-600" />
              </div>
            </button>
          );
        })}

        {visibleRequests.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <MessageCircle className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <h4 className="mt-4 text-lg font-black text-slate-950 dark:text-white">Chưa có mục nào ở nhóm này</h4>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Khi bạn tạo yêu cầu mới hoặc yêu cầu hoàn tất, danh sách sẽ tự cập nhật tại đây.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}