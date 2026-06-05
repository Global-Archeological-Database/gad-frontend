import { create } from 'zustand';

interface MapState {
  selectedArtifactId: string | null;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  isDetailPanelOpen: boolean;
  setSelectedArtifactId: (id: string | null) => void;
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setMapZoom: (zoom: number) => void;
  setIsDetailPanelOpen: (open: boolean) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedArtifactId: null,
  mapCenter: { lat: 20, lng: 0 },
  mapZoom: 3,
  isDetailPanelOpen: false,
  setSelectedArtifactId: (id) => set({ selectedArtifactId: id }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  setIsDetailPanelOpen: (open) => set({ isDetailPanelOpen: open }),
}));
