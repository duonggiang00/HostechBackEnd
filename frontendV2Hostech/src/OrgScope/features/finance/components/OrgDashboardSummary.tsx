import { Link } from 'react-router-dom';
import { Building2, Receipt, Users, Shield, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { useDashboard } from '@/shared/hooks/useDashboard';
import { useProperties } from '@/OrgScope/features/properties/hooks/useProperties';

export default function OrgDashboardSummary() {
  const { user } = useAuthStore();
  const orgId = user?.org_id;
  const { data: dashboard, isLoading: dashLoading } = useDashboard();
  const { data: properties = [], isLoading: propsLoading } = useProperties({
    'filter[org_id]': orgId || undefined,
  });

  const dash = dashboard?.data;
  const role = dashboard?.role;
  const occupancy = dash?.properties?.occupancy_rate;
  const totalRooms = dash?.properties?.total_rooms;
  const staffTotal =
    dash?.staff != null ? (dash.staff.total_managers ?? 0) + (dash.staff.total_staff ?? 0) : undefined;

  let revenueLine = '—';
  if (dash && role && (role === 'owner' || role === 'manager') && dash.revenue) {
    const r = (dash.revenue as { current_period?: number }).current_period ?? 0;
    revenueLine = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(r);
  }

  const loading = dashLoading || propsLoading;

  return (
    <div className="mb-10 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Tổ chức · tóm tắt nhanh</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Đa tài sản · liên kết tài chính & nhân sự
          </p>
        </div>
        <Link
          to="/org/properties"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10"
        >
          Danh sách cơ sở
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="h-24 animate-pulse rounded-3xl bg-white/5" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
              <Building2 className="h-4 w-4 text-emerald-400" />
              Cơ sở
            </div>
            <p className="text-2xl font-black text-white">{properties.length}</p>
            <p className="mt-1 text-xs text-slate-500">
              Lấp đầy {occupancy != null ? `${occupancy}%` : '—'} · {totalRooms != null ? `${totalRooms} phòng` : ''}
            </p>
          </div>

          <Link
            to="/org/finance"
            className="rounded-3xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-emerald-500/30"
          >
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
              <Receipt className="h-4 w-4 text-emerald-400" />
              Tài chính (tháng)
            </div>
            <p className="text-lg font-black text-white">{revenueLine}</p>
            <p className="mt-2 text-xs font-bold text-emerald-400">Mở cổng tài chính →</p>
          </Link>

          <Link
            to="/org/staff"
            className="rounded-3xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-emerald-500/30"
          >
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
              <Users className="h-4 w-4 text-emerald-400" />
              Nhân sự (RBAC)
            </div>
            <p className="text-2xl font-black text-white">{staffTotal ?? '—'}</p>
            <p className="mt-1 text-xs text-slate-500">Quản lý hệ thống & phân quyền</p>
          </Link>

          <Link
            to="/org/compliance"
            className="rounded-3xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-emerald-500/30"
          >
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
              <Shield className="h-4 w-4 text-emerald-400" />
              Tuân thủ
            </div>
            <p className="text-sm font-bold text-slate-300">Nhật ký & báo cáo (placeholder)</p>
            <p className="mt-2 text-xs font-bold text-emerald-400">Chi tiết →</p>
          </Link>
        </div>
      )}

      {properties.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Drill-down nhanh</p>
          <ul className="flex flex-wrap gap-2">
            {properties.slice(0, 8).map((p: { id: string; name?: string }) => (
              <li key={p.id}>
                <Link
                  to={`/properties/${p.id}/dashboard`}
                  className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
                >
                  {p.name ?? p.id}
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
          {properties.length > 8 && (
            <p className="mt-3 text-xs text-slate-500">+{properties.length - 8} cơ sở khác trong danh sách org.</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs font-bold">
        <Link to="/org/invoices" className="text-emerald-400 hover:underline">
          Hóa đơn xuyên tài sản
        </Link>
        <span className="text-slate-600">·</span>
        <Link to="/org/finance" className="text-emerald-400 hover:underline">
          Báo cáo tài chính tổng quát
        </Link>
      </div>
    </div>
  );
}
