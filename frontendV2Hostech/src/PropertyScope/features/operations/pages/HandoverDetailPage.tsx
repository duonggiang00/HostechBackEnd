import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import {
  Banknote,
  Building2,
  ClipboardCheck,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Gauge,
  ImageIcon,
  Loader2,
  Maximize2,
  Minimize2,
  Package,
  Receipt,
  User,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  useHandover,
  type HandoverRefundReceipt,
  type HandoverSnapshot,
} from '@/shared/features/operations/hooks/useHandover';
import { useContract } from '@/PropertyScope/features/contracts/hooks/useContracts';
import type { Contract } from '@/PropertyScope/features/contracts/types';
import { billingApi } from '@/PropertyScope/features/billing/api/billing';
import { invoiceKeys, usePropertyInvoices } from '@/PropertyScope/features/billing/hooks/usePropertyInvoices';
import { formatCurrency, isUuid } from '@/lib/utils';
import type { Payment } from '@/PropertyScope/features/billing/types';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';
import { paymentDetailReferrerState } from '@/PropertyScope/features/finance/utils/paymentNavigation';
import { contractStatusLabelVi } from '@/PropertyScope/features/contracts/utils/contractStatusLabels';

function formatHandoverDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd/MM/yyyy HH:mm', { locale: vi });
  } catch {
    return '—';
  }
}

function getTenantNameFromHandover(h: {
  contract?: {
    tenant?: { name?: string; full_name?: string } | null;
    primaryMember?: { full_name?: string; name?: string } | null;
    primary_member?: { full_name?: string; name?: string } | null;
  } | null;
}): string {
  const t =
    h.contract?.tenant?.name?.trim() ||
    h.contract?.tenant?.full_name?.trim();
  if (t) return t;
  const member = h.contract?.primaryMember ?? h.contract?.primary_member;
  if (member?.full_name) return member.full_name;
  if (member?.name) return member.name;
  return '—';
}

/** Chi tiết HĐ (GET /contracts/:id) luôn nạp members — dùng khi payload handover.contract thiếu tenant. */
function getTenantNameFromContract(c: Contract): string {
  const withTenant = c as Contract & { tenant?: { name?: string; full_name?: string } | null };
  const fromTenant =
    withTenant.tenant?.name?.trim() || withTenant.tenant?.full_name?.trim();
  if (fromTenant) return fromTenant;

  const primary =
    c.members?.find((m) => m.role === 'PRIMARY' || m.is_primary) ?? c.members?.[0];
  if (primary?.full_name?.trim()) return primary.full_name.trim();
  if (primary?.user?.full_name?.trim()) return primary.user.full_name.trim();

  return '';
}

function conditionLabel(condition: string): string {
  const c = (condition || '').toUpperCase();
  const map: Record<string, string> = {
    OK: 'Tốt',
    MISSING: 'Thiếu / mất',
    DAMAGED: 'Hư hỏng',
  };
  return map[c] ?? condition;
}

function conditionBadgeClass(condition: string): string {
  const c = (condition || '').toUpperCase();
  const map: Record<string, string> = {
    OK: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/25',
    MISSING: 'bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-500/25',
    DAMAGED: 'bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-500/25',
  };
  return map[c] ?? 'bg-slate-50 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
}

function snapshotTypeKey(snap: HandoverSnapshot): string {
  const raw = snap.meter_type ?? (snap.meter?.type as string | undefined) ?? '';
  return String(raw).toUpperCase() || 'OTHER';
}

function meterKindLabel(snap: HandoverSnapshot): string {
  const u = snapshotTypeKey(snap);
  if (u === 'ELECTRIC' || u === 'ELECTRICITY') return 'Đồng hồ điện';
  if (u === 'WATER') return 'Đồng hồ nước';
  return 'Đồng hồ';
}

function meterDisplayUnit(snap: HandoverSnapshot): string {
  const u = snapshotTypeKey(snap);
  if (u === 'ELECTRIC' || u === 'ELECTRICITY') return 'kWh';
  if (u === 'WATER') return 'm³';
  const m = snap.meter as Record<string, unknown> | null | undefined;
  return (m?.unit as string) || snap.unit || '';
}

function sortMeterSnapshots(snapshots: HandoverSnapshot[]): HandoverSnapshot[] {
  const rank = (t: string) => {
    if (t === 'ELECTRIC' || t === 'ELECTRICITY') return 0;
    if (t === 'WATER') return 1;
    return 2;
  };
  return [...snapshots].sort((a, b) => {
    const ra = rank(snapshotTypeKey(a));
    const rb = rank(snapshotTypeKey(b));
    if (ra !== rb) return ra - rb;
    return String(a.meter_id ?? '').localeCompare(String(b.meter_id ?? ''));
  });
}

function formatContractEndDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd/MM/yyyy', { locale: vi });
  } catch {
    return iso;
  }
}

function contractStatusLabel(status?: string | null): string {
  const s = (status ?? '').toUpperCase();
  const map: Record<string, string> = {
    ACTIVE: 'Hiệu lực',
    PENDING_TERMINATION: 'Chờ thanh lý',
    PENDING_SETTLEMENT: 'Chờ quyết toán nợ',
    EXPIRED: 'Hết hạn',
    TERMINATED: 'Đã thanh lý',
    ENDED: 'Đã kết thúc',
    CANCELLED: 'Đã hủy',
  };
  return map[s] ?? contractStatusLabelVi(status);
}

function uniquePaymentsFromInvoice(
  allocations: { payment?: Payment | null }[] | undefined,
): Payment[] {
  const list = (allocations ?? []).map((a) => a.payment).filter(Boolean) as Payment[];
  return [...new Map(list.map((p) => [p.id, p])).values()];
}

type TabId = 'detail' | 'gallery' | 'invoices' | 'receipts';

type LocationState = { activeTab?: TabId };

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'detail', label: 'Chi tiết bàn giao', icon: ClipboardCheck },
  { id: 'gallery', label: 'Gallery ảnh', icon: ImageIcon },
  { id: 'invoices', label: 'Hóa đơn', icon: FileText },
  { id: 'receipts', label: 'Biên lai', icon: Receipt },
];

/** Giống InvoiceDetailPage — xem PDF hóa đơn nhúng */
function InlineInvoicePdfViewer({ url }: { url: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
            Bản mềm hóa đơn
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Mở tab mới
          </a>
        </div>
      </div>
      <div className={`relative bg-slate-100 dark:bg-slate-900 transition-all duration-300 ${isExpanded ? 'h-[80vh]' : 'h-[600px]'}`}>
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-slate-900 z-10">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-medium text-gray-500">Đang tải tài liệu...</p>
            </div>
          </div>
        )}
        <iframe
          src={url}
          className="w-full h-full border-0"
          title="Hóa đơn PDF"
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    </div>
  );
}

/** Giống PaymentDetailPage — biên lai thu tiền */
function EmbeddedPaymentReceiptPdf({ url }: { url: string }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Bản mềm biên lai</h2>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Mở tab mới
        </a>
      </div>
      <div className="h-[70vh] rounded-lg overflow-hidden border border-gray-200 dark:border-slate-800">
        <iframe src={url} className="w-full h-full border-0" title="Bản mềm biên lai" />
      </div>
    </div>
  );
}

function EmbeddedRefundPdf({ url }: { url: string }) {
  return (
    <div className="rounded-lg border border-violet-200 dark:border-violet-500/25 bg-white dark:bg-slate-900 p-6 shadow-sm mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
          Bản mềm phiếu hoàn cọc
        </h2>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Mở tab mới
        </a>
      </div>
      <div className="h-[70vh] rounded-lg overflow-hidden border border-gray-200 dark:border-slate-800">
        <iframe src={url} className="w-full h-full border-0" title="Phiếu hoàn cọc PDF" />
      </div>
    </div>
  );
}

export default function HandoverDetailPage() {
  const { propertyId, handoverId } = useParams<{ propertyId: string; handoverId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { useHandoverDetails } = useHandover();
  const { data: handover, isLoading, isError } = useHandoverDetails(handoverId ?? '');

  const [activeTab, setActiveTab] = useState<TabId>(
    () => (location.state as LocationState | null)?.activeTab ?? 'detail',
  );

  const contractId = handover?.contract_id ?? undefined;
  const { data: contract, isLoading: contractDetailLoading } = useContract(contractId);

  const { data: terminationList } = usePropertyInvoices(propertyId ?? '', {
    contract_id: contractId,
    is_termination: true,
    per_page: 50,
    page: 1,
  }, {
    enabled: !!propertyId && !!contractId && isUuid(contractId),
  });

  const termInvoiceRows = terminationList?.data ?? [];

  const invoiceDetailQueries = useQueries({
    queries: termInvoiceRows.map((inv) => ({
      queryKey: invoiceKeys.detail(inv.id),
      queryFn: () => billingApi.getInvoice(inv.id),
      enabled: !!propertyId && !!contractId && isUuid(contractId) && !!inv.id,
      staleTime: 30_000,
    })),
  });

  const mergedReceiptPayments = useMemo(() => {
    const list: Payment[] = [];
    for (const q of invoiceDetailQueries) {
      if (q.data?.payment_allocations?.length) {
        list.push(...uniquePaymentsFromInvoice(q.data.payment_allocations));
      }
    }
    return [...new Map(list.map((p) => [p.id, p])).values()];
  }, [invoiceDetailQueries]);

  const refundReceipt = handover?.refund_receipt ?? null;

  if (!propertyId || !handoverId) {
    return (
      <div className="max-w-[1600px] mx-auto w-full p-8 text-slate-600 dark:text-slate-400">
        Thiếu tham số đường dẫn.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto w-full p-8 space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-1/3" />
        <div className="h-64 bg-gray-100 dark:bg-slate-800 rounded-lg" />
      </div>
    );
  }

  if (isError || !handover) {
    return (
      <div className="max-w-[1600px] mx-auto w-full p-8">
        <p className="text-rose-600 dark:text-rose-400 font-medium">Không tải được biên bản bàn giao.</p>
        <button
          type="button"
          onClick={() => navigate(`/properties/${propertyId}/handovers`)}
          className="mt-4 text-indigo-600 font-bold text-sm"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const roomName = handover.room?.name ?? handover.room?.code ?? '—';
  const tenantFromHandoverPayload = getTenantNameFromHandover(handover);
  const tenantFromContractDetail = contract ? getTenantNameFromContract(contract) : '';
  const tenantNameResolved =
    (tenantFromHandoverPayload !== '—' ? tenantFromHandoverPayload : '') || tenantFromContractDetail;
  const tenantRowDisplay =
    !contractId
      ? '—'
      : contractDetailLoading && !tenantNameResolved
        ? 'Đang tải…'
        : tenantNameResolved || 'Chưa có thông tin';
  const creator =
    handover.createdBy?.full_name ?? handover.createdBy?.name ?? '—';
  const sortedMeterSnapshots = handover.meter_snapshots?.length
    ? sortMeterSnapshots(handover.meter_snapshots)
    : [];

  const documentScanUrls = handover.document_scan_urls ?? [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <PageBackButton
              onBack={() => navigate(`/properties/${propertyId}/handovers`)}
              className="shrink-0 text-sm"
            />
            <div className="h-5 w-px bg-gray-200 dark:bg-slate-700 shrink-0" />
            <div className="min-w-0 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 dark:bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  Chi tiết biên bản bàn giao
                </h1>
                <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5 truncate">
                  Phòng {roomName}
                  {tenantNameResolved ? ` · ${tenantNameResolved}` : ''} · {formatHandoverDate(handover.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-[73px] z-10">
        <div className="px-6 overflow-x-auto no-scrollbar">
          <div className="flex">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-3.5 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {activeTab === 'detail' && (
          <>
      {/* Tóm tắt */}
      <section className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thông tin chung</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-slate-400">Phòng</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{roomName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-slate-400">Khách thuê</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{tenantRowDisplay}</p>
              {contractId && !tenantNameResolved && !contractDetailLoading ? (
                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                  Xem thông tin thành viên trên{' '}
                  <Link
                    to={`/properties/${propertyId}/contracts/${contractId}`}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    hợp đồng
                  </Link>
                  .
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-slate-400">Hợp đồng</p>
              {handover.contract?.id ? (
                <Link
                  to={`/properties/${propertyId}/contracts/${handover.contract.id}`}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  {contractStatusLabel(handover.contract.status)}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">—</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-slate-400">Người tạo</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{creator}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-slate-400">Ngày lập</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatHandoverDate(handover.created_at)}
            </p>
          </div>
        </div>
        {handover.note ? (
          <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
            <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">Ghi chú tình trạng phòng</p>
            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{handover.note}</p>
          </div>
        ) : null}
      </section>

      {/* Tài sản — bảng tên tài sản / tình trạng */}
      <section className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Danh sách tài sản & tình trạng</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
          Theo dõi từng tài sản lúc bàn giao; không phụ thuộc hiển thị tên khách thuê.
        </p>
        {!handover.items?.length ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">Chưa có mục nào trong biên bản.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-gray-200 dark:border-slate-800">
                <TableHead className="text-xs font-semibold text-gray-900 dark:text-slate-300">
                  Tên tài sản
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-900 dark:text-slate-300 w-[140px]">
                  Tình trạng
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {handover.items.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/30"
                >
                  <TableCell className="text-sm text-gray-900 dark:text-white align-top py-3">
                    {item.name}
                  </TableCell>
                  <TableCell className="align-top py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${conditionBadgeClass(item.condition)}`}
                    >
                      {conditionLabel(item.condition)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Đồng hồ — theo loại điện / nước, không hiển thị mã đồng hồ */}
      <section className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chỉ số đồng hồ tại kết thúc</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4 leading-relaxed">
          {handover.contract?.end_date
            ? `Hợp đồng kết thúc ${formatContractEndDate(handover.contract.end_date)}. Bảng dưới là chỉ số điện / nước ghi nhận khi lập biên bản bàn giao (thời điểm kết thúc thuê).`
            : 'Chỉ số điện / nước ghi nhận khi lập biên bản bàn giao.'}
        </p>
        {!sortedMeterSnapshots.length ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">Không có snapshot chỉ số.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-gray-200 dark:border-slate-800">
                <TableHead className="text-xs font-semibold text-gray-900 dark:text-slate-300">
                  Loại đồng hồ
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-900 dark:text-slate-300">
                  Chỉ số
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-900 dark:text-slate-300 text-center w-[100px]">
                  Ảnh
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMeterSnapshots.map((snap, idx) => {
                const typeKey = snapshotTypeKey(snap);
                const sameBefore = sortedMeterSnapshots
                  .slice(0, idx)
                  .filter((s) => snapshotTypeKey(s) === typeKey).length;
                const baseKind = meterKindLabel(snap);
                const rowKind = sameBefore > 0 ? `${baseKind} (${sameBefore + 1})` : baseKind;
                const unit = meterDisplayUnit(snap);
                const photos = snap.meter_photo_urls ?? [];

                return (
                  <TableRow
                    key={snap.id ?? `${snap.meter_id}-${idx}`}
                    className="border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/30"
                  >
                    <TableCell className="text-sm font-medium text-gray-900 dark:text-white align-middle py-3">
                      {rowKind}
                    </TableCell>
                    <TableCell className="align-middle py-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                        {snap.reading_value}
                      </span>
                      {unit ? (
                        <span className="text-sm text-gray-500 dark:text-slate-400 ml-1.5">{unit}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="align-middle py-3">
                      {photos.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {photos.slice(0, 2).map((url) => (
                            <a key={url} href={url} target="_blank" rel="noreferrer" className="block">
                              <img
                                src={url}
                                alt=""
                                className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                              />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-slate-500 block text-center">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>
          </>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-8">
            {documentScanUrls.length > 0 ? (
              <section className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                  Ảnh tình trạng phòng khi bàn giao
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {documentScanUrls.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                    >
                      <img src={url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <ImageIcon className="w-3 h-3" />
                        Mở
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {sortedMeterSnapshots.map((snap, idx) => {
              const photos = snap.meter_photo_urls ?? [];
              if (!photos.length) return null;
              const typeKey = snapshotTypeKey(snap);
              const sameBefore = sortedMeterSnapshots
                .slice(0, idx)
                .filter((s) => snapshotTypeKey(s) === typeKey).length;
              const baseKind = meterKindLabel(snap);
              const rowTitle = sameBefore > 0 ? `${baseKind} (${sameBefore + 1})` : baseKind;

              return (
                <section
                  key={snap.id ?? `${snap.meter_id}-gallery-${idx}`}
                  className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 shadow-sm"
                >
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                    Ảnh đồng hồ · {rowTitle}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {photos.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                      >
                        <img src={url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                          <ImageIcon className="w-3 h-3" />
                          Mở
                        </span>
                      </a>
                    ))}
                  </div>
                </section>
              );
            })}

            {documentScanUrls.length === 0 &&
            !sortedMeterSnapshots.some((s) => (s.meter_photo_urls?.length ?? 0) > 0) ? (
              <div className="rounded-lg border border-dashed border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-12 text-center text-gray-500 dark:text-slate-400 text-sm">
                Chưa có ảnh trong biên bản bàn giao.
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-8">
            {!contractId ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Cần hợp đồng gắn với biên bản để xem hóa đơn thanh lý.
              </p>
            ) : termInvoiceRows.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Chưa có hóa đơn kết thúc (is_termination) cho hợp đồng này.
              </p>
            ) : (
              termInvoiceRows.map((row, idx) => {
                const q = invoiceDetailQueries[idx];
                const inv = q?.data;
                return (
                  <section
                    key={row.id}
                    className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Hóa đơn quyết toán thanh lý
                          </h2>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-slate-400">Tổng tiền</p>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          {inv ? formatCurrency(inv.total_amount) : q?.isPending ? '…' : '—'}
                        </p>
                        {inv ? (
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Trạng thái: {inv.status}</p>
                        ) : null}
                      </div>
                      <Link
                        to={`/properties/${propertyId}/billing/invoices/${row.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        Chi tiết hóa đơn
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>

                    {q?.isPending ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                        <p className="text-xs font-medium text-gray-500">Đang tải hóa đơn…</p>
                      </div>
                    ) : q?.isError ? (
                      <p className="text-sm text-rose-600 dark:text-rose-400">Không tải được chi tiết hóa đơn.</p>
                    ) : inv?.pdf_url ? (
                      <InlineInvoicePdfViewer url={inv.pdf_url} />
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        Hóa đơn này chưa có file PDF bản mềm.
                      </p>
                    )}
                  </section>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'receipts' && (
          <div className="space-y-8">
            {contractId &&
            termInvoiceRows.length > 0 &&
            mergedReceiptPayments.length === 0 &&
            invoiceDetailQueries.some((qu) => qu.isPending) ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="text-xs font-medium text-gray-500">Đang tải biên lai…</p>
              </div>
            ) : null}

            {contractId &&
            termInvoiceRows.length > 0 &&
            mergedReceiptPayments.length === 0 &&
            !invoiceDetailQueries.some((qu) => qu.isPending) ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Chưa có giao dịch gạch nợ hoặc chưa phát sinh biên lai cho các hóa đơn thanh lý.
              </p>
            ) : null}

            {contractId && termInvoiceRows.length === 0 && !refundReceipt && mergedReceiptPayments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Chưa có hóa đơn thanh lý cho hợp đồng — không có biên lai thu tiền.
              </p>
            ) : null}

            {mergedReceiptPayments.map((p) => (
              <div key={p.id} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(p.amount)} · {p.method}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{p.status}</p>
                  </div>
                  <Link
                    to={`/properties/${propertyId}/finance/payments/${p.id}`}
                    state={paymentDetailReferrerState(location.pathname, location.search)}
                    className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Chi tiết biên lai
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {p.receipt?.url ? (
                  <EmbeddedPaymentReceiptPdf url={p.receipt.url} />
                ) : (
                  <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                    <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-lg px-3 py-2">
                      Giao dịch này chưa có file biên lai PDF.
                    </p>
                  </div>
                )}
              </div>
            ))}

            {refundReceipt ? (
              <>
                <RefundReceiptCard receipt={refundReceipt} propertyId={propertyId} />
                {refundReceipt.paid_at && refundReceipt.pdf_url ? (
                  <EmbeddedRefundPdf url={refundReceipt.pdf_url} />
                ) : null}
              </>
            ) : null}

            {!contractId && !refundReceipt && mergedReceiptPayments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Không có biên lai liên quan tới biên bản này.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function depositStatusBadge(status?: string | null): { label: string; className: string } {
  const s = (status ?? '').toUpperCase();
  const map: Record<string, { label: string; className: string }> = {
    HELD: {
      label: 'Đang giữ cọc',
      className:
        'bg-slate-100 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600',
    },
    REFUND_PENDING: {
      label: 'Chờ hoàn cọc',
      className:
        'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-500/25',
    },
    REFUNDED: {
      label: 'Đã hoàn trả',
      className:
        'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/25',
    },
    FORFEITED: {
      label: 'Bị phạt cọc',
      className:
        'bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-500/25',
    },
  };
  return (
    map[s] ?? {
      label: status ?? 'Không rõ',
      className:
        'bg-slate-100 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600',
    }
  );
}

function payoutMethodLabel(method?: string | null): { label: string; Icon: typeof Banknote } {
  const m = (method ?? '').toUpperCase();
  if (m === 'CASH') return { label: 'Tiền mặt', Icon: Banknote };
  if (m === 'TRANSFER' || m === 'BANK_TRANSFER') return { label: 'Chuyển khoản', Icon: CreditCard };
  if (m === 'WALLET') return { label: 'Ví điện tử', Icon: Wallet };
  return { label: method ?? '—', Icon: CreditCard };
}

function RefundReceiptCard({
  receipt,
  propertyId,
}: {
  receipt: HandoverRefundReceipt;
  propertyId: string;
}) {
  const status = depositStatusBadge(receipt.deposit_status);
  const payout = payoutMethodLabel(receipt.payout_method);
  const PayoutIcon = payout.Icon;
  const isPaid = !!receipt.paid_at;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-violet-600 dark:text-violet-300" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Phiếu hoàn cọc</h2>
            {receipt.reference ? (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Mã: {receipt.reference}</p>
            ) : null}
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-4 rounded-lg bg-violet-50/80 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20">
          <p className="text-xs text-violet-800 dark:text-violet-300 font-medium">Số tiền hoàn</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white tabular-nums mt-1">
            {formatCurrency(receipt.amount)}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
            Tạo phiếu: {formatHandoverDate(receipt.created_at)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-600 dark:text-slate-400">Hình thức chi</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1 inline-flex items-center gap-1.5">
              <PayoutIcon className="w-4 h-4 text-gray-500" />
              {payout.label}
            </p>
            {receipt.payout_reference ? (
              <p className="text-xs text-gray-500 mt-1 truncate">Tham chiếu: {receipt.payout_reference}</p>
            ) : null}
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-600 dark:text-slate-400">Đã chi lúc</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {receipt.paid_at ? formatHandoverDate(receipt.paid_at) : 'Chưa chi'}
            </p>
            {receipt.paid_by_user?.full_name ? (
              <p className="text-xs text-gray-500 mt-1 truncate">Người chi: {receipt.paid_by_user.full_name}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {isPaid && receipt.pdf_url ? (
          <a
            href={receipt.pdf_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700"
          >
            <Download className="w-4 h-4" />
            Tải biên lai PDF
          </a>
        ) : null}
        <Link
          to={`/properties/${propertyId}/finance/payments?tab=refunds`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          <ExternalLink className="w-4 h-4" />
          {isPaid ? 'Xem trên trang Biên lai' : 'Xác nhận đã chi trên trang Biên lai'}
        </Link>
      </div>

      {!isPaid ? (
        <p className="mt-4 text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-lg px-3 py-2 leading-relaxed">
          Chưa chi tiền hoàn cọc — bản PDF sẽ được sinh sau khi BQL bấm “Xác nhận đã hoàn” trên trang Biên lai (tab Hoàn tiền).
        </p>
      ) : null}
    </section>
  );
}
