import { create } from "zustand";
import type { IOpenMenu, IOpenTypeStore } from "../types/store";

export const useOpenStore = create<IOpenTypeStore>((set) => ({
  open: false,
  openForm: false,
  openRegister: false,
  openModalSetting: false,
  eyePassword: false,
  setOpen: (open) => set({ open }),
  setOpenForm: (openForm) => set({ openForm }),
  setOpenModalSetting: (openModalSetting) => set({ openModalSetting }),
  setEyePassword: (eyePassword) => set({ eyePassword }),

  setOpenRegister: (openRegister) => set({ openRegister }),
}));

export const useOpenMenu = create<IOpenMenu>((set) => ({
  openMenu1: false,
  openMenu2: false,
  openMenu3: false,
  setOpenMenu1: (openMenu1) => set({ openMenu1 }),
  setOpenMenu2: (openMenu2) => set({ openMenu2 }),
  setOpenMenu3: (openMenu3) => set({ openMenu3 }),
}));
