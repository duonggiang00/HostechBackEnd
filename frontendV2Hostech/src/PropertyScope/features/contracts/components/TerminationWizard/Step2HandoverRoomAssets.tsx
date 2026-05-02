import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, ChevronLeft, ImagePlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/shared/api/client';

type ItemRow = {
  id?: string;
  room_asset_id?: string | null;
  name: string;
  condition: string;
};

type TerminationHandoverPayload = {
  persisted: boolean;
  handover: {
    id: string;
    note?: string | null;
    document_scan_urls?: string[];
  } | null;
  default_handover_note?: string | null;
  items: ItemRow[];
};

interface Step2HandoverRoomAssetsProps {
  contractId: string;
  onBack: () => void;
  onNext: () => void;
}

export function Step2HandoverRoomAssets({ contractId, onBack, onNext }: Step2HandoverRoomAssetsProps) {
  const queryClient = useQueryClient();
  const qcKey = ['termination-handover', contractId] as const;

  const { data: state, dataUpdatedAt, isLoading, isError, error } = useQuery({
    queryKey: qcKey,
    queryFn: async () => {
      const res = await apiClient.get(`/contracts/${contractId}/termination-handover`);
      return res.data.data as TerminationHandoverPayload;
    },
  });

  const [previewDraft, setPreviewDraft] = useState<ItemRow[] | null>(null);
  const [pendingRoomPhotos, setPendingRoomPhotos] = useState<File[]>([]);
  const [handoverNote, setHandoverNote] = useState('');

  useEffect(() => {
    if (!state || state.persisted) {
      setPreviewDraft(null);
      return;
    }
    setPreviewDraft(state.items.map((i) => ({ ...i })));
  }, [contractId, state?.persisted, dataUpdatedAt]);

  useEffect(() => {
    if (!state?.persisted) {
      setPendingRoomPhotos([]);
    }
  }, [state?.persisted, dataUpdatedAt]);

  useEffect(() => {
    if (!state) return;
    if (state.persisted && state.handover) {
      setHandoverNote(state.handover.note ?? '');
    } else if (!state.persisted) {
      setHandoverNote(state.default_handover_note ?? '');
    }
  }, [state?.persisted, dataUpdatedAt, state?.handover?.note, state?.default_handover_note]);

  const updateItem = useMutation({
    mutationFn: async ({ itemId, condition }: { itemId: string; condition: string }) => {
      const hid = state?.handover?.id;
      if (!hid) throw new Error('Thiếu handover');
      const res = await apiClient.put(`/handovers/${hid}/items/${itemId}`, { condition });
      return res.data.data as ItemRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qcKey });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật mục biên bản.');
    },
  });

  const updateHandoverNote = useMutation({
    mutationFn: async (note: string) => {
      const hid = state?.handover?.id;
      if (!hid) throw new Error('Thiếu handover');
      await apiClient.put(`/handovers/${hid}`, { note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qcKey });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không thể lưu ghi chú biên bản.');
    },
  });

  const uploadDocumentScan = useMutation({
    mutationFn: async ({ handoverId, file }: { handoverId: string; file: File }) => {
      const form = new FormData();
      form.append('image', file);
      await apiClient.post(`/handovers/${handoverId}/document-scans`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qcKey });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không thể tải ảnh tình trạng phòng.');
    },
  });

  const commitHandover = useMutation({
    mutationFn: async (payload: { items: { room_asset_id: string; condition: string }[]; note: string }) => {
      const res = await apiClient.post(`/contracts/${contractId}/termination-handover`, payload);
      return res.data.data as TerminationHandoverPayload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qcKey });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không thể lưu biên bản bàn giao.');
    },
  });

  const persistedItems = state?.persisted ? state.items : [];
  const displayItems = state?.persisted ? persistedItems : previewDraft ?? [];

  const patchPreviewRow = (roomAssetId: string, patch: Partial<ItemRow>) => {
    setPreviewDraft((rows) =>
      (rows ?? []).map((r) => ((r.room_asset_id ?? '') === roomAssetId ? { ...r, ...patch } : r)),
    );
  };

  const handleRoomPhotoFiles = (files: File[]) => {
    if (!files.length) return;
    if (state?.persisted && state.handover?.id) {
      const hid = state.handover.id;
      void (async () => {
        let ok = 0;
        for (const file of files) {
          try {
            await uploadDocumentScan.mutateAsync({ handoverId: hid, file });
            ok += 1;
          } catch {
            /* toast in mutation */
          }
        }
        if (ok > 0) {
          toast.success(`Đã tải ${ok} ảnh tình trạng phòng.`);
        }
      })();
    } else {
      setPendingRoomPhotos((prev) => [...prev, ...files]);
      toast.success(
        files.length > 1
          ? `Đã thêm ${files.length} ảnh vào hàng chờ (tải lên sau khi lưu biên bản).`
          : 'Đã thêm ảnh vào hàng chờ (tải lên sau khi lưu biên bản).',
      );
    }
  };

  const handleContinue = async () => {
    if (!state) return;
    if (state.persisted) {
      if (state.handover?.id && handoverNote !== (state.handover.note ?? '')) {
        try {
          await updateHandoverNote.mutateAsync(handoverNote);
        } catch {
          return;
        }
      }
      onNext();
      return;
    }
    const rows = previewDraft ?? [];
    try {
      const committed = await commitHandover.mutateAsync({
        note: handoverNote,
        items: rows.map((i) => ({
          room_asset_id: i.room_asset_id as string,
          condition: i.condition,
        })),
      });
      const hid = committed.handover?.id;
      if (!hid) {
        toast.error('Thiếu mã biên bản sau khi lưu.');
        return;
      }
      if (pendingRoomPhotos.length > 0) {
        let ok = 0;
        try {
          for (const file of pendingRoomPhotos) {
            const form = new FormData();
            form.append('image', file);
            await apiClient.post(`/handovers/${hid}/document-scans`, form, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            ok += 1;
          }
          await queryClient.invalidateQueries({ queryKey: qcKey });
          if (ok > 0) {
            toast.success(`Đã tải ${ok} ảnh tình trạng phòng.`);
          }
        } catch (photoErr: any) {
          toast.error(
            photoErr?.response?.data?.message ||
              'Biên bản đã lưu nhưng tải ảnh thất bại. Bạn có thể bổ sung ảnh ở bước sau hoặc quay lại.',
          );
        }
        setPendingRoomPhotos([]);
      }
      onNext();
    } catch {
      /* toast handled in mutation */
    }
  };

  const busyContinue =
    commitHandover.isPending || uploadDocumentScan.isPending || updateHandoverNote.isPending;

  const roomPhotoUrls = state?.handover?.document_scan_urls ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <p className="text-sm font-bold">Đang tải danh mục phòng…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
        {(error as any)?.response?.data?.message ||
          'Không thể tải dữ liệu. Kiểm tra quyền hoặc trạng thái hợp đồng.'}
      </div>
    );
  }

  if (!state?.persisted && previewDraft === null) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <p className="text-sm font-bold">Đang chuẩn bị form…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Đánh giá tình trạng tài sản trong phòng theo thực tế khi thanh lý. Ảnh minh chứng ghi nhận chung cho toàn phòng (không gắn từng mục).
        {!state.persisted && (
          <span className="mt-1 block text-xs font-bold text-amber-700 dark:text-amber-400">
            Biên bản chỉ được lưu trên hệ thống khi bạn nhấn &quot;Tiếp tục — Ảnh bàn giao&quot;.
          </span>
        )}
      </p>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
          Ghi chú biên bản bàn giao
        </label>
        <textarea
          value={handoverNote}
          onChange={(e) => setHandoverNote(e.target.value)}
          onBlur={() => {
            if (!state.persisted || !state.handover?.id) return;
            const server = state.handover.note ?? '';
            if (handoverNote !== server) {
              updateHandoverNote.mutate(handoverNote);
            }
          }}
          rows={3}
          disabled={updateHandoverNote.isPending}
          placeholder="Ghi chú chung cho toàn bộ biên bản (tình trạng phòng, ghi nhận khi bàn giao)…"
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <ImagePlus className="h-3.5 w-3.5" />
          Ảnh tình trạng phòng (chung)
        </label>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Hình ảnh minh chứng hiện trạng phòng khi bàn giao — không đính kèm từng tài sản.
        </p>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
          {uploadDocumentScan.isPending ? 'Đang tải…' : 'Chọn ảnh (có thể nhiều file)'}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploadDocumentScan.isPending}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = '';
              handleRoomPhotoFiles(files);
            }}
          />
        </label>
        {!state.persisted && pendingRoomPhotos.length > 0 && (
          <p className="mt-2 text-[11px] font-bold text-amber-700 dark:text-amber-400">
            {pendingRoomPhotos.length} ảnh chờ tải sau khi lưu biên bản.
          </p>
        )}
        {roomPhotoUrls.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {roomPhotoUrls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block h-20 w-20 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        )}
      </div>

      {displayItems.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/50">
          Phòng chưa có danh mục tài sản (room assets). Bạn vẫn có thể tiếp tục.
        </div>
      ) : (
        <ul className="space-y-4">
          {displayItems.map((item) => {
            const rowKey = item.id ?? item.room_asset_id ?? item.name;
            const assetId = item.room_asset_id ?? '';

            return (
              <li
                key={rowKey}
                className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <p className="font-black text-slate-900 dark:text-white">{item.name}</p>
                <label className="mt-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Tình trạng
                </label>
                <select
                  value={item.condition}
                  onChange={(e) => {
                    if (state.persisted && item.id) {
                      updateItem.mutate({
                        itemId: item.id,
                        condition: e.target.value,
                      });
                    } else if (assetId) {
                      patchPreviewRow(assetId, { condition: e.target.value });
                    }
                  }}
                  disabled={updateItem.isPending}
                  className="mt-1 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="OK">Tốt / đầy đủ</option>
                  <option value="DAMAGED">Hư hỏng</option>
                  <option value="MISSING">Thiếu / mất</option>
                </select>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={busyContinue}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </button>
        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={busyContinue}
          className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-black text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {busyContinue ? 'Đang lưu…' : 'Tiếp tục — Ảnh bàn giao'}
        </button>
      </div>
    </div>
  );
}
