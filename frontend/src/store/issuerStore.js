import { create } from 'zustand';

const useIssuerStore = create((set) => ({
  // Integration state (Phase 7-9)
  integrations: [],
  currentIntegration: null,
  integrationHealth: null,
  syncLogs: [],
  
  // Organization state
  organization: null,
  
  // Analytics state
  analyticsData: null,
  
  // UI state
  syncing: false,
  loading: false,
  error: null,

  // Integration actions
  setIntegrations: (integrations) => set({ integrations }),
  setCurrentIntegration: (integration) => set({ currentIntegration: integration }),
  setIntegrationHealth: (health) => set({ integrationHealth: health }),
  setSyncLogs: (logs) => set({ syncLogs: logs }),
  setOrganization: (org) => set({ organization: org }),
  setAnalyticsData: (data) => set({ analyticsData: data }),
  setSyncing: (syncing) => set({ syncing }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Reset error
  clearError: () => set({ error: null }),

  // Credential state
  credentials: [],
  currentCredential: null,
  memberCheckResult: null,

  // Member state
  orgMembers: [],
  teamMembers: [],

  setCredentials: (credentials) => set({ credentials }),
  setCurrentCredential: (cred) => set({ currentCredential: cred }),
  setMemberCheckResult: (result) => set({ memberCheckResult: result }),
  setOrgMembers: (members) => set({ orgMembers: members }),
  setTeamMembers: (members) => set({ teamMembers: members }),

  // Legacy state (kept for backward compatibility)
  profile: null,
  credentialTypes: [],
  templates: [],
  issuedCredentials: [],
  requests: [],
  notifications: [],
  unreadCount: 0,
  stats: null,

  setProfile: (profile) => set({ profile }),
  setCredentialTypes: (credentialTypes) => set({ credentialTypes }),
  setTemplates: (templates) => set({ templates }),
  setIssuedCredentials: (issuedCredentials) => set({ issuedCredentials }),
  setRequests: (requests) => set({ requests }),
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setStats: (stats) => set({ stats }),
}));

export default useIssuerStore;
