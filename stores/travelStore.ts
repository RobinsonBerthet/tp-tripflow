import { create } from "zustand";

type TravelStore = {
  selectedVoyageId: number | null;
  setSelectedVoyageId: (id: number | null) => void;
  clearSelectedVoyage: () => void;
  selectedTab: "home" | "voyages" | "profil";
  setSelectedTab: (tab: "home" | "voyages" | "profil") => void;
  stepsVersion: number;
  bumpStepsVersion: () => void;
  resetTravelState: () => void;
};

export const useTravelStore = create<TravelStore>((set) => ({
  selectedVoyageId: null,
  setSelectedVoyageId: (id) => set({ selectedVoyageId: id }),
  clearSelectedVoyage: () => set({ selectedVoyageId: null }),
  selectedTab: "home",
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  stepsVersion: 0,
  bumpStepsVersion: () => set((s) => ({ stepsVersion: s.stepsVersion + 1 })),
  resetTravelState: () =>
    set({ selectedVoyageId: null, selectedTab: "home", stepsVersion: 0 }),
}));
