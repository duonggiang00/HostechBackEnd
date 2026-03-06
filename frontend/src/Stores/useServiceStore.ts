import { create } from "zustand";
import type { Service } from "../Types/ServiceTypes";

interface ServiceStore {
    isOpenModal: boolean;
    selectedService: Service | null;
    openModal: (service?: Service | null) => void;
    closeModal: () => void;
}

export const useServiceStore = create<ServiceStore>((set) => ({
    isOpenModal: false,
    selectedService: null,
    openModal: (service?: Service | null) => set({ isOpenModal: true, selectedService: service }),
    closeModal: () => set({ isOpenModal: false, selectedService: null }),
}));
