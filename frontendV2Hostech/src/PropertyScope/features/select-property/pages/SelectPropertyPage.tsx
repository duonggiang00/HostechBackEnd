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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/40 flex flex-col items-center justify-center p-6">
      {/* Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-8 text-white">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Chọn Property</h1>
          <p className="text-indigo-200 text-sm mt-1">
            Xin chào <span className="text-white font-semibold">{user?.full_name}</span>,
            bạn được gán vào {assigned.length} property. Chọn một để bắt đầu làm việc.
          </p>
        </div>

        {/* Property List */}
        <div className="p-6 space-y-3">
          {assigned.length === 0 ? (
            <div className="text-center py-10">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Chưa được gán vào property nào.</p>
              <p className="text-slate-400 text-xs mt-1">Vui lòng liên hệ Admin để được phân quyền.</p>
            </div>
          ) : (
            assigned.map((property) => (
              <button
                key={property.id}
                onClick={() => handleSelect(property.id)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-sm transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm uppercase group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {property.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{property.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{property.id.slice(0, 8)}…</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
