import apiClient from '@/shared/api/client';
import type { Meter, MeterReading } from '../types';

export const meteringApi = {
  uploadReadingProof: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection', 'reading_proofs');

    const response = await apiClient.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data?.data as {
      media_id: string;
      temporary_upload_id: string;
      url: string;
      file_name: string;
      mime_type: string;
      size: number;
    };
  },

  // Meter CRUD Operations
  getMeters: async (propertyId: string, filters?: Record<string, any>, search?: string, page: number = 1, perPage: number = 15) => {
    // Format filters properly for Laravel's filter[] syntax
    const params: Record<string, any> = {
      page,
      per_page: perPage,
      include: 'room,latestReading,latestApprovedReading', // Load essential relations for status
    };

    // Add filter parameters in bracket notation
    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params[`filter[${key}]`] = value;
        }
      });
    }

    if (search) {
      params.search = search;
    }

    console.log(`📡 Meter API Params:`, params);
    const response = await apiClient.get(`/properties/${propertyId}/meters`, { params });
    console.log(`📡 API Response:`, response.data);

    // Return full response with pagination metadata
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // Paginated response format
      const paginatedResponse = {
        data: response.data.data,
        pagination: {
          total: response.data.meta?.total || 0,
          per_page: response.data.meta?.per_page || perPage,
          current_page: response.data.meta?.current_page || page,
          last_page: response.data.meta?.last_page || 1,
          from: response.data.meta?.from || 1,
          to: response.data.meta?.to || response.data.data.length,
        },
        links: response.data.links || {},
      };
      console.log(`📡 Paginated Response:`, paginatedResponse);
      return paginatedResponse;
    }

    // Fallback for direct array response
    const data = Array.isArray(response.data) ? response.data : [];
    console.log(`📡 Extracted Meters (${data?.length || 0}):`, data);

    // Return as paginated format for consistency
    return {
      data,
      pagination: {
        total: data.length,
        per_page: perPage,
        current_page: page,
        last_page: Math.ceil(data.length / perPage),
        from: 1,
        to: data.length,
      },
      links: {},
    };
  },

  getMeter: async (meterId: string) => {
    const response = await apiClient.get(`/meters/${meterId}`, {
      params: { include: 'room,meter_readings' }
    });
    console.log(`📡 API: GET /meters/${meterId}:`, response.data.data);
    return response.data.data as Meter;
  },

  createMeter: async (data: Partial<Meter>) => {
    const response = await apiClient.post('/meters', data);
    console.log(`📡 API: POST /meters (Created):`, response.data.data);
    return response.data.data as Meter;
  },

  updateMeter: async (meterId: string, data: Partial<Meter>) => {
    const response = await apiClient.put(`/meters/${meterId}`, data);
    console.log(`📡 API: PUT /meters/${meterId} (Updated):`, response.data.data);
    return response.data.data as Meter;
  },

  deleteMeter: async (meterId: string) => {
    const response = await apiClient.delete(`/meters/${meterId}`);
    console.log(`📡 API: DELETE /meters/${meterId} (Deleted):`, response.status);
    return response;
  },

  // Meter Reading Operations
  getMeterReadings: async (meterId: string, page: number = 1, perPage: number = 20, filters?: Record<string, any>) => {
    // Ensure meter_id is properly included in the filter
    const params: Record<string, any> = {
      page,
      per_page: perPage,
      sort: '-period_end',
      include: 'submittedBy,approvedBy,media,meter,meter.room',
      // Always filter by meter_id to get the correct meter's readings
      'filter[meter_id]': meterId,
    };

    // Add custom filters if provided
    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params[`filter[${key}]`] = value;
        }
      });
    }

    console.log(`📡 Meter Readings API Params:`, params);
    const response = await apiClient.get(`/meters/${meterId}/readings`, { params });
    console.log(`📡 API: GET /meters/${meterId}/readings:`, response.data);
    return response.data.data || response.data;
  },

  getMeterReading: async (meterId: string, readingId: string) => {
    const response = await apiClient.get(`/meters/${meterId}/readings/${readingId}`, {
      params: { include: 'meter,submittedBy,approvedBy,media' }
    });
    console.log(`📡 API: GET /meters/${meterId}/readings/${readingId}:`, response.data.data);
    return response.data.data as MeterReading;
  },

  createReading: async (meterId: string, data: { reading_value: number; period_start: string; period_end: string; meta?: Record<string, any>; proof_media_ids?: string[] }) => {
    // Ensure dates are in YYYY-MM-DD format
    const payload = {
      reading_value: data.reading_value,
      period_start: data.period_start, // Should be YYYY-MM-DD from input type="date"
      period_end: data.period_end,     // Should be YYYY-MM-DD from input type="date"
      ...(data.meta && { meta: data.meta }),
      ...(data.proof_media_ids && data.proof_media_ids.length > 0 ? { proof_media_ids: data.proof_media_ids } : {}),
    };

    console.log(`📤 Sending POST /meters/${meterId}/readings:`, JSON.stringify(payload, null, 2));
    console.log(`📊 Payload details:`, {
      meterId,
      reading_value: `${payload.reading_value} (type: ${typeof payload.reading_value})`,
      period_start: `${payload.period_start} (type: ${typeof payload.period_start})`,
      period_end: `${payload.period_end} (type: ${typeof payload.period_end})`,
    });

    try {
      const response = await apiClient.post(`/meters/${meterId}/readings`, payload);
      console.log(`📡 API: POST /meters/${meterId}/readings -Status ${response.status}:`, response.data);
      const result = response.data.data || response.data;
      console.log(`📡 API: POST /meters/${meterId}/readings (Created):`, result);
      return result as MeterReading;
    } catch (error: any) {
      console.error(`❌ API Error:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  updateReading: async (meterId: string, readingId: string, data: Partial<MeterReading>) => {
    const response = await apiClient.put(`/meters/${meterId}/readings/${readingId}`, data);
    console.log(`📡 API: PUT /meters/${meterId}/readings/${readingId} (Updated):`, response.data.data);
    return response.data.data as MeterReading;
  },

  approveReading: async (meterId: string, readingId: string) => {
    const response = await apiClient.put(`/meters/${meterId}/readings/${readingId}`, { status: 'APPROVED' });
    const result = response.data.data || response.data;
    console.log(`📡 API: Approved reading:`, result);
    return result as MeterReading;
  },

  submitReading: async (meterId: string, readingId: string) => {
    const response = await apiClient.put(`/meters/${meterId}/readings/${readingId}`, { status: 'SUBMITTED' });
    const result = response.data.data || response.data;
    console.log(`📡 API: Submitted reading:`, result);
    return result as MeterReading;
  },

  rejectReading: async (meterId: string, readingId: string, reason?: string) => {
    const response = await apiClient.put(`/meters/${meterId}/readings/${readingId}`, {
      status: 'REJECTED',
      rejection_reason: reason,
      meta: reason ? { rejection_reason: reason } : undefined,
    });
    const result = response.data.data || response.data;
    console.log(`📡 API: Rejected reading:`, result);
    return result as MeterReading;
  },

  deleteReading: async (meterId: string, readingId: string) => {
    const response = await apiClient.delete(`/meters/${meterId}/readings/${readingId}`);
    console.log(`📡 API: DELETE reading:`, response.status);
    return response;
  },

  bulkCreateReadings: async (propertyId: string, readings: any[]) => {
    const response = await apiClient.post(`/properties/${propertyId}/meters/bulk-readings`, { readings });
    console.log(`📡 API: POST bulk readings:`, response.data);
    return response.data.data || response.data;
  },

  bulkSubmitReadings: async (readingIds: string[]) => {
    const response = await apiClient.post('/meter-readings/bulk-submit', {
      reading_ids: readingIds,
    });
    console.log(`📡 API: POST bulk-submit:`, response.data);
    return response.data.data || response.data;
  },

  /**
   * Lấy readings (Toàn cục) - Hỗ trợ lọc theo property_id, status.
   */
  getGlobalReadings: async (params?: {
    property_id?: string;
    status?: string;
    period_start?: string;
    period_end?: string;
    page?: number;
    per_page?: number;
    include?: string;
  }) => {
    const queryParams: Record<string, any> = {
      page: params?.page || 1,
      per_page: params?.per_page || 50,
      include: params?.include || 'meter,meter.room,submittedBy',
    };

    if (params?.property_id) queryParams['filter[property_id]'] = params.property_id;
    if (params?.status) queryParams['filter[status]'] = params.status;
    // ... add more filters if needed

    const response = await apiClient.get('/meter-readings', { params: queryParams });
    return response.data;
  },

  /**
   * Lấy readings cho nhiều meters (Tối ưu hóa: dùng global endpoint nếu có property_id).
   */
  getReadingsForMeters: async (
    meterIds: string[],
    params?: { property_id?: string; status?: string; period_start?: string; period_end?: string; per_page?: number }
  ): Promise<{ data: (MeterReading & { meter_id: string })[]; meta: { total: number } }> => {
    // Nếu có property_id, dùng endpoint global mới để lấy tất cả trong 1 nốt nhạc
    if (params?.property_id) {
      const response = await meteringApi.getGlobalReadings({
        property_id: params.property_id,
        status: params.status,
        per_page: params.per_page || 100,
      });

      const list = (response.data || []).map((r: any) => ({
        ...r,
        meter_id: r.meter?.id || r.meter_id,
      }));

      return { data: list, meta: { total: response.meta?.total || list.length } };
    }

    // Fallback: nếu không có property_id (hiếm khi xảy ra trong context này)
    if (!meterIds.length) return { data: [], meta: { total: 0 } };

    const results = await Promise.allSettled(
      meterIds.map(meterId =>
        apiClient.get(`/meters/${meterId}/readings`, {
          params: {
            include: 'meter,meter.room,submittedBy',
            'filter[status]': params?.status || undefined,
            per_page: params?.per_page ?? 50,
          },
        }).then(res => {
          const list: MeterReading[] = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
          return list.map(r => ({ ...r, meter_id: meterId }));
        })
      )
    );

    const allReadings: (MeterReading & { meter_id: string })[] = [];
    results.forEach(r => {
      if (r.status === 'fulfilled') allReadings.push(...r.value);
    });

    return { data: allReadings, meta: { total: allReadings.length } };
  },

  // Duyệt nhiều chốt số cùng lúc (gọi từng cái song song)
  bulkApproveReadings: async (items: { meterId: string; readingId: string }[]) => {
    const results = await Promise.allSettled(
      items.map(({ meterId, readingId }) =>
        apiClient.put(`/meters/${meterId}/readings/${readingId}`, { status: 'APPROVED' })
      )
    );
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    return { succeeded, failed };
  },

  bulkRejectReadings: async (items: { meterId: string; readingId: string }[], reason?: string) => {
    const results = await Promise.allSettled(
      items.map(({ meterId, readingId }) =>
        apiClient.put(`/meters/${meterId}/readings/${readingId}`, { status: 'REJECTED', meta: { rejection_reason: reason } })
      )
    );
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    return { succeeded, failed };
  },

  // Legacy method
  addReading: async (meterId: string, reading_value: number, reading_date: string, photo?: File) => {
    const formData = new FormData();
    formData.append('reading_value', reading_value.toString());
    formData.append('reading_date', reading_date);
    if (photo) {
      formData.append('photo', photo);
    }

    const response = await apiClient.post(`/meters/${meterId}/readings`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    console.log(`📡 API: POST /meters/${meterId}/readings (Added):`, response.data.data);
    return response.data.data as MeterReading;
  },
};
