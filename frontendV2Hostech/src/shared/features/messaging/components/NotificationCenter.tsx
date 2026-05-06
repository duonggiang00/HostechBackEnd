import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Bell, MessageSquare, Megaphone, Trash2,
  FileSignature, CreditCard, AlertCircle, CheckCircle2,
  XCircle, Activity, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { echo } from '@/shared/utils/echo';
import toast from 'react-hot-toast';

import type { Notification } from '../types';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  apiNotificationToLocal,
  notificationKeys,
} from '../hooks/useNotifications';

// ─── Notification content mapper ─────────────────────────────────────────────

interface NotifContent {
  icon: React.ReactNode;
  badgeClass: string;
}

function getNotificationContent(sourceType?: string): NotifContent {
  switch (sourceType) {
    case 'ticket.created':
      return {
        icon: <AlertCircle className="w-5 h-5" />,
        badgeClass: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
      };
    case 'contract.signed':
      return {
        icon: <FileSignature className="w-5 h-5" />,
        badgeClass: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
      };
    case 'contract.signature_requested':
      return {
        icon: <FileSignature className="w-5 h-5" />,
        badgeClass: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
      };
    case 'meter_reading_submitted':
      return {
        icon: <Activity className="w-5 h-5" />,
        badgeClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
      };
    case 'meter_reading_approved':
      return {
        icon: <CheckCircle2 className="w-5 h-5" />,
        badgeClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
      };
    case 'meter_reading_rejected':
      return {
        icon: <XCircle className="w-5 h-5" />,
        badgeClass: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
      };
    case 'payment.received':
      return {
        icon: <CreditCard className="w-5 h-5" />,
        badgeClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
      };
    case 'message':
      return {
        icon: <MessageSquare className="w-5 h-5" />,
        badgeClass: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
      };
    case 'announcement':
      return {
        icon: <Megaphone className="w-5 h-5" />,
        badgeClass: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
      };
    default:
      return {
        icon: <Bell className="w-5 h-5" />,
        badgeClass: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
      };
  }
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-5 rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-2/3" />
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-full" />
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Notification item ────────────────────────────────────────────────────────

interface NotifItemProps {
  notif: Notification;
  onRead: (id: string) => void;
}

function NotificationItem({ notif, onRead }: NotifItemProps) {
  const navigate = useNavigate();
  const { icon, badgeClass } = getNotificationContent(notif.source_type ?? notif.type);

  const handleClick = () => {
    if (notif.unread) onRead(notif.id);
    if (notif.action_url) navigate(notif.action_url);
  };

  return (
    <motion.div
      key={notif.id}
      whileHover={{ scale: 1.01 }}
      onClick={handleClick}
      className={`relative p-5 rounded-3xl border transition-all cursor-pointer group ${
        notif.unread
          ? 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/50 shadow-lg shadow-indigo-100/20 dark:shadow-indigo-900/10'
          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
      }`}
    >
      {notif.unread && (
        <div className="absolute top-5 right-5 w-2 h-2 bg-indigo-600 rounded-full" />
      )}
      <div className="flex gap-4">
        <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center transition-all ${badgeClass}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {notif.title}
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-3 mt-1 line-clamp-2">
            {notif.description}
          </p>
          <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-tighter">
            {notif.time}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  // Flatten pages into a single list
  const notifications: Notification[] = (data?.pages ?? [])
    .flatMap((page) => page.data)
    .map(apiNotificationToLocal);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Real-time: invalidate on new notification broadcast
  const handleEchoNotification = useCallback(
    (e: Record<string, unknown>) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });

      const sourceType = e.type as string | undefined;
      const titleMap: Record<string, string> = {
        'ticket.created': 'Yêu cầu hỗ trợ mới',
        'contract.signed': 'Cư dân đã ký hợp đồng',
        'contract.signature_requested': 'Hợp đồng đang chờ bạn ký',
        'meter_reading_submitted': 'Nhân viên đã ghi chỉ số',
        'meter_reading_approved': 'Chỉ số đã được duyệt',
        'meter_reading_rejected': 'Chỉ số bị từ chối',
        'payment.received': 'Thanh toán đã được xác nhận',
      };
      const title = (sourceType && titleMap[sourceType]) || (e.message as string) || 'Thông báo mới';
      toast(title, { duration: 5000, position: 'top-right' });
    },
    [queryClient],
  );

  useEffect(() => {
    if (!user?.id || !echo) return;

    const channel = echo.private(`App.Models.Org.User.${user.id}`);
    channel.notification(handleEchoNotification);

    return () => {
      echo?.leave(`App.Models.Org.User.${user.id}`);
    };
  }, [user?.id, handleEchoNotification]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] cursor-zoom-out"
          />
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl z-[110] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                  <Bell className="w-6 h-6 text-indigo-600" />
                  Thông báo
                  {unreadCount > 0 && (
                    <span className="text-sm font-bold text-white bg-indigo-600 rounded-full px-2 py-0.5 min-w-[22px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </h2>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                  Các việc cần xử lý được ưu tiên hiển thị
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-2xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {isLoading ? (
                <NotificationSkeleton />
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Không có thông báo nào</p>
                  <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Mọi thứ đang ổn định</p>
                </div>
              ) : (
                <>
                  {notifications.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notif={notif}
                      onRead={(id) => markRead(id)}
                    />
                  ))}
                  {hasNextPage && (
                    <div className="pt-2 text-center">
                      <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mx-auto"
                      >
                        {isFetchingNextPage && <Loader2 className="w-3 h-3 animate-spin" />}
                        Tải thêm
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <button
                onClick={() => markAllRead()}
                disabled={isMarkingAll || unreadCount === 0}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isMarkingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Đánh dấu tất cả đã xem
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-900 dark:hover:bg-slate-600 hover:text-white dark:hover:text-white transition-all shadow-sm"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
