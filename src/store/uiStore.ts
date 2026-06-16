import { create } from 'zustand';

interface UiState {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isChatOpen: false,
  setIsChatOpen: (isChatOpen) => set({ isChatOpen }),
}));
