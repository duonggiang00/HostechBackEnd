import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BuildingOverview } from '../components/BuildingOverview';
import { useBuildingOverview, useSyncBuildingOverview } from '../hooks/useBuildingOverview';
import { LayoutDashboard, Building2, Layers, Pencil, Save, X, RefreshCw } from 'lucide-react';
import type { BuildingFloor } from '../types';
import type { SyncBuildingOverviewPayload, SyncFloorEntry, SyncRoomEntry } from '../types';

export default function BuildingOverviewPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [isEditMode, setIsEditMode] = useState(false);

  // ─── Data fetching ────────────────────────────────────────────────────
  const { data: overview, isLoading, error, refetch } = useBuildingOverview(propertyId);
  const syncMutation = useSyncBuildingOverview(propertyId);

  // ─── Local edit state ─────────────────────────────────────────────────
  // Floors state is derived from API in view mode, and managed locally in edit mode
  const [localFloors, setLocalFloors] = useState<BuildingFloor[]>([]);

  // Sync local state when API data changes (e.g. after save or initial load)
  useEffect(() => {
    if (overview?.floors) {
      setLocalFloors(overview.floors);
    }
  }, [overview]);

  // Floors used for display
  const displayFloors = isEditMode ? localFloors : (overview?.floors ?? []);

  // ─── Edit Mode handlers ───────────────────────────────────────────────

  const handleEnterEdit = useCallback(() => {
    // Clone API state into local state for editing
    if (overview?.floors) {
      setLocalFloors(JSON.parse(JSON.stringify(overview.floors)));
    }
    setIsEditMode(true);
  }, [overview]);

  const handleCancel = useCallback(() => {
    // Revert to last saved state
    if (overview?.floors) {
      setLocalFloors(JSON.parse(JSON.stringify(overview.floors)));
    }
    setIsEditMode(false);
  }, [overview]);

  const handleSave = useCallback(async () => {
    if (!propertyId) return;

    // Build payload from local state
    const deletedRoomIds: string[] = [];
    const deletedFloorIds: string[] = [];

    // Find original IDs that are no longer in local state
    const originalFloorIds = new Set(overview?.floors?.map(f => f.id) ?? []);
    const localFloorIds = new Set(localFloors.map(f => f.id));
    originalFloorIds.forEach(id => {
      if (!localFloorIds.has(id)) deletedFloorIds.push(id);
    });

    const originalRoomIds = new Set(overview?.floors?.flatMap(f => f.rooms.map(r => r.id)) ?? []);
    const localRoomIds = new Set(localFloors.flatMap(f => f.rooms.map(r => r.id)));
    originalRoomIds.forEach(id => {
      if (!localRoomIds.has(id)) deletedRoomIds.push(id);
    });

    // Build sync_data
    const syncData: SyncFloorEntry[] = localFloors.map(floor => ({
      ...(floor.isDraft ? { temp_id: floor.temp_id } : { floor_id: floor.id }),
      name: floor.name,
      floor_number: floor.floor_number,
      rooms: floor.rooms.map((room): SyncRoomEntry => ({
        ...(room.isDraft ? { temp_id: room.temp_id } : { id: room.id }),
        code: room.code,
        template_id: room.template_id,
        x: room.layout?.column ?? 0,
        y: room.layout?.row ?? 0,
        width: room.layout?.col_span ?? 1,
        height: room.layout?.row_span ?? 1,
      })),
    }));

    const payload: SyncBuildingOverviewPayload = {
      sync_data: syncData,
      deleted_room_ids: deletedRoomIds.length > 0 ? deletedRoomIds : undefined,
      deleted_floor_ids: deletedFloorIds.length > 0 ? deletedFloorIds : undefined,
    };

    try {
      await syncMutation.mutateAsync(payload);
      setIsEditMode(false);
    } catch {
      // Error toast is handled by the mutation hook
    }
  }, [propertyId, localFloors, overview, syncMutation]);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden h-full">
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-slate-200 shadow-sm shrink-0 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h1 className="text-slate-900 text-2xl font-black tracking-tight uppercase">Mặt bằng tòa nhà</h1>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Trực quan hóa không gian & Trạng thái vận hành</p>
        </div>

        <div className="flex flex-col gap-2 scale-90 origin-right translate-y-1">
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 text-sm">
              <Layers className="w-4 h-4" />
              Chế độ mặt cắt
            </button>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 text-slate-600 bg-white border-2 border-slate-100 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm active:scale-95 text-sm disabled:opacity-50"
            >
              <LayoutDashboard className="w-4 h-4" />
              Thống kê
            </button>
          </div>

          <div className="flex justify-end">
            {!isEditMode ? (
              <button
                onClick={handleEnterEdit}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all active:scale-95 text-xs shadow-md disabled:opacity-50"
              >
                <Pencil className="w-3.5 h-3.5" />
                Chỉnh sửa mặt bằng
              </button>
            ) : (
              <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                <button
                  onClick={handleCancel}
                  disabled={syncMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-all active:scale-95 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSave}
                  disabled={syncMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all active:scale-95 text-xs shadow-md shadow-emerald-100 disabled:opacity-70"
                >
                  {syncMutation.isPending
                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    : <Save className="w-3.5 h-3.5" />
                  }
                  {syncMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mx-8 mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
          Không thể tải mặt bằng. <button onClick={() => refetch()} className="underline font-bold">Thử lại</button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-auto custom-scrollbar bg-pattern-dots">
          <BuildingOverview
            floors={displayFloors}
            templates={overview?.templates ?? []}
            isEditMode={isEditMode}
            isLoading={isLoading}
            onFloorsChange={setLocalFloors}
          />
        </div>
      </div>
    </div>
  );
}
