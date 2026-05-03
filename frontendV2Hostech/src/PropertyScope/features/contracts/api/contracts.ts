import apiClient from '@/shared/api/client';
import type {
  Contract,
  ContractListResponse,
  ContractQueryParams,
  CreateContractPayload,
  FinalizeTerminationData,
  FinalizeTerminationResult,
  RequestTerminationNoticeResponse,
  TerminationHandoverItemRow,
  TerminationHandoverPersisted,
  TerminationHandoverStateResponse,
  TerminationSyncPayload,
} from '../types';

export const contractsApi = {
  getContracts: async (params?: ContractQueryParams, signal?: AbortSignal): Promise<ContractListResponse> => {
    const apiParams: Record<string, any> = {
      'filter[property_id]': params?.property_id || undefined,
      'filter[room_id]': params?.room_id || undefined,
      'filter[status]': params?.status || undefined,
      search: params?.search || undefined,
      sort: params?.sort || undefined,
      with_trashed: params?.with_trashed ? 1 : undefined,
      page: params?.page ?? 1,
      per_page: params?.per_page ?? 15,
    };

    const response = await apiClient.get('/contracts', { params: apiParams, signal });

    // Handle paginated response with status_counts
    const data = response.data?.data && Array.isArray(response.data.data)
      ? response.data.data as Contract[]
      : (response.data || []) as Contract[];

    const status_counts = response.data?.status_counts ?? {
      total: 0, DRAFT: 0, PENDING_SIGNATURE: 0, PENDING_PAYMENT: 0,
      ACTIVE: 0, PENDING_TERMINATION: 0, ENDED: 0, TERMINATED: 0, EXPIRED: 0, CANCELLED: 0, expiring: 0, invoice_debt: 0,
    };

    return { data, status_counts };
  },

  getTrashContracts: async (params?: ContractQueryParams, signal?: AbortSignal) => {
    const apiParams: Record<string, any> = {
      'filter[property_id]': params?.property_id || undefined,
      'filter[room_id]': params?.room_id || undefined,
      'filter[status]': params?.status || undefined,
      search: params?.search || undefined,
      sort: params?.sort || undefined,
      page: params?.page ?? 1,
      per_page: params?.per_page ?? 15,
    };

    const response = await apiClient.get('/contracts/trash', { params: apiParams, signal });
    return (response.data?.data || response.data) as Contract[];
  },

  getContract: async (id: string, signal?: AbortSignal) => {
    const response = await apiClient.get(`/contracts/${id}`, { signal });
    return response.data?.data as Contract;
  },

  createContract: async (data: CreateContractPayload) => {
    const response = await apiClient.post('/contracts', data);
    return response.data?.data as Contract;
  },

  updateContract: async (id: string, data: Partial<CreateContractPayload>) => {
    const response = await apiClient.put(`/contracts/${id}`, data);
    return response.data?.data as Contract;
  },

  deleteContract: async (id: string) => {
    const response = await apiClient.delete(`/contracts/${id}`);
    return response.data;
  },

  restoreContract: async (id: string) => {
    const response = await apiClient.post(`/contracts/${id}/restore`);
    return response.data?.data as Contract;
  },

  forceDeleteContract: async (id: string) => {
    const response = await apiClient.delete(`/contracts/${id}/force`);
    return response.data;
  },

  getMyPendingContracts: async () => {
    const response = await apiClient.get('/contracts/my-pending');
    return (response.data?.data || response.data) as Contract[];
  },

  getMyContracts: async () => {
    const response = await apiClient.get('/contracts/my-contracts');
    return (response.data?.data || response.data) as Contract[];
  },

  acceptSignature: async (id: string) => {
    const response = await apiClient.post(`/contracts/${id}/accept-signature`);
    return response.data;
  },

  signContract: async (id: string, signature_image: string) => {
    const response = await apiClient.post(`/contracts/${id}/sign`, { signature_image });
    return response.data;
  },

  rejectSignature: async (id: string) => {
    const response = await apiClient.post(`/contracts/${id}/reject-signature`);
    return response.data;
  },

  getAvailableRooms: async (id: string) => {
    const response = await apiClient.get(`/contracts/${id}/available-rooms`);
    return response.data;
  },

  requestRoomTransfer: async (id: string, data: any) => {
    const response = await apiClient.post(`/contracts/${id}/room-transfer-request`, data);
    return response.data;
  },

  requestRenewal: async (id: string, data: { requested_end_date: string; reason?: string }) => {
    const response = await apiClient.post(`/contracts/${id}/request-renewal`, data);
    return response.data as { message: string; contract: { id: string } };
  },

  approveRenewal: async (id: string, data?: { request_index?: number }) => {
    const response = await apiClient.post(`/contracts/${id}/approve-renewal`, data ?? {});
    return response.data as { message: string; data: { contract_id: string; end_date: string | null } };
  },

  previewRoomTransfer: async (
    id: string,
    params: { target_room_id: string; transfer_date: string; rent_price?: number },
    signal?: AbortSignal,
  ) => {
    const response = await apiClient.get(`/contracts/${id}/transfer/preview`, { params, signal });
    return response.data.data as {
      transfer_date: string;
      target_room_id: string;
      resolved_new_rent: number;
      meters_sealed: boolean;
      unread_meter_codes: string[];
      outstanding_invoice_count: number;
      has_invoice_lines: boolean;
      line_preview: { description: string; amount: number; type: string }[];
      estimated_invoice_total: number;
    };
  },

  issueRoomTransferFinalInvoice: async (
    id: string,
    data: { target_room_id: string; transfer_date: string; rent_price?: number },
  ) => {
    const response = await apiClient.post(`/contracts/${id}/transfer/issue-final-invoice`, data);
    return response.data as {
      message: string;
      data: { invoice_id: string | null; total_amount: number | null; status: string | null };
    };
  },

  executeRoomTransfer: async (id: string, data: {
    target_room_id: string;
    transfer_date: string;
    rent_price?: number;
    deposit_amount?: number;
    linked_transfer_invoice_id?: string;
  }) => {
    const response = await apiClient.post(`/contracts/${id}/execute-transfer`, data);
    return response.data as {
      message: string;
      data: {
        new_contract_id: string;
        old_contract_id: string;
      };
    };
  },

  requestTermination: async (
    id: string,
    data: { expected_move_out_date: string; reason?: string },
  ) => {
    const response = await apiClient.post(`/contracts/${id}/request-termination`, data);
    return response.data as RequestTerminationNoticeResponse;
  },

  getStatusHistories: async (id: string) => {
    const response = await apiClient.get(`/contracts/${id}/status-histories`);
    return response.data?.data;
  },

  terminateContract: async (
    id: string,
    data: TerminationSyncPayload & {
      cancellation_reason?: string;
      forfeit_deposit?: boolean;
    },
  ) => {
    const response = await apiClient.post(`/contracts/${id}/terminate`, data);
    return response.data as {
      message?: string;
      status?: string;
      contract_id?: string;
      property_id?: string;
      processing_mode?: string;
    };
  },

  /** POST /handovers/{id}/document-scans — ảnh minh chứng biên bản (sau khi đã lưu handover). */
  uploadHandoverDocumentScan: async (handoverId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post(`/handovers/${handoverId}/document-scans`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data as { message: string; url: string; id: number | string };
  },

  /**
   * Bước 5 wizard: phát hành hóa đơn thanh lý cuối (đồng bộ).
   */
  issueFinalInvoice: async (
    id: string,
    data: TerminationSyncPayload & { cancellation_reason?: string },
  ) => {
    const response = await apiClient.post(`/contracts/${id}/terminate/issue-final-invoice`, data);
    return response.data as {
      message: string;
      data: {
        invoice_id: string;
        invoice_no?: string | null;
        total_amount: number;
        status: string;
        billing_mode: 'combined' | 'split';
        /** Chỉ có khi gắn qua `linkTerminationFinalInvoice`. */
        linked_from_billing?: boolean;
        items: Array<{ type: string; description: string; quantity: number; unit_price: number; amount: number }>;
      };
    };
  },

  /** Gắn HĐ billing (ISSUED) làm HĐ thanh lý cuối — luồng linh hoạt. */
  linkTerminationFinalInvoice: async (
    id: string,
    data: { invoice_id: string } & TerminationSyncPayload & { cancellation_reason?: string; refund_remaining_rent?: boolean },
  ) => {
    const response = await apiClient.post(`/contracts/${id}/terminate/link-final-invoice`, data);
    return response.data as {
      message: string;
      data: {
        invoice_id: string;
        invoice_no?: string | null;
        total_amount: number;
        status: string;
        billing_mode: 'combined' | 'split';
        linked_from_billing?: boolean;
        items: Array<{ type: string; description: string; quantity: number; unit_price: number; amount: number }>;
      };
    };
  },

  /** GET — HĐ thanh lý đã gắn (sau reload / mở lại wizard). */
  getTerminationLinkedFinalInvoice: async (id: string, signal?: AbortSignal) => {
    const response = await apiClient.get(`/contracts/${id}/termination/linked-final-invoice`, { signal });
    return response.data as {
      message: string;
      data: {
        invoice_id: string;
        invoice_no?: string | null;
        total_amount: number;
        status: string;
        billing_mode: 'combined' | 'split';
        linked_from_billing?: boolean;
        items: Array<{ type: string; description: string; quantity: number; unit_price: number; amount: number }>;
      } | null;
    };
  },

  /**
   * Bước 6 wizard: cấn trừ cọc + tạo refund-receipt hoặc final-payment-request (đồng bộ).
   */
  finalizeTermination: async (id: string, data?: FinalizeTerminationData) => {
    const response = await apiClient.post(`/contracts/${id}/terminate/finalize`, data ?? {});
    return response.data as {
      message: string;
      data: FinalizeTerminationResult;
    };
  },

  getTerminationHandover: async (id: string, signal?: AbortSignal) => {
    const response = await apiClient.get(`/contracts/${id}/termination-handover`, { signal });
    return response.data as {
      message: string;
      data: TerminationHandoverStateResponse;
    };
  },

  commitTerminationHandover: async (
    id: string,
    data: {
      items?: Array<{ room_asset_id: string; condition?: 'OK' | 'MISSING' | 'DAMAGED' | null }>;
      note?: string | null;
    },
  ) => {
    const response = await apiClient.post(`/contracts/${id}/termination-handover`, data);
    return response.data as {
      message: string;
      data: {
        persisted: boolean;
        handover: TerminationHandoverPersisted;
        items: TerminationHandoverItemRow[];
      };
    };
  },

  /**
   * Lấy chi tiết Final Payment Request (kịch bản B sau thanh lý).
   */
  getFinalPaymentRequest: async (id: string) => {
    const response = await apiClient.get(`/final-payment-requests/${id}`);
    return response.data as {
      data: {
        id: string;
        status: string;
        amount_due: number;
        outstanding: number;
        created_at: string | null;
        meta: Record<string, unknown> | null;
        contract: { id: string; status: string };
        invoice: {
          id: string;
          invoice_no?: string | null;
          total_amount: number;
          paid_amount: number;
          status: string;
          is_termination: boolean;
        } | null;
        supplemental_debt_invoice_mode?: boolean;
        termination_invoice_id?: string | null;
        supplemental_invoice_id?: string | null;
        vnpay_configured: boolean;
      };
    };
  },

  /**
   * Tạo URL VNPay cho Final Payment Request — Manager gửi link/QR cho khách.
   */
  buildFinalPaymentRequestPaymentUrl: async (id: string) => {
    const response = await apiClient.post(`/final-payment-requests/${id}/payment-url`);
    return response.data as {
      data: { payment_url: string; payment_id: string; amount: number };
    };
  },

  /**
   * Manager ghi nhận thu tiền mặt cho Final Payment Request.
   */
  recordCashPaymentForFpr: async (
    id: string,
    data: { amount?: number; method?: 'CASH' | 'BANK_TRANSFER'; note?: string; proof_image?: File },
  ) => {
    if (data.proof_image) {
      const fd = new FormData();
      if (data.amount != null) fd.append('amount', String(data.amount));
      fd.append('method', data.method ?? 'BANK_TRANSFER');
      if (data.note) fd.append('note', data.note);
      fd.append('proof_image', data.proof_image);
      const response = await apiClient.post(`/final-payment-requests/${id}/record-cash-payment`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data as {
        message: string;
        data: {
          payment_id: string;
          amount: number;
          final_payment_request_status: string;
          contract_status: string;
          /** FPR chuyển sang SATISFIED sau ghi nhận thu (hợp đồng có thể đã TERMINATED trước đó nếu kịch B). */
          is_terminated: boolean;
          proof_receipt?: { id: string; kind: string; url: string } | null;
        };
      };
    }
    const response = await apiClient.post(`/final-payment-requests/${id}/record-cash-payment`, {
      amount: data.amount,
      method: data.method,
      note: data.note,
    });
    return response.data as {
      message: string;
      data: {
        payment_id: string;
        amount: number;
        final_payment_request_status: string;
        contract_status: string;
        /** FPR chuyển sang SATISFIED sau ghi nhận thu (hợp đồng có thể đã TERMINATED trước đó nếu kịch B). */
        is_terminated: boolean;
        proof_receipt?: { id: string; kind: string; url: string } | null;
      };
    };
  },

  generateDocument: async (id: string, data?: { extra_notes?: string; landlord_name?: string; landlord_phone?: string }) => {
    const response = await apiClient.post(`/contracts/${id}/generate-document`, data);
    return response.data; // { message, document_path, download_url }
  },

  downloadDocument: async (id: string, revision?: string): Promise<Blob> => {
    const response = await apiClient.get(`/contracts/${id}/document/download`, {
      responseType: 'blob',
      params: {
        _t: revision || Date.now().toString(),
      },
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    return response.data;
  },

  scanContract: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    // Optional: add template_id if needed in the future
    const response = await apiClient.post('/contracts/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data;
  },

  addContractMember: async (contractId: string, memberData: any) => {
    const response = await apiClient.post(`/contracts/${contractId}/members`, memberData);
    return response.data?.data;
  },

  updateContractMember: async (contractId: string, memberId: string, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/contracts/${contractId}/members/${memberId}`, data);
    return response.data?.data;
  },

  removeContractMember: async (contractId: string, memberId: string) => {
    const response = await apiClient.delete(`/contracts/${contractId}/members/${memberId}`);
    return response.data;
  },

  approveContractMember: async (contractId: string, memberId: string) => {
    // Backend route uses PUT: contracts/{contract}/members/{member}/approve
    const response = await apiClient.put(`/contracts/${contractId}/members/${memberId}/approve`);
    return response.data?.data;
  },

  getPendingRequests: async (propertyId: string) => {
    const response = await apiClient.get(`/properties/${propertyId}/pending-requests`);
    return response.data as import('../types').PendingRequestsResponse;
  },
};
