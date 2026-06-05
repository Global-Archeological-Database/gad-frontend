import { create } from 'zustand';
import type { UserProfile } from '@/types/user';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  setInitialized: (isInitialized: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isInitialized: false,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
}));
