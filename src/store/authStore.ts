import { create } from 'zustand';
import { SuperAdminUser } from '@/types';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: SuperAdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: SuperAdminUser | null) => void;
  logout: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  initialize: () => {
    const user = authService.getCurrentUser();
    const isAuthenticated = authService.isAuthenticated();
    set({ user, isAuthenticated, isLoading: false });
  },
}));
