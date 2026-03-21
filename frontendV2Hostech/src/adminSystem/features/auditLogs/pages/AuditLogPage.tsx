import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, History, User, Building, Eye, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAuditLogs } from '@/adminSystem/features/auditLogs/hooks/useAuditLogs';
import { format } from 'date-fns';

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditLogs(page);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const logs = data?.data || [];
  const meta = data?.meta;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Security Audit Logs</h1>
          <p className="text-slate-500 font-medium">Traceable history of all system modifications</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Actor or Item ID..."
              className="pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-2xl outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50/50 transition-all text-sm font-medium w-64 shadow-sm"
            />
          </div>
          <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
              <th className="px-8 py-5">Actor / Module</th>
              <th className="px-8 py-5">Action</th>
              <th className="px-8 py-5">Item ID</th>
              <th className="px-8 py-5">Timestamp</th>
              <th className="px-8 py-5 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map((log: any) => (
              <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-600 transition-all shadow-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{log.causer_name || 'System'}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Building className="w-3 h-3 text-slate-300" />
                        <span className="text-xs font-black uppercase text-slate-400 tracking-tighter">{log.subject_type || log.log_name}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest ${
                    log.event === 'created' ? 'bg-emerald-50 text-emerald-600' :
                    log.event === 'updated' ? 'bg-amber-50 text-amber-600' :
                    'bg-rose-50 text-rose-600'
                  }`}>
                    {log.event}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{log.subject_id}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <History className="w-3.5 h-3.5 text-slate-300" />
                    {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <button 
                    onClick={() => setSelectedLog(log)}
                    className="p-2 border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold">
                  No activity logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination UI */}
        {meta && meta.last_page > 1 && (
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">
              Showing {meta.from} to {meta.to} of {meta.total} results
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-900 disabled:opacity-50 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-black text-slate-900 px-4">Page {page} of {meta.last_page}</span>
              <button 
                disabled={page === meta.last_page}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-900 disabled:opacity-50 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over for JSON Diff */}
      <AnimatePresence>
        {selectedLog && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 cursor-zoom-out"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-[60] flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Modification Details</h3>
                  <p className="text-sm font-medium text-slate-500">Log ID: {selectedLog.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 border border-slate-100 rounded-xl font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Old Values</p>
                    <pre className="text-xs font-mono font-bold text-slate-600 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.properties?.old, null, 2) || '// No original data'}
                    </pre>
                  </div>
                  <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">New Attributes</p>
                    <pre className="text-xs font-mono font-bold text-indigo-900 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.properties?.attributes, null, 2) || JSON.stringify(selectedLog.properties, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Metadata</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Event', value: selectedLog.event },
                      { label: 'Subject Type', value: selectedLog.subject_type },
                      { label: 'Subject ID', value: selectedLog.subject_id },
                      { label: 'Log Name', value: selectedLog.log_name }
                    ].map((item, i) => (
                      <div key={i} className="p-4 border border-slate-100 rounded-2xl">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                        <p className="text-xs font-bold text-slate-700">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
