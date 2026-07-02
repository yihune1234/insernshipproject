import { create } from 'zustand';

const useHolderStore = create((set) => ({
  credentials: [],
  selectedCredential: null,
  requests: [],
  shares: [],
  wallets: [],
  notifications: [],
  unreadCount: 0,

  setCredentials: (credentials) => set({ credentials }),
  setSelectedCredential: (credential) => set({ selectedCredential: credential }),
  setRequests: (requests) => set({ requests }),
  setShares: (shares) => set({ shares }),
  setWallets: (wallets) => set({ wallets }),
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  decrementUnread: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
}));

export default useHolderStore;
