import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Droplets, Loader2, Gauge, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';
import { TENANT_METERS_QUERY_KEY } from '@/shared/features/billing/hooks/useFinanceRealtime';

interface TenantMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TenantMeterRow {
  id: string;
  code: string;
  type: string;
  latest_reading?: number | null;
  last_read_at?: string | null;
  property_name?: string | null;
  room_name?: string | null;
}

export default function TenantMeterModal({ isOpen, onClose }: TenantMeterModalProps) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [TENANT_METERS_QUERY_KEY],
    queryFn: async () => {
      const res = await apiClient.get<{ data: TenantMeterRow[] }>('/app/meters');
      return res.data.data ?? [];
    },
    enabled: isOpen,
    staleTime: 30_000,
  });

  const meters = data ?? [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                  <Gauge className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Chỉ số đồng hồ</h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Chỉ xem — ban quản lý chốt số</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[min(70vh,420px)] overflow-y-auto px-6 py-5">
              {isLoading && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <p className="text-sm font-medium">Đang tải…</p>
                </div>
              )}

              {isError && !isLoading && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-center dark:border-rose-500/30 dark:bg-rose-500/10">
                  <AlertCircle className="h-8 w-8 text-rose-500" />
                  <p className="text-sm font-bold text-rose-800 dark:text-rose-200">
                    {(error as Error)?.message || 'Không tải được dữ liệu đồng hồ.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-rose-700"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {!isLoading && !isError && meters.length === 0 && (
                <p className="py-10 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                  Chưa có đồng hồ gắn phòng hoặc bạn chưa có hợp đồng đang hiệu lực.
                </p>
              )}

              {!isLoading && !isError && meters.length > 0 && (
                <ul className="space-y-3">
                  {meters.map((m) => {
                    const isElectric = String(m.type).toUpperCase().includes('ELECTRIC');
                    const Icon = isElectric ? Zap : Droplets;
                    const label = isElectric ? 'Điện' : 'Nước';
                    return (
                      <li
                        key={m.id}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              isElectric
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                                : 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 dark:text-white">
                              {label} · {m.code}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {[m.property_name, m.room_name].filter(Boolean).join(' · ') || 'Phòng của bạn'}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-lg font-black tabular-nums text-slate-900 dark:text-white">
                            {m.latest_reading != null ? Number(m.latest_reading).toLocaleString('vi-VN') : '—'}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {m.last_read_at
                              ? `Chốt ${new Date(m.last_read_at).toLocaleDateString('vi-VN')}`
                              : 'Chưa chốt'}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
              <p className="text-center text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                Cần cập nhật chỉ số? Vui lòng liên hệ ban quản lý — cư dân không gửi chỉ số qua ứng dụng.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
