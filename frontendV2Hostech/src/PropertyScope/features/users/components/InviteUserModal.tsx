import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ShieldAlert, BadgeCheck, Loader2 } from 'lucide-react';
import { usePropertyUsers } from '../hooks/usePropertyUsers';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteUserModal({ isOpen, onClose }: InviteUserModalProps) {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { inviteMutation } = usePropertyUsers();
  
  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState('Tenant');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !propertyId) return;

    try {
      await inviteMutation.mutateAsync({
        email,
        role_name: roleName,
        properties_scope: [propertyId],
      });
      toast.success('Gửi lời mời thành công!');
      onClose();
      setEmail('');
      setRoleName('Tenant');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi lời mời.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Nền làm mờ */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        />

        {/* Nội dung Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700"
        >
          {/* Tiêu đề Modal */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Gửi lời mời</h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Thêm người dùng vào tòa nhà</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form nhập liệu */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              {/* Nhập Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email người nhận</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nguyenvana@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-2xl focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/10 transition-all text-sm font-semibold outline-none"
                  />
                </div>
              </div>

              {/* Chọn vai trò */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Vai trò (Role)</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Khách thuê */}
                  <label className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                    roleName === 'Tenant' 
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                  }`}>
                    <input type="radio" name="role" value="Tenant" checked={roleName === 'Tenant'} onChange={(e) => setRoleName(e.target.value)} className="sr-only" />
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl flex-shrink-0 ${
                        roleName === 'Tenant' ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}>
                        <BadgeCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${roleName === 'Tenant' ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                          Khách thuê
                        </p>
                        <p className={`text-[10px] mt-0.5 ${roleName === 'Tenant' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                          Thuê phòng, xem hóa đơn
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Nhân viên */}
                  <label className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                    roleName === 'Staff' 
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                  }`}>
                    <input type="radio" name="role" value="Staff" checked={roleName === 'Staff'} onChange={(e) => setRoleName(e.target.value)} className="sr-only" />
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl flex-shrink-0 ${
                        roleName === 'Staff' ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}>
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${roleName === 'Staff' ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                          Nhân viên
                        </p>
                        <p className={`text-[10px] mt-0.5 ${roleName === 'Staff' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                          Quản trị tòa nhà này
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-2xl text-sm font-bold transition-colors"
                disabled={inviteMutation.isPending}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={inviteMutation.isPending || !email}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Gửi thư mời
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
