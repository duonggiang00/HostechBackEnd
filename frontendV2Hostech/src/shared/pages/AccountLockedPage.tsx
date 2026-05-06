import { motion } from 'framer-motion';
import { ShieldX, Phone, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccountLockedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-10 text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
          className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center"
        >
          <ShieldX className="w-10 h-10 text-red-500 dark:text-red-400" />
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
          Tài khoản bị khóa
        </h1>

        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
          Tài khoản của bạn đã bị tạm khóa bởi ban quản lý. Bạn không thể truy cập hệ thống trong thời gian này. Vui lòng liên hệ trực tiếp với chủ trọ / ban quản lý để được hỗ trợ mở lại.
        </p>

        {/* Info box */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-5 mb-8 text-left space-y-3">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2">
            Cách liên hệ
          </p>
          <div className="flex items-center gap-3 text-sm text-amber-700 dark:text-amber-400">
            <Phone className="w-4 h-4 shrink-0" />
            <span>Gọi điện hoặc nhắn tin trực tiếp cho quản lý tòa nhà</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-amber-700 dark:text-amber-400">
            <Mail className="w-4 h-4 shrink-0" />
            <span>Gửi email cho ban quản trị để yêu cầu mở khóa tài khoản</span>
          </div>
        </div>

        {/* Back to login */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại trang đăng nhập
        </Link>
      </motion.div>
    </div>
  );
}
