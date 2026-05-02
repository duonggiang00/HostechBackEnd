import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  Mail,
  Phone,
  Building,
  Key,
  Loader2,
  Trash2,
  Power,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUsers, useUserActions, type User } from '@/shared/features/auth/hooks/useUsers';
import { format } from 'date-fns';
import { useState } from 'react';

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUsers(undefined, page, 12, searchTerm);
  const { deleteUser, toggleUserStatus } = useUserActions();

  const staff = data?.data || [];
  const meta = data?.meta;

  const roleStyles: Record<string, string> = {
    owner: 'bg-violet-500/20 text-violet-300 border-violet-500/35',
    admin: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35',
    manager: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    staff: 'bg-white/10 text-slate-300 border-white/15',
    technician: 'bg-amber-500/20 text-amber-300 border-amber-500/35',
  };

  const translateRole = (roleName?: string) => {
    const roles: Record<string, string> = {
      owner: 'Chủ sở hữu',
      admin: 'Quản trị viên',
      manager: 'Quản lý',
      staff: 'Nhân viên',
      technician: 'Kỹ thuật viên',
    };
    const key = (roleName ?? '').toLowerCase();
    return roles[key] || roleName || 'Nhân viên';
  };

  const getRoleStyle = (roleName?: string) => {
    const key = (roleName ?? '').toLowerCase();
    return roleStyles[key] || roleStyles.staff;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="slide-in-from-bottom-4 animate-in space-y-8 duration-700">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Danh mục nhân sự hệ thống</h1>
          <p className="mt-1 text-slate-500">Quản lý nhân sự, vai trò và quyền truy cập các cơ sở vận hành.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 active:scale-95">
          <UserPlus className="h-5 w-5" />
          Mời nhân sự
        </button>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300">
          <Building className="h-3.5 w-3.5" />
          Tất cả phòng ban
        </div>
        <div className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition-all hover:bg-white/5">
          <Key className="h-3.5 w-3.5" />
          Quản trị bảo mật
        </div>
        <div className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition-all hover:bg-white/5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Quản lý cơ sở
        </div>
        <div className="relative w-full min-w-[200px] md:ml-auto md:w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân sự..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-emerald-500/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((member: User) => (
          <div
            key={member.id}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-emerald-500/25"
          >
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 p-8 text-white/5 transition-opacity group-hover:text-emerald-500/10">
              <Users className="h-32 w-32" />
            </div>

            <div className="relative">
              <div className="mb-6 flex items-start justify-between">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-xl font-bold text-slate-400">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.full_name || member.email} className="h-full w-full object-cover" />
                    ) : (
                      (member.full_name || member.email || '?')
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    )}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#0d0d0f] ${
                      member.is_active ? 'bg-emerald-500' : 'bg-slate-500'
                    }`}
                  />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleUserStatus.mutate({ id: member.id, is_active: !member.is_active })}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/10 hover:text-emerald-400"
                    title={member.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Bạn có chắc chắn?')) deleteUser.mutate(member.id.toString());
                    }}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/10 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-white transition-colors group-hover:text-emerald-300">{member.full_name}</h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  {member.roles?.map((role: any) => (
                    <span
                      key={role.id}
                      className={`rounded border px-2 py-0.5 text-xs font-black uppercase tracking-wider ${getRoleStyle(role.name)}`}
                    >
                      {translateRole(role.name)}
                    </span>
                  ))}
                  {(!member.roles || member.roles.length === 0) && (
                    <span className={`rounded border px-2 py-0.5 text-xs font-black uppercase tracking-wider ${roleStyles.staff}`}>
                      Nhân viên
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-8 space-y-2.5">
                <div className="flex cursor-pointer items-center gap-2 text-slate-500 transition-colors hover:text-emerald-400">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-xs font-medium">{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs font-medium">{member.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <p className="text-xs font-bold uppercase leading-none tracking-widest text-slate-500">
                  Tham gia {member.created_at ? format(new Date(member.created_at), 'dd/MM/yyyy') : '—'}
                </p>
                <button className="text-xs font-black uppercase tracking-widest text-emerald-400 hover:underline">Quản lý quyền</button>
              </div>
            </div>
          </div>
        ))}

        <div className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/15 py-16 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 transition-all group-hover:bg-emerald-500/20">
            <UserPlus className="h-6 w-6 text-slate-500 transition-colors group-hover:text-emerald-400" />
          </div>
          <div className="text-center">
            <h4 className="text-sm font-bold text-slate-300">Mời thành viên mới</h4>
            <p className="mt-1 text-xs font-black uppercase tracking-widest text-slate-500">Mở rộng đội ngũ quản lý</p>
          </div>
        </div>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-bold text-slate-500">
            Hiển thị {meta.from} đến {meta.to} trong tổng số {meta.total} nhân sự
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border border-white/10 p-2 text-slate-500 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-4 text-xs font-black text-white">
              Trang {page} / {meta.last_page}
            </span>
            <button
              disabled={page === meta.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-white/10 p-2 text-slate-500 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
