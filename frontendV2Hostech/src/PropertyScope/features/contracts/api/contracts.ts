import apiClient from '@/shared/api/client';
import type { Contract } from '../types';

export const contractsApi = {
  getContracts: async (roomId: string) => {
    const response = await apiClient.get('/contracts', {
      params: {
        'filter[room_id]': roomId,
        include: 'tenant'
      }
    });
    console.log(`📡 API: GET /contracts?filter[room_id]=${roomId}:`, response.data.data || response.data);
    return (response.data.data || response.data) as Contract[];
  },

  createContract: async (newContract: Partial<Contract>) => {
    const response = await apiClient.post('/contracts', newContract);
    console.log('📡 API: POST /contracts (Created):', response.data.data || response.data);
    return (response.data.data || response.data) as Contract;
  },
};
