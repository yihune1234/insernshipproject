import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ROLE_DASHBOARDS } from '../utils/constants';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false,

      setAuth: ({ user, role, access, refresh }) => {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        set({ user, role, accessToken: access, refreshToken: refresh, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, role: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      getDashboard: () => {
        const { role } = get();
        return ROLE_DASHBOARDS[role] || '/login';
      },

      setHydrated: (isHydrated) => set({ isHydrated }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated(true);
      },
    }
  )
);

export default useAuthStore;
