import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePropertyUsers } from '../hooks/usePropertyUsers';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, UserPlus, Mail, Phone, Lock, 
  ShieldAlert, BadgeCheck, Loader2, Save 
} from 'lucide-react';

export default function CreateUserPage() {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
  const { user } = useAuthStore();
  const { createUserMutation } = usePropertyUsers();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    role: 'TENANT',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (role: string) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.password_confirmation) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        ...formData,
        org_id: user?.org_id, 
        // Gắn properties_scope để user mới thuộc về tòa nhà hiện tại
        properties_scope: [propertyId],
      });
      toast.success('Thêm người dùng thành công!');
      navigate(`/properties/${propertyId}/users`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi thêm người dùng.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(`/properties/${propertyId}/users`)}
          className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all shadow-sm group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-br from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Thêm người dùng mới
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Khởi tạo trực tiếp tài khoản nhân sự hoặc khách thuê
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Thông tin Form chính */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6"
            >
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700/50 pb-4">
                Thông tin cá nhân
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">HỌ VÀ TÊN <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-semibold outline-none"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">EMAIL <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-semibold outline-none"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">SỐ ĐIỆN THOẠI</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0901234567"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-semibold outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">MẬT KHẨU <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="********"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-semibold outline-none"
                    />
                  </div>
                </div>

                {/* Password Confirmation */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">XÁC NHẬN MẬT KHẨU <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      name="password_confirmation"
                      required
                      minLength={8}
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      placeholder="********"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-semibold outline-none"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Cột Phân quyền bên phải */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6"
            >
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700/50 pb-4">
                Phân quyền
              </h3>

              <div className="space-y-3">
                <label className={`block relative cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                  formData.role === 'TENANT' 
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900/50'
                }`}>
                  <input type="radio" checked={formData.role === 'TENANT'} onChange={() => handleRoleSelect('TENANT')} className="sr-only" />
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${
                      formData.role === 'TENANT' ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}>
                      <BadgeCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${formData.role === 'TENANT' ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                        Khách thuê (Tenant)
                      </p>
                      <p className={`text-[10px] mt-0.5 font-semibold ${formData.role === 'TENANT' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                        Xem hóa đơn, báo cáo sự cố
                      </p>
                    </div>
                  </div>
                </label>

                <label className={`block relative cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                  formData.role === 'STAFF' 
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900/50'
                }`}>
                  <input type="radio" checked={formData.role === 'STAFF'} onChange={() => handleRoleSelect('STAFF')} className="sr-only" />
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${
                      formData.role === 'STAFF' ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}>
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${formData.role === 'STAFF' ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                        Nhân viên (Staff)
                      </p>
                      <p className={`text-[10px] mt-0.5 font-semibold ${formData.role === 'STAFF' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                        Vận hành, ghi điện nước
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </motion.div>

            {/* Nút Submit */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                type="submit"
                disabled={createUserMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    LƯU NGƯỜI DÙNG
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </form>
    </div>
  );
}
