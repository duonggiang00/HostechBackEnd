import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Loader2, DoorOpen } from 'lucide-react';
import { useMyContracts } from '@/PropertyScope/features/contracts/hooks/useContracts';
import type { Contract } from '@/PropertyScope/features/contracts/types';

type TransferRow = {
  key: string;
  contractId: string;
  status: string;
  requestedAt: string | null;
  reason: string | null;
  roomLabel: string;
  propertyName: string;
};

function flattenTransfers(contracts: Contract[] | undefined): TransferRow[] {
  if (!contracts?.length) return [];

  const rows: TransferRow[] = [];

  for (const c of contracts) {
    const raw = Array.isArray(c.meta?.transfer_requests) ? c.meta.transfer_requests : [];
    const roomLabel =
      c.room?.name?.trim() || c.room?.code?.trim()
        ? `${c.room?.name?.trim() || c.room?.code}`.trim()
        : 'Phòng hiện tại';
    const propertyName = c.property?.name?.trim() || 'Cơ sở';

    raw.forEach((t: Record<string, unknown>, idx: number) => {
      rows.push({
        key: `${c.id}-${idx}`,
        contractId: c.id,
        status: String(t?.status ?? 'PENDING').toUpperCase(),
        requestedAt: typeof t?.requested_at === 'string' ? t.requested_at : null,
        reason: typeof t?.reason === 'string' ? t.reason : null,
        roomLabel,
        propertyName,
      });
    });
  }

  rows.sort((a, b) => {
    const ta = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
    const tb = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
    return tb - ta;
  });

  return rows;
}

const statusBadge = (status: string) => {
  const s = status.toUpperCase();
  if (s === 'PENDING')
    return 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300';
  if (s === 'APPROVED' || s === 'COMPLETED')
    return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300';
  if (s === 'REJECTED' || s === 'CANCELLED')
    return 'bg-rose-50 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
};

const statusLabel = (status: string) => {
  const s = status.toUpperCase();
  if (s === 'PENDING') return 'Chờ xử lý';
  if (s === 'APPROVED' || s === 'COMPLETED') return 'Đã xử lý';
  if (s === 'REJECTED') return 'Từ chối';
  if (s === 'CANCELLED') return 'Đã hủy';
  return status;
};

export default function TenantTransferRequestsPage() {
  const { data: contracts, isLoading, isError } = useMyContracts();

  const rows = useMemo(() => flattenTransfers(contracts), [contracts]);

  const pending = useMemo(() => rows.filter((r) => r.status === 'PENDING'), [rows]);
  const rest = useMemo(() => rows.filter((r) => r.status !== 'PENDING'), [rows]);

  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="flex justify-center rounded-[28px] border border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : isError ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50/80 p-6 text-sm font-medium text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          Không tải được hợp đồng. Vui lòng thử lại sau.
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-600 dark:bg-slate-900">
          <DoorOpen className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 font-bold text-slate-700 dark:text-slate-300">Chưa có yêu cầu chuyển phòng</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Bạn có thể gửi đề nghị từ trang chi tiết hợp đồng đang hiệu lực.
          </p>
          <Link
            to="/app/contracts/pending"
            className="mt-4 inline-flex text-sm font-black text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Đi tới hợp đồng của tôi
          </Link>
        </div>
      ) : (
        <>
          {pending.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                Đang chờ ban quản lý ({pending.length})
              </h2>
              {pending.map((r) => (
                <TransferCard key={r.key} row={r} />
              ))}
            </section>
          ) : null}

          {rest.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Lịch sử ({rest.length})
              </h2>
              {rest.map((r) => (
                <TransferCard key={r.key} row={r} />
              ))}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function TransferCard({ row }: { row: TransferRow }) {
  const dateStr = row.requestedAt
    ? new Date(row.requestedAt).toLocaleString('vi-VN')
    : '—';

  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-2xl px-3 py-1 text-xs font-black ${statusBadge(row.status)}`}>
              {statusLabel(row.status)}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Building2 className="h-3.5 w-3.5" />
              {row.propertyName}
            </span>
          </div>
          <p className="font-bold text-slate-900 dark:text-white">
            Phòng hiện tại: <span className="font-black text-indigo-700 dark:text-indigo-400">{row.roomLabel}</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Gửi lúc {dateStr}</p>
          {row.reason ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-bold">Lý do: </span>
              {row.reason}
            </p>
          ) : null}
        </div>
        <Link
          to={`/app/contracts/${row.contractId}`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Mở hợp đồng
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
