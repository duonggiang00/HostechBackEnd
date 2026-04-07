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
  ChevronRight
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
    owner: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    admin: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    manager: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    staff: 'bg-slate-100 text-slate-700 border-slate-200',
    technician: 'bg-amber-100 text-amber-700 border-amber-200',
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Danh mục nhân sự hệ thống</h1>
          <p className="text-slate-500 mt-1">Quản lý nhân sự, vai trò và quyền truy cập các cơ sở vận hành.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95">
          <UserPlus className="w-5 h-5" />
          Mời nhân sự
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100">
          <Building className="w-3.5 h-3.5" />
          Tất cả phòng ban
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all cursor-pointer">
          <Key className="w-3.5 h-3.5" />
          Quản trị bảo mật
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all cursor-pointer">
          <ShieldCheck className="w-3.5 h-3.5" />
          Quản lý cơ sở
        </div>
        <div className="md:ml-auto relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm nhân sự..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-100 rounded-xl text-sm bg-slate-50 focus:bg-white transition-all outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {staff.map((member: User) => (
          <div key={member.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl transition-all relative group overflow-hidden">
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 p-8 text-slate-50 opacity-10 group-hover:text-indigo-50 group-hover:opacity-100 transition-all transform translate-x-4 -translate-y-4">
                <Users className="w-32 h-32" />
             </div>

             <div className="relative">
                <div className="flex items-start justify-between mb-6">
                   <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400 border border-slate-200 overflow-hidden">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.full_name || member.email} className="w-full h-full object-cover" />
                        ) : (
                          (member.full_name || member.email || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${member.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
                   </div>
                   <div className="flex gap-1">
                      <button 
                        onClick={() => toggleUserStatus.mutate({ id: member.id, is_active: !member.is_active })}
                        className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
                        title={member.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      >
                         <Power className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { if(confirm('Bạn có chắc chắn?')) deleteUser.mutate(member.id.toString()); }}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>

                <div className="mb-6">
                   <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{member.full_name}</h3>
                   <div className="flex flex-wrap gap-2 mt-1">
                      {member.roles?.map((role: any) => (
                        <span key={role.id} className={`px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider border ${getRoleStyle(role.name)}`}>
                          {translateRole(role.name)}
                        </span>
                      ))}
                      {(!member.roles || member.roles.length === 0) && (
                        <span className={`px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider border ${roleStyles.staff}`}>
                          Nhân viên
                        </span>
                      )}
                   </div>
                </div>

                <div className="space-y-2.5 mb-8">
                   <div className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium truncate">{member.email}</span>
                   </div>
                   {member.phone && (
                     <div className="flex items-center gap-2 text-slate-500">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{member.phone}</span>
                     </div>
                   )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 bg-white">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Tham gia {format(new Date(member.created_at), 'dd/MM/yyyy')}</p>
                   <button className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:underline">Quản lý quyền</button>
                </div>
             </div>
          </div>
        ))}
        
        {/* Add Staff Placeholder */}
        <div className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 gap-4 py-16 group hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer">
           <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-all">
              <UserPlus className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
           </div>
           <div className="text-center">
              <h4 className="text-sm font-bold text-slate-700">Mời thành viên mới</h4>
              <p className="text-xs text-slate-400 uppercase font-black tracking-widest mt-1">Mở rộng đội ngũ quản lý</p>
           </div>
        </div>
      </div>

      {/* Pagination UI */}
      {meta && meta.last_page > 1 && (
        <div className="mt-8 flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500">
            Hiển thị {meta.from} đến {meta.to} trong tổng số {meta.total} nhân sự
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-900 disabled:opacity-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-900 px-4">Trang {page} / {meta.last_page}</span>
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
  );
}
