import { create } from 'zustand';

const useAdminStore = create((set) => ({
  dashboardStats: null,
  users: [],
  organizations: [],
  issuers: [],
  credentials: [],
  verifications: [],
  auditLogs: [],
  notifications: [],
  unreadCount: 0,

  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setUsers: (users) => set({ users }),
  setOrganizations: (organizations) => set({ organizations }),
  setIssuers: (issuers) => set({ issuers }),
  setCredentials: (credentials) => set({ credentials }),
  setVerifications: (verifications) => set({ verifications }),
  setAuditLogs: (auditLogs) => set({ auditLogs }),
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));

export default useAdminStore;
