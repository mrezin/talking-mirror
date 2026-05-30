import { create } from 'zustand';
import type { User } from '../services/firebase';
import type { UserRole } from '../services/firebase';

interface UserState {
  /** Current Firebase Auth user, or null if signed out. */
  user: User | null;
  /** Role assigned to the current user. */
  role: UserRole;
  /** True while the initial auth state is being resolved. */
  isLoading: boolean;
  /** True when a user (including anonymous guest) is signed in. */
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setRole: (role: UserRole) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  role: 'guest',
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
    }),

  setRole: (role) => set({ role }),

  setLoading: (isLoading) => set({ isLoading }),
}));
