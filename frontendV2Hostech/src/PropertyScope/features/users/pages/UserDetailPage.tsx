import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser, usePropertyUsers } from '../hooks/usePropertyUsers';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, Mail, Phone, ShieldAlert, 
  MapPin, Calendar, CreditCard, Clock, 
  Lock, Unlock, ShieldCheck, BadgeCheck, DoorOpen
} from 'lucide-react';

export default function UserDetailPage() {
  const { propertyId, userId } = useParams<{ propertyId: string, userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { data: user, isLoading, isError } = useUser(userId);
  const { updateUserMutation } = usePropertyUsers();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleBack = () => {
    if (location.state?.from === 'room-detail' && location.state?.roomId) {
      navigate(`/properties/${propertyId}/rooms/${location.state.roomId}`, { 
        state: { activeTab: 'tenants' } 
      });
    } else {
      navigate(`/properties/${propertyId}/users`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-[#EFF6FF] border-t-[#1E3A8A] animate-spin" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mx-auto max-w-2xl px-6 py-12">
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Không tìm thấy người dùng</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-8 max-w-sm">
          Tài khoản này có thể chưa được kích hoạt hoặc đã bị xóa khỏi hệ thống. Vui lòng kiểm tra lại ID người dùng.
        </p>
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 px-8 py-3 bg-[#1E3A8A] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const handleToggleLock = async () => {
    if (!window.confirm(`Bạn có chắc muốn ${user.is_active ? 'khóa' : 'mở khóa'} tài khoản này?`)) return;
    
    setIsUpdating(true);
    try {
      await updateUserMutation.mutateAsync({ 
        id: user.id, 
        data: { is_active: !user.is_active } 
      });
      toast.success(`Đã ${user.is_active ? 'khóa' : 'mở khóa'} tài khoản thành công!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsUpdating(false);
    }
  };

  const isActive = user.is_active === true || user.is_active === '1' || user.is_active === 'true';

  return (
    <div className="max-w-5xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Nút Quay lại & Tiêu đề */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#4B5563] hover:text-[#1E3A8A] dark:hover:text-[#1E3A8A] transition-all shadow-sm group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-24 font-bold text-[#111827] dark:text-white">
              Hồ sơ người dùng
            </h1>
          </div>
        </div>

        {/* Nút Khóa / Mở Khóa */}
        <button
          onClick={handleToggleLock}
          disabled={isUpdating}
          className={`group relative flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            isActive 
              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50' 
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
          }`}
        >
          {isUpdating ? (
             <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : isActive ? (
            <>
              <Lock className="w-5 h-5" />
              Khóa tài khoản
            </>
          ) : (
            <>
              <Unlock className="w-5 h-5" />
              Mở khóa tài khoản
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 hover:translate-y-0!">
        
        {/* Cột trái: Thông tin tổng quan */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 text-center relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className={`absolute top-0 left-0 right-0 h-32 ${isActive ? 'bg-linear-to-b from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-800' : 'bg-linear-to-b from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-800'}`} />

            <div className="relative">
              {/* Avatar */}
              <div className="w-28 h-28 mx-auto rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 text-3xl font-black border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden mb-4">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.full_name.charAt(0).toUpperCase()
                )}
              </div>
              
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{user.full_name}</h2>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">{user.email}</p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight ${
                  user.role === 'Tenant' || user.roles?.[0] === 'Tenant' ? 'bg-[#EFF6FF] text-[#1E3A8A] dark:bg-indigo-900/30 dark:text-indigo-400' : 
                  'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {user.role === 'Tenant' || user.roles?.[0] === 'Tenant' ? <BadgeCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  {user.roles?.[0] || user.role || 'Người dùng'}
                </span>

                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight ${
                  isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                }`}>
                  {isActive ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {isActive ? 'Hoạt động' : 'Tạm khóa'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Phòng được gán */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4"
          >
            <h3 className="text-sm font-bold text-[#111827] dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700/50 pb-4 flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-[#1E3A8A]" />
              Phòng đang ở
            </h3>
            
            {user.assigned_rooms && user.assigned_rooms.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.assigned_rooms.map(room => (
                  <div key={room.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/50 w-full">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900/40 flex items-center justify-center text-[#1E3A8A] dark:text-violet-400 shadow-sm border border-slate-50">
                      <DoorOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111827] dark:text-violet-300">{room.name || room.code}</p>
                      {room.name && room.code && (
                        <p className="text-xs font-medium text-[#4B5563] dark:text-violet-400/70">Mã: {room.code}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 italic">Chưa được gán phòng nào</p>
              </div>
            )}
          </motion.div>

          {/* Quick Stats / Info */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4"
          >
            <h3 className="text-sm font-bold text-[#111827] dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700/50 pb-4">
              Ngày tháng
            </h3>
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Ngày tham gia</p>
                <p className="text-sm font-bold text-[#111827] dark:text-slate-100">{new Date(user.created_at).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Đăng nhập lần cuối</p>
                <p className="text-sm font-bold text-[#111827] dark:text-slate-100">
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleString('vi-VN') : 'Chưa từng đăng nhập'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Cột Phải: Chi tiết tài khoản */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <h3 className="text-sm font-bold text-[#111827] dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700/50 pb-4 mb-6">
              Thông tin liên hệ & Định danh
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#4B5563] flex items-center gap-2">
                  <Mail className="w-4 h-4" /> EMAIL LIÊN HỆ
                </label>
                <p className="text-base font-bold text-[#111827] dark:text-slate-100">{user.email}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> SỐ ĐIỆN THOẠI
                </label>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{user.phone || 'Chưa cập nhật'}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> CCCD / CMND
                </label>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{user.identity_number || 'Chưa cập nhật'}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> NGÀY CẤP CCCD
                </label>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {user.identity_issued_date ? new Date(user.identity_issued_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </p>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> ĐỊA CHỈ NƠI CẤP
                </label>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{user.identity_issued_place || 'Chưa cập nhật'}</p>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> ĐỊA CHỈ THƯỜNG TRÚ
                </label>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{user.address || 'Chưa thiết lập địa chỉ'}</p>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
}
