import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Send, RefreshCw, Search, Loader2, Zap, Droplets, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { roomsApi } from '@/PropertyScope/features/rooms/api/rooms';
import { billingApi } from '@/PropertyScope/features/billing/api/billing';
import type { CreateInvoicePayload } from '../types';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';
import {
  getMissingApprovedMeterLabels,
  isRoomReadyForQuickInvoiceSubmit,
} from '@/PropertyScope/features/billing/utils/roomMeterReadiness';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmtVND = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));

// ─── Types ──────────────────────────────────────────────────────────────────

interface RentItem {
  id: string;
  label: string;
  amount: number;
  editable?: boolean;
}

interface MeterItem {
  id: string;
  service_id?: string;
  meter_id: string;
  type: 'ELECTRIC' | 'WATER';
  label: string;
  unit: string;
  unit_price: number;
  prev_reading: number;
  curr_reading: number;
  tiered_rates: any[];
  amount: number;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CreateQuickInvoicePage() {
  const { propertyId, roomId } = useParams<{ propertyId: string; roomId?: string }>();
  const navigate = useNavigate();
  const canIssueInvoices = useAuthStore((s) => s.hasRole(['Admin', 'Owner', 'Manager']));

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(roomId || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [missingReadings, setMissingReadings] = useState<string[]>([]);

  const [periodStart, setPeriodStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd'));

  // ── Invoice sections ──
  const [rentItems, setRentItems] = useState<RentItem[]>([]);
  const [meterItems, setMeterItems] = useState<MeterItem[]>([]);

  if (!propertyId) return null;

  // ─── Data Fetching ─────────────────────────────────────────────────────────

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['property-rooms-occupied', propertyId],
    queryFn: () => roomsApi.getRooms({
      property_id: propertyId,
      per_page: 100,
      status: 'occupied',
      include: 'floor,contracts',
    }),
    enabled: !!propertyId,
  });

  const occupiedRooms = useMemo(() => rooms || [], [rooms]);
  const filteredRooms = useMemo(() =>
    occupiedRooms.filter((r: any) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code.toLowerCase().includes(searchTerm.toLowerCase())
    ), [occupiedRooms, searchTerm]);

  const { data: roomDetail, isLoading: detailLoading, isError: roomDetailError } = useQuery({
    queryKey: ['room-detail-invoice', selectedRoomId],
    queryFn: () => roomsApi.getRoom(selectedRoomId!, {
      // Load contracts + roomServices + meters with latest APPROVED (invoice-eligible) reading.
      include: 'property,contracts.members,roomServices.service,meters.latestInvoiceEligibleReading',
    }),
    enabled: !!selectedRoomId,
  });

  // ─── Build Invoice Sections from Room Detail ───────────────────────────────

  const rebuildSections = useCallback(() => {
    if (!roomDetail) return;

    // 1. Find active contract
    const contract = roomDetail.contracts?.find(
      (c: any) => ['active', 'pending_termination'].includes((c.status || '').toLowerCase())
    );

    // ── RENT ITEMS ──────────────────────────────────────
    const newRentItems: RentItem[] = [];

    // 1a. Base rent (tiền phòng thuần)
    const baseRent = contract?.base_rent ?? contract?.monthly_rent ?? 0;
    newRentItems.push({
      id: 'rent-base',
      label: 'Tiền thuê phòng (cơ bản)',
      amount: baseRent,
      editable: true,
    });

    // 1b. Fixed service fees — each service that is NOT PER_METER goes here
    const fixedServices = (roomDetail.room_services || []).filter(
      (rs: any) => rs.service?.calc_mode !== 'PER_METER'
    );
    fixedServices.forEach((rs: any) => {
      const price = rs.service?.price ?? 0;
      const qty = rs.quantity ?? 1;
      newRentItems.push({
        id: 'svc-' + rs.id,
        label: `${rs.service?.name || 'Dịch vụ'} (${qty} ${rs.service?.unit || 'tháng'})`,
        amount: price * qty,
        editable: false,
      });
    });

    setRentItems(newRentItems);

    // ── METER ITEMS (điện, nước) ──────────────────────────────────────────────
    const newMeterItems: MeterItem[] = [];
    const meters = ((roomDetail.meters || []) as any[]).filter((m) => m?.is_active !== false);

    meters.forEach((meter) => {
      const rsMatch = (roomDetail.room_services || []).find(
        (rs: any) => rs.service?.type === meter.type && rs.service?.calc_mode === 'PER_METER'
      );
      if (!rsMatch) return;

      const service = rsMatch.service;
      const unitPrice = service?.price ?? 0;

      const currReading = meter.latest_reading ?? meter.base_reading ?? 0;
      const consumption = meter.consumption ?? 0;
      const prevReading = currReading - consumption;

      newMeterItems.push({
        id: 'meter-' + meter.id,
        service_id: service?.id,
        meter_id: meter.id,
        type: meter.type === 'ELECTRIC' ? 'ELECTRIC' : 'WATER',
        label: meter.type === 'ELECTRIC' ? 'Tiền điện' : 'Tiền nước',
        unit: meter.type === 'ELECTRIC' ? 'kWh' : 'm³',
        unit_price: unitPrice,
        prev_reading: prevReading,
        curr_reading: currReading,
        tiered_rates: [],
        amount: consumption * unitPrice,
      });
    });

    setMissingReadings(getMissingApprovedMeterLabels(roomDetail));
    setMeterItems(newMeterItems);
  }, [roomDetail]);

  useEffect(() => { rebuildSections(); }, [roomDetail]);

  // ─── Computed Totals ───────────────────────────────────────────────────────

  const rentSubtotal = useMemo(() => rentItems.reduce((s, i) => s + i.amount, 0), [rentItems]);
  const meterSubtotal = useMemo(() => meterItems.reduce((s, i) => s + i.amount, 0), [meterItems]);
  const grandTotal = rentSubtotal + meterSubtotal;

  // Contract total_rent for comparison
  const activeContract = roomDetail?.contracts?.find(
    (c) => ['active', 'pending_termination'].includes((c.status || '').toLowerCase())
  );

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const updateRentAmount = (id: string, amount: number) =>
    setRentItems(prev => prev.map(i => i.id === id ? { ...i, amount } : i));

  const updateMeterUnitPrice = (id: string, price: number) => {
    setMeterItems(prev => prev.map(m => {
      if (m.id !== id) return m;
      const usage = Math.max(0, m.curr_reading - m.prev_reading);
      return { ...m, unit_price: price, amount: usage * price };
    }));
  };

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!selectedRoomId || !roomDetail) return;

    if (!isRoomReadyForQuickInvoiceSubmit(roomDetail)) {
      const missing = getMissingApprovedMeterLabels(roomDetail);
      toast.error(
        missing.length > 0
          ? `Chưa đủ điều kiện lập hóa đơn nhanh: ${missing.join(', ')}.`
          : 'Chưa đủ điều kiện lập hóa đơn nhanh.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const items: CreateInvoicePayload['items'] = [];

      // Rent items → type RENT
      rentItems.forEach(r => {
        if (r.amount > 0) items.push({
          type: 'RENT',
          description: r.label,
          quantity: 1,
          unit_price: r.amount,
          amount: r.amount,
        });
      });

      // Meter items → type SERVICE (mapped from ELECTRIC/WATER in descripton/meta)
      meterItems.forEach(m => {
        const usage = Math.max(0, m.curr_reading - m.prev_reading);
        if (usage > 0) items.push({
          type: 'SERVICE',
          description: m.label,
          quantity: usage,
          unit_price: m.unit_price,
          amount: m.amount,
          service_id: m.service_id,
          meta: {
            meter_id: m.meter_id,
            meter_type: m.type,
            prev_reading: m.prev_reading,
            curr_reading: m.curr_reading,
          },
        });
      });

      const payload: CreateInvoicePayload = {
        property_id: propertyId,
        room_id: selectedRoomId,
        contract_id: activeContract?.id,
        period_start: periodStart,
        period_end: periodEnd,
        issue_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: dueDate,
        status: 'ISSUED',
        items,
      };

      const res = await billingApi.createInvoice(payload);

      toast.success('Hóa đơn đã được phát hành thành công!');
      navigate(`/properties/${propertyId}/billing/invoices/${res.id}`);
    } catch (err: any) {
      const d = err.response?.data;
      const fromErrors =
        d?.errors && typeof d.errors === 'object'
          ? (Object.values(d.errors).flat().filter(Boolean) as string[]).join(' ')
          : '';
      toast.error('Lỗi: ' + (fromErrors || d?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Derived display data ──────────────────────────────────────────────────
  const tenant = activeContract?.members?.find((m: any) => m.is_primary || m.role === 'TENANT')
    ?? activeContract?.members?.[0];
  const property = roomDetail?.property;

  // ─── Render ────────────────────────────────────────────────────────────────
  if (propertyId && !canIssueInvoices) {
    return <Navigate to={`/properties/${propertyId}/billing`} replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">

      {/* ───────────────────────────────────────────────────────────────────
          LEFT SIDEBAR: Room list (occupied only)
      ─────────────────────────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="mb-3">
            <PageBackButton className="text-xs" />
          </div>
          <h2 className="font-bold text-sm text-gray-800">Phòng đang thuê</h2>
          <p className="text-xs text-gray-400 mt-0.5">Chọn phòng để lập hóa đơn</p>
        </div>

        <div className="px-3 py-2 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm phòng..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 bg-gray-50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {roomsLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-gray-400">
              Không có phòng nào đang có hợp đồng
            </div>
          ) : (
            <ul>
              {filteredRooms.map((room: any) => {
                const isSelected = selectedRoomId === room.id;
                return (
                  <li key={room.id}>
                    <button
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-50 flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-teal-50 border-l-2 border-l-teal-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <p className={`font-semibold text-sm ${isSelected ? 'text-teal-700' : 'text-gray-800'}`}>
                          Phòng {room.name}
                        </p>
                        <p className="text-[11px] text-gray-400">{room.code}</p>
                      </div>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                        Đang thuê
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 shrink-0">
          <p className="text-[11px] text-gray-400">{occupiedRooms.length} phòng đang có hợp đồng</p>
        </div>
      </aside>

      {/* ───────────────────────────────────────────────────────────────────
          MAIN: Invoice Form (physical invoice layout)
      ─────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {!selectedRoomId ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
              <Send size={28} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">Chọn phòng để bắt đầu tạo hóa đơn</p>
            <p className="text-sm text-gray-400 mt-1">Danh sách phòng đang có hợp đồng ở bên trái</p>
          </div>
        ) : detailLoading ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <Loader2 size={24} className="animate-spin mr-2" />
            <span className="text-sm">Đang tải dữ liệu phòng...</span>
          </div>
        ) : roomDetailError || !roomDetail ? (
          <div className="h-full flex flex-col items-center justify-center px-6 text-center text-gray-500">
            <AlertCircle size={40} className="mb-3 text-rose-400" />
            <p className="font-semibold text-gray-700">Không tải được dữ liệu phòng</p>
            <p className="mt-1 text-sm text-gray-400">Vui lòng chọn lại phòng hoặc thử lại sau.</p>
          </div>
        ) : !isRoomReadyForQuickInvoiceSubmit(roomDetail) ? (
          <div className="h-full flex flex-col items-center justify-center px-6 py-12">
            <div className="max-w-md w-full rounded-2xl border-2 border-amber-200 bg-amber-50/90 p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <AlertCircle size={28} />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight text-amber-950">Phòng chưa chốt số đồng hồ</h2>
              <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
                Các dịch vụ tính theo chỉ số đồng hồ cần có chỉ số đã duyệt và tiêu thụ kỳ đó lớn hơn 0 trước khi lập hóa đơn nhanh.
                {missingReadings.length > 0 ? (
                  <>
                    {' '}
                    Hiện chưa đủ: <span className="font-semibold">{missingReadings.join(' và ')}</span>.
                  </>
                ) : null}
              </p>
              <Link
                to={`/properties/${propertyId}/meters/room/${selectedRoomId}`}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-amber-700"
              >
                <ExternalLink size={16} />
                Mở trang chốt số đồng hồ
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">

              {/* ── HEADER ── */}
              <div className="text-center py-5 px-8 border-b-2 border-teal-500">
                <h1 className="text-2xl font-black text-teal-600 tracking-wide">HÓA ĐƠN DỊCH VỤ</h1>
                <p className="text-xs text-gray-400 mt-1">
                  Ngày phát hành: {format(new Date(), 'dd/MM/yyyy')}
                </p>
              </div>

              <div className="px-8 py-5 space-y-5">

                {/* ── ROW 1: Supplier + Tenant ── */}
                <div className="grid grid-cols-2 gap-6 pb-4 border-b border-gray-100">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Đơn vị cung cấp</p>
                    <p className="font-bold text-sm text-gray-900">{property?.name || '—'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{property?.address}</p>
                    {property?.bank_accounts?.[0] && (
                      <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                        <p>Ngân hàng: <span className="font-semibold">{property.bank_accounts[0].bank_name}</span></p>
                        <p>STK: <span className="font-bold">{property.bank_accounts[0].account_number}</span></p>
                        <p>Chủ TK: <span className="font-semibold uppercase">{property.bank_accounts[0].account_name}</span></p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Thông tin khách thuê</p>
                    <p className="font-bold text-sm text-gray-900">Phòng: {roomDetail?.name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Họ tên: {tenant?.full_name || 'Chưa có thông tin'}</p>
                    {tenant?.phone && <p className="text-xs text-gray-600">SĐT: {tenant.phone}</p>}
                  </div>
                </div>

                {/* ── ROW 2: Period ── */}
                <div className="grid grid-cols-2 gap-6 pb-4 border-b border-gray-100">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Chi tiết kỳ hóa đơn</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-20 shrink-0">Kỳ hạn:</span>
                        <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
                          className="text-xs font-semibold text-gray-800 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-teal-400" />
                        <span className="text-gray-400 text-xs">→</span>
                        <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
                          className="text-xs font-semibold text-gray-800 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-teal-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-20 shrink-0">Hạn TT:</span>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                          className="text-xs font-bold text-red-600 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-teal-400" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start justify-end">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Trạng thái</p>
                      <span className="inline-block px-3 py-1 border border-gray-300 text-xs font-semibold text-gray-700 rounded">
                        DRAFT
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── ITEMS TABLE ── */}
                <div>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-teal-50">
                        <th className="text-left px-3 py-2.5 text-xs font-bold text-teal-800 border-b border-teal-200 w-[42%]">Dịch vụ / Nội dung</th>
                        <th className="text-center px-3 py-2.5 text-xs font-bold text-teal-800 border-b border-teal-200 w-[14%]">Số lượng</th>
                        <th className="text-right px-3 py-2.5 text-xs font-bold text-teal-800 border-b border-teal-200 w-[22%]">Đơn giá</th>
                        <th className="text-right px-3 py-2.5 text-xs font-bold text-teal-800 border-b border-teal-200 w-[22%]">Thành tiền (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody>

                      {/* ===== SECTION 1: RENT + FIXED SERVICES ===== */}
                      {rentItems.map(item => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2.5 text-xs text-gray-700">{item.label}</td>
                          <td className="px-3 py-2.5 text-center text-xs text-gray-600">1</td>
                          <td className="px-3 py-2.5 text-right text-xs text-gray-600">
                            {item.editable ? (
                              <input
                                type="number"
                                value={item.amount}
                                onChange={e => updateRentAmount(item.id, Number(e.target.value))}
                                className="w-28 text-xs text-right border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-teal-400 ml-auto block"
                              />
                            ) : (
                              fmtVND(item.amount)
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right text-xs font-semibold text-gray-800">
                            {fmtVND(item.amount)}
                          </td>
                        </tr>
                      ))}

                      {/* ===== SUBTOTAL: TỔNG TIỀN PHÒNG ===== */}
                      <tr className="bg-teal-50/60 border-y-2 border-teal-200">
                        <td className="px-3 py-2.5 text-xs font-bold text-teal-800" colSpan={3}>
                          Tổng tiền phòng
                          {activeContract && (
                            <span className="ml-2 text-[10px] font-normal text-gray-500">
                              (Hợp đồng: {fmtVND(activeContract?.monthly_rent || 0)} VNĐ/tháng)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right text-sm font-black text-teal-800">
                          {fmtVND(rentSubtotal)} VNĐ
                        </td>
                      </tr>

                      {/* ===== SECTION 2: METERED SERVICES (điện, nước) ===== */}
                      {meterItems.map(meter => {
                        const usage = Math.max(0, meter.curr_reading - meter.prev_reading);
                        const Icon = meter.type === 'ELECTRIC' ? Zap : Droplets;
                        const iconColor = meter.type === 'ELECTRIC' ? 'text-yellow-500' : 'text-blue-500';
                        return (
                          <tr key={meter.id} className="border-b border-gray-100 hover:bg-gray-50">
                            {/* Description - Hide reading values, only show icon and label */}
                            <td className="px-3 py-2.5 align-middle">
                              <div className="flex items-center gap-1.5">
                                <Icon size={13} className={iconColor} />
                                <span className="text-xs font-medium text-gray-800">{meter.label}</span>
                              </div>
                              {missingReadings.includes(meter.type === 'ELECTRIC' ? 'ĐIỆN' : 'NƯỚC') && (
                                <span className="text-[9px] font-bold text-rose-500 uppercase px-1.5 py-0.5 bg-rose-50 rounded-md mt-1.5">Chưa duyệt</span>
                              )}
                            </td>

                            {/* Quantity (usage) */}
                            <td className="px-3 py-2.5 text-center align-middle">
                              <span className="text-xs font-semibold text-gray-700">{usage}</span>
                              <div className="text-[10px] text-gray-400">{meter.unit}</div>
                            </td>

                            {/* Unit price */}
                            <td className="px-3 py-2.5 text-right align-middle">
                              <input
                                type="number"
                                value={meter.unit_price}
                                onChange={e => updateMeterUnitPrice(meter.id, Number(e.target.value))}
                                className="w-28 text-xs text-right border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-teal-400 ml-auto block"
                              />
                              <div className="text-[10px] text-gray-400 text-right mt-0.5">đ/{meter.unit}</div>
                            </td>

                            {/* Amount */}
                            <td className="px-3 py-2.5 text-right align-middle">
                              <span className="text-sm font-semibold text-gray-800">{fmtVND(meter.amount)}</span>
                            </td>
                          </tr>
                        );
                      })}

                    </tbody>
                  </table>

                  {/* ===== GRAND TOTAL ===== */}
                  <div className="mt-4 border-t-2 border-gray-200 pt-4 flex justify-end">
                    <div className="w-80 bg-teal-50 border border-teal-200 rounded-lg px-5 py-4 flex items-center justify-between">
                      <span className="text-sm font-black text-teal-800 uppercase tracking-wide">Tổng cộng:</span>
                      <span className="text-xl font-black text-teal-700">{fmtVND(grandTotal)} VNĐ</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Action Buttons ── */}
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                onClick={rebuildSections}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg bg-white transition-colors"
              >
                <RefreshCw size={14} /> Lấy lại dữ liệu
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting
                  || (rentItems.length === 0 && meterItems.length === 0)
                  || !isRoomReadyForQuickInvoiceSubmit(roomDetail)
                }
                title={
                  !isRoomReadyForQuickInvoiceSubmit(roomDetail)
                    ? `Cần chốt số điện/nước đã duyệt${missingReadings.length ? `: ${missingReadings.join(', ')}` : ''}`
                    : undefined
                }
                className="flex items-center gap-2 px-6 py-2 text-sm font-semibold bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-lg shadow-teal-500/20"
              >
                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {!isRoomReadyForQuickInvoiceSubmit(roomDetail)
                  ? `Cần chốt số: ${missingReadings.length ? missingReadings.join(', ') : 'Điện + Nước'}`
                  : 'Phát hành hóa đơn'}
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
