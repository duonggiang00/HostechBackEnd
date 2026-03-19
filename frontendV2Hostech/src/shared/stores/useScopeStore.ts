import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ScopeState {
  organizationId: string | null;
  propertyId: string | null;
  floorId: string | null;
  roomId: string | null;
  setOrganizationId: (id: string | null) => void;
  setPropertyId: (id: string | null) => void;
  setFloorId: (id: string | null) => void;
  setRoomId: (id: string | null) => void;
  clearScope: () => void;
}

const isUuid = (id: string | null): boolean => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const useScopeStore = create<ScopeState>()(
  persist(
    (set) => ({
      organizationId: null,
      propertyId: null,
      floorId: null,
      roomId: null,
      setOrganizationId: (id) => {
        const validId = isUuid(id) ? id : null;
        set({ organizationId: validId, propertyId: null, floorId: null, roomId: null });
      },
      setPropertyId: (id) => {
        const validId = isUuid(id) ? id : null;
        set({ propertyId: validId, floorId: null, roomId: null });
      },
      setFloorId: (id) => {
        const validId = isUuid(id) ? id : null;
        set({ floorId: validId, roomId: null });
      },
      setRoomId: (id) => {
        const validId = isUuid(id) ? id : null;
        set({ roomId: validId });
      },
      clearScope: () => set({ organizationId: null, propertyId: null, floorId: null, roomId: null }),
    }),
    {
      name: 'hostech-scope-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Cleanup legacy IDs on load
          if (state.organizationId && !isUuid(state.organizationId)) state.organizationId = null;
          if (state.propertyId && !isUuid(state.propertyId)) state.propertyId = null;
          if (state.floorId && !isUuid(state.floorId)) state.floorId = null;
          if (state.roomId && !isUuid(state.roomId)) state.roomId = null;
        }
      },
    }
  )
);
