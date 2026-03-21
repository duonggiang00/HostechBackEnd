import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, LogOut } from 'lucide-react';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

/**
 * SelectPropertyPage — shown to Manager/Staff who belong to multiple properties.
 * They pick one to set as the active session property and navigate to its dashboard.
 */
export default function SelectPropertyPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const assigned = user?.properties ?? [];

  const handleSelect = (propertyId: string) => {
    navigate(`/properties/${propertyId}/dashboard`, { replace: true });
  };

  const handleLogout = async () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50/40 dark:from-slate-900 dark:to-indigo-950/20 flex flex-col items-center justify-center p-6 transition-colors">
      {/* Card */}
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-indigo-100/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-600 to-violet-600 dark:from-indigo-500 dark:to-violet-500 px-8 py-8 text-white transition-colors">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Chọn Property</h1>
          <p className="text-indigo-100 dark:text-indigo-50 text-sm mt-1">
            Xin chào <span className="text-white font-semibold">{user?.full_name}</span>,
            bạn được gán vào {assigned.length} property. Chọn một để bắt đầu làm việc.
          </p>
        </div>

        {/* Property List */}
        <div className="p-6 space-y-3">
          {assigned.length === 0 ? (
            <div className="text-center py-10 transition-colors">
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Chưa được gán vào property nào.</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Vui lòng liên hệ Admin để được phân quyền.</p>
            </div>
          ) : (
            assigned.map((property) => (
              <button
                key={property.id}
                onClick={() => handleSelect(property.id)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 hover:shadow-sm transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-500 transition-all">
                    {property.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white transition-colors">{property.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono transition-colors">{property.id.slice(0, 8)}…</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
