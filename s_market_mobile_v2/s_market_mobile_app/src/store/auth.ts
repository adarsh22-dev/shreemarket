import { create } from 'zustand';
import { User } from '../types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuest: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  skipOnboarding: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isGuest: false,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => set({
    user: null,
    isAuthenticated: false,
    isGuest: false,
    isLoading: false,
  }),

  skipOnboarding: () => set({ isGuest: true, isLoading: false }),
}));
