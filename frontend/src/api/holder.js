import api from './axios';

// ── Wallet ─────────────────────────────────────────────────────────────────────
export const getWallet = () => api.get('/wallet/');

// ── Credentials ────────────────────────────────────────────────────────────────
export const getHolderCredentials = (params) => api.get('/wallet/credentials/', { params });
export const getHolderCredential = (id) => api.get(`/wallet/credentials/${id}/`);
export const syncCredentials = () => api.post('/wallet/credentials/sync/');
export const requestCredential = (data) => api.post('/wallet/credentials/request/', data);

// ── My credentials (aliases) ───────────────────────────────────────────────────
export const getMyCredentials = (params) => api.get('/wallet/my-credentials/', { params });
export const getMyCredential = (id) => api.get(`/wallet/my-credentials/${id}/`);

// ── Request catalog ────────────────────────────────────────────────────────────
export const getRequestCatalog = () => api.get('/wallet/request-catalog/');

// ── Held credentials ───────────────────────────────────────────────────────────
export const getHeldCredentials = () => api.get('/wallet/held/');
export const addHeldCredential = (data) => api.post('/wallet/held/', data);
export const removeHeldCredential = (id) => api.delete(`/wallet/held/${id}/`);

// ── Sharing management ─────────────────────────────────────────────────────────
export const getShares = () => api.get('/wallet/shares/');
export const createShare = (data) => api.post('/wallet/shares/', data);
export const enableSharing = (data) => api.post('/wallet/shares/enable/', data);
export const disableSharing = (data) => api.post('/wallet/shares/disable/', data);
export const getShareStats = () => api.get('/wallet/shares/stats/');
export const getShareByToken = (token) => api.get(`/wallet/shares/${token}/`);
export const deactivateShare = (token) => api.delete(`/wallet/shares/${token}/`);

// ── Presentations ──────────────────────────────────────────────────────────────
export const getPresentations = () => api.get('/wallet/presentations/');
export const createPresentation = (data) => api.post('/wallet/presentations/', data);
export const generateHolderPresentation = createPresentation;
export const getPresentation = (id) => api.get(`/wallet/presentations/${id}/`);

// ── Backward-compatible aliases ─────────────────────────────────────────────
export const createHolderRequest = requestCredential;
export const getWallets = getWallet;
export const getHolderVerificationHistory = () => api.get('/verification/history/');
export const getHolderRequests = () => api.get('/wallet/credentials/');
export const getCredentialVerificationActivity = (id) => api.get(`/wallet/my-credentials/${id}/`);

// Notification aliases (holder notifications use /notifications/ directly)
export const getHolderNotifications = (params) => api.get('/notifications/', { params });
export const getHolderNotificationCount = () => api.get('/notifications/unread-count/');
export const markHolderNotificationRead = (id) => api.post('/notifications/mark-read/', { ids: [id] });
export const markAllHolderNotificationsRead = () => api.post('/notifications/mark-all-read/');
export const deleteHolderNotification = (id) => api.post('/notifications/mark-read/', { ids: [id] });
