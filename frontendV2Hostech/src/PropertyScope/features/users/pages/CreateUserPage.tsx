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
    identity_number: '',
    date_of_birth: '',
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
    
    if (formData.password.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        ...formData,
        org_id: user?.org_id, 
        properties_scope: [propertyId],
      });
      toast.success('Thêm người dùng thành công!');
      navigate(`/properties/${propertyId}/users`);
    } catch (err: any) {
      // apiClient will handle showing the toast error globally
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(`/properties/${propertyId}/users`)}
          className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#4B5563] hover:text-[#1E3A8A] transition-all shadow-sm group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h1 className="text-24 font-bold text-[#111827] dark:text-white flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-[#1E3A8A]" />
            Thêm người dùng mới
          </h1>
          <p className="text-sm text-[#4B5563] dark:text-slate-400 mt-1">
            Khởi tạo trực tiếp tài khoản nhân sự hoặc khách thuê
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6"
            >
              <h3 className="text-sm font-bold text-[#111827] dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700/50 pb-4">
                Thông tin cá nhân
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-[#4B5563] dark:text-slate-300">HỌ VÀ TÊN <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all text-sm font-medium outline-none text-[#111827] dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#4B5563] dark:text-slate-300">EMAIL <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      className="w-full pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all text-sm font-medium outline-none text-[#111827] dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#4B5563] dark:text-slate-300">SỐ ĐIỆN THOẠI</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0901234567"
                      className="w-full pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all text-sm font-medium outline-none text-[#111827] dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#4B5563] dark:text-slate-300">CCCD</label>
                  <input
                    type="text"
                    name="identity_number"
                    value={formData.identity_number}
                    onChange={handleChange}
                    placeholder="012345678901"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all text-sm font-medium outline-none text-[#111827] dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#4B5563] dark:text-slate-300">NGÀY SINH</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all text-sm font-medium outline-none text-[#111827] dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#4B5563] dark:text-slate-300">MẬT KHẨU <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="********"
                      className="w-full pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all text-sm font-medium outline-none text-[#111827] dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#4B5563] dark:text-slate-300">XÁC NHẬN MẬT KHẨU <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      name="password_confirmation"
                      required
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      placeholder="********"
                      className="w-full pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all text-sm font-medium outline-none text-[#111827] dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6"
            >
              <h3 className="text-sm font-bold text-[#111827] dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700/50 pb-4">
                Phân quyền
              </h3>

              <div className="space-y-3">
                <label className={`block relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  formData.role === 'TENANT' 
                    ? 'border-[#1E3A8A] bg-[#EFF6FF] dark:bg-indigo-900/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900/50'
                }`}>
                  <input type="radio" checked={formData.role === 'TENANT'} onChange={() => handleRoleSelect('TENANT')} className="sr-only" />
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      formData.role === 'TENANT' ? 'bg-[#1E3A8A] text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}>
                      <BadgeCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${formData.role === 'TENANT' ? 'text-[#1E3A8A] dark:text-indigo-200' : 'text-[#4B5563] dark:text-slate-300'}`}>
                        Khách thuê (Tenant)
                      </p>
                      <p className={`text-[10px] mt-0.5 font-bold ${formData.role === 'TENANT' ? 'text-[#1E3A8A]/70 dark:text-indigo-400' : 'text-slate-500'}`}>
                        Xem hóa đơn, báo cáo sự cố
                      </p>
                    </div>
                  </div>
                </label>

                <label className={`block relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  formData.role === 'STAFF' 
                    ? 'border-[#1E3A8A] bg-[#EFF6FF] dark:bg-indigo-900/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900/50'
                }`}>
                  <input type="radio" checked={formData.role === 'STAFF'} onChange={() => handleRoleSelect('STAFF')} className="sr-only" />
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      formData.role === 'STAFF' ? 'bg-[#1E3A8A] text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}>
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${formData.role === 'STAFF' ? 'text-[#1E3A8A] dark:text-indigo-200' : 'text-[#4B5563] dark:text-slate-300'}`}>
                        Nhân viên (Staff)
                      </p>
                      <p className={`text-[10px] mt-0.5 font-bold ${formData.role === 'STAFF' ? 'text-[#1E3A8A]/70 dark:text-indigo-400' : 'text-slate-500'}`}>
                        Vận hành, ghi điện nước
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                type="submit"
                disabled={createUserMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-lg font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
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
