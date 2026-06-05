import { create } from 'zustand';

interface UiState {
  isChatOpen: boolean;
  isSubmitFormOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  setIsSubmitFormOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isChatOpen: false,
  isSubmitFormOpen: false,
  setIsChatOpen: (isChatOpen) => set({ isChatOpen }),
  setIsSubmitFormOpen: (isSubmitFormOpen) => set({ isSubmitFormOpen }),
}));
