import { Search, Filter, Calendar, LogOut, Eye, ShieldAlert } from 'lucide-react';
import { useHandover, type Handover } from '@/shared/features/operations/hooks/useHandover';
import { useState, useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Input } from '@/shared/components/ui/input';

function formatHandoverDate(item: { created_at?: string | null }): string {
  const raw = item.created_at;
  if (!raw) return '—';
  try {
    return format(parseISO(raw), 'dd/MM/yyyy', { locale: vi });
  } catch {
    return '—';
  }
}

function shortId(id: string): string {
  return id ? `${id.slice(0, 8).toUpperCase()}…` : '—';
}

function getTenantName(item: { contract?: Handover['contract'] }): string {
  const t = item.contract?.tenant?.name?.trim() || item.contract?.tenant?.full_name?.trim();
  if (t) return t;
  const member = item.contract?.primary_member ?? item.contract?.primaryMember;
  if (member?.full_name) return member.full_name;
  if (member?.name) return member.name;
  return 'Chưa có khách thuê';
}

function getCreatorName(item: any): string {
  const u = item.createdBy;
  if (u?.full_name) return u.full_name;
  if (u?.name) return u.name;
  return '—';
}

function contractStatusLabel(status?: string | null): { label: string; className: string } {
  const s = (status ?? '').toUpperCase();
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE: {
      label: 'Hiệu lực',
      className: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    },
    PENDING_TERMINATION: {
      label: 'Chờ thanh lý',
      className: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
    },
    EXPIRED: {
      label: 'Hết hạn',
      className: 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20',
    },
    TERMINATED: {
      label: 'Đã thanh lý',
      className: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
    },
    ENDED: {
      label: 'Đã kết thúc',
      className: 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20',
    },
    CANCELLED: {
      label: 'Đã hủy',
      className: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20',
    },
  };
  return (
    map[s] ?? {
      label: status || '—',
      className: 'bg-gray-50 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-500/20',
    }
  );
}

export default function HandoverListing() {
  const location = useLocation();
  const { propertyId: routePropertyId } = useParams<{ propertyId: string }>();
  const propertyId = useMemo(() => {
    if (routePropertyId) return routePropertyId;
    const m = location.pathname.match(/^\/properties\/([^/]+)\//);
    return m?.[1];
  }, [routePropertyId, location.pathname]);

  const [search, setSearch] = useState('');

  const { useHandovers } = useHandover();
  const { data: response, isLoading } = useHandovers(
    { filter: { property_id: propertyId }, per_page: 50 },
    { enabled: !!propertyId },
  );
  const allHandovers: Handover[] = response?.data ?? [];

  const handovers = allHandovers.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const roomName = (item.room?.name ?? '').toLowerCase();
    const tenantName = getTenantName(item).toLowerCase();
    const idShort = (item.id ?? '').toLowerCase();
    return roomName.includes(q) || tenantName.includes(q) || idShort.includes(q);
  });

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      {!propertyId ? (
        <div className="rounded-[10px] border border-amber-200 bg-amber-50/80 dark:bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-900 dark:text-amber-200 mb-6">
          Không xác định được mã tòa từ URL. Hãy mở trang này từ menu trong phạm vi một cơ sở (
          <code className="text-xs">/properties/…/handovers</code>).
        </div>
      ) : null}

      <div className="bg-white dark:bg-gray-800/50 rounded-[10px] border border-gray-200/80 dark:border-white/10 overflow-hidden shadow-sm">
        {/* Cùng pattern filter strip như ContractTable */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Tìm phòng, khách thuê, mã biên bản..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-blue-500/20 dark:text-gray-100"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-500 dark:text-gray-400">
            <Filter className="h-3.5 w-3.5 shrink-0" />
            <span>Lọc nâng cao (sắp có)</span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-white/10">
              <TableHead className="h-11 px-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-[120px]">
                Loại
              </TableHead>
              <TableHead className="h-11 px-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Mã biên bản
              </TableHead>
              <TableHead className="h-11 px-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-[120px]">
                Phòng
              </TableHead>
              <TableHead className="h-11 px-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Khách thuê
              </TableHead>
              <TableHead className="h-11 px-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Ngày lập
              </TableHead>
              <TableHead className="h-11 px-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Người tạo
              </TableHead>
              <TableHead className="h-11 px-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">
                Hợp đồng
              </TableHead>
              <TableHead className="min-w-[120px] h-11 px-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8} className="px-4 py-6">
                    <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse max-w-md" />
                  </TableCell>
                </TableRow>
              ))
            ) : handovers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-20">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="rounded-full bg-gray-50 dark:bg-gray-700/50 p-6 mb-4 ring-1 ring-gray-100 dark:ring-white/10">
                      <ShieldAlert className="h-10 w-10 text-gray-300 dark:text-gray-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Chưa có biên bản</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                      Biên bản được tạo khi thanh lý hợp đồng hoặc từ quy trình vận hành.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {handovers.map((item, index: number) => {
                  const roomName = item.room?.name ?? item.room?.code ?? '—';
                  const tenantName = getTenantName(item);
                  const dateStr = formatHandoverDate(item);
                  const creator = getCreatorName(item);
                  const st = contractStatusLabel(item.contract?.status);
                  const detailPath =
                    propertyId && item.id
                      ? `/properties/${propertyId}/handovers/${item.id}`
                      : '#';

                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className="group hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-colors border-b border-gray-50 dark:border-white/5 last:border-0"
                    >
                      <TableCell className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/25">
                          <LogOut className="w-3 h-3" />
                          Bàn giao
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <span
                          className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300"
                          title={item.id}
                        >
                          {shortId(item.id)}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">
                          {roomName}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center text-xs font-bold text-blue-900 dark:text-blue-400 shrink-0 border border-blue-50 dark:border-blue-500/20">
                            {tenantName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[160px]">
                            {tenantName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {dateStr}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{creator}</span>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <div className="flex items-center justify-center">
                          <Link
                            to={detailPath}
                            title="Xem chi tiết biên bản"
                            aria-disabled={!propertyId || !item.id}
                            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg font-bold text-xs text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 ${!propertyId || !item.id ? 'pointer-events-none opacity-50' : ''}`}
                          >
                            <Eye className="h-4 w-4" />
                            Chi tiết
                          </Link>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>

      </div>
    </motion.section>
  );
}
