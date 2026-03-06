import { create } from "zustand";
import type { IPageStore } from "../types/store";

export const usePageStore = create<IPageStore>((set) => ({
  pages: 1,
  pageSizes: 1,
  setPage: (pages) => set({ pages }),
  setPageSize: (pageSizes) => set({ pageSizes }),
}));
