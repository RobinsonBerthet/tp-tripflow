import { create } from "zustand";

type TravelStore = {
  selectedVoyageId: number | null;
  setSelectedVoyageId: (id: number | null) => void;
  clearSelectedVoyage: () => void;
};

export const useTravelStore = create<TravelStore>((set) => ({
  selectedVoyageId: null,
  setSelectedVoyageId: (id) => set({ selectedVoyageId: id }),
  clearSelectedVoyage: () => set({ selectedVoyageId: null }),
}));
