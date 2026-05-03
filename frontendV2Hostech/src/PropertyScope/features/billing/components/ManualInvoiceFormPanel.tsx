import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Droplets,
  FileText,
  Home,
  Info,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { billingApi } from '../api/billing';
import { roomsApi } from '../../rooms/api/rooms';
import {
  getMissingApprovedMeterLabels,
  isRoomReadyForQuickInvoiceSubmit,
} from '@/PropertyScope/features/billing/utils/roomMeterReadiness';
import type {
  CreateInvoicePayload,
  CreateInvoiceItemPayload,
  Invoice,
  InvoiceItemType,
  InvoiceStatus,
} from '../types';
import type { LucideIcon } from 'lucide-react';

const ITEM_TYPES: { value: InvoiceItemType; label: string; icon: LucideIcon; color: string }[] = [
  { value: 'RENT', label: 'Tiền thuê phòng', icon: Home, color: 'text-blue-500' },
  { value: 'SERVICE', label: 'Phí dịch vụ / Tiền điện / Nước', icon: Settings, color: 'text-indigo-500' },
  { value: 'PENALTY', label: 'Phí phạt / Bồi thường', icon: Info, color: 'text-red-500' },
  { value: 'ADJUSTMENT', label: 'Điều chỉnh phí', icon: FileText, color: 'text-emerald-500' },
  { value: 'DEBT', label: 'Nợ cũ', icon: MoreHorizontal, color: 'text-slate-500' },
  { value: 'DEPOSIT', label: 'Tiền cọc', icon: FileText, color: 'text-blue-400' },
  { value: 'DISCOUNT', label: 'Giảm giá', icon: MoreHorizontal, color: 'text-green-500' },
];

const fmtVND = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));

type TerminationMeterRow = {
  id: string;
  service_id?: string;
  meter_id: string;
  type: 'ELECTRIC' | 'WATER';
  label: string;
  unit: string;
  unit_price: number;
  prev_reading: number;
  curr_reading: number;
  quantity: number;
  amount: number;
};

type TerminationManualRow = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
};

function buildTerminationMeterRows(roomDetail: Record<string, unknown>): TerminationMeterRow[] {
  const rows: TerminationMeterRow[] = [];
  const meters = ((roomDetail.meters || []) as Record<string, unknown>[]).filter((m) => m?.is_active !== false);
  const roomServices = (roomDetail.room_services || []) as Record<string, unknown>[];

  meters.forEach((meter: Record<string, unknown>) => {
    const rsMatch = roomServices.find((rs: Record<string, unknown>) => {
      const svc = rs.service as Record<string, unknown> | undefined;
      return svc?.type === meter.type && svc?.calc_mode === 'PER_METER';
    });
    if (!rsMatch) return;
    const service = rsMatch.service as Record<string, unknown> | undefined;
    const unitPrice = Number(service?.price ?? 0);
    const currReading = Number(meter.latest_reading ?? meter.base_reading ?? 0);
    const consumption = Number(meter.consumption ?? 0);
    const prevReading = currReading - consumption;
    const qty = Math.max(0, consumption);
    rows.push({
      id: `meter-${meter.id}`,
      service_id: service?.id != null ? String(service.id) : undefined,
      meter_id: String(meter.id),
      type: meter.type === 'ELECTRIC' ? 'ELECTRIC' : 'WATER',
      label: meter.type === 'ELECTRIC' ? 'Tiền điện' : 'Tiền nước',
      unit: meter.type === 'ELECTRIC' ? 'kWh' : 'm³',
      unit_price: unitPrice,
      prev_reading: prevReading,
      curr_reading: currReading,
      quantity: qty,
      amount: qty * unitPrice,
    });
  });
  return rows;
}

function newManualRowId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type ManualInvoiceFormPanelProps = {
  propertyId: string;
  roomId: string;
  roomName?: string;
  /** Wizard: truyền `contract.id` để không phụ thuộc room.contracts */
  contractId?: string;
  /** Tên đơn vị cung cấp (BĐS) khi API phòng không trả về `property` đầy đủ */
  supplierDisplayName?: string;
  enabled?: boolean;
  formId?: string;
  onInvoiceCreated?: (invoice: Invoice) => void;
  onClose?: () => void;
  /** Mặc định: đóng sau tạo nếu có `onClose`. Wizard đặt `false`. */
  closeOnSuccess?: boolean;
  /** Nút submit nằm trong form (wizard nhúng). Modal để `false`, nút ngoài dùng `form={formId}`. */
  embeddedSubmit?: boolean;
  className?: string;
  /**
   * `termination`: layout giống Quick Invoice — không có tiền thuê phòng; điện/nước từ chỉ số;
   * thêm dòng dịch vụ tay (mô tả, SL, đơn giá).
   */
  variant?: 'default' | 'termination';
};

export const ManualInvoiceFormPanel: React.FC<ManualInvoiceFormPanelProps> = ({
  propertyId,
  roomId,
  roomName,
  contractId: contractIdProp,
  supplierDisplayName,
  enabled = true,
  formId = 'manual-invoice-form',
  onInvoiceCreated,
  onClose,
  closeOnSuccess,
  embeddedSubmit = false,
  className,
  variant = 'default',
}) => {
  const queryClient = useQueryClient();
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(endOfMonth(new Date()), 3), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<InvoiceStatus>('ISSUED');
  const [items, setItems] = useState<CreateInvoiceItemPayload[]>([
    { type: 'SERVICE', description: '', quantity: 1, unit_price: 0, amount: 0 },
  ]);

  const [meterItems, setMeterItems] = useState<TerminationMeterRow[]>([]);
  const [manualRows, setManualRows] = useState<TerminationManualRow[]>([
    { id: newManualRowId(), description: '', quantity: 1, unit_price: 0 },
  ]);

  const roomInclude =
    variant === 'termination'
      ? 'floor,property,contracts.members,contracts.tenant,roomServices.service,meters.latestInvoiceEligibleReading,meters.latestApprovedReading'
      : undefined;

  const { data: room } = useQuery({
    queryKey: ['rooms', roomId, variant],
    queryFn: () => roomsApi.getRoom(roomId, roomInclude ? { include: roomInclude } : undefined),
    enabled: !!roomId && enabled,
  });

  const activeContract = room?.contracts?.find(
    (c) => String(c.status).toLowerCase() === 'active' || String(c.status).toLowerCase() === 'pending_termination',
  );
  const contractForTenant =
    contractIdProp && room?.contracts?.length
      ? room.contracts.find((c) => c.id === contractIdProp) ?? activeContract
      : activeContract;
  const targetContractId = contractIdProp ?? activeContract?.id;

  const rebuildTerminationMeters = useCallback(() => {
    if (!room || variant !== 'termination') return;
    setMeterItems(buildTerminationMeterRows(room as Record<string, unknown>));
  }, [room, variant]);

  useEffect(() => {
    if (variant !== 'termination' || !room) return;
    rebuildTerminationMeters();
  }, [variant, room, rebuildTerminationMeters]);

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0), [items]);

  const meterSubtotal = useMemo(
    () => meterItems.reduce((s, m) => s + m.quantity * m.unit_price, 0),
    [meterItems],
  );
  const manualSubtotal = useMemo(
    () => manualRows.reduce((s, r) => s + r.quantity * r.unit_price, 0),
    [manualRows],
  );
  const terminationGrandTotal = meterSubtotal + manualSubtotal;

  const missingReadings = useMemo(
    () => (variant === 'termination' && room ? getMissingApprovedMeterLabels(room) : []),
    [variant, room],
  );
  const metersReady = variant !== 'termination' || !room || isRoomReadyForQuickInvoiceSubmit(room);

  const addItem = () => {
    setItems([...items, { type: 'SERVICE', description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.error('Phải có ít nhất một hạng mục phí');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof CreateInvoiceItemPayload, value: unknown) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value } as CreateInvoiceItemPayload;

    if (field === 'quantity' || field === 'unit_price') {
      const q = field === 'quantity' ? Number(value) : item.quantity;
      const p = field === 'unit_price' ? Number(value) : item.unit_price;
      item.amount = q * p;
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const updateMeterQuantity = (id: string, quantity: number) => {
    setMeterItems((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const q = Math.max(0, quantity);
        return { ...m, quantity: q, amount: q * m.unit_price };
      }),
    );
  };

  const updateMeterUnitPrice = (id: string, price: number) => {
    setMeterItems((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const p = Math.max(0, price);
        return { ...m, unit_price: p, amount: m.quantity * p };
      }),
    );
  };

  const addManualRow = () => {
    setManualRows((rows) => [...rows, { id: newManualRowId(), description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeManualRow = (id: string) => {
    setManualRows((rows) => {
      if (rows.length <= 1) return rows;
      return rows.filter((r) => r.id !== id);
    });
  };

  const updateManualRow = (id: string, patch: Partial<TerminationManualRow>) => {
    setManualRows((rows) =>
      rows.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        const q = Math.max(0, Number(next.quantity) || 0);
        const p = Math.max(0, Number(next.unit_price) || 0);
        return { ...next, quantity: q, unit_price: p };
      }),
    );
  };

  const doCloseAfterSuccess = () => {
    const autoClose = closeOnSuccess !== undefined ? closeOnSuccess : Boolean(onClose);
    if (autoClose && onClose) {
      onClose();
    }
  };

  const createInvoiceMutation = useMutation({
    mutationFn: (payload: CreateInvoicePayload) => billingApi.createInvoice(payload),
    onSuccess: (invoice) => {
      toast.success('Hóa đơn đã được tạo thành công!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
      onInvoiceCreated?.(invoice);
      doCloseAfterSuccess();
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || 'Không thể tạo hóa đơn. Vui lòng kiểm tra lại.');
    },
  });

  const handleSubmitDefault = (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetContractId) {
      toast.error('Phòng hiện không có hợp đồng hiệu lực. Không thể tạo hóa đơn.');
      return;
    }

    if (items.some((item) => !item.description || item.unit_price < 0)) {
      toast.error('Vui lòng nhập đầy đủ mô tả và đơn giá hợp lệ cho các hạng mục.');
      return;
    }

    createInvoiceMutation.mutate({
      property_id: propertyId,
      room_id: roomId,
      contract_id: targetContractId,
      period_start: periodStart,
      period_end: periodEnd,
      due_date: dueDate,
      status,
      items: items.map((item) => ({
        ...item,
        amount: item.quantity * item.unit_price,
      })),
    });
  };

  const handleSubmitTermination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetContractId) {
      toast.error('Phòng hiện không có hợp đồng hiệu lực. Không thể tạo hóa đơn.');
      return;
    }

    const payloadItems: CreateInvoiceItemPayload[] = [];

    meterItems.forEach((m) => {
      const qty = Math.max(0, m.quantity);
      if (qty <= 0) return;
      payloadItems.push({
        type: 'SERVICE',
        description: m.label,
        quantity: qty,
        unit_price: m.unit_price,
        amount: qty * m.unit_price,
        service_id: m.service_id,
        meta: {
          meter_id: m.meter_id,
          meter_type: m.type,
          prev_reading: m.prev_reading,
          curr_reading: m.curr_reading,
        },
      });
    });

    manualRows.forEach((row) => {
      const desc = row.description.trim();
      const qty = Math.max(0, row.quantity);
      const price = Math.max(0, row.unit_price);
      if (!desc || qty * price <= 0) return;
      payloadItems.push({
        type: 'SERVICE',
        description: desc,
        quantity: qty,
        unit_price: price,
        amount: qty * price,
      });
    });

    if (payloadItems.length === 0) {
      toast.error('Vui lòng nhập ít nhất một dòng có thành tiền (điện/nước hoặc dịch vụ thêm).');
      return;
    }

    const includesMeterCharges = meterItems.some((m) => m.quantity > 0);
    if (includesMeterCharges && !metersReady) {
      toast.error(
        missingReadings.length > 0
          ? `Chưa đủ chỉ số đồng hồ đã duyệt: ${missingReadings.join(', ')}.`
          : 'Chưa đủ điều kiện lập hóa đơn theo chỉ số.',
      );
      return;
    }

    createInvoiceMutation.mutate({
      property_id: propertyId,
      room_id: roomId,
      contract_id: targetContractId,
      period_start: periodStart,
      period_end: periodEnd,
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: dueDate,
      status,
      items: payloadItems,
    });
  };

  const displayRoomName = roomName || room?.name;
  const property = room?.property as Record<string, unknown> | undefined;
  const supplierTitle =
    supplierDisplayName?.trim() ||
    (typeof property?.name === 'string' && property.name.trim()) ||
    room?.property_name?.trim() ||
    '—';
  const tenant = contractForTenant?.members?.find((m) => m.is_primary || m.role === 'TENANT')
    ?? contractForTenant?.members?.[0];

  if (variant === 'termination') {
    return (
      <div className={className}>
        <form id={formId} onSubmit={handleSubmitTermination} className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900">
            <div className="border-b-2 border-teal-500 px-6 py-4 text-center">
              <h2 className="text-xl font-black tracking-wide text-teal-600">HÓA ĐƠN THANH LÝ</h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                Không gồm tiền thuê phòng — điện, nước và dịch vụ phát sinh / sửa chữa
              </p>
              <p className="mt-1 text-xs text-gray-400">Ngày phát hành: {format(new Date(), 'dd/MM/yyyy')}</p>
            </div>

            <div className="space-y-4 px-6 py-4 text-sm">
              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4 dark:border-slate-700">
                <div>
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Đơn vị cung cấp</p>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">{supplierTitle}</p>
                  {property?.address ? (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{String(property.address)}</p>
                  ) : null}
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Thông tin khách thuê
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">Phòng: {displayRoomName ?? '—'}</p>
                  <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-300">
                    Họ tên: {tenant?.full_name || contractForTenant?.tenant_full_name || '—'}
                  </p>
                  {tenant?.phone ? (
                    <p className="text-xs text-gray-600 dark:text-slate-300">SĐT: {tenant.phone}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4 dark:border-slate-700">
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Chi tiết kỳ hóa đơn
                  </p>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-16 shrink-0 text-xs text-gray-500">Kỳ hạn:</span>
                      <input
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                        className="rounded border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-800 focus:border-teal-400 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <span className="text-xs text-gray-400">→</span>
                      <input
                        type="date"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                        className="rounded border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-800 focus:border-teal-400 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-xs text-gray-500">Hạn TT:</span>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="rounded border border-gray-200 px-2 py-1 text-xs font-semibold text-red-600 focus:border-teal-400 focus:outline-none dark:border-slate-600 dark:bg-slate-800"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div>
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Trạng thái</p>
                    <span className="inline-block rounded border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:border-slate-600 dark:text-slate-200">
                      {status === 'ISSUED' ? 'ISSUED' : 'DRAFT'}
                    </span>
                  </div>
                </div>
              </div>

              {!metersReady && meterItems.length > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-100">
                  Chưa đủ chỉ số đồng hồ đã duyệt để tính điện/nước chuẩn
                  {missingReadings.length > 0 ? `: ${missingReadings.join(', ')}` : ''}. Vẫn có thể lập HĐ chỉ từ các
                  dòng dịch vụ thêm phía dưới.
                </div>
              ) : null}

              <div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-teal-50 dark:bg-teal-950/40">
                      <th className="w-[40%] border-b border-teal-200 px-2 py-2 text-left text-xs font-bold text-teal-800 dark:border-teal-800 dark:text-teal-200">
                        Dịch vụ / Nội dung
                      </th>
                      <th className="w-[14%] border-b border-teal-200 px-2 py-2 text-center text-xs font-bold text-teal-800 dark:border-teal-800 dark:text-teal-200">
                        Số lượng
                      </th>
                      <th className="w-[22%] border-b border-teal-200 px-2 py-2 text-right text-xs font-bold text-teal-800 dark:border-teal-800 dark:text-teal-200">
                        Đơn giá
                      </th>
                      <th className="w-[22%] border-b border-teal-200 px-2 py-2 text-right text-xs font-bold text-teal-800 dark:border-teal-800 dark:text-teal-200">
                        Thành tiền (VNĐ)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {meterItems.map((meter) => {
                      const Icon = meter.type === 'ELECTRIC' ? Zap : Droplets;
                      const iconColor = meter.type === 'ELECTRIC' ? 'text-yellow-500' : 'text-blue-500';
                      return (
                        <tr key={meter.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                          <td className="px-2 py-2 align-middle">
                            <div className="flex items-center gap-1.5">
                              <Icon size={14} className={iconColor} aria-hidden />
                              <span className="text-xs font-medium text-gray-800 dark:text-slate-200">{meter.label}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center align-middle">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={meter.quantity}
                              onChange={(e) => updateMeterQuantity(meter.id, Number(e.target.value))}
                              className="mx-auto block w-20 rounded border border-gray-200 px-1 py-0.5 text-center text-xs focus:border-teal-400 focus:outline-none dark:border-slate-600 dark:bg-slate-800"
                            />
                            <div className="text-[10px] text-gray-400">{meter.unit}</div>
                          </td>
                          <td className="px-2 py-2 text-right align-middle">
                            <input
                              type="number"
                              min={0}
                              value={meter.unit_price}
                              onChange={(e) => updateMeterUnitPrice(meter.id, Number(e.target.value))}
                              className="ml-auto block w-24 rounded border border-gray-200 px-1 py-0.5 text-right text-xs focus:border-teal-400 focus:outline-none dark:border-slate-600 dark:bg-slate-800"
                            />
                            <div className="text-right text-[10px] text-gray-400">đ/{meter.unit}</div>
                          </td>
                          <td className="px-2 py-2 text-right align-middle text-sm font-semibold text-gray-800 dark:text-slate-100">
                            {fmtVND(meter.quantity * meter.unit_price)}
                          </td>
                        </tr>
                      );
                    })}

                    {manualRows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 dark:border-slate-700">
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            placeholder="Vd: Sửa chữa điều hòa"
                            value={row.description}
                            onChange={(e) => updateManualRow(row.id, { description: e.target.value })}
                            className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-teal-400 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.quantity}
                            onChange={(e) => updateManualRow(row.id, { quantity: Number(e.target.value) })}
                            className="mx-auto w-20 rounded border border-gray-200 px-1 py-0.5 text-center text-xs dark:border-slate-600 dark:bg-slate-800"
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            value={row.unit_price}
                            onChange={(e) => updateManualRow(row.id, { unit_price: Number(e.target.value) })}
                            className="ml-auto w-24 rounded border border-gray-200 px-1 py-0.5 text-right text-xs dark:border-slate-600 dark:bg-slate-800"
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                              {fmtVND(row.quantity * row.unit_price)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeManualRow(row.id)}
                              className="rounded p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                              aria-label="Xóa dòng"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={addManualRow}
                    className="inline-flex items-center gap-1 rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-950/50 dark:text-teal-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm dòng dịch vụ
                  </button>
                  <button
                    type="button"
                    onClick={rebuildTerminationMeters}
                    className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Lấy lại chỉ số điện/nước
                  </button>
                </div>
              </div>

              <div className="flex justify-end border-t-2 border-gray-100 pt-3 dark:border-slate-700">
                <div className="flex w-full max-w-sm items-center justify-between rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 dark:border-teal-800 dark:bg-teal-950/40">
                  <span className="text-sm font-black uppercase tracking-wide text-teal-800 dark:text-teal-200">
                    Tổng cộng
                  </span>
                  <span className="text-lg font-black text-teal-700 dark:text-teal-300">
                    {fmtVND(terminationGrandTotal)} đ
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-slate-700">
                <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setStatus('DRAFT')}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                      status === 'DRAFT' ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Lưu nháp
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('ISSUED')}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                      status === 'ISSUED' ? 'bg-white text-indigo-600 shadow dark:bg-slate-700 dark:text-teal-300' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Phát hành
                  </button>
                </div>
                {embeddedSubmit ? (
                  <button
                    type="submit"
                    disabled={createInvoiceMutation.isPending || !targetContractId}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-teal-700 disabled:opacity-50"
                  >
                    {createInvoiceMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tạo…
                      </>
                    ) : status === 'DRAFT' ? (
                      <>
                        <Save className="h-4 w-4" />
                        Lưu hóa đơn nháp
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Tạo hóa đơn thanh lý
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={className}>
      <form id={formId} onSubmit={handleSubmitDefault} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50 md:grid-cols-3">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Calendar className="h-3.5 w-3.5" /> Từ ngày
            </label>
            <input
              type="date"
              required
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Calendar className="h-3.5 w-3.5" /> Đến ngày
            </label>
            <input
              type="date"
              required
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
              <Info className="h-3.5 w-3.5" /> Hạn thanh toán
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-indigo-500" />
              Chi tiết các khoản phí
            </h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 dark:shadow-none"
            >
              <Plus className="h-4 w-4" /> Thêm hạng mục
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={index}
                className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/30 dark:hover:shadow-none md:flex-row"
              >
                <div className="min-w-[180px]">
                  <select
                    value={item.type}
                    onChange={(e) => updateItem(index, 'type', e.target.value)}
                    className="w-full rounded-xl border-none bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {ITEM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    placeholder="Nhập nội dung/mô tả khoản phí..."
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="w-full rounded-xl border-none bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="w-full md:w-32">
                  <input
                    type="number"
                    min={1}
                    placeholder="SL"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className="w-full rounded-xl border-none bg-slate-50 px-3 py-2.5 text-center text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="w-full md:w-44">
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      placeholder="Đơn giá"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      className="w-full rounded-xl border-none bg-slate-50 py-2.5 pl-4 pr-10 text-right text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                      đ
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              Ghi chú nội bộ / Gửi khách
            </label>
            <textarea
              placeholder="Nhập ghi chú cho hóa đơn này (nếu có)..."
              className="min-h-[120px] w-full rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
            />
          </div>

          <div className="space-y-4 rounded-[2rem] bg-slate-900 p-8 text-white shadow-2xl shadow-slate-200 dark:bg-indigo-600 dark:shadow-none">
            <div className="flex items-center justify-between border-b border-white/20 pb-4">
              <span className="text-sm font-bold uppercase opacity-70">Tổng cộng hóa đơn</span>
              <span className="text-3xl font-black tabular-nums">{totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            {displayRoomName ? (
              <p className="text-xs font-bold opacity-80">Phòng: {displayRoomName}</p>
            ) : null}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-tighter opacity-60">Trạng thái phát hành</span>
              <div className="flex rounded-xl bg-white/10 p-1">
                <button
                  type="button"
                  onClick={() => setStatus('DRAFT')}
                  className={`rounded-lg px-4 py-1.5 text-[10px] font-black uppercase transition-all ${
                    status === 'DRAFT' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Lưu nháp
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('ISSUED')}
                  className={`rounded-lg px-4 py-1.5 text-[10px] font-black uppercase transition-all ${
                    status === 'ISSUED' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Phát hành
                </button>
              </div>
            </div>
          </div>
        </div>

        {embeddedSubmit ? (
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
            <button
              type="submit"
              disabled={createInvoiceMutation.isPending || !targetContractId}
              className="inline-flex items-center gap-3 rounded-2xl bg-indigo-600 px-10 py-4 text-xs font-black uppercase text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-50 dark:shadow-none"
            >
              {createInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang khởi tạo…
                </>
              ) : (
                <>
                  {status === 'DRAFT' ? <Save className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                  {status === 'DRAFT' ? 'Lưu hóa đơn nháp' : 'Tạo hóa đơn'}
                </>
              )}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
};
