import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';
import type { Notification } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiNotification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: string;
  data: {
    type?: string;
    message?: string;
    title?: string;
    description?: string;
    action_url?: string;
    [key: string]: unknown;
  };
  read_at: string | null;
  created_at: string;
}

interface PaginatedNotifications {
  data: ApiNotification[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  links: {
    next?: string | null;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function apiNotificationToLocal(n: ApiNotification): Notification {
  const data = n.data ?? {};
  const sourceType = data.type ?? '';

  const typeMap: Record<string, Notification['type']> = {
    'ticket.created': 'alert',
    'meter_reading_rejected': 'alert',
    'contract.signature_requested': 'alert',
    'meter_reading_submitted': 'message',
    'contract.signed': 'message',
    'meter_reading_approved': 'update',
    'payment.received': 'update',
  };

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    return `${Math.floor(hrs / 24)} ngày trước`;
  };

  return {
    id: n.id,
    title: (data.title as string) || 'Thông báo',
    description: (data.message as string) || (data.description as string) || '',
    time: relativeTime(n.created_at),
    type: typeMap[sourceType] ?? 'update',
    unread: n.read_at === null,
    source_type: sourceType,
    action_url: data.action_url as string | undefined,
    read_at: n.read_at,
    raw: data as Record<string, unknown>,
  };
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => ['notifications', 'list'] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Paginated notification inbox — `GET /api/notifications`
 */
export function useNotifications() {
  return useInfiniteQuery<PaginatedNotifications>({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get('/notifications', { params: { page: pageParam } }).then((r) => r.data),
    getNextPageParam: (last) =>
      last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30_000,
  });
}

/**
 * Unread notification count — `GET /api/notifications/unread-count`
 * Refetches every 60 s so the bell badge stays roughly in sync.
 */
export function useUnreadNotificationCount() {
  return useQuery<{ count: number }>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => apiClient.get('/notifications/unread-count').then((r) => r.data),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

/**
 * Mark a single notification as read — `PATCH /api/notifications/{id}/read`
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

/**
 * Mark all notifications as read — `POST /api/notifications/mark-all-read`
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post('/notifications/mark-all-read').then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}
