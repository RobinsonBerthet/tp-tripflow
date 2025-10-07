import { create } from "zustand";

type TravelStore = {
  selectedVoyageId: number | null;
  setSelectedVoyageId: (id: number | null) => void;
  clearSelectedVoyage: () => void;
  stepsVersion: number;
  bumpStepsVersion: () => void;
  navigateToVoyagesTick: number;
  navigateToVoyages: () => void;
};

export const useTravelStore = create<TravelStore>((set) => ({
  selectedVoyageId: null,
  setSelectedVoyageId: (id) => set({ selectedVoyageId: id }),
  clearSelectedVoyage: () => set({ selectedVoyageId: null }),
  stepsVersion: 0,
  bumpStepsVersion: () => set((s) => ({ stepsVersion: s.stepsVersion + 1 })),
  navigateToVoyagesTick: 0,
  navigateToVoyages: () =>
    set((s) => ({ navigateToVoyagesTick: s.navigateToVoyagesTick + 1 })),
}));
