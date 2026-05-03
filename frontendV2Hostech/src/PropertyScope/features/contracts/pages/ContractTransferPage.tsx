import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowRightLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gauge,
  Loader2,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { PageBackButton } from '@/shared/components/ui/PageBackButton';
import { formatCurrency } from '@/lib/utils';
import { useContract } from '../hooks/useContracts';
import { contractsApi } from '../api/contracts';
import { RoomMetersInlinePanel } from '../components/TerminationWizard/RoomMetersInlinePanel';

interface AvailableRoom {
  id: string;
  code?: string | null;
  name?: string | null;
  area?: number | null;
  base_price?: number | null;
  floor_number?: number | null;
  capacity?: number | null;
}

const ALLOWED_STATUSES = ['ACTIVE'] as const;

const STEPS = [
  { id: 'info', title: 'Thông tin chuyển', desc: 'Phòng đích, ngày chuyển, giá thuê & cọc' },
  { id: 'meters', title: 'Chốt đồng hồ', desc: 'Phòng hiện tại — chỉ số đến ngày chuyển' },
  { id: 'invoice', title: 'Hóa đơn', desc: 'Điện/nước + chênh lệch tiền phòng (nếu có)' },
  { id: 'confirm', title: 'Hoàn tất', desc: 'Xác nhận và kích hoạt HĐ mới' },
] as const;

export default function ContractTransferPage() {
  const { propertyId, contractId } = useParams<{ propertyId: string; contractId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: contract, isLoading } = useContract(contractId);

  const defaultTargetRoomId = searchParams.get('target_room_id') ?? '';

  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [fetchingRooms, setFetchingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState(0);
  const [targetRoomId, setTargetRoomId] = useState(defaultTargetRoomId);
  const [transferDate, setTransferDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rentPrice, setRentPrice] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('');

  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof contractsApi.previewRoomTransfer>> | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [issuedInvoiceId, setIssuedInvoiceId] = useState<string | null>(null);
  const [issuedTotal, setIssuedTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!contractId) return;
    setFetchingRooms(true);
    contractsApi
      .getAvailableRooms(contractId)
      .then((res: any) => {
        setAvailableRooms(res?.data ?? []);
      })
      .catch(() => toast.error('Không tải được danh sách phòng trống.'))
      .finally(() => setFetchingRooms(false));
  }, [contractId]);

  useEffect(() => {
    if (!contract) return;
    if (depositAmount === '') {
      setDepositAmount(contract.deposit_amount != null ? String(contract.deposit_amount) : '');
    }
  }, [contract, depositAmount]);

  useEffect(() => {
    if (!targetRoomId) return;
    const room = availableRooms.find((r) => r.id === targetRoomId);
    if (room?.base_price != null) {
      setRentPrice(String(room.base_price));
    }
  }, [targetRoomId, availableRooms]);

  useEffect(() => {
    setIssuedInvoiceId(null);
    setIssuedTotal(null);
    setPreview(null);
  }, [targetRoomId, transferDate, rentPrice]);

  const loadPreview = useCallback(async () => {
    if (!contractId || !targetRoomId) return;
    setPreviewLoading(true);
    try {
      const p = await contractsApi.previewRoomTransfer(contractId, {
        target_room_id: targetRoomId,
        transfer_date: transferDate,
        rent_price: rentPrice !== '' ? Number(rentPrice) : undefined,
      });
      setPreview(p);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Không tải được xem trước chuyển phòng.';
      toast.error(typeof msg === 'string' ? msg : 'Không tải được xem trước chuyển phòng.');
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [contractId, targetRoomId, transferDate, rentPrice]);

  useEffect(() => {
    if (step !== 2) return;
    void loadPreview();
  }, [step, loadPreview]);

  const selectedRoom = useMemo(
    () => availableRooms.find((r) => r.id === targetRoomId) ?? null,
    [availableRooms, targetRoomId],
  );

  const oldRent = Number(contract?.rent_price ?? 0);
  const newRentNum = rentPrice ? Number(rentPrice) : Number(selectedRoom?.base_price ?? oldRent);
  const rentDelta = newRentNum - oldRent;

  const issuePayload = useMemo(
    () => ({
      target_room_id: targetRoomId,
      transfer_date: transferDate,
      rent_price: rentPrice !== '' ? Number(rentPrice) : undefined,
    }),
    [targetRoomId, transferDate, rentPrice],
  );

  if (!propertyId || !contractId) {
    return <Navigate to="/org/properties" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6">
        <PageBackButton to={`/properties/${propertyId}/contracts`} />
        <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-6 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          Không tìm thấy hợp đồng.
        </div>
      </div>
    );
  }

  if (!ALLOWED_STATUSES.includes(contract.status as (typeof ALLOWED_STATUSES)[number])) {
    return <Navigate to={`/properties/${propertyId}/contracts/${contractId}`} replace />;
  }

  const backTo = `/properties/${propertyId}/contracts/${contractId}`;

  const goNext = () => {
    if (step === 0) {
      if (!targetRoomId) {
        toast.error('Vui lòng chọn phòng đích.');
        return;
      }
    }
    if (step === 2 && preview?.has_invoice_lines && !issuedInvoiceId) {
      toast.error('Vui lòng phát hành hóa đơn chuyển phòng trước khi sang bước xác nhận.');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleIssueInvoice = async () => {
    if (!contractId) return;
    try {
      setIssuing(true);
      const res = await contractsApi.issueRoomTransferFinalInvoice(contractId, issuePayload);
      setIssuedInvoiceId(res.data.invoice_id);
      setIssuedTotal(res.data.total_amount ?? null);
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Không phát hành được hóa đơn.';
      toast.error(message);
    } finally {
      setIssuing(false);
    }
  };

  const handleExecute = async () => {
    if (!contractId || !targetRoomId) return;
    if (preview?.has_invoice_lines && !issuedInvoiceId) {
      toast.error('Thiếu hóa đơn đã phát hành — quay lại bước 3.');
      return;
    }
    try {
      setSubmitting(true);
      const response = await contractsApi.executeRoomTransfer(contractId, {
        target_room_id: targetRoomId,
        transfer_date: transferDate,
        rent_price: rentPrice ? Number(rentPrice) : undefined,
        deposit_amount: depositAmount ? Number(depositAmount) : undefined,
        ...(issuedInvoiceId ? { linked_transfer_invoice_id: issuedInvoiceId } : {}),
      });

      toast.success('Chuyển phòng thành công. Hợp đồng mới đã được kích hoạt.');
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });

      const newContractId = response?.data?.new_contract_id ?? null;
      if (newContractId) {
        navigate(`/properties/${propertyId}/contracts/${newContractId}`);
      } else {
        navigate(`/properties/${propertyId}/contracts`);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Có lỗi xảy ra khi chuyển phòng.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <PageBackButton to={backTo} className="mb-6" />

        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-xl shadow-slate-200/30 sm:p-8 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
          <header className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
              <ArrowRightLeft className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Chuyển phòng
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Đóng hợp đồng phòng <span className="font-semibold">{contract.room?.name ?? contract.room?.code ?? ''}</span> và mở hợp đồng mới ở phòng đích — cọc kế thừa nguyên xi.
              </p>
            </div>
          </header>

          <nav className="mt-8 flex flex-wrap gap-2 border-b border-slate-100 pb-4 dark:border-slate-700">
            {STEPS.map((s, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (i <= step) setStep(i);
                  }}
                  className={`flex min-w-[140px] flex-1 flex-col rounded-xl border px-3 py-2 text-left text-xs transition sm:text-sm ${
                    active
                      ? 'border-blue-500 bg-blue-50 text-blue-900 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-100'
                      : done
                        ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                        : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400'
                  }`}
                >
                  <span className="font-bold">{i + 1}. {s.title}</span>
                  <span className="mt-0.5 hidden opacity-80 sm:inline">{s.desc}</span>
                </button>
              );
            })}
          </nav>

          <section className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-3 dark:border-slate-700 dark:bg-slate-900/40">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Phòng hiện tại</p>
              <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">{contract.room?.name ?? contract.room?.code ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Tiền thuê</p>
              <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">{formatCurrency(oldRent)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Tiền cọc đã giữ</p>
              <p className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(contract.deposit_amount ?? 0))}</p>
            </div>
          </section>

          {step === 0 && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Phòng đích <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={targetRoomId}
                    onChange={(e) => setTargetRoomId(e.target.value)}
                    disabled={fetchingRooms}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="" disabled>
                      {fetchingRooms ? 'Đang tải danh sách...' : 'Chọn phòng trống...'}
                    </option>
                    {availableRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name ?? room.code}
                        {room.area ? ` · ${room.area}m²` : ''} ·{' '}
                        {Number(room.base_price ?? 0).toLocaleString('vi-VN')}đ
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Ngày chuyển <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Giá thuê HĐ mới (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={rentPrice}
                    onChange={(e) => setRentPrice(e.target.value)}
                    placeholder="Để trống lấy giá phòng đích"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Tiền cọc HĐ mới (VNĐ)
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                      Kế thừa
                    </span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Mặc định kế thừa từ HĐ cũ"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {targetRoomId && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-sm text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
                  <p className="font-semibold">Tóm tắt chênh lệch tiền phòng</p>
                  <p className="mt-1">
                    Giá thuê hiện tại: <strong>{formatCurrency(oldRent)}</strong> · Giá HĐ mới:{' '}
                    <strong>{formatCurrency(newRentNum)}</strong> · Chênh lệch:{' '}
                    <strong>{rentDelta >= 0 ? '+' : ''}{formatCurrency(rentDelta)}</strong> / tháng.
                  </p>
                  {rentDelta > 0 ? (
                    <p className="mt-2 text-xs">
                      Phòng mới đắt hơn — dòng phụ thu chênh lệch (theo ngày còn lại trong tháng) sẽ gộp vào hóa đơn chuyển phòng ở bước sau.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs">
                      Phòng mới rẻ hơn hoặc bằng — hóa đơn chuyển phòng chỉ gồm điện/nước (nếu có tiêu thụ).
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <div className="flex gap-3">
                  <Gauge className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>
                    Bước tiếp theo: chốt chỉ số <strong>điện, nước</strong> phòng cũ đến ngày chuyển (ghi nhận & duyệt).
                  </p>
                </div>
                <div className="flex gap-3">
                  <Wallet className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>
                    Mọi hóa đơn cũ chưa thanh toán đủ phải đóng trước khi phát hành hóa đơn chuyển phòng.
                  </p>
                </div>
                <div className="flex gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>
                    Sau bước hóa đơn: hệ thống chỉ hoàn tất chuyển phòng khi đã có <strong>hóa đơn đã phát hành</strong> khớp dữ liệu (nếu có phát sinh tiền).
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 1 && contract.room_id && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Kỳ chốt số được căn theo <strong>tháng của ngày chuyển</strong> ({transferDate}). Hãy ghi nhận và duyệt chỉ số đến ngày chuyển trước khi sang bước hóa đơn.
              </p>
              <RoomMetersInlinePanel
                propertyId={propertyId}
                roomId={contract.room_id}
                periodAnchorDate={transferDate}
              />
            </div>
          )}

          {step === 2 && (
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <FileText className="h-4 w-4 text-blue-500" />
                Hóa đơn cuối cho hợp đồng phòng cũ (nguồn: chuyển phòng)
              </div>

              {previewLoading && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải xem trước…
                </div>
              )}

              {preview && !previewLoading && (
                <>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span
                      className={`rounded-full px-2 py-1 font-bold ${
                        preview.meters_sealed
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200'
                      }`}
                    >
                      Đồng hồ: {preview.meters_sealed ? 'Đã chốt' : `Chưa đủ (${preview.unread_meter_codes.join(', ') || '—'})`}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 font-bold ${
                        preview.outstanding_invoice_count === 0
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200'
                      }`}
                    >
                      Nợ HĐ cũ: {preview.outstanding_invoice_count === 0 ? 'Không' : `${preview.outstanding_invoice_count} hóa đơn`}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      Dự kiến tổng: {formatCurrency(preview.estimated_invoice_total)}
                    </span>
                  </div>

                  {!preview.meters_sealed && (
                    <p className="text-sm text-rose-600 dark:text-rose-300">
                      Chưa đủ chỉ số đồng hồ — quay lại bước 2 để chốt số trước khi phát hành hóa đơn.
                    </p>
                  )}
                  {preview.outstanding_invoice_count > 0 && (
                    <p className="text-sm text-rose-600 dark:text-rose-300">
                      Còn hóa đơn chưa thanh toán — vui lòng thu nợ cũ trước.
                    </p>
                  )}

                  {preview.line_preview.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                          <tr>
                            <th className="px-3 py-2">Nội dung</th>
                            <th className="px-3 py-2 text-right">Tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.line_preview.map((row, idx) => (
                            <tr key={idx} className="border-t border-slate-100 dark:border-slate-700">
                              <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{row.description}</td>
                              <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatCurrency(row.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!preview.has_invoice_lines && (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
                      Không phát sinh dòng thanh toán cho chuyển phòng — có thể sang bước xác nhận mà không cần phát hành hóa đơn.
                    </p>
                  )}

                  {preview.has_invoice_lines && (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleIssueInvoice}
                        disabled={
                          issuing ||
                          !preview.meters_sealed ||
                          preview.outstanding_invoice_count > 0 ||
                          Boolean(issuedInvoiceId)
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
                      >
                        {issuing && <Loader2 className="h-4 w-4 animate-spin" />}
                        Phát hành hóa đơn chuyển phòng
                      </button>
                      {issuedInvoiceId && (
                        <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Đã phát hành · {formatCurrency(issuedTotal ?? preview.estimated_invoice_total)}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="mt-6 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <p>
                Xác nhận chuyển sang phòng <strong>{selectedRoom?.name ?? selectedRoom?.code ?? targetRoomId}</strong>, ngày{' '}
                <strong>{transferDate}</strong>, giá thuê mới <strong>{formatCurrency(newRentNum)}</strong>.
              </p>
              {preview?.has_invoice_lines && issuedInvoiceId && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                  Hóa đơn chuyển phòng đã liên kết (sẽ ghi vào meta hợp đồng). Bạn có thể thu tiền theo hóa đơn sau khi hoàn tất.
                </p>
              )}
              {!preview?.has_invoice_lines && (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-900/40">
                  Không có hóa đơn chuyển phòng — chỉ đóng hợp đồng cũ và kích hoạt hợp đồng mới.
                </p>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-6 dark:border-slate-700">
            <button
              type="button"
              onClick={step === 0 ? () => navigate(backTo) : goBack}
              disabled={submitting}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
              {step === 0 ? 'Hủy' : 'Quay lại'}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={
                  submitting ||
                  (step === 2 &&
                    Boolean(preview?.has_invoice_lines && !issuedInvoiceId))
                }
                className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-50 dark:shadow-none"
              >
                Tiếp theo
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExecute}
                disabled={
                  submitting ||
                  !targetRoomId ||
                  (Boolean(preview?.has_invoice_lines) && !issuedInvoiceId)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-50 dark:shadow-none"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Xác nhận chuyển phòng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
