import { create } from 'zustand';

const useVerifierStore = create((set) => ({
  profile: null,
  verifications: [],
  history: [],
  apiKeys: [],
  notifications: [],
  unreadCount: 0,
  stats: null,

  setProfile: (profile) => set({ profile }),
  setVerifications: (verifications) => set({ verifications }),
  setHistory: (history) => set({ history }),
  setApiKeys: (apiKeys) => set({ apiKeys }),
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setStats: (stats) => set({ stats }),
}));

export default useVerifierStore;
