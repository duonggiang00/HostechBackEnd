import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { echo } from '@/shared/utils/echo';
import { ticketKeys } from './useTickets';

/**
 * Kênh `org.{orgId}` — Staff / Manager nhận realtime khi:
 *  - Tenant tạo ticket mới          → `ticket.created`
 *  - Ticket thay đổi trạng thái     → `ticket.updated`
 *  - Tenant / ai đó gửi comment     → `ticket.comment_added`
 */
export function useOrgTicketRealtime(orgId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!echo || !orgId) return;

    const channel = echo.private(`org.${orgId}`);

    const onTicketCreated = (payload: {
      id?: string;
      property_id?: string;
      room_code?: string;
      category?: string;
      description?: string;
    }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      // Badge sidebar
      queryClient.invalidateQueries({ queryKey: ['tickets', 'list'] });
      toast(`🎫 Yêu cầu hỗ trợ mới${payload.room_code ? ` — phòng ${payload.room_code}` : ''}`, {
        id: `ticket-created-${payload.id ?? Date.now()}`,
        duration: 6000,
      });
    };

    const onTicketUpdated = (payload: { id?: string }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      if (payload.id) {
        queryClient.invalidateQueries({ queryKey: ticketKeys.detail(payload.id) });
      }
    };

    const onCommentAdded = (payload: { ticket_id?: string }) => {
      if (payload.ticket_id) {
        queryClient.invalidateQueries({ queryKey: ticketKeys.detail(payload.ticket_id) });
      }
    };

    channel.listen('.ticket.created', onTicketCreated);
    channel.listen('.ticket.updated', onTicketUpdated);
    channel.listen('.ticket.comment_added', onCommentAdded);

    return () => {
      channel.stopListening('.ticket.created');
      channel.stopListening('.ticket.updated');
      channel.stopListening('.ticket.comment_added');
    };
  }, [orgId, queryClient]);
}

/**
 * Kênh `App.Models.Org.User.{userId}` — Tenant nhận realtime khi:
 *  - Staff / Manager thay đổi trạng thái ticket  → `ticket.updated`
 *  - Staff / Manager gửi comment phản hồi        → `ticket.comment_added`
 */
export function useTenantTicketRealtime(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!echo || !userId) return;

    const channel = echo.private(`App.Models.Org.User.${userId}`);

    const onTicketUpdated = (payload: { id?: string; status?: string }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      if (payload.id) {
        queryClient.invalidateQueries({ queryKey: ticketKeys.detail(payload.id) });
      }
      if (payload.status) {
        toast(`Ticket của bạn đã được cập nhật trạng thái.`, {
          id: `ticket-updated-${payload.id ?? Date.now()}`,
          duration: 5000,
        });
      }
    };

    const onCommentAdded = (payload: { ticket_id?: string }) => {
      if (payload.ticket_id) {
        queryClient.invalidateQueries({ queryKey: ticketKeys.detail(payload.ticket_id) });
      }
      toast('💬 Ban quản lý đã phản hồi yêu cầu của bạn.', {
        id: `ticket-comment-${payload.ticket_id ?? Date.now()}`,
        duration: 5000,
      });
    };

    channel.listen('.ticket.updated', onTicketUpdated);
    channel.listen('.ticket.comment_added', onCommentAdded);

    return () => {
      channel.stopListening('.ticket.updated');
      channel.stopListening('.ticket.comment_added');
    };
  }, [userId, queryClient]);
}
