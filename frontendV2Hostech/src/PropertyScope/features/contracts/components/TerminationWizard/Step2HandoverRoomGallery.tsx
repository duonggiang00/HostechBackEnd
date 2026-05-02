import { useQuery } from '@tanstack/react-query';
import { Loader2, ChevronLeft, Images } from 'lucide-react';
import apiClient from '@/shared/api/client';

type TerminationHandoverPayload = {
  persisted: boolean;
  handover: {
    id: string;
    note?: string | null;
    document_scan_urls?: string[];
  } | null;
};

interface Step2HandoverRoomGalleryProps {
  contractId: string;
  onBack: () => void;
  onNext: () => void;
}

/**
 * Bước xem lại ảnh minh chứng tình trạng phòng (document_scans) sau khi đã lưu biên bản.
 */
export function Step2HandoverRoomGallery({ contractId, onBack, onNext }: Step2HandoverRoomGalleryProps) {
  const qcKey = ['termination-handover', contractId] as const;

  const { data: state, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: qcKey,
    queryFn: async () => {
      const res = await apiClient.get(`/contracts/${contractId}/termination-handover`);
      return res.data.data as TerminationHandoverPayload;
    },
  });

  const urls = state?.handover?.document_scan_urls ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <p className="text-sm font-bold">Đang tải ảnh bàn giao…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
        {(error as any)?.response?.data?.message || 'Không tải được dữ liệu biên bản.'}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
          <Images className="h-5 w-5 text-violet-600 dark:text-violet-300" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Ảnh tình trạng phòng khi bàn giao</h3>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Xem lại ảnh minh chứng chung trước khi chốt số đồng hồ. Cần bổ sung ảnh? Quay lại bước &quot;Biên bản phòng&quot;.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="mt-2 text-[11px] font-bold text-indigo-600 hover:underline disabled:opacity-50 dark:text-indigo-400"
          >
            {isFetching ? 'Đang làm mới…' : 'Làm mới danh sách ảnh'}
          </button>
        </div>
      </div>

      {urls.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/30">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            Chưa có ảnh tình trạng phòng. Bạn có thể quay lại bước trước để tải ảnh, hoặc tiếp tục nếu không cần minh chứng hình ảnh.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {urls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
            >
              <img src={url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
            </a>
          ))}
        </div>
      )}

      <div className="flex justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-black text-white hover:bg-rose-700"
        >
          Tiếp tục — Chốt số
        </button>
      </div>
    </div>
  );
}
