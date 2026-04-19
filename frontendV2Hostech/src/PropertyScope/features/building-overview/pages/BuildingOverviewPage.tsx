import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BuildingOverview } from '../components/BuildingOverview';
import { useBuildingOverview, useSyncBuildingOverview } from '../hooks/useBuildingOverview';
import { Building2, Pencil, Save, X, RefreshCw } from 'lucide-react';
import type { BuildingFloor } from '../types';
import type { SyncBuildingOverviewPayload, SyncFloorEntry, SyncRoomEntry } from '../types';

interface BuildingOverviewPageProps {
  hideHeader?: boolean;
}

export default function BuildingOverviewPage({ hideHeader = false }: BuildingOverviewPageProps) {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
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

  // ─── Handlers ───────────────────────────────────────────────────────────

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
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden h-full">
      {/* Header */}
      {!hideHeader && (
        <div className="bg-white px-8 py-5 border-b border-gray-200 shadow-sm shrink-0 flex items-center justify-between z-10 relative">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center shadow-sm">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-gray-900 text-[20px] font-bold tracking-tight">Mặt Bằng Tòa Nhà</h1>
            </div>
            <p className="text-gray-500 text-[12px] font-medium tracking-wide ml-11">Trực quan hóa không gian & trạng thái hiện tại</p>
          </div>

          <div className="flex items-center gap-3">
            {!isEditMode ? (
              <button
                onClick={handleEnterEdit}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2 bg-amber-500 text-white rounded-[6px] font-semibold hover:bg-amber-600 transition-colors shadow-sm text-[13px] disabled:opacity-50 focus-visible:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <Pencil className="w-4 h-4" />
                Chỉnh sửa mặt bằng
              </button>
            ) : (
              <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                <button
                  onClick={handleCancel}
                  disabled={syncMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-[6px] font-semibold hover:bg-gray-50 transition-colors text-[13px] focus-visible:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  <X className="w-4 h-4" />
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSave}
                  disabled={syncMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-[6px] font-semibold hover:bg-green-700 transition-colors text-[13px] shadow-sm disabled:opacity-70 focus-visible:outline-none focus:ring-2 focus:ring-green-600/50"
                >
                  {syncMutation.isPending
                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                    : <Save className="w-4 h-4" />
                  }
                  {syncMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-[8px] text-red-700 text-sm font-medium">
          Không thể tải mặt bằng. <button onClick={() => refetch()} className="underline font-bold">Thử lại</button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <BuildingOverview
            floors={displayFloors}
            templates={overview?.templates ?? []}
            isEditMode={isEditMode}
            isLoading={isLoading}
            onFloorsChange={setLocalFloors}
            onRoomSelect={(room) => {
              if (!isEditMode && room) {
                navigate(`/properties/${propertyId}/rooms/${room.id}`, { state: { from: 'building-view' } });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
