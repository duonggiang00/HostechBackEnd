import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Property {
  id: string;
  name: string;
  address?: string;
  [key: string]: any;
}

interface PropertyState {
  activeProperty: Property | null;
  setActiveProperty: (property: Property | null) => void;
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set) => ({
      activeProperty: null,
      setActiveProperty: (property) => set({ activeProperty: property }),
    }),
    {
      name: 'property-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
