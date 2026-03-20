import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useContracts, useTrashContracts, useContractActions } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { ContractTable } from '@/PropertyScope/features/contracts/components/ContractTable';
import { Button } from '@/shared/components/ui/button';
import { 
  Plus, FileText, CheckCircle2, Clock, 
  FileSignature, XCircle, ChevronLeft, ChevronRight,
  type LucideIcon 
} from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useDebounce } from '@/shared/hooks/useDebounce';

// --- Sub-components ---

interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  description?: string;
  color: 'indigo' | 'emerald' | 'amber' | 'slate' | 'purple' | 'red';
}

const KPICard = ({ title, value, icon: Icon, trend, description, color }: KPICardProps) => {
  const colorMap = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-600 border-indigo-100',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600 border-emerald-100',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-600 border-amber-100',
    slate: 'from-slate-500/20 to-slate-500/5 text-slate-600 border-slate-100',
    red: 'from-red-500/20 to-red-500/5 text-red-600 border-red-100',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-600 border-purple-100',
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`relative overflow-hidden bg-gradient-to-br ${colorMap[color]} border rounded-3xl p-6 transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5 group`}
    >
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{title}</p>
          <p className="text-3xl font-black tracking-tight">{value}</p>
        </div>
        <div className="p-3 bg-white/50 backdrop-blur-md rounded-2xl border border-white/50 group-hover:scale-110 transition-transform">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {(trend || description) && (
        <div className="mt-4 flex items-center gap-2 relative z-10">
          <div className="h-1 w-1 rounded-full bg-current opacity-50" />
          <p className="text-[10px] font-extrabold uppercase tracking-tight opacity-60">
            {trend || description}
          </p>
        </div>
      )}

      {/* Abstract Background Shapes */}
      <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-current opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
    </motion.div>
  );
};

// --- Main Page Component ---

export default function ContractListPage() {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
  const { deleteContract } = useContractActions();
  const [searchParams, setSearchParams] = useSearchParams();

  // Keep setSearchParams in a ref so it's not a useEffect dependency
  // (react-router's setSearchParams is NOT referentially stable)
  const setSearchParamsRef = useRef(setSearchParams);
  setSearchParamsRef.current = setSearchParams;

  // ─── State from URL ─────────────────────────────────────────────────────────

  // Search: local state + debounced for API
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Filters & sort from URL
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [sort, setSort] = useState(searchParams.get('sort') || '-created_at');
  const [isTrashView, setIsTrashView] = useState(searchParams.get('view') === 'trash');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // ─── Page Reset (skip initial mount) ───────────────────────────────────────

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, sort]);

  // ─── URL Sync (uses ref to avoid setSearchParams dep) ──────────────────────

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (status !== 'all') params.set('status', status);
    if (sort !== '-created_at') params.set('sort', sort);
    if (page > 1) params.set('page', page.toString());
    if (isTrashView) params.set('view', 'trash');

    setSearchParamsRef.current(params, { replace: true });
  }, [debouncedSearch, status, sort, page, isTrashView]);

  // ─── Query Params (memoized to stabilize TanStack Query key) ───────────────

  const queryParams = useMemo(() => ({
    property_id: propertyId,
    search: debouncedSearch || undefined,
    status: status !== 'all' ? status : undefined,
    sort: sort || undefined,
    page,
    per_page: 15,
  }), [propertyId, debouncedSearch, status, sort, page]);

  // ─── Queries ────────────────────────────────────────────────────────────────

  const { data: contractResponse, isLoading: isActiveLoading } = useContracts(
    queryParams,
    { enabled: !isTrashView }
  );

  const activeContracts = contractResponse?.data ?? [];
  const statusCounts = contractResponse?.status_counts;

  const { data: trashContracts = [], isLoading: isTrashLoading } = useTrashContracts(
    queryParams,
    { enabled: isTrashView }
  );

  const currentData = isTrashView ? trashContracts : activeContracts;
  const isLoading = isTrashView ? isTrashLoading : isActiveLoading;

  // ─── Sort Toggle ────────────────────────────────────────────────────────────

  const handleSortChange = (field: string) => {
    setSort(prev => prev === field ? `-${field}` : field);
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleEdit = (contract: any) => {
    navigate(`/properties/${propertyId}/contracts/${contract.id}`);
  };

  const handleDelete = (contract: any) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá hợp đồng này?')) return;
    deleteContract.mutate(contract.id, {
      onSuccess: () => toast.success('Đã chuyển hợp đồng vào thùng rác.'),
      onError: () => toast.error('Có lỗi xảy ra khi xoá hợp đồng.'),
    });
  };

  const stats = {
    total: statusCounts?.total ?? 0,
    active: statusCounts?.ACTIVE ?? 0,
    pending: (statusCounts?.DRAFT ?? 0) + (statusCounts?.PENDING_SIGNATURE ?? 0) + (statusCounts?.PENDING_PAYMENT ?? 0),
    expiring: statusCounts?.expiring ?? 0,
    ended: statusCounts?.ENDED ?? 0,
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header Section */}
      <div className="px-6 lg:px-8 py-8 bg-white border-b border-slate-100 shadow-sm relative z-20">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <FileText className="h-10 w-10 text-indigo-600" />
              Hợp Đồng Thuê
            </h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-2 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-indigo-500 rounded-full" />
              Quản lý pháp lý & chu kỳ thuê
            </p>
          </motion.div>

          {!isTrashView && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button 
                onClick={() => navigate(`/properties/${propertyId}/contracts/create`)}
                size="lg"
                className="rounded-2xl px-8 h-14 text-base font-black shadow-xl shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 transition-all bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="mr-2 h-6 w-6" />
                Ký Hợp Đồng Mới
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar px-6 lg:px-8 pb-8">
        <div className="max-w-[1600px] mx-auto space-y-10 py-10">
          
          {/* KPI Dashboard Section */}
          {!isTrashView && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <KPICard
                title="Tổng Hợp Đồng"
                value={stats.total.toString()}
                icon={FileText}
                color="indigo"
              />
              <KPICard
                title="Đang Hiệu Lực"
                value={stats.active.toString()}
                icon={CheckCircle2}
                color="emerald"
              />
              <KPICard
                title="Sắp Hết Hạn"
                value={stats.expiring.toString()}
                icon={Clock}
                trend="Trong 30 ngày tới"
                color="amber"
              />
              <KPICard
                title="Đang Soạn / Chờ Ký"
                value={stats.pending.toString()}
                icon={FileSignature}
                color="purple"
              />
              <KPICard
                title="Đã Kết Thúc"
                value={stats.ended.toString()}
                icon={XCircle}
                color="red"
              />
            </div>
          )}

          {/* Table & Filtering Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <ContractTable
                contracts={currentData}
                isTrashView={isTrashView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                search={searchTerm}
                onSearchChange={setSearchTerm}
                status={status}
                onStatusChange={setStatus}
                onViewChange={setIsTrashView}
                sort={sort}
                onSortChange={handleSortChange}
              />
            )}
          </motion.section>

          {/* Pagination */}
          {!isLoading && currentData.length > 0 && (
            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-xs font-black text-slate-700">
                  {currentData.length}
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">kết quả trang {page}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="h-9 px-3 rounded-lg text-xs font-bold"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Trước
                </Button>
                <div className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black">
                  {page}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentData.length < (queryParams.per_page ?? 15)}
                  onClick={() => setPage(p => p + 1)}
                  className="h-9 px-3 rounded-lg text-xs font-bold"
                >
                  Sau
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
