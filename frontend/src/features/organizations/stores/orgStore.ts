import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Organization } from "../types";

interface OrgStoreState {
  activeOrg: Organization | null;
  setActiveOrg: (org: Organization | null) => void;
}

export const useOrgStore = create<OrgStoreState>()(
  persist(
    (set) => ({
      activeOrg: null,
      setActiveOrg: (org) => set({ activeOrg: org }),
    }),
    {
      name: "hostech-org-storage",
    }
  )
);
