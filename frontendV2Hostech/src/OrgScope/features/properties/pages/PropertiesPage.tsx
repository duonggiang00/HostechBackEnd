import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Loader2,
  Building2,
  ArrowRight,
  Pencil,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useProperties } from '@/OrgScope/features/properties/hooks/useProperties';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import type { Property } from '@/OrgScope/features/properties/types';

const STATUS_LABELS: Record<string, string> = {
  active: 'Đang hoạt động',
  inactive: 'Ngừng hoạt động',
  maintenance: 'Bảo trì',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  inactive: 'bg-white/10 text-slate-400 border-white/15',
  maintenance: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

type SortKey = 'name' | 'rooms' | 'contracts' | 'tenants' | 'revenue_month' | 'revenue_total';

export default function PropertiesPage() {
  const { user } = useAuthStore();
  const { orgId: orgIdParam } = useParams<{ orgId: string }>();
  const orgId = orgIdParam || user?.org_id;

  const navigate = useNavigate();
  const { data: properties, isLoading: isPropsLoading, error: propsError } = useProperties({
    'filter[org_id]': orgId,
  });

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filteredProperties = useMemo(() => {
    const list: Property[] = (properties as Property[] | undefined) ?? [];
    const s = search.trim().toLowerCase();
    const filtered = s
      ? list.filter(
          (p) =>
            p.name?.toLowerCase().includes(s) ||
            p.address?.toLowerCase().includes(s) ||
            p.code?.toLowerCase().includes(s),
        )
      : list;

    const direction = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'rooms':
          return ((a.rooms_count ?? 0) - (b.rooms_count ?? 0)) * direction;
        case 'contracts':
          return ((a.active_contracts_count ?? 0) - (b.active_contracts_count ?? 0)) * direction;
        case 'tenants':
          return ((a.active_tenants_count ?? 0) - (b.active_tenants_count ?? 0)) * direction;
        case 'revenue_month':
          return ((a.revenue_this_month ?? 0) - (b.revenue_this_month ?? 0)) * direction;
        case 'revenue_total':
          return ((a.revenue_total ?? 0) - (b.revenue_total ?? 0)) * direction;
        case 'name':
        default:
          return (a.name ?? '').localeCompare(b.name ?? '') * direction;
      }
    });
  }, [properties, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="ml-1 inline h-3 w-3 text-emerald-400" />
    ) : (
      <ChevronDown className="ml-1 inline h-3 w-3 text-emerald-400" />
    );
  };

  if (isPropsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (propsError) {
    return <div className="p-8 text-center text-rose-400">Lỗi tải danh sách cơ sở. Vui lòng thử lại.</div>;
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Cơ sở vận hành</h1>
          <p className="mt-1 text-slate-500">Quản lý tất cả tài sản và khu vực lưu trú của bạn.</p>
        </div>
        <button
          onClick={() => navigate('/org/properties/add')}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Thêm cơ sở
        </button>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-2">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm cơ sở theo tên hoặc địa chỉ..."
            className="w-full border-none bg-transparent text-sm text-white placeholder:text-slate-500 focus:ring-0"
          />
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-300 transition-colors hover:bg-white/10">
          <Filter className="h-4 w-4" />
          Bộ lọc
        </button>
      </div>

      {/* Bảng danh sách cơ sở */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th
                  onClick={() => toggleSort('name')}
                  className="cursor-pointer select-none px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-300"
                >
                  Cơ sở {renderSortIcon('name')}
                </th>
                <th
                  onClick={() => toggleSort('rooms')}
                  className="cursor-pointer select-none px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-300"
                >
                  Phòng {renderSortIcon('rooms')}
                </th>
                <th
                  onClick={() => toggleSort('contracts')}
                  className="cursor-pointer select-none px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-300"
                >
                  HĐ hiệu lực {renderSortIcon('contracts')}
                </th>
                <th
                  onClick={() => toggleSort('tenants')}
                  className="cursor-pointer select-none px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-300"
                >
                  Người thuê {renderSortIcon('tenants')}
                </th>
                <th
                  onClick={() => toggleSort('revenue_month')}
                  className="cursor-pointer select-none px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-300"
                >
                  Thu tháng này {renderSortIcon('revenue_month')}
                </th>
                <th
                  onClick={() => toggleSort('revenue_total')}
                  className="cursor-pointer select-none px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-300"
                >
                  Thu lũy kế {renderSortIcon('revenue_total')}
                </th>
                <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    {search ? 'Không có cơ sở nào khớp tìm kiếm.' : 'Chưa có cơ sở. Hãy thêm cơ sở đầu tiên.'}
                  </td>
                </tr>
              ) : (
                filteredProperties.map((prop) => {
                  const occ = prop.stats?.occupied_rooms ?? 0;
                  const total = prop.stats?.total_rooms ?? prop.rooms_count ?? 0;
                  const status = prop.status || 'active';
                  return (
                    <tr key={prop.id} className="group transition-colors hover:bg-white/[0.04]">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 transition-colors group-hover:bg-emerald-500/25">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-bold text-white">{prop.name}</p>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[status]}`}
                              >
                                {STATUS_LABELS[status] || status}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              <span className="font-bold uppercase tracking-wider text-slate-400">{prop.code}</span>
                              {prop.address ? <span> · {prop.address}</span> : null}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-bold text-white">{total}</p>
                        <p className="text-[11px] font-medium text-slate-500">
                          Lấp đầy {occ}/{total}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-white">{prop.active_contracts_count ?? 0}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-white">{prop.active_tenants_count ?? 0}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-emerald-400">
                          {formatVnd(prop.revenue_this_month ?? 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-white">{formatVnd(prop.revenue_total ?? 0)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/org/properties/${prop.id}/edit`)}
                            title="Sửa thông tin cơ sở"
                            className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-emerald-400"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/properties/${prop.id}/dashboard`)}
                            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow shadow-emerald-500/25 transition-all hover:bg-emerald-400 active:scale-95"
                          >
                            Quản lý
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Hiển thị {filteredProperties.length} / {properties?.length ?? 0} cơ sở
          </p>
          <button
            onClick={() => navigate('/org/properties/add')}
            className="flex items-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-2 text-xs font-bold text-slate-400 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-300"
          >
            <Plus className="h-4 w-4" />
            Đăng ký cơ sở mới
          </button>
        </div>
      </div>
    </div>
  );
}
