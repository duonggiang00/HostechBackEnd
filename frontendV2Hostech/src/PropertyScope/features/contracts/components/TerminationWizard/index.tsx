import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import axios from 'axios';
import { format, isBefore, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  Check,
  ClipboardList,
  ExternalLink,
  FileText,
  Gauge,
  Loader2,
  Maximize2,
  Minimize2,
  Plus,
  Receipt,
  Trash2,
  X,
} from 'lucide-react';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import type { Contract, ContractMember, FinalizeTerminationData, TerminationRefundReceiptLine } from '../../types';
import { contractStatusLabelVi } from '../../utils/contractStatusLabels';
import { billingApi } from '@/PropertyScope/features/billing/api/billing';
import { ManualInvoiceFormPanel } from '@/PropertyScope/features/billing/components/ManualInvoiceFormPanel';
import type { Invoice } from '@/PropertyScope/features/billing/types';
import { contractsApi } from '../../api/contracts';
import {
  CONTRACT_KEY,
  CONTRACT_TERMINATION_HANDOVER_KEY,
  contractTerminationLinkedFinalInvoiceQueryKey,
  useContractActions,
  useTerminationHandoverState,
} from '../../hooks/useContracts';
import { buildSyncPayload, defaultTerminationDateInput, type TerminationFormValues } from './buildPayload';
import { RoomMetersInlinePanel } from './RoomMetersInlinePanel';
import { ContractRentDebtPanel } from '../ContractRentDebtPanel';

interface TerminationWizardProps {
  contract: Contract;
  propertyId: string;
  onClose: () => void;
}

type FinalInvoiceStepResult = Awaited<ReturnType<typeof contractsApi.linkTerminationFinalInvoice>>;

const STEPS = [
  { id: 'info', title: 'Thông tin', icon: FileText },
  { id: 'handover', title: 'Biên bản', icon: ClipboardList },
  { id: 'meters', title: 'Đồng hồ', icon: Gauge },
  { id: 'invoice', title: 'Hóa đơn thanh lý', icon: Calculator },
  { id: 'refund', title: 'Biên lai hoàn', icon: Receipt },
] as const;

function newLineId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Dòng hoàn cọc tự điền khi chọn Hoàn cọc — đồng bộ số với `depositPreview.remainder`. */
const AUTO_DEPOSIT_REFUND_ROW_ID = 'auto-deposit-refund';

function parseErr(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const msg = (e.response?.data as { message?: string } | undefined)?.message;
    return typeof msg === 'string' ? msg : e.message;
  }
  return e instanceof Error ? e.message : 'Có lỗi xảy ra.';
}

/** Khớp ContractResource::tenant (PRIMARY → is_primary → member đầu). */
function resolveTenantMember(members: ContractMember[] | undefined): ContractMember | undefined {
  if (!members?.length) return undefined;
  return (
    members.find((m) => m.role === 'PRIMARY') ||
    members.find((m) => m.is_primary) ||
    members[0]
  );
}

function memberDisplayName(m: ContractMember | undefined): string {
  if (!m) return '';
  return (
    m.full_name?.trim() ||
    m.user?.full_name?.trim() ||
    m.email?.trim() ||
    m.user?.email?.trim() ||
    ''
  );
}

function parseYmdDate(s: string | null | undefined): Date | null {
  if (!s || !String(s).trim()) return null;
  const day = String(s).split('T')[0];
  const d = parseISO(day);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Xem PDF hóa đơn thanh lý nhúng (cùng pattern HandoverDetailPage). */
function TerminationInlineInvoicePdf({ url }: { url: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Bản mềm hóa đơn
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Mở tab mới
          </a>
        </div>
      </div>
      <div
        className={`relative bg-slate-100 transition-all duration-300 dark:bg-slate-950 ${isExpanded ? 'h-[min(80vh,720px)]' : 'h-[420px]'}`}
      >
        {!isLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-xs font-medium">Đang tải PDF…</p>
            </div>
          </div>
        )}
        <iframe src={url} className="h-full w-full border-0" title="Hóa đơn PDF" onLoad={() => setIsLoaded(true)} />
      </div>
    </div>
  );
}

type LineDraft = { id: string; description: string; amount: string };

type PendingHandoverScan = { id: string; file: File; previewUrl: string };

export function TerminationWizard({ contract, propertyId, onClose }: TerminationWizardProps) {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<TerminationFormValues>(() => ({
    termination_date: defaultTerminationDateInput(contract),
    cancellation_party: contract.cancellation_party ?? 'MUTUAL',
    cancellation_reason: contract.cancellation_reason ?? '',
    waive_penalty: false,
    damage_fee_total: 0,
    billing_mode: 'combined',
    mid_month_rent_credit: 0,
  }));
  const [issueResult, setIssueResult] = useState<FinalInvoiceStepResult | null>(null);
  const [linkedInvoicePdfUrl, setLinkedInvoicePdfUrl] = useState<string | null>(null);
  /** Kịch B: ưu tiên nút thu sau quyết toán */
  const [extraPaymentPreference, setExtraPaymentPreference] = useState<'transfer' | 'cash'>('transfer');
  const [fprProofFile, setFprProofFile] = useState<File | null>(null);
  const [fprProofPreviewUrl, setFprProofPreviewUrl] = useState<string | null>(null);
  /** Sau khi ghi nhận thu qua yêu cầu thanh toán cuối: xem biên lai / ảnh bằng chứng trên máy chủ */
  const [fprRecordedPaymentSummary, setFprRecordedPaymentSummary] = useState<{
    paymentId: string;
    proofUrl: string | null;
  } | null>(null);
  const [finalizeResult, setFinalizeResult] = useState<
    Awaited<ReturnType<typeof contractsApi.finalizeTermination>> | null
  >(null);
  const [fprDetail, setFprDetail] = useState<
    Awaited<ReturnType<typeof contractsApi.getFinalPaymentRequest>>['data'] | null
  >(null);
  const [handoverNote, setHandoverNote] = useState('');
  const [handoverConditions, setHandoverConditions] = useState<
    Record<string, 'OK' | 'MISSING' | 'DAMAGED'>
  >({});
  const [refundReceiptLineDrafts, setRefundReceiptLineDrafts] = useState<LineDraft[]>([]);
  const [handoverUploadBusy, setHandoverUploadBusy] = useState(false);
  const [pendingHandoverScans, setPendingHandoverScans] = useState<PendingHandoverScan[]>([]);
  const pendingScansRef = useRef<PendingHandoverScan[]>([]);
  pendingScansRef.current = pendingHandoverScans;
  const [issueLinkBusy, setIssueLinkBusy] = useState(false);
  /** Hoàn cọc: biên lai hoàn phần còn lại | Không hoàn cọc: thu hồi (FORFEIT), không gửi dòng hoàn cọc. */
  const [depositRefundChoice, setDepositRefundChoice] = useState<'refund' | 'no_refund'>('refund');

  const {
    linkTerminationFinalInvoice,
    finalizeTermination,
    commitTerminationHandover,
  } = useContractActions();

  const {
    data: handoverState,
    isLoading: handoverLoading,
    isError: handoverError,
    error: handoverQueryError,
  } = useTerminationHandoverState(contract.id);

  const linkedFinalInvoiceQuery = useQuery({
    queryKey: contractTerminationLinkedFinalInvoiceQueryKey(contract.id),
    queryFn: ({ signal }) => contractsApi.getTerminationLinkedFinalInvoice(contract.id, signal),
    staleTime: 60_000,
  });

  const effectiveIssueResult = useMemo((): FinalInvoiceStepResult | null => {
    if (issueResult) return issueResult;
    const p = linkedFinalInvoiceQuery.data;
    if (p?.data) {
      return { message: p.message, data: p.data };
    }
    return null;
  }, [issueResult, linkedFinalInvoiceQuery.data]);

  useEffect(() => {
    const invId = effectiveIssueResult?.data?.invoice_id;
    if (!invId) {
      setLinkedInvoicePdfUrl(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const inv = await billingApi.getInvoice(invId);
        if (!cancelled) setLinkedInvoicePdfUrl(inv.pdf_url ?? null);
      } catch {
        if (!cancelled) setLinkedInvoicePdfUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveIssueResult?.data?.invoice_id]);

  const paramsLocked = Boolean(issueResult);

  useEffect(() => {
    if (!handoverState?.items?.length) return;
    setHandoverConditions((prev) => {
      const next = { ...prev };
      for (const it of handoverState.items) {
        const rid = it.room_asset_id;
        if (!rid) continue;
        const c = it.condition;
        if (next[rid] === undefined && (c === 'OK' || c === 'MISSING' || c === 'DAMAGED')) {
          next[rid] = c;
        }
      }
      return next;
    });
    if (!handoverNote && handoverState.default_handover_note) {
      setHandoverNote(handoverState.default_handover_note);
    }
  }, [handoverState, handoverNote]);

  useEffect(
    () => () => {
      pendingScansRef.current.forEach((row) => URL.revokeObjectURL(row.previewUrl));
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (fprProofPreviewUrl) URL.revokeObjectURL(fprProofPreviewUrl);
    };
  }, [fprProofPreviewUrl]);

  const prevContractIdRef = useRef(contract.id);
  useEffect(() => {
    if (prevContractIdRef.current === contract.id) return;
    prevContractIdRef.current = contract.id;
    setIssueResult(null);
    setLinkedInvoicePdfUrl(null);
    setFinalizeResult(null);
    setRefundReceiptLineDrafts([]);
    setDepositRefundChoice('refund');
    setExtraPaymentPreference('transfer');
    setFprProofFile(null);
    setFprRecordedPaymentSummary(null);
    setFprProofPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [contract.id]);

  const removePendingHandoverScan = (id: string) => {
    setPendingHandoverScans((prev) => {
      const row = prev.find((p) => p.id === id);
      if (row) URL.revokeObjectURL(row.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      if (!form.termination_date.trim()) {
        toast.error('Vui lòng chọn ngày thanh lý.');
        return;
      }
    }
    if (activeStep === 3) {
      let hasFinal = issueResult != null;
      if (!hasFinal) {
        try {
          const r = await queryClient.fetchQuery({
            queryKey: contractTerminationLinkedFinalInvoiceQueryKey(contract.id),
            queryFn: ({ signal }) => contractsApi.getTerminationLinkedFinalInvoice(contract.id, signal),
          });
          hasFinal = Boolean(r?.data);
        } catch {
          hasFinal = false;
        }
      }
      if (!hasFinal) {
        toast.error('Vui lòng tạo, phát hành và gắn hóa đơn thanh lý trước khi sang bước biên lai hoàn.');
        return;
      }
    }
    setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const updateField = <K extends keyof TerminationFormValues>(key: K, value: TerminationFormValues[K]) => {
    if (paramsLocked) return;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleBillingInvoiceCreated = async (invoice: Invoice) => {
    setIssueLinkBusy(true);
    try {
      let inv = invoice;
      if (String(inv.status).toUpperCase() !== 'ISSUED') {
        inv = await billingApi.issueInvoice(inv.id);
      }
      const res = await linkTerminationFinalInvoice.mutateAsync({
        id: contract.id,
        data: {
          invoice_id: inv.id,
          ...buildSyncPayload(form),
        },
      });
      setIssueResult(res);
      let pdfUrl = inv.pdf_url ?? null;
      if (!pdfUrl && res.data?.invoice_id) {
        try {
          const fullInv = await billingApi.getInvoice(res.data.invoice_id);
          pdfUrl = fullInv.pdf_url ?? null;
        } catch {
          /* bỏ qua — vẫn có link chi tiết HĐ */
        }
      }
      setLinkedInvoicePdfUrl(pdfUrl);
      void queryClient.invalidateQueries({
        queryKey: contractTerminationLinkedFinalInvoiceQueryKey(contract.id),
      });
      toast.success(res.message || 'Đã gắn hóa đơn thanh lý.');
    } catch (e) {
      toast.error(parseErr(e));
    } finally {
      setIssueLinkBusy(false);
    }
  };

  const toRefundReceiptLines = (): TerminationRefundReceiptLine[] =>
    refundReceiptLineDrafts
      .map((row) => ({
        description: row.description.trim(),
        amount: Math.max(0, Number(row.amount) || 0),
      }))
      .filter((row) => row.description.length > 0 && row.amount >= 0.0001);

  const handleFinalize = async () => {
    if (!effectiveIssueResult) {
      toast.error('Vui lòng tạo và gắn hóa đơn thanh lý cuối trước khi quyết toán.');
      return;
    }
    try {
      const data: FinalizeTerminationData = {
        forfeit_remaining_deposit: depositRefundChoice === 'no_refund',
      };
      if (depositRefundChoice === 'refund') {
        const refundLines = toRefundReceiptLines();
        if (refundLines.length > 0) {
          data.refund_receipt_lines = refundLines;
        }
      }
      const res = await finalizeTermination.mutateAsync({
        id: contract.id,
        data,
      });
      setFprRecordedPaymentSummary(null);
      setFinalizeResult(res);
      toast.success(res.message || 'Đã quyết toán.');
      const fprId = res.data.final_payment_request_id;
      if (res.data.scenario === 'B' && fprId) {
        try {
          const fpr = await contractsApi.getFinalPaymentRequest(fprId);
          setFprDetail(fpr.data);
        } catch {
          setFprDetail(null);
        }
      }
    } catch (e) {
      toast.error(parseErr(e));
    }
  };

  const handleCommitHandover = async () => {
    if (!handoverState?.items?.length) {
      toast.error('Không có danh mục tài sản để lưu.');
      return;
    }
    try {
      const res = await commitTerminationHandover.mutateAsync({
        id: contract.id,
        data: {
          note: handoverNote,
          items: handoverState.items.map((it) => ({
            room_asset_id: it.room_asset_id,
            condition: handoverConditions[it.room_asset_id] ?? 'OK',
          })),
        },
      });
      const hid = res.data?.handover?.id;
      const toUpload = [...pendingHandoverScans];
      if (hid && toUpload.length > 0) {
        setHandoverUploadBusy(true);
        try {
          for (const row of toUpload) {
            await contractsApi.uploadHandoverDocumentScan(hid, row.file);
          }
          toUpload.forEach((r) => URL.revokeObjectURL(r.previewUrl));
          setPendingHandoverScans([]);
          toast.success('Đã lưu biên bản và tải ảnh minh chứng lên server.');
        } catch (err) {
          toast.error(parseErr(err));
        } finally {
          setHandoverUploadBusy(false);
        }
      } else {
        toast.success('Đã lưu biên bản bàn giao.');
      }
      await queryClient.invalidateQueries({
        queryKey: [CONTRACT_KEY, contract.id, CONTRACT_TERMINATION_HANDOVER_KEY],
      });
    } catch (e) {
      toast.error(parseErr(e));
    }
  };

  const clearFprProof = () => {
    setFprProofFile(null);
    setFprProofPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const handleFprProofInput = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh (JPEG/PNG/WebP).');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Ảnh bằng chứng tối đa 5MB.');
      return;
    }
    setFprProofPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setFprProofFile(f);
  };

  const handleRecordFprPayment = async (method: 'CASH' | 'BANK_TRANSFER') => {
    const id = finalizeResult?.data.final_payment_request_id;
    if (!id) return;
    const amt = fprDetail?.amount_due ?? finalizeResult?.data.amount_due ?? 0;
    if (method === 'BANK_TRANSFER' && !fprProofFile) {
      toast.error('Vui lòng chọn ảnh bằng chứng chuyển khoản (biên lai / ảnh chụp màn hình).');
      return;
    }
    try {
      const res = await contractsApi.recordCashPaymentForFpr(id, {
        amount: amt,
        method,
        proof_image: method === 'BANK_TRANSFER' ? fprProofFile ?? undefined : undefined,
      });
      setFprRecordedPaymentSummary({
        paymentId: res.data.payment_id,
        proofUrl: res.data.proof_receipt?.url ?? null,
      });
      if (method === 'BANK_TRANSFER') {
        clearFprProof();
      }
      toast.success(res.message || (method === 'CASH' ? 'Đã ghi nhận thu tiền mặt.' : 'Đã ghi nhận thu chuyển khoản.'));
      await queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, contract.id] });
      void queryClient.invalidateQueries({ queryKey: ['finance', 'payment', res.data.payment_id] });
    } catch (e) {
      toast.error(parseErr(e));
    }
  };

  const roomLabel = contract.room?.code ?? contract.room?.name ?? contract.room_id;
  const tenantFromApi = contract.tenant?.name?.trim() || contract.tenant?.full_name?.trim() || contract.tenant?.email?.trim();
  const tenantDisplay =
    tenantFromApi ||
    memberDisplayName(resolveTenantMember(contract.members)) ||
    '—';
  const depositPreview = useMemo(() => {
    const deposit = Number(contract.deposit_amount ?? 0);
    const debt =
      contract.invoice_debt?.has_debt === true
        ? Number(contract.invoice_debt?.total_outstanding ?? 0)
        : 0;
    return { deposit, debt, remainder: Math.max(0, deposit - debt) };
  }, [contract]);

  useEffect(() => {
    if (depositRefundChoice === 'no_refund') {
      setRefundReceiptLineDrafts([]);
      return;
    }
    const rem = depositPreview.remainder;
    const amtStr = String(Math.max(0, rem));
    const baseDesc = 'Hoàn tiền cọc sau khấu trừ nợ các hóa đơn';
    setRefundReceiptLineDrafts((prev) => {
      const manual = prev.filter((r) => r.id !== AUTO_DEPOSIT_REFUND_ROW_ID);
      const prevAuto = prev.find((r) => r.id === AUTO_DEPOSIT_REFUND_ROW_ID);
      if (rem <= 0.0001) {
        return manual;
      }
      if (prevAuto) {
        return [{ ...prevAuto, description: baseDesc, amount: amtStr }, ...manual];
      }
      if (manual.length === 0) {
        return [{ id: AUTO_DEPOSIT_REFUND_ROW_ID, description: baseDesc, amount: amtStr }];
      }
      return [...manual];
    });
  }, [depositRefundChoice, depositPreview.remainder]);

  const noticeVsContractEnd = useMemo(() => {
    const end = parseYmdDate(contract.end_date);
    const expectedMoveOut = parseYmdDate(contract.expected_move_out_date);
    const termination = parseYmdDate(form.termination_date);
    const reference = expectedMoveOut ?? termination;
    const earlyVsEnd = Boolean(end && reference && isBefore(reference, end));
    return { end, expectedMoveOut, termination, reference, earlyVsEnd };
  }, [contract.end_date, contract.expected_move_out_date, form.termination_date]);

  const persistedHandoverId = handoverState?.persisted ? handoverState.handover?.id : undefined;

  /** Chưa lưu biên bản: thêm ảnh vào hàng đợi (upload khi bấm Lưu). Đã lưu: upload ngay. */
  const handleHandoverFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (picked.length === 0) return;

    const valid: File[] = [];
    for (const file of picked) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}: chỉ chấp nhận file ảnh.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: dung lượng tối đa 5MB.`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;

    if (handoverState?.persisted && handoverState.handover?.id) {
      const hid = handoverState.handover.id;
      setHandoverUploadBusy(true);
      try {
        for (const file of valid) {
          await contractsApi.uploadHandoverDocumentScan(hid, file);
        }
        toast.success(valid.length > 1 ? `Đã tải ${valid.length} ảnh.` : 'Đã tải ảnh biên bản.');
        await queryClient.invalidateQueries({
          queryKey: [CONTRACT_KEY, contract.id, CONTRACT_TERMINATION_HANDOVER_KEY],
        });
      } catch (err) {
        toast.error(parseErr(err));
      } finally {
        setHandoverUploadBusy(false);
      }
      return;
    }

    setPendingHandoverScans((prev) => [
      ...prev,
      ...valid.map((file) => ({
        id: newLineId(),
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  };

  const stepIntro = (icon: ReactNode, title: string, subtitle: string) => (
    <div className="mb-6 flex gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
  );

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white';

  const refundDraftTotal = refundReceiptLineDrafts.reduce(
    (acc, r) => acc + Math.max(0, Number(r.amount) || 0),
    0,
  );

  const finalizeSuccessSection = finalizeResult ? (
    <div className="space-y-3 text-sm">
      <p className="font-bold text-emerald-800 dark:text-emerald-200">{finalizeResult.message}</p>
      <p>
        Kịch bản: <strong>{finalizeResult.data.scenario}</strong> — Trạng thái hợp đồng:{' '}
        {contractStatusLabelVi(String(finalizeResult.data.contract_status))}
      </p>
      {finalizeResult.data.scenario === 'A' && (
        <ul className="list-inside list-disc space-y-1">
          <li>Biên lai hoàn: {finalizeResult.data.refund_receipt_id ?? '—'}</li>
          <li>Tổng hoàn: {formatCurrency(Number(finalizeResult.data.refund_amount ?? 0))}</li>
          <li>
            Phần từ cọc:{' '}
            {finalizeResult.data.deposit_refund_portion != null
              ? formatCurrency(finalizeResult.data.deposit_refund_portion)
              : '—'}
          </li>
        </ul>
      )}
      {finalizeResult.data.scenario === 'B' && (
        <div className="space-y-2 rounded-xl border border-amber-100 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p>
            Cần thu thêm:{' '}
            <strong>{formatCurrency(Number(finalizeResult.data.amount_due ?? fprDetail?.amount_due ?? 0))}</strong>
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            FPR: {finalizeResult.data.final_payment_request_id}
          </p>
          {finalizeResult.data.supplemental_invoice_id ? (
            <p className="text-xs text-slate-700 dark:text-slate-300">
              Thu nợ trên{' '}
              <Link
                to={`/properties/${propertyId}/billing/invoices/${finalizeResult.data.supplemental_invoice_id}`}
                className="font-semibold text-indigo-700 underline underline-offset-2 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                hóa đơn nợ bổ sung
              </Link>{' '}
              (hóa đơn thanh lý đã được điều chỉnh để tránh đếm nợ hai lần).
            </p>
          ) : null}
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Ưu tiên thao tác theo lựa chọn trước khi quyết toán:{' '}
            {extraPaymentPreference === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt'}.
          </p>
          {extraPaymentPreference === 'transfer' && (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-white/80 p-3 text-xs dark:border-slate-600 dark:bg-slate-900/40">
              <label className="block font-medium text-slate-800 dark:text-slate-200">
                Ảnh bằng chứng chuyển khoản (bắt buộc)
              </label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFprProofInput} />
              {fprProofPreviewUrl ? (
                <div className="flex flex-wrap items-center gap-2">
                  <img src={fprProofPreviewUrl} alt="" className="h-16 max-w-[8rem] rounded border object-cover" />
                  <button
                    type="button"
                    onClick={clearFprProof}
                    className="rounded border border-slate-300 px-2 py-1 text-[11px] hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                  >
                    Xóa ảnh
                  </button>
                </div>
              ) : null}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleRecordFprPayment('BANK_TRANSFER')}
              className={
                extraPaymentPreference === 'transfer'
                  ? 'rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700'
                  : 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800'
              }
            >
              Ghi nhận chuyển khoản
            </button>
            <button
              type="button"
              onClick={() => void handleRecordFprPayment('CASH')}
              className={
                extraPaymentPreference === 'cash'
                  ? 'rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700'
                  : 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800'
              }
            >
              Ghi nhận tiền mặt
            </button>
          </div>
          {fprRecordedPaymentSummary ? (
            <div className="mt-2 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/90 p-3 text-xs text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100">
              <p className="font-semibold">Đã ghi nhận thanh toán trên hệ thống.</p>
              {fprRecordedPaymentSummary.proofUrl ? (
                <div className="space-y-2">
                  <p className="text-[11px] opacity-90">Ảnh bằng chứng chuyển khoản đã lưu.</p>
                  <img
                    src={fprRecordedPaymentSummary.proofUrl}
                    alt="Bằng chứng chuyển khoản"
                    className="max-h-44 max-w-full rounded border border-emerald-300/60 object-contain dark:border-emerald-600/50"
                  />
                </div>
              ) : null}
              <Link
                to={`/properties/${propertyId}/finance/payments/${fprRecordedPaymentSummary.paymentId}`}
                className="inline-flex items-center gap-1 font-semibold text-indigo-700 underline underline-offset-2 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                Mở chi tiết biên lai trong tài chính
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </Link>
            </div>
          ) : null}
        </div>
      )}
      {finalizeResult.data.scenario === 'C' && <p>Đã khớp — không phát sinh hoàn / thu thêm đáng kể.</p>}
      {finalizeResult.data.scenario === 'FORFEIT' && (
        <ul className="list-inside list-disc space-y-1">
          <li>Không phát hành biên lai hoàn — phần dư sau cấn trừ được ghi nhận thu hồi.</li>
          <li>
            Tổng thu hồi (ước tính từ phản hồi):{' '}
            {formatCurrency(Number(finalizeResult.data.forfeited_amount ?? 0))}
          </li>
          <li>
            Phần từ cọc (đã bỏ hoàn):{' '}
            {finalizeResult.data.deposit_refund_portion != null
              ? formatCurrency(finalizeResult.data.deposit_refund_portion)
              : '—'}
          </li>
        </ul>
      )}
    </div>
  ) : null;

  return (
    <div className={`mx-auto py-6 px-4 ${activeStep >= 3 ? 'max-w-5xl' : 'max-w-3xl'}`}>
      <nav className="mb-8 flex items-center justify-between gap-2" aria-label="Các bước thanh lý">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = activeStep === index;
          const isCompleted = activeStep > index;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : isCompleted
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-200 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={`mt-2 max-w-[5.5rem] text-center text-[10px] font-semibold uppercase leading-tight sm:max-w-none sm:text-xs ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <div
                  className={`mx-1 h-0.5 min-w-[8px] flex-1 rounded-full sm:mx-2 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-600'}`}
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex-1 p-5 sm:p-6">
          {effectiveIssueResult && (activeStep === 3 || activeStep === 4) ? (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
              Đã gắn hóa đơn thanh lý — chỉnh sửa số tiền trên hóa đơn tại module hóa đơn; biên lai hoàn và quyết toán ở
              bước sau.
            </div>
          ) : null}
          <div>
            {activeStep === 0 && (
              <div className="space-y-6">
                {stepIntro(
                  <FileText className="h-5 w-5 text-indigo-600" aria-hidden />,
                  'Thông tin thanh lý',
                  'Tóm tắt phòng, hợp đồng và ngày chốt trước biên bản bàn giao.',
                )}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-600 dark:bg-slate-900/50">
                    <p className="text-xs font-medium text-slate-500">Phòng</p>
                    <p className="mt-1 truncate text-lg font-semibold text-slate-900 dark:text-white">{roomLabel}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-600 dark:bg-slate-900/50">
                    <p className="text-xs font-medium text-slate-500">Trạng thái</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                      {contractStatusLabelVi(contract.status)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-600 dark:bg-slate-900/50">
                    <p className="text-xs font-medium text-slate-500">Tiền cọc</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                      {formatCurrency(Number(contract.deposit_amount ?? 0))}
                    </p>
                  </div>
                </div>

                <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-600">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <FileText className="h-4 w-4 text-indigo-600" aria-hidden />
                    Hợp đồng
                  </h2>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-slate-500">Khách thuê</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{tenantDisplay}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-slate-500">Phòng thuê</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">
                        {roomLabel}
                        {contract.room?.name && contract.room?.code && contract.room.name !== contract.room.code
                          ? ` — ${contract.room.name}`
                          : null}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Giá thuê (HĐ)</dt>
                      <dd className="font-medium tabular-nums text-slate-900 dark:text-white">
                        {formatCurrency(Number(contract.rent_price ?? contract.total_rent ?? 0))}
                        {contract.billing_cycle ? (
                          <span className="text-xs font-normal text-slate-500">
                            {' '}
                            / {contract.billing_cycle}
                          </span>
                        ) : null}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Bắt đầu</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">
                        {contract.start_date ? new Date(contract.start_date).toLocaleDateString('vi-VN') : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Hết hạn</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">
                        {contract.end_date ? new Date(contract.end_date).toLocaleDateString('vi-VN') : '—'}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-slate-500">Báo trả phòng</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">
                        {contract.status === 'PENDING_TERMINATION' && contract.expected_move_out_date
                          ? new Date(contract.expected_move_out_date).toLocaleDateString('vi-VN')
                          : '—'}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-600">
                    <label className="flex max-w-xs flex-col gap-1">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Ngày thanh lý</span>
                      <input
                        type="date"
                        disabled={paramsLocked}
                        value={form.termination_date}
                        onChange={(e) => updateField('termination_date', e.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </div>
                </section>
              </div>
            )}

            {activeStep === 1 && (
              <div className="space-y-5">
                {stepIntro(
                  <ClipboardList className="h-5 w-5 text-amber-600" aria-hidden />,
                  'Biên bản bàn giao',
                  `Phòng ${roomLabel} — tình trạng tài sản và minh chứng.`,
                )}
            {handoverError ? (
              <p className="text-rose-600 dark:text-rose-300">
                {parseErr(handoverQueryError) ||
                  'Không tải được biên bản (kiểm tra trạng thái hợp đồng / quyền).'}
              </p>
            ) : handoverLoading ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" /> Đang tải biên bản…
              </div>
            ) : handoverState ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      handoverState.persisted
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {handoverState.persisted ? 'Đã lưu biên bản' : 'Chưa lưu — danh mục xem trước'}
                  </span>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Ghi chú biên bản</span>
                  <textarea
                    value={handoverNote}
                    onChange={(e) => setHandoverNote(e.target.value)}
                    rows={3}
                    className={inputClass}
                  />
                </label>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="px-3 py-2">Tài sản</th>
                        <th className="px-3 py-2">Tình trạng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {handoverState.items.map((it) => (
                        <tr key={it.room_asset_id}>
                          <td className="px-3 py-2">{it.name ?? it.room_asset_id}</td>
                          <td className="px-3 py-2">
                            <select
                              value={handoverConditions[it.room_asset_id] ?? 'OK'}
                              onChange={(e) =>
                                setHandoverConditions((prev) => ({
                                  ...prev,
                                  [it.room_asset_id]: e.target.value as 'OK' | 'MISSING' | 'DAMAGED',
                                }))
                              }
                              className="rounded border border-slate-200 px-2 py-1 dark:border-slate-700 dark:bg-slate-950"
                            >
                              <option value="OK">OK</option>
                              <option value="MISSING">Thiếu</option>
                              <option value="DAMAGED">Hư hỏng</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-600">
                  <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">Ảnh minh chứng (biên bản)</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={commitTerminationHandover.isPending || handoverUploadBusy}
                    onChange={(e) => void handleHandoverFileInput(e)}
                    className="text-xs file:mr-2 file:rounded file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-indigo-700 disabled:opacity-50 dark:file:bg-slate-800 dark:file:text-indigo-300"
                  />
                  {pendingHandoverScans.length > 0 ? (
                    <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      Ảnh chờ tải lên: {pendingHandoverScans.length} — bấm Lưu biên bản bàn giao để gửi.
                    </p>
                  ) : null}
                  {handoverUploadBusy ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Đang tải ảnh lên server…
                    </div>
                  ) : null}
                  {pendingHandoverScans.length > 0 ? (
                    <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {pendingHandoverScans.map((row) => (
                        <li
                          key={row.id}
                          className="relative overflow-hidden rounded-lg border border-dashed border-indigo-300 dark:border-indigo-500/40"
                        >
                          <img
                            src={row.previewUrl}
                            alt={row.file.name}
                            className="h-28 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePendingHandoverScan(row.id)}
                            disabled={commitTerminationHandover.isPending || handoverUploadBusy}
                            className="absolute right-1 top-1 rounded bg-white/90 p-1 text-rose-600 shadow hover:bg-white disabled:opacity-50 dark:bg-slate-900/90"
                            aria-label="Bỏ ảnh chờ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <p className="truncate bg-indigo-50/90 px-2 py-1 text-center text-[10px] font-medium text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-100">
                            Chờ gửi
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {handoverState.handover?.document_scan_urls &&
                  handoverState.handover.document_scan_urls.length > 0 ? (
                    <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {handoverState.handover.document_scan_urls.map((url, i) => (
                        <li key={`${url}-${i}`} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                            <img
                              src={url}
                              alt={`Ảnh minh chứng ${i + 1}`}
                              className="h-28 w-full object-cover transition hover:opacity-90"
                            />
                          </a>
                          <p className="truncate bg-slate-50 px-2 py-1 text-center text-[10px] font-bold text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">
                            Ảnh {i + 1}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : persistedHandoverId && pendingHandoverScans.length === 0 ? (
                    <p className="mt-3 text-xs text-slate-500">Chưa có ảnh đính kèm trên server.</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void handleCommitHandover()}
                  disabled={commitTerminationHandover.isPending || handoverUploadBusy}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {commitTerminationHandover.isPending || handoverUploadBusy ? (
                    <>
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                      {handoverUploadBusy ? 'Đang tải ảnh…' : 'Đang lưu…'}
                    </>
                  ) : (
                    'Lưu biên bản bàn giao'
                  )}
                </button>
              </>
            ) : (
              <p>Không tải được biên bản.</p>
            )}
              </div>
            )}

            {/* Luôn mount bước đồng hồ để giữ state nhập chỉ số / tiêu thụ khi chuyển bước rồi quay lại */}
            <div className={activeStep === 2 ? 'space-y-5' : 'hidden'}>
              {stepIntro(
                <Gauge className="h-5 w-5 text-sky-600" aria-hidden />,
                'Chỉ số đồng hồ',
                'Chốt hoặc kiểm tra trước khi soạn hóa đơn thanh lý ở bước tiếp theo.',
              )}
              <div className="text-sm text-slate-700 dark:text-slate-300">
                <RoomMetersInlinePanel propertyId={propertyId} roomId={contract.room_id} />
              </div>
            </div>

            {activeStep === 3 && (
              <div className="space-y-5">
                {stepIntro(
                  <Calculator className="h-5 w-5 text-emerald-600" aria-hidden />,
                  'Hóa đơn thanh lý cuối',
                  'Tạo hóa đơn lẻ, phát hành và gắn làm hóa đơn thanh lý. Biên lai hoàn và quyết toán thực hiện ở bước sau.',
                )}
                <div className="space-y-4 text-sm">
                  {finalizeResult ? (
                    finalizeSuccessSection
                  ) : linkedFinalInvoiceQuery.isLoading && !issueResult ? (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-6 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-indigo-600" aria-hidden />
                      Đang kiểm tra hóa đơn thanh lý đã gắn với hợp đồng…
                    </div>
                  ) : !effectiveIssueResult ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-950/50">
                      <p className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Soạn hóa đơn lẻ (thanh lý)
                      </p>
                      <p className="mb-3 text-xs text-slate-500">
                        Kiểm tra ngày thanh lý ở bước đầu và chỉ số đồng hồ. Sau khi tạo, nếu còn nháp hệ thống sẽ phát
                        hành rồi gắn làm HĐ thanh lý cuối.
                      </p>
                      {issueLinkBusy ? (
                        <p className="mb-3 text-xs font-bold text-indigo-600">Đang phát hành / gắn HĐ…</p>
                      ) : null}
                      <ManualInvoiceFormPanel
                        variant="termination"
                        propertyId={propertyId}
                        roomId={contract.room_id}
                        contractId={contract.id}
                        roomName={roomLabel}
                        supplierDisplayName={contract.property?.name}
                        enabled={activeStep === 3 && !effectiveIssueResult}
                        formId="termination-manual-invoice"
                        onInvoiceCreated={(inv) => {
                          void handleBillingInvoiceCreated(inv);
                        }}
                        closeOnSuccess={false}
                        embeddedSubmit
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {linkedInvoicePdfUrl ? (
                        <>
                          <TerminationInlineInvoicePdf url={linkedInvoicePdfUrl} />
                          <div className="flex flex-wrap justify-end gap-2">
                            <Link
                              to={`/properties/${propertyId}/billing/invoices/${effectiveIssueResult.data.invoice_id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                            >
                              Chi tiết hóa đơn
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            </Link>
                          </div>
                        </>
                      ) : (
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900">
                          <div className="border-b-2 border-teal-500 bg-teal-50/40 px-6 py-4 text-center dark:bg-teal-950/25">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">
                              Bản mềm — hóa đơn đã gắn thanh lý
                            </p>
                            <h2 className="mt-1 text-xl font-black tracking-wide text-teal-600 dark:text-teal-400">
                              HÓA ĐƠN THANH LÝ
                            </h2>
                            <p className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                              {effectiveIssueResult.message}
                            </p>
                          </div>
                          <div className="space-y-4 px-6 py-4 text-sm">
                            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4 dark:border-slate-700">
                              <div>
                                <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                  Đơn vị cung cấp
                                </p>
                                <p className="font-semibold text-gray-900 dark:text-slate-100">
                                  {contract.property?.name?.trim() || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                  Khách thuê
                                </p>
                                <p className="font-semibold text-gray-900 dark:text-slate-100">Phòng: {roomLabel}</p>
                                <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-300">Họ tên: {tenantDisplay}</p>
                              </div>
                            </div>
                            <div className="grid gap-3 border-b border-gray-100 pb-4 text-xs dark:border-slate-700 sm:grid-cols-2">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                  Số hóa đơn
                                </p>
                                <p className="mt-0.5 font-mono text-sm font-bold text-gray-900 dark:text-slate-100">
                                  {effectiveIssueResult.data.invoice_no ?? effectiveIssueResult.data.invoice_id}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                  Ngày gắn
                                </p>
                                <p className="mt-0.5 font-semibold text-gray-900 dark:text-slate-100">
                                  {format(new Date(), 'dd/MM/yyyy')}
                                </p>
                              </div>
                              <div className="sm:col-span-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                  Tổng thanh toán
                                </p>
                                <p className="mt-0.5 text-lg font-black tabular-nums text-teal-700 dark:text-teal-400">
                                  {formatCurrency(effectiveIssueResult.data.total_amount)}
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                Chi tiết dòng
                              </p>
                              <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-slate-700">
                                <table className="w-full min-w-[280px] border-collapse text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/80">
                                      <th className="w-10 px-2 py-2 font-bold text-gray-700 dark:text-slate-200">STT</th>
                                      <th className="px-2 py-2 font-bold text-gray-700 dark:text-slate-200">Mô tả</th>
                                      <th className="px-2 py-2 text-right font-bold text-gray-700 dark:text-slate-200">
                                        Số tiền
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {effectiveIssueResult.data.items.map((it, i) => (
                                      <tr
                                        key={i}
                                        className="border-b border-gray-100 last:border-0 dark:border-slate-800"
                                      >
                                        <td className="px-2 py-2 tabular-nums text-gray-600 dark:text-slate-400">
                                          {i + 1}
                                        </td>
                                        <td className="px-2 py-2 text-gray-900 dark:text-slate-100">{it.description}</td>
                                        <td className="px-2 py-2 text-right font-semibold tabular-nums text-gray-900 dark:text-slate-100">
                                          {formatCurrency(it.amount)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4 dark:border-slate-700">
                              <Link
                                to={`/properties/${propertyId}/billing/invoices/${effectiveIssueResult.data.invoice_id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                              >
                                Chi tiết hóa đơn
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="space-y-5">
                {stepIntro(
                  <Receipt className="h-5 w-5 text-slate-600 dark:text-slate-400" aria-hidden />,
                  'Biên lai hoàn tiền',
                  'Soạn phiếu hoàn theo mẫu giấy, đối chiếu nợ hóa đơn, rồi quyết toán.',
                )}
                {finalizeResult ? (
                  finalizeSuccessSection
                ) : !effectiveIssueResult ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Vui lòng hoàn tất bước <strong>Hóa đơn thanh lý</strong> trước (hoặc dùng nút Quay lại).
                  </p>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
                    <div className="space-y-4">
                      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-600 dark:bg-slate-900/60">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Thời điểm trả phòng so với thời hạn hợp đồng
                        </p>
                        <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                          <div>
                            <dt className="text-slate-500 dark:text-slate-400">Ngày kết thúc theo hợp đồng</dt>
                            <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                              {noticeVsContractEnd.end
                                ? format(noticeVsContractEnd.end, 'dd/MM/yyyy')
                                : '—'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500 dark:text-slate-400">Ngày dự kiến dọn (tenant)</dt>
                            <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                              {noticeVsContractEnd.expectedMoveOut
                                ? format(noticeVsContractEnd.expectedMoveOut, 'dd/MM/yyyy')
                                : '—'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500 dark:text-slate-400">Ngày thanh lý (bước Thông tin)</dt>
                            <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                              {noticeVsContractEnd.termination
                                ? format(noticeVsContractEnd.termination, 'dd/MM/yyyy')
                                : '—'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500 dark:text-slate-400">Báo trước (hợp đồng)</dt>
                            <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                              {contract.notice_days != null ? `${contract.notice_days} ngày` : '—'}
                            </dd>
                          </div>
                          {contract.notice_given_at ? (
                            <div className="sm:col-span-2">
                              <dt className="text-slate-500 dark:text-slate-400">Thời điểm gửi báo trả phòng</dt>
                              <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                                {(() => {
                                  const d = parseYmdDate(contract.notice_given_at);
                                  return d ? format(d, 'dd/MM/yyyy') : '—';
                                })()}
                              </dd>
                            </div>
                          ) : null}
                        </dl>
                        {noticeVsContractEnd.earlyVsEnd ? (
                          <div className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/30 dark:text-amber-100">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                            <p>
                              Ngày dự kiến dọn / thanh lý <strong>trước</strong> ngày hết hạn ghi trên hợp đồng — có thể là
                              chấm dứt sớm; kiểm tra phạt / chính sách và khớp với hóa đơn thanh lý.
                            </p>
                          </div>
                        ) : noticeVsContractEnd.end && noticeVsContractEnd.reference ? (
                          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                            Ngày tham chiếu (dự kiến dọn hoặc thanh lý) không trước ngày kết thúc hợp đồng theo lịch.
                          </p>
                        ) : null}
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 text-sm dark:border-slate-600 dark:bg-slate-900/50">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                          Phần cọc còn lại sau quyết toán
                        </p>
                        <div className="mt-3 space-y-4">
                          <label className="flex cursor-pointer items-start gap-3">
                            <input
                              type="radio"
                              name="term-deposit-refund-choice"
                              checked={depositRefundChoice === 'refund'}
                              onChange={() => setDepositRefundChoice('refund')}
                              className="mt-1 accent-indigo-600"
                            />
                            <span>
                              <span className="font-semibold text-slate-900 dark:text-white">Hoàn cọc</span>
                              <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                                Tạo biên lai hoàn phần cọc còn lại sau khi đã khấu trừ nợ các hóa đơn (có thể chỉnh dòng
                                hoàn bên dưới).
                              </span>
                            </span>
                          </label>
                          <label className="flex cursor-pointer items-start gap-3">
                            <input
                              type="radio"
                              name="term-deposit-refund-choice"
                              checked={depositRefundChoice === 'no_refund'}
                              onChange={() => setDepositRefundChoice('no_refund')}
                              className="mt-1 accent-indigo-600"
                            />
                            <span>
                              <span className="font-semibold text-slate-900 dark:text-white">Không hoàn cọc</span>
                              <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                                Không phát hành biên lai hoàn phần cọc còn lại (thu hồi). Chỉ áp dụng phần tiền cọc còn
                                lại; khoản hoàn khác cần chọn <strong>Hoàn cọc</strong>.
                              </span>
                            </span>
                          </label>
                        </div>
                      </div>

                      <div
                        className="relative overflow-hidden rounded-sm border-[3px] border-double border-slate-700/25 bg-white p-6 text-slate-900 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] dark:border-slate-500/40 dark:bg-slate-950 dark:text-slate-100"
                        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                      >
                        <div className="pointer-events-none absolute right-4 top-4 h-16 w-16 rounded-full border border-dashed border-slate-300/80 opacity-40 dark:border-slate-600" />
                        <header className="border-b border-dashed border-slate-400/60 pb-4 text-center dark:border-slate-600">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                            Phiếu hoàn tiền — bản mềm
                          </p>
                          <h2 className="mt-2 text-xl font-bold tracking-tight">BIÊN LAI HOÀN TIỀN</h2>
                          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                            Ngày lập: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </header>
                        <dl className="mt-5 grid gap-2 border-b border-dashed border-slate-300/70 pb-4 text-sm dark:border-slate-600">
                          <div className="flex flex-wrap justify-between gap-2">
                            <dt className="text-slate-600 dark:text-slate-400">Bên nhận tiền (khách)</dt>
                            <dd className="max-w-[65%] text-right font-semibold">{tenantDisplay}</dd>
                          </div>
                          <div className="flex flex-wrap justify-between gap-2">
                            <dt className="text-slate-600 dark:text-slate-400">Phòng</dt>
                            <dd className="font-semibold">{roomLabel}</dd>
                          </div>
                        </dl>
                        <p className="mt-4 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                          Hai bảng: số liệu tham chiếu từ hợp đồng, và các dòng hoàn do quản lý nhập. Quyết toán thực
                          tế do backend tính khi bấm Quyết toán.
                        </p>
                        <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                          Số liệu tham chiếu (ước lượng)
                        </p>
                        <div className="mt-2 overflow-x-auto rounded border border-slate-300/50 dark:border-slate-600">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-300/60 bg-slate-100/80 dark:border-slate-600 dark:bg-slate-800/80">
                                <th className="w-10 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide">STT</th>
                                <th className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide">Nội dung</th>
                                <th className="w-40 px-2 py-1.5 text-right text-[10px] font-bold uppercase tracking-wide">
                                  Số tiền
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-slate-200/60 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/30">
                                <td className="px-2 py-2 align-top tabular-nums text-slate-500 dark:text-slate-400">1</td>
                                <td className="px-2 py-2 align-top text-slate-700 dark:text-slate-300">
                                  Tiền cọc theo hợp đồng
                                </td>
                                <td className="px-2 py-2 align-top text-right tabular-nums font-semibold text-slate-800 dark:text-slate-100">
                                  {formatCurrency(depositPreview.deposit)}
                                </td>
                              </tr>
                              <tr className="border-b border-slate-200/60 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/30">
                                <td className="px-2 py-2 align-top tabular-nums text-slate-500 dark:text-slate-400">2</td>
                                <td className="px-2 py-2 align-top text-slate-700 dark:text-slate-300">
                                  Tổng nợ chưa thanh toán trên các hóa đơn
                                </td>
                                <td className="px-2 py-2 align-top text-right tabular-nums font-semibold text-slate-800 dark:text-slate-100">
                                  {formatCurrency(depositPreview.debt)}
                                </td>
                              </tr>
                              <tr className="border-b border-slate-200/60 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/30">
                                <td className="px-2 py-2 align-top tabular-nums text-slate-500 dark:text-slate-400">3</td>
                                <td className="px-2 py-2 align-top text-slate-700 dark:text-slate-300">
                                  Phần cọc còn lại sau khi trừ nợ (ước lượng)
                                </td>
                                <td className="px-2 py-2 align-top text-right tabular-nums font-semibold text-slate-800 dark:text-slate-100">
                                  {formatCurrency(depositPreview.remainder)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p className="mt-5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                          Các khoản hoàn trả do quản lý nhập
                        </p>
                        <div className="mt-2 flex items-center justify-end">
                          <button
                            type="button"
                            disabled={depositRefundChoice === 'no_refund'}
                            onClick={() =>
                              setRefundReceiptLineDrafts((rows) => [
                                ...rows,
                                { id: newLineId(), description: '', amount: '' },
                              ])
                            }
                            className="inline-flex items-center gap-1 rounded border border-slate-400/60 bg-white/80 px-2 py-1 text-[11px] font-bold text-slate-800 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                          >
                            <Plus className="h-3 w-3" />
                            Thêm dòng
                          </button>
                        </div>
                        <div className="mt-2 overflow-x-auto rounded border border-slate-300/50 dark:border-slate-600">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-300/60 bg-slate-100/80 dark:border-slate-600 dark:bg-slate-800/80">
                                <th className="w-10 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide">STT</th>
                                <th className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide">Nội dung</th>
                                <th className="w-40 px-2 py-1.5 text-right text-[10px] font-bold uppercase tracking-wide">
                                  Tiền hoàn trả
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {depositRefundChoice === 'no_refund' ? (
                                <tr>
                                  <td
                                    colSpan={3}
                                    className="px-2 py-5 text-center text-[11px] italic text-slate-500 dark:text-slate-400"
                                  >
                                    Không hoàn tiền cọc — phần cọc còn lại được ghi nhận thu hồi khi quyết toán. Chọn
                                    Hoàn cọc nếu cần nhập biên lai hoàn.
                                  </td>
                                </tr>
                              ) : refundReceiptLineDrafts.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={3}
                                    className="px-2 py-5 text-center italic text-slate-500 dark:text-slate-400"
                                  >
                                    Chưa có dòng hoàn do quản lý nhập — dùng nút Thêm dòng (ví dụ hoàn tiền thuê, điện
                                    nước dư…).
                                  </td>
                                </tr>
                              ) : (
                                refundReceiptLineDrafts.map((row, idx) => {
                                  const isAutoDeposit = row.id === AUTO_DEPOSIT_REFUND_ROW_ID;
                                  return (
                                    <tr key={row.id} className="border-b border-slate-200/60 dark:border-slate-700">
                                      <td className="px-2 py-2 align-top tabular-nums">{idx + 1}</td>
                                      <td className="px-2 py-2 align-top">
                                        <input
                                          type="text"
                                          placeholder="Nội dung"
                                          readOnly={isAutoDeposit}
                                          value={row.description}
                                          onChange={(e) =>
                                            setRefundReceiptLineDrafts((prev) =>
                                              prev.map((r) =>
                                                r.id === row.id ? { ...r, description: e.target.value } : r,
                                              ),
                                            )
                                          }
                                          className="w-full border-0 border-b border-dotted border-slate-400/70 bg-transparent py-0.5 text-xs outline-none read-only:cursor-default read-only:text-slate-700 focus:border-slate-700 dark:border-slate-500 dark:read-only:text-slate-200 dark:focus:border-slate-300"
                                        />
                                      </td>
                                      <td className="px-2 py-2 align-top text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <input
                                            type="number"
                                            min={0}
                                            placeholder="0"
                                            value={row.amount}
                                            onChange={(e) =>
                                              setRefundReceiptLineDrafts((prev) =>
                                                prev.map((r) =>
                                                  r.id === row.id ? { ...r, amount: e.target.value } : r,
                                                ),
                                              )
                                            }
                                            className="w-full min-w-[5rem] border-0 border-b border-dotted border-slate-400/70 bg-transparent py-0.5 text-right text-xs tabular-nums outline-none dark:border-slate-500"
                                          />
                                          {!isAutoDeposit ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setRefundReceiptLineDrafts((prev) =>
                                                  prev.filter((r) => r.id !== row.id),
                                                )
                                              }
                                              className="shrink-0 rounded p-1 text-rose-700 hover:bg-rose-100/80 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                              aria-label="Xóa dòng"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          ) : (
                                            <span className="inline-block w-7 shrink-0" aria-hidden />
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4 space-y-2 border-t border-dashed border-slate-400/50 pt-3 text-sm dark:border-slate-600">
                          <div className="flex justify-between">
                            <span>Tổng các khoản hoàn (nháp)</span>
                            <span className="font-bold tabular-nums">{formatCurrency(refundDraftTotal)}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                            Hệ thống dùng tổng các dòng hoàn (nếu có) kèm quy tắc backend khi quyết toán.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-4 text-sm dark:border-slate-600 dark:bg-slate-900/50">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          Nếu sau quyết toán còn phải thu thêm (kịch bản B)
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          Chọn phương thức dự kiến — sau quyết toán, nút ghi nhận tương ứng sẽ được nhấn mạnh (lựa chọn chỉ
                          trên giao diện; chuyển khoản bắt buộc kèm ảnh bằng chứng khi ghi nhận).
                        </p>
                        <div className="mt-3 flex flex-wrap gap-4">
                          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name="term-extra-pay"
                              checked={extraPaymentPreference === 'transfer'}
                              onChange={() => setExtraPaymentPreference('transfer')}
                              className="accent-indigo-600"
                            />
                            <span>Chuyển khoản</span>
                          </label>
                          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name="term-extra-pay"
                              checked={extraPaymentPreference === 'cash'}
                              onChange={() => {
                                setExtraPaymentPreference('cash');
                                clearFprProof();
                              }}
                              className="accent-indigo-600"
                            />
                            <span>Tiền mặt</span>
                          </label>
                        </div>
                        {extraPaymentPreference === 'transfer' && (
                          <div className="mt-3 space-y-2 rounded-md border border-dashed border-slate-300 p-3 text-xs dark:border-slate-600">
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              Ảnh bằng chứng (có thể chọn trước hoặc sau khi quyết toán)
                            </p>
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFprProofInput} />
                            {fprProofPreviewUrl ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <img src={fprProofPreviewUrl} alt="" className="h-14 max-w-[7rem] rounded border object-cover" />
                                <button
                                  type="button"
                                  onClick={clearFprProof}
                                  className="rounded border border-slate-300 px-2 py-1 text-[11px] hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                                >
                                  Xóa ảnh
                                </button>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleFinalize}
                        disabled={finalizeTermination.isPending}
                        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {finalizeTermination.isPending ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
                        Quyết toán (finalize)
                      </button>
                    </div>
                    <aside className="space-y-4 lg:sticky lg:top-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-600 dark:bg-slate-900/60">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Hóa đơn thanh lý (vừa gắn)
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                          {effectiveIssueResult.data.invoice_no ?? effectiveIssueResult.data.invoice_id}
                        </p>
                        <p className="mt-1 text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(effectiveIssueResult.data.total_amount)}
                        </p>
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                          Dùng để đối chiếu với nợ cũ trước khi quyết toán.
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-600 dark:bg-slate-900/60">
                        <div className="mb-3 flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-slate-600 dark:text-slate-400" aria-hidden />
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Hóa đơn nợ hợp đồng</h3>
                        </div>
                        <ContractRentDebtPanel
                          propertyId={propertyId}
                          invoiceDebt={contract.invoice_debt}
                          isLoading={false}
                        />
                      </div>
                    </aside>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Footer Actions ─── */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-600 dark:bg-slate-900/40 sm:px-6">
          {activeStep === 0 ? (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <X className="h-4 w-4" aria-hidden />
              Hủy
            </button>
          ) : (
            <PageBackButton
              onBack={handleBack}
              className="rounded-lg px-4 py-2 text-sm font-medium"
            />
          )}

          <div className="flex items-center gap-3">
            {activeStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => void handleNext()}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                Tiếp tục
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      </div>

    </div>
  );
}
