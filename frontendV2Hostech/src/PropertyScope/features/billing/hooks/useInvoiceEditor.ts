import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { roomsApi } from '@/PropertyScope/features/rooms/api/rooms';
import { billingApi } from '@/PropertyScope/features/billing/api/billing';
import { toast } from 'react-hot-toast';
import type { 
  EditableInvoiceItem, 
  TieredRate, 
  CreateInvoicePayload 
} from '../types';

interface UseInvoiceEditorProps {
  propertyId: string;
  navigate: (path: string) => void;
}

export const useInvoiceEditor = ({ propertyId, navigate }: UseInvoiceEditorProps) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Period State
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  // Invoice Items State
  const [invoiceItems, setInvoiceItems] = useState<EditableInvoiceItem[]>([]);

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['property-rooms-simple', propertyId],
    queryFn: () => roomsApi.getRooms({ property_id: propertyId, per_page: 100 }),
    enabled: !!propertyId
  });

  const { data: roomDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['room-detail-invoice', selectedRoomId],
    queryFn: () => roomsApi.getRoom(selectedRoomId!, { 
      include: 'property,room_services.service.currentRate.tieredRates,contracts.members,contracts.tenant,meters.readings' 
    }),
    enabled: !!selectedRoomId
  });

  // ─── Calculation Utilities ──────────────────────────────────────────────────

  const calculateTieredAmount = useCallback((usage: number, tiers: TieredRate[]) => {
    if (!tiers || tiers.length === 0) return { total: 0, breakdown: [] };
    
    let remaining = usage;
    let total = 0;
    const breakdown: any[] = [];
    const sortedTiers = [...tiers].sort((a, b) => a.tier_from - b.tier_from);

    for (const tier of sortedTiers) {
      const limit = tier.tier_to === null ? Infinity : (tier.tier_to - tier.tier_from);
      const amountInTier = Math.min(remaining, limit);

      if (amountInTier > 0) {
        const cost = amountInTier * tier.price;
        total += cost;
        breakdown.push({
          label: `${tier.tier_from}${tier.tier_to ? ` - ${tier.tier_to}` : '+'}`,
          usage: amountInTier,
          price: tier.price,
          amount: cost
        });
        remaining -= amountInTier;
      }
      if (remaining <= 0) break;
    }

    return { total, breakdown };
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleUpdateItem = useCallback((id: string, updates: Partial<EditableInvoiceItem>) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
        const newItem = { ...item, ...updates };
        
        // Handle metered updates
        if (newItem.is_metered && (updates.curr_reading !== undefined || updates.prev_reading !== undefined)) {
          const usage = Math.max(0, (newItem.curr_reading || 0) - (newItem.prev_reading || 0));
          newItem.quantity = usage;
          newItem.description = `TIỀN ${newItem.meter_type === 'ELECTRIC' ? 'ĐIỆN' : 'NƯỚC'} (CHỈ SỐ: ${newItem.prev_reading} - ${newItem.curr_reading})`;
          
          if (newItem.tiered_rates && newItem.tiered_rates.length > 0) {
            const { total } = calculateTieredAmount(usage, newItem.tiered_rates);
            newItem.amount = total;
            // Unit price for tiered items can be average but we should probably keep base price for display logic
            newItem.unit_price = usage > 0 ? total / usage : newItem.unit_price;
          } else {
            newItem.amount = usage * newItem.unit_price;
          }
        } 
        // Handle generic updates
        else if (updates.quantity !== undefined || updates.unit_price !== undefined) {
          newItem.amount = (newItem.quantity || 0) * (newItem.unit_price || 0);
        }
        
        return newItem;
      }
      return item;
    }));
  }, [calculateTieredAmount]);

  const removeItem = useCallback((id: string) => {
    setInvoiceItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const addCustomItem = useCallback(() => {
    setInvoiceItems(prev => [...prev, {
      id: 'custom-' + Date.now(),
      type: 'OTHER',
      description: 'DỊCH VỤ / CHI PHÍ KHÁC',
      quantity: 1,
      unit_price: 0,
      amount: 0
    }]);
  }, []);

  const resetItems = useCallback(() => {
    if (!roomDetail) return;
    
    const activeContract = roomDetail.contracts?.find(
      (c: any) => c.status === 'ACTIVE' || c.status === 'PENDING_TERMINATION'
    );
    const initialItems: EditableInvoiceItem[] = [];

    // 1. Rent
    if (activeContract) {
      initialItems.push({
        id: 'rent-' + Date.now(),
        type: 'RENT',
        description: `TIỀN THUÊ PHÒNG CHU KỲ ${format(new Date(periodStart), 'dd/MM')} - ${format(new Date(periodEnd), 'dd/MM/yyyy')}`,
        quantity: 1,
        unit_price: Number(activeContract.base_rent),
        amount: Number(activeContract.base_rent)
      });
    }

    // 2. Meters
    roomDetail.meters?.forEach((meter: any) => {
      const lastReading = meter.readings?.sort((a: any, b: any) => 
        new Date(b.period_end).getTime() - new Date(a.period_end).getTime()
      )[0]?.reading_value || meter.base_reading || 0;

      const rsEntry = roomDetail.room_services?.find((rs: any) => rs.service?.type === meter.type);
      const service = rsEntry?.service as any;
      const tieredRates = service?.current_rate?.tiered_rates || service?.currentRate?.tieredRates || [];
      const basePrice = service?.current_rate?.price || service?.currentRate?.price || 0;

      initialItems.push({
        id: 'meter-' + meter.id,
        type: 'SERVICE',
        description: `TIỀN ${meter.type === 'ELECTRIC' ? 'ĐIỆN' : 'NƯỚC'} (CHỈ SỐ: ${lastReading} - ${lastReading})`,
        quantity: 0,
        unit_price: basePrice,
        amount: 0,
        meter_id: meter.id,
        prev_reading: lastReading,
        curr_reading: lastReading,
        is_metered: true,
        meter_type: meter.type,
        tiered_rates: tieredRates,
        service_id: service?.id
      });
    });

    // 3. Fixed Services
    roomDetail.room_services?.forEach((rs: any) => {
      if (rs.service?.calc_mode?.toUpperCase() !== 'PER_METER') {
        initialItems.push({
          id: 'service-' + rs.id,
          type: 'SERVICE',
          description: `PHÍ DỊCH VỤ: ${rs.service?.name}`,
          quantity: rs.quantity || 1,
          unit_price: parseFloat(rs.service?.current_price || rs.service?.price || 0),
          amount: (rs.quantity || 1) * parseFloat(rs.service?.current_price || rs.service?.price || 0),
          service_id: rs.service_id
        });
      }
    });

    setInvoiceItems(initialItems);
  }, [roomDetail, periodStart, periodEnd]);

  // Handle Room Change
  useEffect(() => {
    resetItems();
  }, [roomDetail]);

  // Handle Date Change: Update descriptions without resetting values
  useEffect(() => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.type === 'RENT') {
        return {
          ...item,
          description: `TIỀN THUÊ PHÒNG CHU KỲ ${format(new Date(periodStart), 'dd/MM')} - ${format(new Date(periodEnd), 'dd/MM/yyyy')}`
        };
      }
      return item;
    }));
  }, [periodStart, periodEnd]);

  const totalAmount = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  }, [invoiceItems]);

  const handleSubmit = async () => {
    if (!selectedRoomId || !roomDetail) return;
    
    setIsSubmitting(true);
    try {
      const activeContract = roomDetail.contracts?.find((c: any) => c.status === 'ACTIVE' || c.status === 'PENDING_TERMINATION');
      
      const payload: CreateInvoicePayload = {
        property_id: propertyId,
        room_id: selectedRoomId,
        contract_id: activeContract?.id,
        period_start: periodStart,
        period_end: periodEnd,
        issue_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        status: 'ISSUED',
        items: invoiceItems.map(item => ({
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          service_id: item.service_id,
          meta: item.is_metered ? {
            meter_id: item.meter_id,
            prev_reading: item.prev_reading,
            curr_reading: item.curr_reading,
            tiers: item.tiered_rates && calculateTieredAmount(item.quantity, item.tiered_rates).breakdown
          } : undefined
        }))
      };

      const response = await billingApi.createInvoice(payload);
      toast.success('Hóa đơn đã được phát hành thành công!');
      navigate(`/properties/${propertyId}/billing/invoices/${response.id}`);
    } catch (error: any) {
      toast.error('Lỗi khi tạo hóa đơn: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRooms = useMemo(() => {
    return rooms?.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.code.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [rooms, searchTerm]);

  return {
    selectedRoomId, setSelectedRoomId,
    searchTerm, setSearchTerm,
    isSidebarOpen, setIsSidebarOpen,
    periodStart, setPeriodStart,
    periodEnd, setPeriodEnd,
    invoiceItems, setInvoiceItems,
    isSubmitting,
    rooms, roomsLoading,
    roomDetail, detailLoading,
    handleUpdateItem, removeItem, addCustomItem, resetItems,
    totalAmount, handleSubmit,
    filteredRooms,
    calculateTieredAmount
  };
};
